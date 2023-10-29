import Quill from 'quill';
const Inline = Quill.import('blots/inline');

class LinkFormat extends Inline {
	static create(value) {
		// 原 link format 只传值 link, 复制粘贴时不会通过 Link.js 格式化
		let { text, link } = value;

		if (!text) {
			link = value;
		}

		const node = super.create(link);
		node.classList.add('link');
		node.setAttribute('href', link);
		node.textContent = text;
		node.setAttribute('target', '_blank');

		return node;
	}
	static formats(domNode) {
		return domNode.getAttribute('href');
	}

	static sanitize(url) {
		return url || this.SANITIZED_URL;
	}

	format(name, value) {
		// 保证撤回操作时 url 修改正常
		if (name !== this.statics.blotName || !value) return super.format(name, value);
		value = this.constructor.sanitize(value);
		this.domNode.setAttribute('href', value);
	}
}

LinkFormat.SANITIZED_URL = 'about:blank';
LinkFormat.blotName = 'link';
LinkFormat.tagName = 'A';

export default LinkFormat;
