import type { User } from "$lib/types/types";
import { writable } from "svelte/store";

export const userStore = writable<User | null>(null);