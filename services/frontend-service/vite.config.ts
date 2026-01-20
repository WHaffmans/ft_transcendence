import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), checker({ typescript: true })],
	server: {
		"allowedHosts": ["*","quinten.codes", "transcendence.duinvoetje.nl", "localhost"]
	}
});
