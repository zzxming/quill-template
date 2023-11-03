import { BaseTooltip } from 'quill/themes/base';
import Emitter from 'quill/core/emitter';
import { Range } from 'quill/core/selection';

import LinkFormatBlot from '@/assets/quill/format/LinkFormat';
import { showQuillLinkCreator } from '@/utils/components';

export default class SnowTooltip extends BaseTooltip {
	constructor(quill, bounds) {
		super(quill, bounds);
		this.preview = this.root.querySelector('a.ql-preview');
	}
	// 重写定位, 保证不超出富文本框
	position(reference) {
		let left = reference.left + reference.width / 2 - this.root.offsetWidth / 2;
		// 修改时的滚动元素是 container, 不再是 root
		let top = reference.bottom + this.quill.container.scrollTop;
		// console.log(reference);
		// console.log(this.quill);
		// 限制范围
		if (left < 0) left = 0;
		if (left + this.root.offsetWidth > this.quill.root.offsetWidth)
			left = this.quill.root.offsetWidth - this.root.offsetWidth;
		// modify end
		this.root.style.left = left + 'px';
		this.root.style.top = top + 'px';
		this.root.classList.remove('ql-flip');
		let containerBounds = this.boundsContainer.getBoundingClientRect();
		let rootBounds = this.root.getBoundingClientRect();
		let shift = 0;
		if (rootBounds.right > containerBounds.right) {
			shift = containerBounds.right - rootBounds.right;
			this.root.style.left = left + shift + 'px';
		}
		if (rootBounds.left < containerBounds.left) {
			shift = containerBounds.left - rootBounds.left;
			this.root.style.left = left + shift + 'px';
		}
		if (rootBounds.bottom > containerBounds.bottom) {
			let height = rootBounds.bottom - rootBounds.top;
			let verticalShift = reference.bottom - reference.top + height;
			this.root.style.top = top - verticalShift + 'px';
			this.root.classList.add('ql-flip');
		}
		return shift;
	}

	listen() {
		super.listen();

		this.root.querySelector('a.ql-action').addEventListener('click', (event) => {
			if (this.root.classList.contains('ql-editing')) {
				this.save();
			} else {
				this.edit('link', this.preview.getAttribute('href'));
			}
			event.preventDefault();
		});
		this.root.querySelector('a.ql-remove').addEventListener('click', (event) => {
			if (this.linkRange != null) {
				let range = this.linkRange;
				this.restoreFocus();
				this.quill.formatText(range, 'link', false, Emitter.sources.USER);
				delete this.linkRange;
			}
			event.preventDefault();
			this.hide();
		});
		this.quill.on(Emitter.events.SELECTION_CHANGE, (range, oldRange, source) => {
			if (range == null) return;
			if (range.length === 0 && source === Emitter.sources.USER) {
				let [link, offset] = this.quill.scroll.descendant(LinkFormatBlot, range.index);
				if (link != null) {
					this.linkRange = new Range(range.index - offset, link.length());
					let preview = LinkFormatBlot.formats(link.domNode);
					this.preview.textContent = '打开链接';
					this.preview.setAttribute('href', preview);
					this.show();
					this.position(this.quill.getBounds(this.linkRange));
					return;
				}
			} else {
				delete this.linkRange;
			}
			this.hide();
		});
	}

	edit(mode = 'link', preview = null) {
		if (preview != null) {
			this.textbox.value = preview;
		} else if (mode !== this.root.getAttribute('data-mode')) {
			this.textbox.value = '';
		}
		// console.log(this.quill.getText(this.linkRange.index, this.linkRange.length), this.textbox.value, preview);
		showQuillLinkCreator(this.quill.getText(this.linkRange.index, this.linkRange.length), this.textbox.value).then(
			({ text, link }) => {
				this.replaceLink(text, link);
			}
		);

		this.root.setAttribute('data-mode', mode);
	}

	replaceLink(text, link) {
		let range = this.linkRange;

		this.quill.deleteText(range.index, range.length, 'user');
		this.quill.insertEmbed(range.index, LinkFormatBlot.blotName, { text, link }, 'user');

		range.index += Math.max(text.length, range.length);
		this.quill.setSelection(range.index, 0, 'user');
	}

	show() {
		super.show();
		this.root.removeAttribute('data-mode');
	}
}
SnowTooltip.TEMPLATE = [
	'<a class="ql-preview" rel="noopener noreferrer" target="_blank" href="about:blank"></a>',
	'<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">',
	'<div class="break"></div>',
	'<a class="ql-action"></a>',
	'<div class="break"></div>',
	'<a class="ql-remove"></a>',
].join('');
