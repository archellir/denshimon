import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
	username: string;
	role: string;
}

interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;
	initialized: boolean;
}

const initialState: AuthState = {
	isAuthenticated: false,
	user: null,
	token: null,
	initialized: false
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		
		async login(username: string, password: string) {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, password })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Login failed');
			}

			const data = await response.json();
			
			// Store token in localStorage
			if (browser) {
				localStorage.setItem('k8s_webui_token', data.token);
			}

			update(state => ({
				...state,
				isAuthenticated: true,
				user: data.user,
				token: data.token,
				initialized: true
			}));
		},

		async logout() {
			try {
				await fetch('/api/auth/logout', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${get(authStore).token}`
					}
				});
			} catch (error) {
				console.error('Logout request failed:', error);
			}

			// Clear token from localStorage
			if (browser) {
				localStorage.removeItem('k8s_webui_token');
			}

			set({
				isAuthenticated: false,
				user: null,
				token: null,
				initialized: true
			});
		},

		async checkAuth() {
			if (!browser) {
				update(state => ({ ...state, initialized: true }));
				return;
			}

			const token = localStorage.getItem('k8s_webui_token');
			if (!token) {
				update(state => ({ ...state, initialized: true }));
				return;
			}

			try {
				const response = await fetch('/api/auth/verify', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});

				if (response.ok) {
					const data = await response.json();
					update(state => ({
						...state,
						isAuthenticated: true,
						user: data.user,
						token,
						initialized: true
					}));
				} else {
					// Token is invalid, remove it
					localStorage.removeItem('k8s_webui_token');
					update(state => ({ ...state, initialized: true }));
				}
			} catch (error) {
				console.error('Auth check failed:', error);
				localStorage.removeItem('k8s_webui_token');
				update(state => ({ ...state, initialized: true }));
			}
		},

		getToken() {
			return browser ? localStorage.getItem('k8s_webui_token') : null;
		}
	};
}

export const authStore = createAuthStore();

// Helper function to get current auth state
function get<T>(store: { subscribe: (fn: (value: T) => void) => () => void }): T {
	let value: T;
	const unsubscribe = store.subscribe((val: T) => { value = val; });
	unsubscribe();
	return value!;
}