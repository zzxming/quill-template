import MyPicker from '@/assets/quill/picker/Picker';

export default class MyColorPicker extends MyPicker {
	constructor(select, label, defualtColor) {
		// ColorPicker 重写代码
		super(select);
		this.label.innerHTML = label;
		this.container.classList.add('ql-color-picker');
		[].slice.call(this.container.querySelectorAll('.ql-picker-item'), 0, 7).forEach(function (item) {
			item.classList.add('ql-primary');
		});

		// 为图标 label 设置事件使点击 label 可直接更改颜色
		this.label.addEventListener('mousedown', () => {
			// 关闭选择框
			this.container.classList.toggle('ql-expanded');
			this.label.setAttribute('aria-expanded', false);
			this.options.setAttribute('aria-hidden', false);

			// 以下代码为 update 方法
			// 点击 label 直接赋值
			let ops = Array.from(this.container.querySelector('.ql-picker-options').children);
			let i = ops.findIndex((op) => {
				let v = op.dataset.value ?? '#ffffff';
				return v === this.curColor;
			});
			let item = ops[i];
			let option = this.select.options[i];
			// trigger 传 true, 使触发 select 的 change 事件, 更改富文本样式
			this.selectItem(item, true);
			let isActive = option != null && option !== this.select.querySelector('option[selected]');
			this.label.classList.toggle('ql-active', isActive);
			// 使 labelIcon 和 label 同样式, 样式修改看 global.less
			this.labelIcon && this.labelIcon.classList.toggle('ql-active', isActive);
		});
		// 取消点击 label 可展开选择框
		this.label.removeEventListener('mousedown', this.labelMouseDownHandler);
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

	update() {
		let isActive = super.update();
		// 使展开 icon 与图标 icon 同背景和颜色
		this.labelIcon && this.labelIcon.classList.toggle('ql-active', isActive);
	}

	selectItem(item, trigger) {
		super.selectItem(item, trigger);

		// ColorPicker 重写代码
		let colorLabel = this.label.querySelector('.ql-color-label');
		let value = item ? item.getAttribute('data-value') || '' : '';
		if (colorLabel) {
			if (colorLabel.tagName === 'line') {
				colorLabel.style.stroke = value;
			} else {
				colorLabel.style.fill = value;
			}
		}
		// 以上代码除初始行外未修改

		if (trigger) {
			console.log(value);
			// 保存修改颜色
			this.curColor = value;
		}
	}

	buildItem(option) {
		// 以下代码未修改
		let item = super.buildItem(option);
		item.style.backgroundColor = option.getAttribute('value') || '';
		return item;
	}
}
