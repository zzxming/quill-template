import MyPicker from '@/assets/quill/picker/Picker';

export default class MyColorPicker extends MyPicker {
	constructor(select, label, defualtColor) {
		super(select);
		this.label.innerHTML = label;
		this.container.classList.add('ql-color-picker');

		// 为图标 label 设置事件使点击 label 可直接更改颜色
		this.label.addEventListener('mousedown', () => {
			this.close();
			const i = [].findIndex.call(this.select.options, (option) => option.value === this.curColor);
			this.select.selectedIndex = i;
			// 触发 change 事件使 quill 更换颜色
			this.triggerChange();
		});
		// 为图标添加展开 icon
		this.expendIcon();
		this.curColor = defualtColor;
	}
	// 扩展 icon 后的下拉三角
	expendIcon() {
		this.label.style.flexShrink = '0';
		this.label.style.width = '32px';
		let span = document.createElement('span');
		span.classList.add('ql-picker-expand');
		span.innerHTML = `<svg viewBox="0 0 32 32"><path fill="currentColor" d="m24 12l-8 10l-8-10z"/></svg>`;
		this.label.parentNode.insertBefore(span, this.label.nextSibling);

		// 为展开 icon 添加点击时可以打开选择框
		span.addEventListener('mousedown', () => {
			this.togglePicker();
		});

		this.labelIcon = span;
	}

	selectItem(item, trigger) {
		super.selectItem(item, trigger);
		let colorLabel = this.label.querySelector('.ql-color-label');
		let value = item ? item.getAttribute('data-value') || '' : '';
		if (colorLabel) {
			if (colorLabel.tagName === 'line') {
				colorLabel.style.stroke = value;
			} else {
				colorLabel.style.fill = value;
			}
		}
		// 以上代码来自 color-picker 未修改
		this.curColor = value;
	}

	buildItem(option) {
		// 以下代码来自 color-picker 未修改
		let item = super.buildItem(option);
		item.style.backgroundColor = option.getAttribute('value') || '';
		return item;
	}
}
