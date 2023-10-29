import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import inject from '@rollup/plugin-inject';

export default defineConfig({
	plugins: [
		vue(),
		AutoImport({
			imports: ['vue'],
			dts: 'src/auto-imports.d.ts',
		}),
		Components({
			extensions: ['vue'],
			dts: 'src/components.d.ts',
			deep: true,
		}),
		// Quill image resize module requires window Quill, inject using this plugin
		inject({
			'window.Quill': 'quill',
		}),
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
});
