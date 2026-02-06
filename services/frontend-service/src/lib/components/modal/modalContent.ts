import type { ModalType } from './modal';

interface ModalConfig {
	title: string;
	content: string;
}

export const modalContent: Record<Exclude<ModalType, null>, ModalConfig> = {
	privacy: {
		title: 'Privacy Policy',
		content: 'We respect your privacy. This application only processes the minimum data required for authentication and gameplay.'
	},
	terms: {
		title: 'Terms of Service',
		content: 'By using this service, you agree to fair use, respectful behavior, and compliance with applicable laws.'
	},
	settings: {
		title: 'Settings',
		content: 'Settings content will go here.'
	},
	profile: {
		title: 'Profile',
		content: 'Profile content will go here.'
	},
	friends: {
		title: 'Friends',
		content: 'Friends list will go here.'
	}
};
