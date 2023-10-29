import Quill from 'quill';
const Block = Quill.import('blots/block');
// 不可以使用此方法引入继承类, 会导致方法失效
// import Block from 'quill/blots/block';

// 为 header 添加 id, 以实现目录
class DirectiveHeader extends Block {
	static formats(domNode) {
		return this.tagName.indexOf(domNode.tagName) + 1;
	}
	static create(level) {
		const node = super.create(level);
		// console.log(node, this.count);
		node.setAttribute('id', `header${level}.${this.count++}`);

		return node;
	}
}
DirectiveHeader.blotName = 'header';
DirectiveHeader.tagName = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
DirectiveHeader.count = 1;

export default DirectiveHeader;
