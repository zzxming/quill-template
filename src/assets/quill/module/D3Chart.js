import D3ChartFormat from '@/assets/quill/format/D3ChartFormat';

import Quill from 'quill';
import { showQuillD3ChartCreator } from '@/utils/components';

const icons = Quill.import('ui/icons');

class D3Chart {
	constructor(quill, options) {
		this.quill = quill;
		this.options = options;
		this.range = null;
		this.placeholderDelta = null;

		let toolbar = this.quill.getModule('toolbar');
		if (toolbar) {
			toolbar.addHandler(D3Chart.toolName, this.createD3Chart.bind(this));
		}
	}

	async createD3Chart() {
		this.quill.focus();
		this.range = this.quill.getSelection();

		let res = await showQuillD3ChartCreator().catch((err) => {
			console.log('error', err);
		});

		if (res) {
			this.insertToEditor(res);
		}
	}

	insertToEditor({ chartData, chartComponent, dataDep, componentID }) {
		const range = this.range;
		// 重新在富文本中绘制, 保证插入图和最终图一致
		let { width, height } = this.quill.container.getBoundingClientRect();
		let chartWidth = Math.max(width, 880);
		// css 设置 max-width 为 800px, 当小于此值且大于 768px 时, 减去 padding, 保证 d3 图完全显示
		if (chartWidth < 800 && chartWidth > 768) {
			chartWidth -= 80;
		}
		// console.log(chartWidth, height);
		let { node, tips } = chartComponent(chartData, chartWidth - 24, height - 80);

		// this.quill.insertText(range.index, '\n', 'user');
		// this.quill.insertEmbed(range.index, 'block', '', 'user');
		this.quill.insertEmbed(range.index, D3ChartFormat.blotName, { dep: dataDep, node, tips, componentID }, 'user');
		// this.quill.insertEmbed(range.index + 2, 'block', '', 'user');

		range.index += 1;
		this.quill.setSelection(range, 'user');
		this.quill.focus();
	}
}

D3Chart.moduleName = 'd3chart';
D3Chart.toolName = 'd3chart';

// 添加icon
icons[D3Chart.toolName] = `<svg viewBox="0 0 24 24">
<path class="ql-fill" fill="currentColor" d="M6 20q-.825 0-1.413-.588T4 18v-7q0-.825.588-1.413T6 9q.825 0 1.413.588T8 11v7q0 .825-.588 1.413T6 20Zm6 0q-.825 0-1.413-.588T10 18V6q0-.825.588-1.413T12 4q.825 0 1.413.588T14 6v12q0 .825-.588 1.413T12 20Zm6 0q-.825 0-1.413-.588T16 18v-3q0-.825.588-1.413T18 13q.825 0 1.413.588T20 15v3q0 .825-.588 1.413T18 20Z"/>
</svg>`;
export default D3Chart;
