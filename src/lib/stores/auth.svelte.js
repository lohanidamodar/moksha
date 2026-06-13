import { ID } from 'appwrite';
import { getAccount } from '$lib/appwrite/client.js';

class AuthState {
	user = $state(null);
	loading = $state(true);
	error = $state(null);

	get isAuthenticated() {
		return !!this.user;
	}

	async init() {
		if (typeof window === 'undefined') {
			this.loading = false;
			return;
		}
		try {
			this.user = await getAccount().get();
		} catch {
			this.user = null;
		} finally {
			this.loading = false;
		}
	}

	async login(email, password) {
		this.error = null;
		try {
			await getAccount().createEmailPasswordSession(email, password);
			this.user = await getAccount().get();
			return true;
		} catch (err) {
			this.error = err?.message || 'Login failed';
			return false;
		}
	}

	async signup(email, password, name) {
		this.error = null;
		try {
			await getAccount().create(ID.unique(), email, password, name || undefined);
			await getAccount().createEmailPasswordSession(email, password);
			this.user = await getAccount().get();
			return true;
		} catch (err) {
			this.error = err?.message || 'Signup failed';
			return false;
		}
	}

	async logout() {
		try {
			await getAccount().deleteSession('current');
		} catch {
			// ignore — clear local state regardless
		}
		this.user = null;
	}
}

export const auth = new AuthState();
