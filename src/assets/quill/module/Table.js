import Quill from 'quill';
const Parchment = Quill.import('parchment');
const Delta = Quill.import('delta');
const BlockEmbed = Quill.import('blots/block/embed');
const Block = Quill.import('blots/block');
const Container = Quill.import('blots/container');
import Module from 'quill/core/module';
const icons = Quill.import('ui/icons');

import TableSelection from '@/assets/quill/TableSelection';
import TableOperationMenu from '@/assets/quill/TableOperationMenu';

import ContainBlot from '@/assets/quill/blot/contain';

import TableCellFormat from '@/assets/quill/format/TableCellFormat';
import TableRowFormat from '@/assets/quill/format/TableRowFormat';
import TableFormat from '@/assets/quill/format/TableFormat';
import TableWrapper from '@/assets/quill/format/TableWrapperFormat';
import TableBodyFormat from '@/assets/quill/format/TableBodyFormat';
import TableColgroupFormat from '@/assets/quill/format/TableColgroupFormat';
import TableColFormat from '@/assets/quill/format/TableColFormat';

ContainBlot.allowedChildren = [Block, BlockEmbed, Container];

TableWrapper.allowedChildren = [TableFormat];

TableFormat.allowedChildren = [TableBodyFormat, TableColgroupFormat];
TableFormat.requiredContainer = TableWrapper;

TableBodyFormat.allowedChildren = [TableRowFormat];
TableBodyFormat.requiredContainer = TableFormat;

TableColgroupFormat.allowedChildren = [TableColFormat];
TableColgroupFormat.requiredContainer = TableFormat;

TableRowFormat.allowedChildren = [TableCellFormat];
TableRowFormat.requiredContainer = TableBodyFormat;

TableCellFormat.allowedChildren = [Block, BlockEmbed, Container];

Quill.register(
	{
		[`formats/table-${ContainBlot.blotName}`]: ContainBlot,

		[`formats/table-${TableCellFormat.blotName}`]: TableCellFormat,
		[`formats/table-${TableRowFormat.blotName}`]: TableRowFormat,
		[`formats/table-${TableFormat.blotName}`]: TableFormat,
		[`formats/table-${TableWrapper.blotName}`]: TableWrapper,
		[`formats/table-${TableBodyFormat.blotName}`]: TableBodyFormat,

		[`formats/table-${TableColgroupFormat.blotName}`]: TableColgroupFormat,
		[`formats/table-${TableColFormat.blotName}`]: TableColFormat,
	},
	true
);

import { h, render } from 'vue';
// import QuillTableCreatorVue from '@/components/Creator/QuillTable/QuillTableCreator.vue';
import { randomId } from '@/assets/quill/utils';

class TableHandler extends Module {
	constructor(quill, options) {
		super(quill, options);
		this.quill = quill;
		this.options = options;
		this.tableBtn = null;
		this.tableInsertSelectCloseHandler = null;

		const toolbar = this.quill.getModule('toolbar');
		if (toolbar) {
			toolbar.controls.find(([name, el]) => {
				if (name === TableFormat.blotName) {
					this.tableBtn = el;
					this.tableBtn.classList.add('ql-button-picker');
					this.tableBtn.classList.add('ql-picker');
					const div = document.createElement('div');
					div.classList.add('ql-picker-options');
					div.classList.add('ql-custom-select');
					this.selectBox = div;
					this.tableBtn.appendChild(div);
					this.tableBtn.dataset.active = false;
					return true;
				}
			});
			toolbar.addHandler(TableHandler.toolName, this.handleSelectDisplay.bind(this));
		}
		this.pasteTableHandler();

		// 绑定 table 的选择事件
		this.quill.root.addEventListener(
			'click',
			(evt) => {
				const path = evt.path || (evt.composedPath && evt.composedPath());
				if (!path || path.length <= 0) return;

				const tableNode = path.filter((node) => {
					return (
						node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table')
					);
				})?.[0];

				if (tableNode) {
					if (this.table === tableNode) return;
					if (this.table) this.hideTableTools();
					this.showTableTools(tableNode, quill, options);
				} else if (this.table) {
					this.hideTableTools();
				}
			},
			false
		);
		// 绑定 table 的右键插入、删除事件
		this.quill.root.addEventListener('contextmenu', (evt) => {
			if (!this.table) return true;
			evt.preventDefault();

			const path = evt.path || (evt.composedPath && evt.composedPath());
			if (!path || path.length <= 0) return;

			const tableNode = path.filter(
				(node) => node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table')
			)[0];

			const rowNode = path.filter(
				(node) => node.tagName && node.tagName.toUpperCase() === 'TR' && node.getAttribute('data-row-id')
			)[0];

			const cellNode = path.filter(
				(node) => node.tagName && node.tagName.toUpperCase() === 'TD' && node.getAttribute('data-row-id')
			)[0];

			// let isTargetCellSelected = this.tableSelection.selectedTds
			// 	.map((tableCell) => tableCell.domNode)
			// 	.includes(cellNode);

			// console.log(this.tableSelection);
			// if ((this.tableSelection.selectedTds.length <= 0 || !isTargetCellSelected) && cellNode) {
			// 	this.tableSelection.setSelection(cellNode.getBoundingClientRect(), cellNode.getBoundingClientRect());
			// }

			if (this.tableOperationMenu) this.tableOperationMenu = this.tableOperationMenu.destroy();

			if (tableNode) {
				this.tableOperationMenu = new TableOperationMenu(
					{
						table: tableNode,
						row: rowNode,
						cell: cellNode,
						left: evt.pageX,
						top: evt.pageY,
					},
					quill,
					options.operationMenu
				);
			}
		});
	}

	showTableTools(table, quill, options) {
		this.table = table;
		this.tableSelection = new TableSelection(table, quill, options);
	}

	hideTableTools() {
		this.tableSelection && this.tableSelection.destroy();
		this.tableOperationMenu && this.tableOperationMenu.destroy();
		this.tableSelection = null;
		this.tableOperationMenu = null;
		this.table = null;
	}

	// 粘贴表格处理
	pasteTableHandler() {
		let tableId = randomId();
		let rowId = randomId();
		let colId = [];
		let countColOver = false;
		let cellCount = 0;

		// 重新生成 table 里的所有 id, cellFormat 和 colFormat 进行 table 的添加
		// addMatcher 匹配的是标签字符串, 不是 blotName, 只是这些 blotName 设置的是标签字符串
		this.quill.clipboard.addMatcher(TableFormat.blotName, (node, delta) => {
			// 添加 col
			let tdWidth = Array.from(node.getElementsByTagName('tr')).reduce((pre, cur) => {
				let w = Array.from(cur.getElementsByTagName('td')).map((td) => td.getBoundingClientRect().width);
				if (w.length < pre.length) return pre;
				return w.map((width, i) => Math.max(width, pre[i] ?? 0)).concat(pre.slice(w.length));
			}, []);

			let colDelta = new Delta();
			colId.map((id, i) => {
				colDelta.insert('\n', {
					[TableColFormat.blotName]: {
						colId: id,
						tableId,
						width: tdWidth[i] ?? 150,
					},
				});
			});

			tableId = randomId();
			colId = [];
			countColOver = false;
			cellCount = 0;
			return colDelta.concat(delta);
		});

		this.quill.clipboard.addMatcher(TableRowFormat.blotName, (node, delta) => {
			// console.log(node);
			rowId = randomId();
			countColOver = true;
			return delta;
		});

		this.quill.clipboard.addMatcher(TableCellFormat.blotName, (node, delta) => {
			// console.log(node);
			let cellId = randomId();
			if (!countColOver) {
				colId.push(randomId());
			}
			cellCount += 1;
			return delta.compose(
				new Delta().retain(delta.length(), {
					[TableCellFormat.blotName]: {
						tableId,
						rowId,
						colId: colId[(cellCount - 1) % colId.length],
						cellId,
						rowspan: node.getAttribute('rowspan'),
						colspan: node.getAttribute('colspan'),
						style: node.getAttribute('style'),
					},
				})
			);
		});

		this.quill.clipboard.addMatcher(TableColFormat.blotName, (node, delta) => {
			// console.log(node);
			let curColId = randomId();
			colId.push(curColId);

			countColOver = true;

			// 复制进来 col 的 delta 长度是 0, 手动添加 \n 保证有内容能插入
			return new Delta([{ insert: '\n' }]).compose(
				new Delta().retain(1, {
					[TableColFormat.blotName]: {
						tableId,
						colId: curColId,
						width: node.getAttribute('width'),
					},
				})
			);
		});
	}

	handleSelectDisplay() {
		this.createSelect();
		this.quill.focus();
		this.range = this.quill.getSelection();

		this.tableBtn.classList.add('ql-expanded');
		this.tableBtn.dataset.active = true;
		window.removeEventListener('click', this.tableInsertSelectCloseHandler);
		this.tableInsertSelectCloseHandler = this.closeSelecte.bind(this);
		window.addEventListener('click', this.tableInsertSelectCloseHandler);
	}

	createSelect() {
		const handle = this.insertTable.bind(this);
		render(
			h(QuillTableCreatorVue, {
				style: { margin: 0, padding: '4px' },
				onCreateTable(row, col) {
					handle(row, col);
				},
			}),
			this.selectBox
		);
	}

	closeSelecte(e) {
		const path = (e.composedPath && e.composedPath()) || e.path;
		const i = path.findIndex((el) => el === this.tableBtn);
		if (i > 2 || i === -1) {
			this.tableBtn.classList.remove('ql-expanded');
			this.tableBtn.dataset.active = false;
			window.removeEventListener('click', this.tableInsertSelectCloseHandler);
		}
	}

	// 以上为 toolbar table 按钮的选择生成器相关
	// 以下为 table module 生成表格相关功能函数

	insertTable(rows, columns) {
		// const range = this.quill.getSelection(true);
		const range = this.range;
		if (range == null) return;
		let currentBlot = this.quill.getLeaf(range.index)[0];
		let delta = new Delta().retain(range.index);

		if (isForbidInTable(currentBlot)) {
			ElMessage.warning('不支持的嵌套');
			return;
		}

		delta.insert('\n');
		const tableId = randomId();
		const colId = new Array(columns).fill(0).map(() => randomId());

		setTimeout(() => {
			const offsetWidth = this.quill.root.offsetWidth;

			delta = new Array(columns).fill('\n').reduce((memo, text, i) => {
				memo.insert(text, {
					[TableColFormat.blotName]: {
						width: Math.floor((offsetWidth - 30) / columns), // 30 为输入框的内边距
						tableId,
						colId: colId[i],
					},
				});
				return memo;
			}, delta);

			// 直接生成 delta 的数据格式并插入
			delta = new Array(rows).fill(0).reduce((memo) => {
				const rowId = randomId();
				return new Array(columns).fill('\n').reduce((memo, text, i) => {
					memo.insert(text, {
						// [TableCellFormat.blotName]: `${tableId}|${rowId}|${randomId()}`,
						[TableCellFormat.blotName]: {
							tableId,
							rowId,
							colId: colId[i],
							cellId: randomId(),
							rowspan: 1,
							colspan: 1,
						},
					});
					return memo;
				}, memo);
			}, delta);
			// console.log(delta);
			// console.log(columns, rows);
			this.quill.updateContents(delta, Quill.sources.USER);
			this.quill.setSelection(range.index + columns + 1, Quill.sources.API);
			this.quill.focus();
		}, 0);
	}

	findTable(blot) {
		let cur = blot;
		while (cur.statics.blotName !== TableFormat.blotName && cur !== null) {
			cur = cur.parent;
		}
		return cur;
	}

	appendRow(isDown) {
		const tds = this.tableSelection.selectedTds;
		if (!tds.length) return;
		const table = this.findTable(tds[0]);
		const tableId = table.tableId();
		const newRowId = randomId();
		const totalColIds = table.colsId();
		// 根据选中的单元格, 找到当前行, 在当前行上方或下方插入一行
		// this.tableSelection.tds 是按 Delta 顺序排列的, 所以向上插入第一个 td 的 parent 就是当前行, 向下插入最后一个 td 的 parent 就是当前行
		let curRow = tds[0].parent;
		if (isDown) {
			curRow = tds[tds.length - 1].parent;
		}
		// 计算对应行的列数, 若存在 td 跨行, 则返回 NaN 使判断进入 else
		const nextRowColCount = curRow.next?.children.reduce((pre, cur) => {
			if (cur.domNode.getAttribute('rowspan') > 1) return NaN;
			return pre + Number(cur.domNode.getAttribute('colspan')) || 1;
		}, 0);
		const prevRowColCount = curRow.prev?.children.reduce((pre, cur) => {
			if (cur.domNode.getAttribute('rowspan') > 1) return NaN;
			return pre + Number(cur.domNode.getAttribute('colspan')) || 1;
		}, 0);
		// 若是向下插入, 且当前是最后一行, 或下一行的列是满的且没有跨行, 则直接在最后插入一行
		// 若是向上插入, 且当前是第一行, 或当前行的满的且没有跨行, 则直接在最前插入一行
		if (
			(isDown && (!curRow.next || nextRowColCount === totalColIds.length)) ||
			(!isDown && (!curRow.prev || prevRowColCount === totalColIds.length))
		) {
			let newRow = Parchment.create(TableRowFormat.blotName, newRowId);
			for (let i = 0; i < totalColIds.length; i++) {
				let td = Parchment.create(TableCellFormat.blotName, {
					tableId,
					rowId: newRowId,
					colId: totalColIds[i],
					cellId: randomId(),
					rowspan: 1,
					colspan: 1,
				});
				newRow.appendChild(td);
			}
			if (isDown && !curRow.next) {
				curRow.parent.appendChild(newRow);
			} else if (isDown && curRow.next) {
				curRow.parent.insertBefore(newRow, curRow.next);
			} else {
				curRow.parent.insertBefore(newRow, curRow);
			}
			return;
		} else {
			// 不是能直接插入满行的情况, 需要判断是否有跨行
			let colIds;
			let computedTr = curRow;
			if (isDown) {
				// 向下插入时需要找到最下方的选中 td 下一行, 若选中 td 存在跨行, 则需要找到跨行后的下一行
				let curSpanRowCount = Number(tds[tds.length - 1].domNode.getAttribute('rowspan')) || 1;
				while (curSpanRowCount > 0) {
					computedTr = computedTr.next;
					curSpanRowCount -= 1;
				}
				// 保存要插入的 col 数
				colIds = !computedTr ? totalColIds : computedTr.children.map((td) => td.colId());
			} else {
				// 向上插入时直接插入当前选中 td 所在行的 col 数
				colIds = computedTr.children.map((td) => td.colId());
			}
			// 生成 tr 并插入 td, 先不将 tr 插入, 会影响后续的跨行增加计算
			let newRow = Parchment.create(TableRowFormat.blotName, newRowId);
			for (let i = 0; i < colIds.length; i++) {
				let td = Parchment.create(TableCellFormat.blotName, {
					tableId,
					rowId: newRowId,
					colId: colIds[i],
					cellId: randomId(),
					rowspan: 1,
					colspan: 1,
				});
				newRow.appendChild(td);
			}

			// 找到之前有跨行影响到选中 td 的 td, 将跨行增加 1
			if (computedTr) {
				let spanRowI = isDown ? 2 : 2;
				let preTr = isDown ? computedTr.prev : computedTr.prev;
				while (preTr) {
					preTr.children.map((td) => {
						// console.log(td.domNode.getAttribute('rowspan'), spanRowI);
						// 此单元格跨行影响到了新增行, 需要增加 rowspan
						if (td.domNode.getAttribute('rowspan') >= spanRowI) {
							// console.log(td);
							td.format('rowspan', Number(td.domNode.getAttribute('rowspan')) + 1);
						}
					});
					preTr = preTr.prev;
					spanRowI += 1;
				}
			}
			// 插入新 tr 到当前行的下方或上方
			if (computedTr) {
				curRow.parent.insertBefore(newRow, computedTr);
			} else {
				curRow.parent.appendChild(newRow);
			}
		}
	}

	removeRow() {
		if (!this.tableSelection.selectedTds.length) return;
		let tds = this.tableSelection.selectedTds;
		// 拿到所有要删除的行
		let delTrs = [];
		for (let i = 0; i < tds.length; i++) {
			let tr = tds[i].parent;
			if (!delTrs.includes(tr)) {
				delTrs.push(tr);
			}
		}
		const table = this.findTable(tds[0]);
		const colCount = table.children.head.children.length;
		delTrs.map((delTr) => {
			if (delTr.children.length < colCount) {
				let spanRowI = 1;
				// 在之前的 delTr 存在跨行, 影响了此行, 导致此行少 td
				let preTr = delTr.prev;
				while (preTr) {
					preTr.children.map((td) => {
						// 此单元格跨行影响到了删除行, 需要减少 rowspan
						if (td.domNode.getAttribute('rowspan') > spanRowI) {
							td.format('rowspan', Number(td.domNode.getAttribute('rowspan')) - 1);
						}
					});
					preTr = preTr.prev;
					spanRowI += 1;
				}
			}
			// 清除影响后, 若此行中的 td 存在跨行, 则需要在之后的 tr 对应位置新增 td
			let i = 0;
			delTr.children.map((td) => {
				if (td.domNode.getAttribute('rowspan') > 1) {
					// 此单元格跨行, 需要在之后的 tr 对应位置新增 td
					let nextTr = delTr.next;
					let newTd = Parchment.create(TableCellFormat.blotName, {
						tableId: table.tableId(),
						rowId: nextTr.rowId(),
						colId: td.colId(),
						cellId: randomId(),
						rowspan: td.domNode.getAttribute('rowspan') - 1,
						colspan: td.domNode.getAttribute('colspan'),
					});

					// 根据当前 td 在行中的 index, 找到对应的位置
					// let cur = nextTr.findTdWrapCol(i);
					let cur = nextTr.findTdByCol(i);
					// console.log(cur);
					if (cur === null) {
						nextTr.appendChild(newTd);
					} else {
						nextTr.insertBefore(newTd, cur);
					}
				}
				i += Number(td.domNode.getAttribute('colspan')) || 1;
				td.remove();
			});
		});
	}

	appendCol(isRight) {
		if (!this.tableSelection.selectedTds.length) return;
		const table = this.findTable(this.tableSelection.selectedTds[0]);
		const tableId = table.tableId();
		const newColId = randomId();
		const trs = table.children.tail.children;
		const trIterator = trs.iterator();
		let curTr = trIterator();

		// 找到插入列的下标
		let firstCell = this.tableSelection.selectedTds[0];
		if (isRight) {
			// 数组最后一项可能是跨行的前一个, 所有循环数组找到最右边的 cell
			let [rightCell] = this.tableSelection.selectedTds.reduce(
				(pre, cur) => {
					let curColIndex = cur.indexOfCol();
					if (curColIndex > pre[1]) {
						return [cur, curColIndex];
					}
					return pre;
				},
				[null, 0]
			);
			firstCell = rightCell;
		}
		let firstCellI = firstCell.indexOfCol();

		// 插入 cell
		for (let i = 0; i < trs.length; i++) {
			const td = Parchment.create(TableCellFormat.blotName, {
				tableId,
				rowId: curTr.rowId(),
				colId: newColId,
				cellId: randomId(),
				rowspan: 1,
				colspan: 1,
			});

			// 可能存在跨行的 td,
			let insertSelectTd = curTr.findTdByCol(firstCellI);
			// console.log(insertSelectTd);
			if (!insertSelectTd) {
				curTr.appendChild(td);
			} else {
				let insertSelectTdI = insertSelectTd.indexOfCol();
				// console.log(insertSelectTdI, firstCellI);
				if (isRight) {
					if (insertSelectTdI > firstCellI) {
						// console.log('right', 'colspan before', insertSelectTd.next);
						curTr.insertBefore(td, insertSelectTd);
					} else if (
						insertSelectTdI + (Number(insertSelectTd.domNode.getAttribute('colspan')) || 1) - 1 <=
						firstCellI
					) {
						// console.log('right', 'before', insertSelectTd.next);
						curTr.insertBefore(td, insertSelectTd.next);
					} else {
						// console.log('right', 'add', insertSelectTd);
						insertSelectTd.format('colspan', Number(insertSelectTd.domNode.getAttribute('colspan')) + 1);
					}
				} else {
					if (insertSelectTdI >= firstCellI) {
						// console.log('left', 'before', insertSelectTd);
						curTr.insertBefore(td, insertSelectTd);
					} else {
						// console.log('left', 'add', insertSelectTd);
						insertSelectTd.format('colspan', Number(insertSelectTd.domNode.getAttribute('colspan')) + 1);
					}
				}
			}

			curTr = trIterator();
		}

		// 插入 col
		const colGroup = table.children.head;
		const col = Parchment.create(TableColFormat.blotName, {
			tableId,
			colId: newColId,
			width: 280,
		});
		let curCol = colGroup.findCol(firstCellI);
		if (isRight) {
			colGroup.insertBefore(col, curCol.next);
		} else {
			colGroup.insertBefore(col, curCol);
		}
		// 更新 table 宽度
		table.tableWidth();
	}

	removeCol() {
		if (!this.tableSelection.selectedTds.length) return;
		let tds = this.tableSelection.selectedTds;

		let delColCount = 0;
		for (let i = 0; i < tds.length; i++) {
			if (tds[i - 1] && tds[i].rowId() !== tds[i - 1].rowId()) {
				break;
			}
			delColCount += Number(tds[i].domNode.getAttribute('colspan')) || 1;
		}
		let delColStartIndex = tds[0].indexOfCol();
		// console.log(delColCount, delColStartIndex);

		const table = this.findTable(this.tableSelection.selectedTds[0]);
		const trs = table.children.tail.children;
		const colIds = table.colsId();

		trs.map((tr) => {
			for (let i = delColStartIndex; i < delColStartIndex + delColCount; i++) {
				let removeCol = tr.exacFindTdByCol(i);
				if (removeCol) {
					if (removeCol.domNode.getAttribute('colspan') > delColStartIndex + delColCount - i) {
						// console.log(
						// 	'reduce',
						// 	removeCol,
						// 	removeCol.domNode.getAttribute('colspan') - (delColStartIndex + delColCount - i)
						// );
						removeCol.format(
							'colspan',
							removeCol.domNode.getAttribute('colspan') - (delColStartIndex + delColCount - i)
						);
						removeCol.domNode.dataset.colId = colIds[i];
					} else {
						// console.log('remove', removeCol);
						removeCol.remove();
					}
				}
			}
		});

		const colgroup = table.children.head;
		const colIterator = colgroup.children.iterator();
		let curCol;
		let i = 0;
		while ((curCol = colIterator())) {
			if (i >= delColStartIndex && i < delColStartIndex + delColCount) {
				curCol.remove();
			} else if (i >= delColStartIndex) {
				break;
			}
			i += 1;
		}

		table.tableWidth();
	}

	removeTable() {
		const selectedTds = this.tableSelection.selectedTds;
		if (!selectedTds.length) return;
		this.findTable(selectedTds[0]).remove();
	}

	mergeCells() {
		if (!this.tableSelection.selectedTds.length) return;
		// const table = this.findTable(this.tableSelection.selectedTds[0]);
		const selectTds = this.tableSelection.selectedTds;

		// 计算需要合并的单元格的行列数
		let counts = selectTds.reduce(
			(pre, td) => {
				const colId = td.colId();
				const rowId = td.rowId();
				if (!pre[0][colId]) pre[0][colId] = 0;
				pre[0][colId] += Number(td.domNode.getAttribute('rowspan')) || 1;

				if (!pre[1][rowId]) pre[1][rowId] = 0;
				pre[1][rowId] += Number(td.domNode.getAttribute('colspan')) || 1;
				return pre;
			},
			[{}, {}]
		);
		const rowCount = Math.max(...Object.values(counts[0]));
		const colCount = Math.max(...Object.values(counts[1]));

		// console.log('col', colCount);
		// console.log('row', rowCount);
		// console.log(selectTds);
		const mergedCell = selectTds.reduce((pre, cur, index) => {
			if (index === 0) {
				cur.format('rowspan', rowCount);
				cur.format('colspan', colCount);
				pre = cur;
			} else {
				pre && cur.moveChildren(pre);
				cur.remove();
			}
			return pre;
		}, null);

		// 是否需要合并 col, row
	}

	// cellBackground(color) {
	// 	let td = this.findTd('td');
	// 	if (td) {
	// 		let style = 'background:' + color;
	// 		td.format('style', color ? style : false);
	// 	}
	// }
}

// 不可插入至表格的 blot
export const tableCantInsert = [TableCellFormat.blotName];
export const isForbidInTableBlot = (blot) => {
	return tableCantInsert.includes(blot.statics.blotName);
};

export const isForbidInTable = (current) => {
	return current && current.parent
		? isForbidInTableBlot(current.parent)
			? true
			: isForbidInTable(current.parent)
		: false;
};

TableHandler.moduleName = 'table';
TableHandler.toolName = 'table';

icons[TableHandler.toolName] = `<svg width="32" height="32" viewBox="0 0 32 32">
	<path class="ql-fill" fill="currentColor" d="M27 3H5a2 2 0 0 0-2 2v22a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 2v4H5V5Zm-10 6h10v7H17Zm-2 7H5v-7h10ZM5 20h10v7H5Zm12 7v-7h10v7Z" />
</svg>`;
export default TableHandler;
