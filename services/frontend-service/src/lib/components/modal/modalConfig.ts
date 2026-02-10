import type { ModalType } from './modal';

interface ModalMetadata {
	title: string;
}

export const modalConfig: Record<Exclude<ModalType, null>, ModalMetadata> = {
	privacy: {
		title: 'Privacy Policy'
	},
	terms: {
		title: 'Terms of Service'
	},
	settings: {
		title: 'Settings'
	},
	profile: {
		title: 'Profile'
	},
	friends: {
		title: 'Friends'
	}
};
