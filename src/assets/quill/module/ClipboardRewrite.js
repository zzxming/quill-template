import Quill from 'quill';
const Delta = Quill.import('delta');
const Clipboard = Quill.import('modules/clipboard');

class ClipboardRewrite extends Clipboard {
	constructor(quill, options) {
		super(quill, options);

		// 若不监听 scroll 会导致粘贴后输入框会滚动到顶部然后再到 this.scrollTop 的位置, 可见的闪现一次
		this.scrollTop = null;
		this.container.addEventListener('scroll', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (this.scrollTop) {
				this.quill.container.scrollTop = this.scrollTop;
			}
			return false;
		});
	}

	onPaste(e) {
		if (e.defaultPrevented || !this.quill.isEnabled()) return;
		let range = this.quill.getSelection();
		let delta = new Delta().retain(range.index);
		// 解决粘贴后输入框滚动到顶部问题, 把原来的 this.quill.scrollingContainer 改为 this.quill.container
		// 记录粘贴前滚动距离, 粘贴后恢复
		let scrollTop = this.quill.container.scrollTop;
		this.scrollTop = scrollTop;

		this.container.focus();
		this.quill.selection.update(Quill.sources.SILENT);
		setTimeout(async () => {
			delta = delta.concat(this.convert()).delete(range.length);
			this.quill.updateContents(delta, Quill.sources.USER);
			this.quill.setSelection(delta.length() - range.length, Quill.sources.SILENT);

			this.quill.container.scrollTop = scrollTop;

			this.quill.focus();

			// 使用此方法滚动至光标
			this.quill.selection.scrollIntoView(this.quill.container);
			// 消除记录
			this.scrollTop = null;
		}, 1);
	}
}

ClipboardRewrite.moduleName = 'clipboard';
export default ClipboardRewrite;
