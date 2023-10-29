export function css(domNode, rules) {
	if (typeof rules === 'object') {
		for (let prop in rules) {
			domNode.style[prop] = rules[prop];
		}
	}
}

export function getRelativeRect(targetRect, container) {
	let containerRect = container.getBoundingClientRect();

	return {
		x: targetRect.x - containerRect.x - container.scrollLeft,
		y: targetRect.y - containerRect.y - container.scrollTop,
		x1: targetRect.x - containerRect.x - container.scrollLeft + targetRect.width,
		y1: targetRect.y - containerRect.y - container.scrollTop + targetRect.height,
		width: targetRect.width,
		height: targetRect.height,
	};
}

export function computeBoundaryFromRects(startRect, endRect) {
	let x = Math.min(startRect.x, endRect.x, startRect.x + startRect.width - 1, endRect.x + endRect.width - 1);

	let x1 = Math.max(startRect.x, endRect.x, startRect.x + startRect.width - 1, endRect.x + endRect.width - 1);

	let y = Math.min(startRect.y, endRect.y, startRect.y + startRect.height - 1, endRect.y + endRect.height - 1);

	let y1 = Math.max(startRect.y, endRect.y, startRect.y + startRect.height - 1, endRect.y + endRect.height - 1);

	let width = x1 - x;
	let height = y1 - y;

	return { x, x1, y, y1, width, height };
}
