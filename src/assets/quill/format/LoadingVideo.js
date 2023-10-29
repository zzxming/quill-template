import Quill from 'quill';
const InlineEmbed = Quill.import('blots/embed');

class LoadingVideo extends InlineEmbed {
	static create(src) {
		const node = super.create(src);
		if (src === true) return node;

		const videoDom = document.createElement('video');
		videoDom.setAttribute('src', src);

		node.appendChild(videoDom);
		node.setAttribute('width', '100%');
		return node;
	}
	deleteAt(index, length) {
		super.deleteAt(index, length);
		this.cache = {};
	}
	static value(domNode) {
		const { src, custom } = domNode.dataset;
		return { src, custom };
	}
}

LoadingVideo.blotName = 'videoBlot';
LoadingVideo.className = 'ql-video-loading';
LoadingVideo.tagName = 'div';
Quill.register({ 'formats/videoBlot': LoadingVideo });

export default LoadingVideo;
