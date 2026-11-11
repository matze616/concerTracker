import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Runs locally with Node (`pnpm build && pnpm start`)
			adapter: adapter()
		})
	],
	server: { host: '127.0.0.1' },
	preview: { host: '127.0.0.1' },
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
