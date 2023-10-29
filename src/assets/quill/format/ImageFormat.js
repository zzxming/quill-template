import Quill from 'quill';
const Image = Quill.import('formats/image');

class ImageFormat extends Image {
	static create({ src, uuid }) {
		const node = super.create(src);
		node.setAttribute('src', src);
		node.dataset.uuid = uuid;
		return node;
	}

	setSrc(src) {
		this.domNode.src = src;
	}

	static value(domNode) {
		// 传给detla的属性
		const { uuid } = domNode.dataset;
		return { src: domNode.getAttribute('src'), uuid };
	}
}

ImageFormat.blotName = 'image';
ImageFormat.tagName = 'IMG';
ImageFormat.className = 'ql-image';

export default ImageFormat;
