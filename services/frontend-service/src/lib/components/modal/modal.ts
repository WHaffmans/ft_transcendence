import { writable } from 'svelte/store';

export type ModalType = 'privacy' | 'terms' | 'profileSettings' | null;

interface ModalState {
	type: ModalType;
	data?: unknown;
}

const createModalStore = () => {
	const { subscribe, set } = writable<ModalState>({
		type: null,
		data: undefined
	});

	return {
		subscribe,

		open(type: Exclude<ModalType, null>, data?: unknown) {
			set({ type, data });
		},

		close() {
			set({ type: null, data: undefined });
		}
	};
};

export const modalStore = createModalStore();
