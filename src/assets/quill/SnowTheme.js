import Quill from 'quill';

import BaseTheme from 'quill/themes/base';
import IconPicker from 'quill/ui/icon-picker';
import Emitter from 'quill/core/emitter';

import SnowTooltip from '@/assets/quill/SnowToolTip';
import MyPicker from '@/assets/quill/picker/Picker';
import MyColorPicker from '@/assets/quill/picker/ColorPicker';

// 注意引入方式, import 和 import 引入的 SnowTheme 会导致 icons 为模块, 而无法获取 svg
const icons = Quill.prototype.constructor.imports['ui/icons'];

const ALIGNS = [false, 'center', 'right', 'justify'];
const COLORS = [
	'#000000',
	'#e60000',
	'#ff9900',
	'#ffff00',
	'#008a00',
	'#0066cc',
	'#9933ff',
	'#ffffff',
	'#facccc',
	'#ffebcc',
	'#ffffcc',
	'#cce8cc',
	'#cce0f5',
	'#ebd6ff',
	'#bbbbbb',
	'#f06666',
	'#ffc266',
	'#ffff66',
	'#66b966',
	'#66a3e0',
	'#c285ff',
	'#888888',
	'#a10000',
	'#b26b00',
	'#b2b200',
	'#006100',
	'#0047b2',
	'#6b24b2',
	'#444444',
	'#5c0000',
	'#663d00',
	'#666600',
	'#003700',
	'#002966',
	'#3d1466',
];
const FONTS = [false, 'serif', 'monospace'];
const HEADERS = ['1', '2', '3', false];
const SIZES = ['small', false, 'large', 'huge'];
const FONTSIZES = ['12', '14', false, '18', '20', '24', '32', '48', '64', '72'];

// quill SnowTheme 重写
export default class SnowThemeRewrite extends BaseTheme {
	constructor(quill, options) {
		super(quill, options);
		this.quill.container.classList.add('ql-snow');
	}

	extendToolbar(toolbar) {
		toolbar.container.classList.add('ql-snow');
		this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), icons);
		this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), icons);
		// 为使用重写的 SnowToolTip
		this.tooltip = new SnowTooltip(this.quill, this.options.bounds);
	}

	buildPickers(selects, icons) {
		this.pickers = selects.map((select) => {
			if (select.classList.contains('ql-align')) {
				if (select.querySelector('option') == null) {
					fillSelect(select, ALIGNS);
				}
				return new IconPicker(select, icons.align);
			} else if (select.classList.contains('ql-background') || select.classList.contains('ql-color')) {
				let format = select.classList.contains('ql-background') ? 'background' : 'color';
				if (select.querySelector('option') == null) {
					fillSelect(select, COLORS, format === 'background' ? '#ffffff' : '#000000');
				}
				let defualtColor = 'background' ? '#ffffff' : '#000000';
				return new MyColorPicker(select, icons[format], defualtColor);
			} else {
				if (select.querySelector('option') == null) {
					if (select.classList.contains('ql-font')) {
						fillSelect(select, FONTS);
					} else if (select.classList.contains('ql-header')) {
						fillSelect(select, HEADERS);
					} else if (select.classList.contains('ql-size')) {
						fillSelect(select, SIZES);
					} else if (select.classList.contains('ql-fontsize')) {
						fillSelect(select, FONTSIZES);
					}
				}
				return new MyPicker(select);
			}
		});
		// 光标改变时，picker 随着当前行改变
		let update = () => {
			this.pickers.forEach(function (picker) {
				if (picker instanceof MyColorPicker) return;
				picker.update();
			});
		};
		this.quill.on(Emitter.events.EDITOR_CHANGE, update);
	}
}

function fillSelect(select, values, defaultValue = false) {
	values.forEach(function (value) {
		let option = document.createElement('option');
		if (value === defaultValue) {
			option.setAttribute('selected', 'selected');
		} else {
			option.setAttribute('value', value);
		}
		select.appendChild(option);
	});
}
