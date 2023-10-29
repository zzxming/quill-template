import { showQuillLinkCreator } from '@/utils/components';

import LinkFormat from '@/assets/quill/format/LinkFormat';

class Link {
	constructor(quill, options) {
		this.quill = quill;
		this.options = options;
		this.range = null;
		this.placeholderDelta = null;

		let toolbar = this.quill.getModule('toolbar');
		if (toolbar) {
			toolbar.addHandler('link', this.handleDisplay.bind(this));
		}
	}

	handleDisplay() {
		this.range = this.quill.getSelection();
		let selectText = this.quill.getText(this.range.index, this.range.length);

		showQuillLinkCreator(selectText).then(({ text, link }) => {
			this.insertToEditor(text, link);
		});
	}

	insertToEditor(text, link) {
		let range = this.range;

		this.quill.deleteText(range.index, range.length, 'user');
		this.quill.insertEmbed(range.index, LinkFormat.blotName, { text, link }, 'user');

		range.index += Math.max(text.length, range.length);
		this.quill.setSelection(range.index, 0, 'user');
	}
}

Link.moduleName = 'link';
export default Link;
