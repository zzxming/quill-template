import { h, render } from 'vue';
import EmojiSelect from '@/components/EmojiSelect.vue';
import EmojiFormat from '@/assets/quill/format/EmojiFormat';

import Quill from 'quill';
const icons = Quill.import('ui/icons');

class Emoji {
	constructor(quill) {
		this.quill = quill;
		this.range = null;

		/** toolbar emoji button */
		this.emojiBtn = null;
		/** emoji selector close handler */
		this.emojiSelectCloseHandler = null;

		let toolbar = this.quill.getModule('toolbar');
		if (toolbar) {
			toolbar.controls.find(([name, el]) => {
				if (name === EmojiFormat.blotName) {
					this.emojiBtn = el;

					this.emojiBtn.classList.add('ql-button-picker');
					this.emojiBtn.classList.add('ql-picker');

					let div = document.createElement('div');

					div.classList.add('ql-picker-options');
					div.classList.add('ql-custom-select');
					this.selectBox = div;
					this.emojiBtn.appendChild(div);
					this.emojiBtn.dataset.active = false;

					return true;
				}
			});
			toolbar.addHandler(Emoji.toolName, this.handleDisplay.bind(this));
		}
	}

	createSelect() {
		let handle = this.emojiSelected.bind(this);
		render(
			h(EmojiSelect, {
				style: { margin: 0, padding: '4px' },
				onSelected(detail) {
					handle(detail);
				},
			}),
			this.selectBox
		);
	}

	handleDisplay() {
		this.createSelect();

		this.quill.focus();
		this.range = this.quill.getSelection();

		// 展开时添加此类名, 否则会导致提示文字遮挡 emoji 选择框
		this.emojiBtn.classList.add('ql-expanded');
		this.emojiBtn.dataset.active = true;

		window.removeEventListener('click', this.emojiSelectCloseHandler, true);
		this.emojiSelectCloseHandler = this.closeSelector.bind(this);
		window.addEventListener('click', this.emojiSelectCloseHandler, true);
	}

	emojiSelected(detail) {
		const range = this.range;

		this.quill.insertEmbed(range.index, EmojiFormat.blotName, detail, 'user');

		range.index += 1;
		this.quill.setSelection(range, 'user');
		this.quill.focus();

		// this.closeSelector();
	}

	closeSelector(e) {
		let path = (e.composedPath && e.composedPath()) || e.path;
		// 点击其他地方才关闭, 保证能连续选择表情
		if (!path || !path.includes(this.emojiBtn)) {
			this.emojiBtn.classList.remove('ql-expanded');
			this.emojiBtn.dataset.active = false;
			window.removeEventListener('click', this.emojiSelectCloseHandler, true);
		}
	}
}

Emoji.toolName = 'emoji';
Emoji.moduleName = 'emoji';

// 添加icon, 注意 icon 的 path class 名
icons[Emoji.toolName] = `<svg viewBox="0 0 32 32">
<path class="ql-fill" fill="currentColor" d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2Zm0 26a12 12 0 1 1 12-12a12 12 0 0 1-12 12Z"></path>
<path class="ql-fill" fill="currentColor" d="M11.5 11a2.5 2.5 0 1 0 2.5 2.5a2.48 2.48 0 0 0-2.5-2.5zm9 0a2.5 2.5 0 1 0 2.5 2.5a2.48 2.48 0 0 0-2.5-2.5zM16 24a8 8 0 0 0 6.85-3.89l-1.71-1a6 6 0 0 1-10.28 0l-1.71 1A8 8 0 0 0 16 24z"></path>
</svg>`;

export default Emoji;
