import Quill from 'quill';
const Delta = Quill.import('delta');
import ImageUploader from 'quill-image-uploader';
import LoadingImage from 'quill-image-uploader/src/blots/image.js';
import ImageFormat from './ImageFormat';
import { compressPic } from '@/utils/image';
import { ElMessage } from 'element-plus';

Quill.register({ 'formats/image': ImageFormat });

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

	compressImageFile(file) {
		return new Promise((resolve, reject) => {
			let img = new Image();
			img.onload = async () => {
				let blobFile = await compressPic({ file, width: img.width, height: img.height });
				resolve(new File([blobFile], file.name, { type: blobFile.type }));
			};
			img.onerror = (e) => reject(e);
			img.src = URL.createObjectURL(file);
		});
	}

	async readAndUploadFile(file) {
		if (this.placeholderDelta) {
			ElMessage.warning('等待图片加载完成继续');
			return;
		}
		if (file.type.split('/')[0] !== 'image') {
			return;
		}
		this.insertImagePreview();

		// 非 gif 图片进行压缩
		if (file.type.split('/')[1] !== 'gif') {
			file = await this.compressImageFile(file);
		}

		let uuid = crypto.randomUUID();
		let timestamp = new Date().getTime();
		file.uuid = uuid + '-' + timestamp;

		this.options.upload(file).then(
			(imageUrl) => {
				this.insertToEditor(imageUrl, file);
			},
			(error) => {
				this.removeBase64Image();
				console.warn(error);
			}
		);
	}

	insertImagePreview() {
		const range = this.range;
		this.placeholderDelta = this.quill.insertEmbed(
			range.index,
			LoadingImageRewrite.blotName,
			'/static/image/loading.png',
			'api'
		);
		this.quill.setSelection(range, 'api');
	}

	insertToEditor(url, file) {
		const range = this.range;

		const lengthToDelete = this.calculatePlaceholderInsertLength();
		this.placeholderDelta = null;

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
