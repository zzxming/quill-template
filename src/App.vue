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
	<Quill
		ref="quillRef"
		v-model:content="content"
	/>
	<button @click="show">wfom</button>
</template>

<style scoped></style>
