import Quill from 'quill';
import { errorImg } from '@/assets/defaultStatic/image';

import { createApp } from 'vue';
import Error from '@/components/Directives/Error.vue';
import { numberToTimeDisplay } from '@/utils/time';

// const BlockEmbed = Quill.import('blots/block/embed');
// const InlineEmbed = Quill.import('blots/embed');
// const Inline = Quill.import('blots/inline');
const Parchment = Quill.import('parchment');

class WrapperEmbed extends Parchment.Embed {
	static create({ tag, src, file, width, style, uuid }) {
		const node = super.create(src);
		if (!src) return node;

		// 使用 BlockEmbed 时添加
		// node.classList.add('block')

		// 绑定节点属性
		node.dataset.src = src;
		node.dataset.tag = tag;
		node.style = style;
		if (width) {
			node.setAttribute('width', width);
		}
		if (uuid || file?.uuid) {
			node.dataset.uuid = uuid ?? file.uuid;
		}

		const embed = document.createElement(tag);
		const wrapper = document.createElement('div');

		if (tag === 'img') {
			// 没有file表示为初始数据, 非用户输入
			embed.onerror = (e) => {
				embed.src = errorImg;
			};

			if (width) {
				embed.setAttribute('width', width);
			}
			embed.setAttribute('src', src);

			node.appendChild(embed);
		} else {
			embed.setAttribute('src', src);
			wrapper.appendChild(embed);
			wrapper.classList.add('ql-video-wrapper');
			node.appendChild(wrapper);
		}

		if (tag === 'video') {
			node.classList.add('ql-embed-loading');

			embed.setAttribute('preload', '');
			embed.setAttribute('loop', '');

			// 此 dataset 为 css 用
			wrapper.dataset.video = 1;
			embed.addEventListener('loadedmetadata', () => {
				node.classList.remove('ql-embed-loading');
				wrapper.dataset.duration = numberToTimeDisplay(embed.duration);

				// 播放按钮
				let startBtn = document.createElement('div');
				startBtn.classList.add('ql-video-play');
				// 防止元素内可输入
				startBtn.setAttribute('contenteditable', false);
				startBtn.onclick = () => {
					embed.setAttribute('controls', 'controls');
					embed.play();
					wrapper.dataset.video = 0;
					wrapper.removeChild(startBtn);
				};
				wrapper.appendChild(startBtn);
			});
			embed.addEventListener('error', (e) => {
				console.log(e);
				embed.classList.add('ql-resource-error');
				node.classList.remove('ql-embed-loading');

				wrapper.dataset.error = true;

				let errorTip = document.createElement('div');
				errorTip.classList.add('v-error');
				createApp(Error, { title: 'resource loading error' }).mount(errorTip);

				wrapper.appendChild(errorTip);
			});
		}

		node.setAttribute('contenteditable', false);
		return node;
	}

	setSrc(src) {
		this.domNode.dataset.src = src;
		if (this.domNode.dataset.tag === 'img') {
			this.domNode.querySelector('img').src = src;
		} else if (this.domNode.dataset.tag === 'video') {
			this.domNode.querySelector('video').src = src;
		}
	}

	setWidth(width) {
		this.domNode.setAttribute('width', width);
	}

	format(name, value) {
		super.format(name, value);
		if (value) {
			this.domNode.setAttribute(name, value);
		} else {
			this.domNode.removeAttribute(name);
		}
	}

	deleteAt(index, length) {
		super.deleteAt(index, length);
		this.cache = {};
	}

	static value(domNode) {
		// 传给detla的属性
		const { src, tag, uuid } = domNode.dataset;
		const width = domNode.getAttribute('width');
		if (width) {
			return { src, tag, uuid, width: domNode.getAttribute('width') };
		}
		return { src, tag, uuid, style: domNode.style.cssText };
	}
}

WrapperEmbed.blotName = 'wrapperEmbed';
WrapperEmbed.className = 'ql-embed-box';
WrapperEmbed.tagName = 'div';
Quill.register({ 'formats/wapperEmbed': WrapperEmbed });

export default WrapperEmbed;
