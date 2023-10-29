import Quill from 'quill';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');
import TableColgroupFormat from '@/assets/quill/format/TableColgroupFormat';

class Table extends Container {
	constructor(domNode, value) {
		super(domNode, value);
		this.tableWidth();
	}

	static create(value) {
		const node = super.create();

		node.dataset.tableId = value;
		node.classList.add('ql-table');
		node.setAttribute('cellpadding', 0);
		node.setAttribute('cellspacing', 0);
		// 防止 wrapper 和 table 间可输入
		// node.setAttribute('contenteditable', false);

		return node;
	}

	tableWidth() {
		setTimeout(() => {
			let colgroup = this.children.head;
			if (!colgroup || colgroup.statics.blotName !== TableColgroupFormat.blotName) return;

			let tableWidth = colgroup.children.reduce((sum, col) => col.getWidth() + sum, 0);
			this.domNode.style.width = tableWidth + 'px';
		}, 0);
	}

	tableId() {
		return this.domNode.dataset.tableId;
	}

	rowsId() {
		return this.children.tail.children.map((d) => d.rowId());
	}

	colsId() {
		return this.children.head.children.map((d) => d.colId());
	}

	optimize() {
		super.optimize();
		let next = this.next;
		if (
			next != null &&
			next.prev === this &&
			next.statics.blotName === this.statics.blotName &&
			next.domNode.tagName === this.domNode.tagName &&
			next.domNode.dataset.tableId === this.domNode.dataset.tableId
		) {
			next.moveChildren(this);
			next.remove();
		}
	}

	// 注意 table 的 format 不要在 static 写 defaultChild, 否则会导致 table 内的 blot 无法全部删除, 而导致 table 无法删除
	// deleteAt(index, length) {
	// 	super.deleteAt(index, length);
	// }
}

Table.blotName = 'table';
Table.tagName = 'table';
Table.scope = Parchment.Scope.BLOCK_BLOT;

export default Table;
