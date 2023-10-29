import Quill from 'quill';
const Delta = Quill.import('delta');
import ImageUploader from 'quill-image-uploader';
import LoadingImage from 'quill-image-uploader/src/blots/image.js';
import ImageFormat from '@/assets/quill/format/ImageFormat';

class LoadingImageRewrite extends LoadingImage {
	static create(src) {
		const node = super.create(src);
		node.setAttribute('contenteditable', false);
		return node;
	}
}
LoadingImageRewrite.blotName = 'imageUploadingBlot';
Quill.register({ 'formats/imageUploadingBlot': LoadingImageRewrite });

class ImageUploaderRewrite extends ImageUploader {
	constructor(quill, options) {
		super(quill, options);
	}

	readAndUploadFile(file) {
		let isUploadReject = false;
		if (file.type.split('/')[0] !== 'image') {
			return;
		}
		this.insertImagePreview(URL.createObjectURL(file));

		let uuid = crypto.randomUUID();
		let timestamp = new Date().getTime();
		file.uuid = uuid + '-' + timestamp;

		this.options.upload(file).then(
			(imageUrl) => {
				this.insertToEditor(imageUrl, file);
			},
			(error) => {
				isUploadReject = true;
				this.removeLoadingImage();
				console.warn(error);
			}
		);
	}

	removeLoadingImage() {
		const lengthToDelete = this.calculatePlaceholderInsertLength();
		this.placeholderDelta = null;
		return lengthToDelete;
	}

	insertImagePreview(url) {
		const range = this.range;
		this.placeholderDelta = this.quill.insertEmbed(range.index, LoadingImageRewrite.blotName, url, 'api');
		this.quill.setSelection(range, 'api');
	}

	insertToEditor(url, file) {
		const range = this.range;

		const lengthToDelete = this.removeLoadingImage();

		this.quill.formatText(range.index, lengthToDelete, { [LoadingImageRewrite.blotName]: false }, 'api');
		let deleteLen = this.quill.getText(range.index, 1) === '\n' ? 2 : 1;
		this.quill.updateContents(
			new Delta()
				.retain(range.index)
				.delete(deleteLen)
				.insert('\n')
				.insert({
					[ImageFormat.blotName]: { src: url, uuid: file.uuid },
				}),
			'api'
		);
		range.index += 3;
		this.quill.setSelection(range, 'user');
	}

	calculatePlaceholderInsertLength() {
		return this.placeholderDelta.ops.reduce((accumulator, deltaOperation) => {
			if (deltaOperation.hasOwnProperty('insert')) accumulator++;

			return accumulator;
		}, 0);
	}
}

ImageUploaderRewrite.moduleName = 'imageUploader';
export default ImageUploaderRewrite;
