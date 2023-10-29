import Quill from 'quill';
import defaultsDeep from 'lodash/defaultsDeep';
// image-resize 插件没有默认导出, 打包会报错, 只能一个一个引入
import DefaultOptions from 'quill-image-resize-module/src/DefaultOptions';
import { Resize } from 'quill-image-resize-module/src/modules/Resize';
import { DisplaySize } from 'quill-image-resize-module/src/modules/DisplaySize';
import { Toolbar } from 'quill-image-resize-module/src/modules/Toolbar';

// resize 的子模块中的 this.img 来自 BaseModule 的 constructor
// 子模块的创建在 initializeModules, 在创建时把 this 传入了, 从中重新赋值获取的 this.img

const IconAlignLeft = `<svg viewbox="0 0 18 18">
<line class="ql-stroke" x1="3" x2="15" y1="9" y2="9"></line>
<line class="ql-stroke" x1="3" x2="13" y1="14" y2="14"></line>
<line class="ql-stroke" x1="3" x2="9" y1="4" y2="4"></line>
</svg>`;
const IconAlignCenter = `<svg viewbox="0 0 18 18">
<line class="ql-stroke" x1="15" x2="3" y1="9" y2="9"></line>
<line class="ql-stroke" x1="14" x2="4" y1="14" y2="14"></line>
<line class="ql-stroke" x1="12" x2="6" y1="4" y2="4"></line>
</svg>`;
const IconAlignRight = `<svg viewbox="0 0 18 18">
<line class="ql-stroke" x1="15" x2="3" y1="9" y2="9"></line>
<line class="ql-stroke" x1="15" x2="5" y1="14" y2="14"></line>
<line class="ql-stroke" x1="15" x2="9" y1="4" y2="4"></line>
</svg>`;

const Parchment = Quill.imports.parchment;
const FloatStyle = new Parchment.Attributor.Style('float', 'float');
const MarginStyle = new Parchment.Attributor.Style('margin', 'margin');
const DisplayStyle = new Parchment.Attributor.Style('display', 'display');

class ToolbarRewrite extends Toolbar {
	constructor(resizer) {
		super(resizer);
		this.quill = resizer.quill;
	}

	_defineAlignments = () => {
		this.alignments = [
			{
				icon: IconAlignLeft,
				apply: () => {
					DisplayStyle.add(this.img, 'inline');
					FloatStyle.add(this.img, 'left');
					MarginStyle.add(this.img, '0 1em 1em 0');
				},
				isApplied: () => {
					return FloatStyle.value(this.img) == 'left';
				},
			},
			{
				icon: IconAlignCenter,
				apply: () => {
					DisplayStyle.add(this.img, 'block');
					FloatStyle.remove(this.img);
					MarginStyle.add(this.img, 'auto');
				},
				isApplied: () => MarginStyle.value(this.img) == 'auto',
			},
			{
				icon: IconAlignRight,
				apply: () => {
					DisplayStyle.add(this.img, 'inline');
					FloatStyle.add(this.img, 'right');
					MarginStyle.add(this.img, '0 0 1em 1em');
				},
				isApplied: () => FloatStyle.value(this.img) == 'right',
			},
		];
	};

	_addToolbarButtons = () => {
		const buttons = [];
		this.alignments.forEach((alignment, idx) => {
			const button = document.createElement('span');
			buttons.push(button);
			button.innerHTML = alignment.icon;
			button.addEventListener('click', () => {
				// deselect all buttons
				buttons.forEach((button) => (button.style.filter = ''));
				if (alignment.isApplied()) {
					// If applied, unapply
					FloatStyle.remove(this.img);
					MarginStyle.remove(this.img);
					DisplayStyle.remove(this.img);
				} else {
					this._selectButton(button);
					alignment.apply();
				}
				this.requestUpdate();
			});
			Object.assign(button.style, this.options.toolbarButtonStyles);
			if (idx > 0) {
				button.style.borderLeftWidth = '0';
			}
			button.children[0] && Object.assign(button.children[0].style, this.options.toolbarButtonSvgStyles);
			if (alignment.isApplied()) {
				this._selectButton(button);
			}
			this.toolbar.appendChild(button);
		});
	};
}

const knownModules = { Toolbar: ToolbarRewrite, Resize, DisplaySize };

class ImageResizeRewrite {
	constructor(quill, options = {}) {
		this.quill = quill;

		let moduleClasses = false;
		if (options.modules) {
			moduleClasses = options.modules.slice();
		}

		this.options = defaultsDeep({}, options, DefaultOptions);

		if (moduleClasses !== false) {
			this.options.modules = moduleClasses;
		}

		document.execCommand('enableObjectResizing', false, 'false');
		this.quill.root.addEventListener('click', this.handleClick, false);
		this.quill.root.parentNode.style.position = this.quill.root.parentNode.style.position || 'relative';
		this.moduleClasses = this.options.modules;
		this.modules = [];
	}

	initializeModules = () => {
		this.removeModules();

		this.modules = this.moduleClasses.map((ModuleClass) => {
			return new (knownModules[ModuleClass] || ModuleClass)(this);
		});

		this.modules.forEach((module) => {
			module.onCreate();
		});

		this.onUpdate();
	};

	handleClick = (e) => {
		if (e.target && e.target.tagName && e.target.tagName.toUpperCase() === 'IMG') {
			if (this.img === e.target) {
				return;
			}
			if (this.img) {
				this.hide();
			}
			this.show(e.target);
		} else if (this.img) {
			this.hide();
		}
	};

	hide = () => {
		this.hideOverlay();
		this.removeModules();
		this.img = undefined;
	};

	showOverlay = () => {
		if (this.overlay) {
			this.hideOverlay();
		}
		this.quill.setSelection(null);

		this.setUserSelect('none');

		document.addEventListener('keyup', this.checkImage, true);
		this.quill.root.addEventListener('input', this.checkImage, true);

		this.overlay = document.createElement('div');
		Object.assign(this.overlay.style, this.options.overlayStyles);

		this.quill.root.parentNode.appendChild(this.overlay);

		this.repositionElements();
	};

	hideOverlay = () => {
		if (!this.overlay) {
			return;
		}

		this.quill.root.parentNode.removeChild(this.overlay);
		this.overlay = undefined;

		document.removeEventListener('keyup', this.checkImage);
		this.quill.root.removeEventListener('input', this.checkImage);

		this.setUserSelect('');
	};

	checkImage = (evt) => {
		if (this.img) {
			if (evt.keyCode == 46 || evt.keyCode == 8) {
				window.Quill.find(this.img).deleteAt(0);
			}
			this.hide();
		}
	};

	// 未重写方法
	onUpdate = () => {
		this.repositionElements();
		this.modules.forEach((module) => {
			module.onUpdate();
		});
	};

	removeModules = () => {
		this.modules.forEach((module) => {
			module.onDestroy();
		});

		this.modules = [];
	};

	show = (img) => {
		// keep track of this img element
		this.img = img;

		this.showOverlay();

		this.initializeModules();
	};

	repositionElements = () => {
		if (!this.overlay || !this.img) {
			return;
		}

		// position the overlay over the image
		const parent = this.quill.root.parentNode;
		const imgRect = this.img.getBoundingClientRect();
		const containerRect = parent.getBoundingClientRect();

		Object.assign(this.overlay.style, {
			left: `${imgRect.left - containerRect.left - 1 + parent.scrollLeft}px`,
			top: `${imgRect.top - containerRect.top + parent.scrollTop}px`,
			width: `${imgRect.width}px`,
			height: `${imgRect.height}px`,
		});
	};

	setUserSelect = (value) => {
		['userSelect', 'mozUserSelect', 'webkitUserSelect', 'msUserSelect'].forEach((prop) => {
			// set on contenteditable element and <html>
			this.quill.root.style[prop] = value;
			document.documentElement.style[prop] = value;
		});
	};
}

ImageResizeRewrite.moduleName = 'imageResizeRewrite';
export default ImageResizeRewrite;
