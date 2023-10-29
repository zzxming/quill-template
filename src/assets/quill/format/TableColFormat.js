import Quill from 'quill';
const Parchment = Quill.import('parchment');

import TableFormat from '@/assets/quill/format/TableFormat';
import TableWrapperFormat from '@/assets/quill/format/TableWrapperFormat';
import TableColgroupFormat from '@/assets/quill/format/TableColgroupFormat';

const Block = Quill.import('blots/block');

class TableCol extends Block {
	static create(value) {
		let { width, tableId, colId } = value;

		let node = super.create();

		node.setAttribute('width', width);
		node.dataset.tableId = tableId;
		node.dataset.colId = colId;

		return node;
	}

	getWidth() {
		return Number(this.domNode.getAttribute('width'));
	}

	colId() {
		return this.domNode.dataset.colId;
	}

	formats() {
		return {
			[this.statics.blotName]: {
				width: this.domNode.getAttribute('width'),
				tableId: this.domNode.dataset.tableId,
				colId: this.domNode.dataset.colId,
			},
		};
	}

	format(name, value) {
		if (name != null) {
			if (value) {
				this.domNode.setAttribute(name, value ?? 'auto');
			} else {
				this.domNode.removeAttribute(name);
			}
		} else {
			super.format(name, value);
		}
	}

	optimize() {
		super.optimize();

		let parent = this.parent;
		if (parent != null && parent.statics.blotName != TableColgroupFormat.blotName) {
			// we will mark td position, put in table and replace mark
			let mark = Parchment.create('block');

			this.parent.insertBefore(mark, this.next);
			let tableWrapper = Parchment.create(TableWrapperFormat.blotName, this.domNode.dataset.tableId);
			let table = Parchment.create(TableFormat.blotName, this.domNode.dataset.tableId);

			let tableColgroup = Parchment.create(TableColgroupFormat.blotName);

			tableColgroup.appendChild(this);
			table.appendChild(tableColgroup);
			tableWrapper.appendChild(table);

			// 最终显示 tableWrapper
			tableWrapper.replace(mark);
		}

		let next = this.next;
		if (
			next != null &&
			next.prev === this &&
			next.statics.blotName === this.statics.blotName &&
			next.domNode.tagName === this.domNode.tagName &&
			next.domNode.dataset.tableId === this.domNode.dataset.tableId &&
			next.domNode.dataset.colId === this.domNode.dataset.colId
		) {
			next.moveChildren(this);
			next.remove();
		}
	}

	html() {
		return this.domNode.outerHTML;
	}
}
TableCol.blotName = 'col';
TableCol.tagName = 'col';
// 嵌套合并必须有 scope
TableCol.scope = Parchment.Scope.BLOCK_BLOT;

export default TableCol;
