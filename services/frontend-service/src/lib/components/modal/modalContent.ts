import type { ModalType } from './modal';

interface SimpleModalContent {
	content: string;
}

// Simple text-based modals (for future use)
// Privacy and Terms use dedicated .svelte components with markdown files
export const modalContent: Record<Exclude<ModalType, 'privacy' | 'terms' | null>, SimpleModalContent> = {
	settings: {
		content: 'Settings content will go here.'
	},
	profile: {
		content: 'Profile content will go here.'
	},
	friends: {
		content: 'Friends list will go here.'
	}
};
