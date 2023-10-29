import { Resize } from 'quill-image-resize-module/src/modules/Resize';

export default class ImageResizeMinSize extends Resize {
	handleDrag = (evt) => {
		if (!this.img) {
			return;
		}
		const deltaX = evt.clientX - this.dragStartX;
		let width;
		if (this.dragBox === this.boxes[0] || this.dragBox === this.boxes[3]) {
			width = Math.round(this.preDragWidth - deltaX);
		} else {
			width = Math.round(this.preDragWidth + deltaX);
		}
		if (width < 36) width = 36;
		this.img.width = width;
		this.requestUpdate();
	};
}
