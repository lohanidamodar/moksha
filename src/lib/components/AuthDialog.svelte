<script>
	import { auth } from '$lib/stores/auth.svelte.js';
	import { projects } from '$lib/stores/projects.svelte.js';

	let { open = $bindable(false) } = $props();

	let mode = $state('login'); // 'login' | 'signup'
	let email = $state('');
	let password = $state('');
	let name = $state('');
	let busy = $state(false);
	let localError = $state(null);

	function reset() {
		email = '';
		password = '';
		name = '';
		localError = null;
		auth.error = null;
	}

	function close() {
		open = false;
		reset();
	}

	async function submit(e) {
		e.preventDefault();
		busy = true;
		localError = null;
		auth.error = null;
		const ok =
			mode === 'login'
				? await auth.login(email, password)
				: await auth.signup(email, password, name);
		busy = false;
		if (ok) {
			close();
			await projects.loadAll();
		} else {
			localError = auth.error;
		}
	}

	function backdropClick(e) {
		if (e.target === e.currentTarget) close();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-backdrop" onclick={backdropClick}>
		<div class="dialog">
			<div class="dialog-header">
				<h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
				<button class="close-btn" onclick={close} aria-label="Close">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>

			<form onsubmit={submit} class="dialog-body">
				{#if mode === 'signup'}
					<label class="field">
						<span>Name</span>
						<input bind:value={name} type="text" autocomplete="name" required />
					</label>
				{/if}
				<label class="field">
					<span>Email</span>
					<input bind:value={email} type="email" autocomplete="email" required />
				</label>
				<label class="field">
					<span>Password</span>
					<input
						bind:value={password}
						type="password"
						autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
						minlength="8"
						required
					/>
				</label>

				{#if localError}
					<div class="error">{localError}</div>
				{/if}

				<button class="primary-btn" type="submit" disabled={busy}>
					{busy ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
				</button>

				<div class="switch-mode">
					{#if mode === 'login'}
						No account?
						<button type="button" class="link-btn" onclick={() => { mode = 'signup'; localError = null; }}>Create one</button>
					{:else}
						Already have an account?
						<button type="button" class="link-btn" onclick={() => { mode = 'login'; localError = null; }}>Sign in</button>
					{/if}
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.dialog-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.dialog {
		width: 100%;
		max-width: 380px;
		background: var(--bg-surface, #1a1a1f);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		max-height: 90vh;
		overflow: hidden;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		border-bottom: 1px solid var(--border, #2e2e36);
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary, #f0eff4);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-secondary, #9d9baa);
		cursor: pointer;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-primary, #f0eff4);
	}

	.dialog-body {
		padding: 16px 18px 18px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field span {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.6px;
		color: var(--text-secondary, #9d9baa);
	}

	.field input {
		padding: 8px 12px;
		border: 1px solid var(--border, #2e2e36);
		border-radius: 7px;
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		font-family: inherit;
		font-size: 13px;
		outline: none;
	}

	.field input:focus {
		border-color: var(--accent, #f97316);
	}

	.error {
		padding: 8px 10px;
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.4);
		border-radius: 6px;
		color: #fca5a5;
		font-size: 12px;
	}

	.primary-btn {
		padding: 9px 14px;
		border: none;
		border-radius: 8px;
		background: var(--accent, #f97316);
		color: #fff;
		font-family: inherit;
		font-weight: 600;
		font-size: 13px;
		cursor: pointer;
	}

	.primary-btn:hover:not(:disabled) {
		background: #ea6c10;
	}

	.primary-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.switch-mode {
		text-align: center;
		font-size: 12px;
		color: var(--text-secondary, #9d9baa);
	}

	.link-btn {
		border: none;
		background: transparent;
		color: var(--accent, #f97316);
		font-family: inherit;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		padding: 0 2px;
	}

	.link-btn:hover {
		text-decoration: underline;
	}
</style>
