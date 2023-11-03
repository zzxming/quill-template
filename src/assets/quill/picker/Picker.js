import Picker from 'quill/ui/picker';

export default class MyPicker extends Picker {
	constructor(select) {
		super(select);

		this.labelIcon = null;
	}

	buildLabel() {
		let label = super.buildLabel();
		// 修改 icon, 因为引入了 Quill 下的 icon, 而 require 引入的会变成字符串, 需要改正
		label.innerHTML = `<svg viewBox="0 0 32 32"><path fill="currentColor" d="m24 12l-8 10l-8-10z"/></svg>`;
		return label;
	}

	// quill 监听了 input 的 change 事件，会根据 select.value 设置 format
	// 在 dist/quill.js 9440 行
	triggerChange() {
		if (typeof Event === 'function') {
			this.select.dispatchEvent(new Event('change'));
		} else if (typeof Event === 'object') {
			// IE11
			let event = document.createEvent('Event');
			event.initEvent('change', true, true);
			this.select.dispatchEvent(event);
		}
	}
}
