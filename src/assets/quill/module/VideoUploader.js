import LoadingVideo from '@/assets/quill/format/LoadingVideo';
import VideoFormat from '@/assets/quill/format/VideoFormat';

class VideoUploader {
	constructor(quill, options) {
		this.quill = quill;
		this.options = options;
		this.range = null;
		this.placeholderDelta = null;

		if (typeof this.options.upload !== 'function')
			console.warn('[Missing config] upload function that returns a promise is required');

		let toolbar = this.quill.getModule('toolbar');
		if (toolbar) {
			toolbar.addHandler('video', this.selectLocalVideo.bind(this));
		}

		this.handleDrop = this.handleDrop.bind(this);
		this.handlePaste = this.handlePaste.bind(this);

		this.quill.root.addEventListener('drop', this.handleDrop, false);
		this.quill.root.addEventListener('paste', this.handlePaste, false);
	}

	selectLocalVideo() {
		this.quill.focus();
		this.range = this.quill.getSelection();
		this.fileHolder = document.createElement('input');
		this.fileHolder.setAttribute('type', 'file');
		this.fileHolder.setAttribute('accept', 'video/*');
		this.fileHolder.setAttribute('style', 'visibility:hidden');

		this.fileHolder.onchange = this.fileChanged.bind(this);

		document.body.appendChild(this.fileHolder);

		this.fileHolder.click();

		window.requestAnimationFrame(() => {
			document.body.removeChild(this.fileHolder);
		});
	}
	handleDrop(evt) {
		if (evt.dataTransfer && evt.dataTransfer.files && evt.dataTransfer.files.length) {
			evt.stopPropagation();
			evt.preventDefault();
			if (document.caretRangeFromPoint) {
				const selection = document.getSelection();
				const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
				if (selection && range) {
					selection.setBaseAndExtent(
						range.startContainer,
						range.startOffset,
						range.startContainer,
						range.startOffset
					);
				}
			} else {
				const selection = document.getSelection();
				const range = document.caretPositionFromPoint(evt.clientX, evt.clientY);
				if (selection && range) {
					selection.setBaseAndExtent(range.offsetNode, range.offset, range.offsetNode, range.offset);
				}
			}

			this.quill.focus();
			this.range = this.quill.getSelection();
			let file = evt.dataTransfer.files[0];

			setTimeout(() => {
				this.quill.focus();
				this.range = this.quill.getSelection();
				this.readAndUploadFile(file);
			}, 0);
		}
	}
	handlePaste(evt) {
		let clipboard = evt.clipboardData || window.clipboardData;

		// IE 11 is .files other browsers are .items
		if (clipboard && (clipboard.items || clipboard.files)) {
			let items = clipboard.items || clipboard.files;
			const VIDEO_MIME_REGEX = /^video/i;

			for (let i = 0; i < items.length; i++) {
				if (VIDEO_MIME_REGEX.test(items[i].type)) {
					let file = items[i].getAsFile ? items[i].getAsFile() : items[i];

					if (file) {
						this.quill.focus();
						this.range = this.quill.getSelection();
						evt.preventDefault();
						setTimeout(() => {
							this.quill.focus();
							this.range = this.quill.getSelection();
							this.readAndUploadFile(file);
						}, 0);
					}
				}
			}
		}
	}

	fileChanged() {
		const file = this.fileHolder.files[0];
		this.readAndUploadFile(file);
	}

	readAndUploadFile(file) {
		if (file.type.split('/')[0] !== 'video') {
			return;
		}

		let uuid = crypto.randomUUID();
		let timestamp = new Date().getTime();
		file.uuid = uuid + '-' + timestamp;

		if (file) {
			let url = URL.createObjectURL(file);
			this.insertVideoPreview(url);
		}

		this.options.upload(file).then(
			(videoUrl) => {
				this.insertToEditor(videoUrl, file);
			},
			(error) => {
				this.removeVideoPreview();
				console.warn(error);
			}
		);
	}

	insertVideoPreview(url) {
		const range = this.range;
		// 添加加载占位
		this.placeholderDelta = this.quill.insertEmbed(range.index, LoadingVideo.blotName, url, 'user');
	}

	insertToEditor(url, file) {
		const range = this.range;
		const lengthToDelete = this.calculatePlaceholderInsertLength();

		// 删除加载占位
		this.quill.deleteText(range.index, lengthToDelete, 'user');

		this.quill.insertText(range.index, '\n', 'user');
		this.quill.insertEmbed(range.index + 1, VideoFormat.blotName, { src: url, uuid: file.uuid }, 'user');
		this.quill.insertText(range.index + 2, '\n', 'user');
		range.index += 3;

		this.quill.setSelection(range, 'user');
	}

	calculatePlaceholderInsertLength() {
		return this.placeholderDelta.ops.reduce((accumulator, deltaOperation) => {
			if (deltaOperation.hasOwnProperty('insert')) {
				accumulator++;
			}

			return accumulator;
		}, 0);
	}

	removeVideoPreview() {
		const range = this.range;
		const lengthToDelete = this.calculatePlaceholderInsertLength();

		this.quill.deleteText(range.index, lengthToDelete, 'user');
	}
}

VideoUploader.moduleName = 'videoUploader';
export default VideoUploader;
