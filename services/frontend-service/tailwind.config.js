/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{svelte,js,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#0f8',
				'dark-bg': '#121212',
				'dark-card': '#1a1a1a',
				'dark-border': 'rgba(255, 255, 255, 0.1)',
				'cyan-primary': '#0f8',
			},
			boxShadow: {
				'glow': '0px 10px 20px 0px rgba(255, 255, 255, 0.25)',
				'glow-strong': '0px 20px 40px 0px rgba(255, 255, 255, 0.5)',
			},
		},
	},
};
