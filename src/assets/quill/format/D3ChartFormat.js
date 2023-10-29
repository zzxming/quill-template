import Quill from 'quill';
const InlineEmbed = Quill.import('blots/embed');

class D3ChartFormat extends InlineEmbed {
	static create(arg) {
		let { node: svg, tips, dep, componentID } = arg;
		// console.log(arg);
		const node = super.create(arg);
		if (!svg) return node;

		// 图形数据获取和生成在 InitContentEditor.vue 中
		node.dataset.dep = JSON.stringify(dep);
		node.dataset.componentID = componentID;

		node.style.cursor = 'default';
		node.appendChild(svg);
		node.tips = tips;
		// console.log(node.tips);
		return node;
	}
	deleteAt(index, length) {
		super.deleteAt(index, length);
		this.domNode.tips && this.domNode.tips.destroy();
		this.domNode.tips = null;
		this.cache = {};
	}

	static value(domNode) {
		let { dep, componentID } = domNode.dataset;
		try {
			dep = JSON.parse(dep);
			return { dep, componentID };
		} catch (e) {
			console.log(e, domNode);
			return {
				dep: {},
				componentID,
			};
		}
	}
}

D3ChartFormat.blotName = 'd3chart';
D3ChartFormat.className = 'ql-d3-box';
D3ChartFormat.tagName = 'span';
Quill.register({ 'formats/d3chart': D3ChartFormat });

export default D3ChartFormat;
