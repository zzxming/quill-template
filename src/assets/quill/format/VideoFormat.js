import Quill from 'quill';
const Video = Quill.import('formats/video');

class VideoFormat extends Video {
	static create({ src, uuid }) {
		let node = super.create({ src });
		node.setAttribute('src', src);
		node.setAttribute('controls', 'controls');
		node.setAttribute('preload', 'metadata');
		node.dataset.uuid = uuid;
		return node;
	}

	setSrc(src) {
		this.domNode.src = src;
	}

	setWidth(width) {
		this.domNode.setAttribute('width', width);
	}

	static value(domNode) {
		// 传给detla的属性
		const { uuid } = domNode.dataset;
		return { src: domNode.getAttribute('src'), uuid };
	}
}

VideoFormat.blotName = 'video';
VideoFormat.tagName = 'video';
VideoFormat.className = 'ql-video';

export default VideoFormat;
