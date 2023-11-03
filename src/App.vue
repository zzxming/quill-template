<script setup>
	import Delta from 'quill-delta';

	const quillRef = ref();

	const content = ref(new Delta());

	const show = () => {
		console.log(content.value);
		console.log(quillRef.value);
		console.log(quillRef.value.uploadedImgs);
		console.log(quillRef.value.uploadedVideos);
	};
</script>

<template>
	<div class="ww">
		<button @click="show">wfom</button>
		<div>
			<Quill
				ref="quillRef"
				v-model:content="content"
			/>
		</div>
	</div>
</template>

<style scoped>
	.ww {
		display: flex;
		:deep(.quill) {
			width: 800px;
		}
	}
</style>
