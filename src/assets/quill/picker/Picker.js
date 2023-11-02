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
		let option;
		if (this.select.selectedIndex > -1) {
			let item = this.container.querySelector('.ql-picker-options').children[this.select.selectedIndex];
			option = this.select.options[this.select.selectedIndex];
			this.selectItem(item);
		} else {
			this.selectItem(null);
		}
		let isActive = option != null && option !== this.select.querySelector('option[selected]');
		// 上面代码没有更改, 继承自 quill/ui/picker.js 主要是需要使用到 isActive
		// 切换光标时切换 toolbar 上的按钮状态
		this.label.classList.toggle('ql-active', isActive);
		this.label.dataset.value = option ? option.value : false;
		return isActive;
	}
}
