import Picker from 'quill/ui/picker';

export default class MyPicker extends Picker {
	constructor(select) {
		super(select);

		this.labelIcon = null;
		// this.container.dataset.tip = select.dataset.tip;
	}

	buildLabel() {
		let label = super.buildLabel();
		// 修改 icon, 因为引入了 Quill 下的 icon, 而 require 引入的会变成字符串, 需要改正
		label.innerHTML = `<svg viewBox="0 0 32 32"><path fill="currentColor" d="m24 12l-8 10l-8-10z"/></svg>`;
		return label;
	}

	update() {
		super.update();
	}
}
