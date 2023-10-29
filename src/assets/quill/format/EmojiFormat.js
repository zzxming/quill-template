import { emojiMap } from '@/assets/const/emoji';
import Quill from 'quill';
const InlineEmbed = Quill.import('blots/embed');

class EmojiFormat extends InlineEmbed {
	static create(arg) {
		let { name } = arg;
		const node = super.create(arg);
		if (!name) return node;

		node.dataset.name = name;

		let img = document.createElement('img');
		img.classList.add('ql-emoji-icon');
		img.setAttribute('src', emojiMap[name].icon);
		node.appendChild(img);

		return node;
	}
	deleteAt(index, length) {
		super.deleteAt(index, length);
		this.cache = {};
	}
	static value(domNode) {
		const { name } = domNode.dataset;
		return { name };
	}
}

EmojiFormat.blotName = 'emoji';
EmojiFormat.className = 'ql-emoji';
EmojiFormat.tagName = 'span';
Quill.register({ 'formats/emoji': EmojiFormat });

export default EmojiFormat;
