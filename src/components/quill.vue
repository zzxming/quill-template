<script setup>
	import Quill from 'quill';
	import 'quill/dist/quill.snow.css';

	import { SizeClass, SizeStyle } from '@/assets/quill/format/FontSizeFormat';
	import LinkFormat from '@/assets/quill/format/LinkFormat';
	import HeaderFormat from '@/assets/quill/format/HeaderFormat';
	import ImageFormat from '@/assets/quill/format/ImageFormat';
	import VideoFormat from '@/assets/quill/format/VideoFormat';

	import ImageUploader from '@/assets/quill/module/ImageUploader';
	import ImageResize from 'quill-image-resize-module';
	import ImageResizeMinSize from '@/assets/quill/module/ImageResizeMinSize';
	import VideoUploader from '@/assets/quill/module/VideoUploader';
	import LinkModule from '@/assets/quill/module/Link';
	import TableModule from '@/assets/quill/module/Table';

	import SnowTheme from '@/assets/quill/SnowTheme';

	import 'quill-image-uploader/dist/quill.imageUploader.min.css';

	Quill.register(
		{
			'attributors/class/fontsize': SizeClass,
			'attributors/style/fontsize': SizeStyle,

			'formats/header': HeaderFormat,
			'formats/fontsize': SizeClass,
			'formats/linkFormat': LinkFormat,
			'formats/image': ImageFormat,
			'formats/video': VideoFormat,

			[`modules/${LinkModule.moduleName}`]: LinkModule,
			'modules/ImageResize': ImageResize,
			[`modules/${ImageUploader.moduleName}`]: ImageUploader,
			[`modules/${VideoUploader.moduleName}`]: VideoUploader,
			[`modules/${TableModule.moduleName}`]: TableModule,

			'themes/snow': SnowTheme,
		},
		true
	);

	const props = defineProps({
		content: {
			type: [String, Object],
		},
		contentType: {
			type: String,
			default: 'delta',
			validator: (value) => {
				return ['delta', 'html', 'text'].includes(value);
			},
		},
		theme: {
			type: String,
			default: 'snow',
			validator: (value) => {
				return ['snow', 'bubble', ''].includes(value);
			},
		},
	});
	const emits = defineEmits(['update:content', 'textChange']);

	const editorRef = ref();
	const toolbarRef = ref();

	const uploadedVideos = ref([]);
	const uploadedImgs = ref([]);
	let quill = null;

	onMounted(() => {
		quill = new Quill(editorRef.value, {
			theme: props.theme,
			modules: {
				toolbar: '#my-toolbar',
				[`${LinkModule.moduleName}`]: {},
				[`${ImageUploader.moduleName}`]: {
					upload: (file) => {
						return new Promise((resolve, reject) => {
							uploadedImgs.value.push(file);
							resolve(URL.createObjectURL(file));
						});
					},
				},
				ImageResize: {
					modules: ['Toolbar', ImageResizeMinSize],
				},
				[`${VideoUploader.moduleName}`]: {
					upload: (file) => {
						return new Promise((resolve, reject) => {
							uploadedVideos.value.push(file);
							resolve(URL.createObjectURL(file));
						});
					},
				},
			},
		});

		quill.on('text-change', (delta, oldContents, source) => {
			internalModel = maybeClone(getContents());
			// Update v-model:content when text changes
			if (!internalModelEquals(props.content)) {
				emits('update:content', internalModel);
			}
			emits('textChange', { delta, oldContents, source });
		});
	});

	const getContents = (index, length) => {
		if (props.contentType === 'html') {
			return getHTML();
		} else if (props.contentType === 'text') {
			return getText(index, length);
		}
		return quill === null || quill === void 0 ? void 0 : quill.getContents(index, length);
	};
	const getQuill = () => {
		return quill;
	};
	const maybeClone = (delta) => {
		return typeof delta === 'object' && delta ? delta.slice() : delta;
	};
	const deltaHasValuesOtherThanRetain = (delta) => {
		return Object.values(delta.ops).some((v) => !v.retain || Object.keys(v).length !== 1);
	};
	// Doesn't need reactivity, but does need to be cloned to avoid deep mutations always registering as equal
	let internalModel;
	const internalModelEquals = (against) => {
		if (typeof internalModel === typeof against) {
			if (against === internalModel) {
				return true;
			}
			// Ref/Proxy does not support instanceof, so do a loose check
			if (typeof against === 'object' && against && typeof internalModel === 'object' && internalModel) {
				return !deltaHasValuesOtherThanRetain(internalModel.diff(against));
			}
		}
		return false;
	};
	const toolbarList = [
		{ value: '', name: 'bold', tip: '加粗' },
		{ value: '', name: 'italic', tip: '倾斜' },
		{ value: '', name: 'underline', tip: '下划线' },
		{ value: '', name: 'strike', tip: '删除线' },
		{ value: 'sub', name: 'script', tip: '上标' },
		{ value: 'super', name: 'script', tip: '下标' },

		// { value: [], name: 'fontsize', tip: '字体大小' },
		// {
		// 	// 官方文档里是 false, 但实测需要使用 '', 估计因为判断的是空值
		// 	value: ['', 1, 2, 3, 4, 5, 6],
		// 	name: 'header',
		// 	tip: '标题',
		// },
		// { value: [], name: 'color', tip: '字体颜色' },
		{ value: [], name: 'background', tip: '背景颜色' },

		{ value: '', name: 'align', tip: '左对齐' },
		{ value: 'center', name: 'align', tip: '居中对齐' },
		{ value: 'right', name: 'align', tip: '右对齐' },
		{ value: 'justify', name: 'align', tip: '两端对齐' },

		{ value: 'ordered', name: 'list', tip: '有序列表' },
		{ value: 'bullet', name: 'list', tip: '无须列表' },
		{ value: '-1', name: 'indent', tip: '减少缩进' },
		{ value: '+1', name: 'indent', tip: '增加缩进' },

		{ value: '', name: 'blockquote', tip: '引用' },
		{ value: '', name: 'code-block', tip: '代码块' },
		{ value: '', name: 'link', tip: '链接' },
		{ value: '', name: 'image', tip: '图片' },
		{ value: '', name: 'video', tip: '视频' },
		// { value: '', name: D3Chart.toolName, tip: '数据图' },
		// { value: '', name: Emoji.toolName, tip: '表情' },
		// { value: '', name: Table.toolName, tip: '表格' },
	];

	defineExpose({
		getQuill,
		uploadedImgs,
		uploadedVideos,
	});
</script>

<template>
	<div
		ref="toolbarRef"
		id="my-toolbar"
	>
		<template v-for="tool in toolbarList">
			<button
				v-if="typeof tool.value === 'string'"
				:class="`ql-${tool.name}`"
				:value="tool.value"
			></button>
			<select
				v-else
				:class="`ql-${tool.name}`"
			>
				<option
					v-for="v in tool.value"
					:value="v"
				></option>
			</select>
		</template>
	</div>
	<div
		id="editor"
		ref="editorRef"
	></div>
</template>

<style lang="less">
	.ql-toolbar.ql-snow {
		.ql {
			&-custom {
				&-select {
					top: 100%;
					left: 0px;
					border: 1px solid #d1d5db;
				}
			}
		}
	}
	.ql-snow.ql-toolbar button,
	.ql-snow .ql-toolbar button,
	.ql-snow .ql-picker {
		margin: 0px;
	}
	.ql-container[data-readOnly='true'] {
		.ql-editor > * {
			cursor: auto;
		}
	}
	// 超链接样式修改
	.ql-tooltip {
		display: flex;
		align-items: center;
		font-size: 12px;
	}
	.ql-container.ql-snow {
		.ql-tooltip {
			&::before {
				display: none;
			}
			div.break {
				display: inline-block;
				width: 1px;
				height: 16px;
				margin: 0px 6px;
				background-color: #d1d5db;
			}
			a.ql-preview {
			}
			a.ql-action::after {
				content: '修改链接';
				border: none;
				padding: 0px;
				margin: 0px;
			}
			a.ql-remove::before {
				content: '取消链接';
				margin: 0px;
			}
		}

		.ql-table {
			&-tooltip {
				position: absolute;
				display: flex;
				width: calc(100% - 30px);
				height: 12px;
				overflow: hidden;
				&.ql-hidden {
					display: none;
				}
				.ql-table-col {
					&-header {
						position: relative;
						flex-shrink: 0;
						width: 20%;
						height: 100%;
						background-color: #f3f4f5;
						border-right: 1px solid #ccc;
						border-top: 1px solid #ccc;
						border-bottom: 1px solid #ccc;
						&:first-child {
							border-left: 1px solid #ccc;
						}
					}

					&-separator {
						position: absolute;
						top: 0px;
						bottom: 0px;
						right: -1px;
						width: 1px;
						cursor: ew-resize;
						z-index: 1;
						&::after {
							right: -6px;
						}
						&::before {
							left: -6px;
						}
						&::after,
						&::before {
							content: '';
							position: absolute;
							top: 0;
							display: block;
							width: 8px;
							height: 100%;
						}
					}
				}
			}
		}
	}
	// table 的辅助 dom
	.ql-table-drag-line {
		position: absolute;
		width: 2px;
		background-color: #409eff;
		cursor: e-resize;
	}
	.ql-table {
		&-operation {
			&-menu {
				border-radius: 6px;
				box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.1);
				overflow: hidden;
				background-color: var(--white);
				font-size: 14px;
				z-index: 1;
				&-dividing {
					height: 1px;
					background-color: #efefef;
				}
				&-subtitle {
					color: #999;
					font-size: 14px;
					padding: 5px 16px;
				}
				&-item {
					display: flex;
					align-items: center;
					padding: 10px 16px;
					background-color: #fff;
					cursor: pointer;
					color: #595959;
					overflow: hidden;
					text-overflow: ellipsis;
					&:hover {
						background-color: #f5f5f5;
					}
				}
			}
		}
	}

	.ql {
		&-video {
			&-play {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 8%;
				padding-top: 8%;
				height: 0px;
				background-color: rgba(0, 0, 0, 0.6);
				border-radius: 50%;
				cursor: pointer;
				&::after {
					content: '';
					position: absolute;
					top: 50%;
					left: 50%;
					width: 50%;
					height: 50%;
					background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 50%);
					transform: translate(-72.5%, -50%) rotate(-135deg);
				}
			}
			&-wrapper {
				position: relative;
				display: inline-block;
				&[data-video='1'] {
					&::after {
						display: none;
						box-sizing: border-box;
						content: attr(data-duration);
						position: absolute;
						bottom: 20px;
						right: 20px;
						line-height: 14px;
						padding: 4px 10px;
						border-radius: 4px;
						color: #fff;
						font-size: 14px;
						background-color: rgba(33, 33, 33, 0.7);
						user-select: none;
					}
					&[data-duration]::after {
						display: block;
					}
				}
				&[data-error='true'] {
					font-size: 32px;
					&::after {
						display: none;
					}
				}
			}
		}
		&-fontsize {
			width: 96px;
			&-12 {
				font-size: 12px;
				line-height: 16px;
			}
			&-14 {
				font-size: 14px;
				line-height: 20px;
			}
			&-18 {
				font-size: 18px;
				line-height: 22px;
			}
			&-20 {
				font-size: 20px;
				line-height: 24px;
			}
			&-24 {
				font-size: 24px;
				line-height: 28px;
			}
			&-32 {
				font-size: 32px;
				line-height: 36px;
			}
			&-48 {
				font-size: 48px;
				line-height: 52px;
			}
			&-64 {
				font-size: 64px;
				line-height: 68px;
			}
			&-72 {
				font-size: 72px;
				line-height: 76px;
			}
		}
		&-table {
			// margin: 4px 0px;
			border-collapse: separate;
			&-wrapper {
				width: 100%;
				overflow: auto;
			}
			&-row {
				&:first-child {
					.ql-table-cell {
						border-top: 1px solid #a1a1aa;
					}
				}
			}
			&-cell {
				border: 1px solid #a1a1aa;
				padding: 8px 12px;
				font-size: 14px;
				outline: none;
				> * {
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: normal;
					word-break: break-all;

					line-height: 14px + 8px;
				}
			}
			col {
				border-collapse: separate;
				text-indent: initial;
				display: table-column;
				table-layout: fixed;
			}
		}
		&-picker {
			&-expand {
				display: inline-flex;
				align-items: center;
				width: 100%;
				height: 100%;
				z-index: 2;
				svg {
					width: 14px;
				}
				&:hover {
					background-color: #334d660f;
				}
				&.ql-active {
					background-color: #dbeafe;
					color: #2563eb;
				}
			}
		}
	}
	// 标题提示文字, toolbar 展开按钮样式
	#my-toolbar {
		> * {
			cursor: default;
		}
		&.ql-snow {
			button {
				width: 32px;
				height: 28px;
				margin: 0px 2px;
			}
			.ql-color-picker {
				.ql-picker-label {
					width: 100%;
					svg {
						height: 100%;
					}
				}
			}
			.ql-picker {
				width: 36px;
				height: 28px;
				margin: 0px 2px;
				&:hover {
					background-color: #f3f4f6;
				}
				&.ql-color-picker {
					display: flex;
					width: 46px;
				}
				.ql-stroke {
					// stroke: #d1d5db;
					stroke: #4b5563;
				}
				.ql-fill {
					fill: #4b5563;
				}
				.ql-picker-label {
					cursor: default;
					&:hover {
						background-color: #334d660f;
					}
					&::before {
						line-height: 26px;
					}
				}
				&.ql-size {
					width: 96px;
					.ql-picker-label,
					.ql-picker-item {
						&::before {
							content: '普通';
						}
						&[data-value='small']::before {
							content: '小号';
						}
						&[data-value='large']::before {
							content: '大号';
						}
						&[data-value='huge']::before {
							content: '超大号';
						}
					}
				}
				&.ql-fontsize {
					width: 96px;
					.ql-picker-label,
					.ql-picker-item {
						&::before {
							content: '16';
						}
						&[data-value='12']::before {
							content: '12';
						}
						&[data-value='14']::before {
							content: '14';
						}
						&[data-value='18']::before {
							content: '18';
						}
						&[data-value='20']::before {
							content: '20';
						}
						&[data-value='24']::before {
							content: '24';
						}
						&[data-value='32']::before {
							content: '32';
						}
						&[data-value='48']::before {
							content: '48';
						}
						&[data-value='64']::before {
							content: '64';
						}
						&[data-value='72']::before {
							content: '72';
						}
					}
				}
				&.ql-header {
					width: 96px;
					.ql-picker-label,
					.ql-picker-item {
						&::before {
							content: '正文';
						}
						&[data-value='1']::before {
							content: '标题 1';
						}
						&[data-value='2']::before {
							content: '标题 2';
						}
						&[data-value='3']::before {
							content: '标题 3';
						}
						&[data-value='4']::before {
							content: '标题 4';
						}
						&[data-value='5']::before {
							content: '标题 5';
						}
						&[data-value='6']::before {
							content: '标题 6';
						}
					}
				}
				&.ql-expanded {
					background-color: #f3f4f6;
					.ql-picker-expand {
						border-color: transparent;
						color: inherit;
						// background-color: #f3f4f6;
					}
					.ql-picker-label {
						border-color: transparent;
						color: inherit;
						// background-color: #f3f4f6;
						.ql-stroke {
							stroke: #4b5563;
						}
						.ql-fill {
							fill: #4b5563;
						}
					}
				}
			}
			.ql {
				&-button-picker {
					width: 32px;
					padding: 3px 5px;
					&[data-active='true'] {
						position: relative;
						padding: 2px 4px;
						border: 1px solid #d1d5db;
						color: #d1d5db;
						.ql-picker-options {
							display: block;
						}
					}
					svg {
						position: static;
						width: 100%;
						margin-top: 0px;
					}
				}
			}

			&.ql-disabled-table {
				.ql {
					&-table,
					&-d3chart,
					&-video {
						opacity: 0.3;
						background-color: transparent;
						cursor: not-allowed;
					}
				}
			}
		}
	}
	.ql-clipboard {
		opacity: 0;
	}
</style>
