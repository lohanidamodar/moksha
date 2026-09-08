<script>
	import { onMount } from 'svelte';
	import { project } from '$lib/stores/project.svelte.js';
	import StorePage from '$lib/components/StorePage.svelte';

	let store = $state('ios');

	onMount(() => {
		if (!project.loaded) project.load();
	});
</script>

<div class="preview-page">
	<nav>
		<a class="back" href="/">← Editor</a>
		{#if project.project}
			<span class="app">{project.project.app?.name}</span>
			<div class="tabs">
				<button class:active={store === 'ios'} onclick={() => (store = 'ios')}>App Store</button>
				<button class:active={store === 'android'} onclick={() => (store = 'android')}>
					Google Play
				</button>
			</div>
			{#if project.locales.length > 1}
				<select value={project.locale} onchange={(e) => project.setLocale(e.currentTarget.value)}>
					{#each project.locales as locale (locale)}
						<option value={locale}>{locale}</option>
					{/each}
				</select>
			{/if}
		{/if}
	</nav>

	{#if project.loaded && project.project}
		<StorePage
			project={project.project}
			locale={project.locale}
			imageUrl={(ref) => project.imageUrl(ref)}
			{store}
		/>
	{:else if project.loaded}
		<p class="note">{project.error || 'No project open.'}</p>
	{:else}
		<p class="note">Loading…</p>
	{/if}
</div>

<style>
	.preview-page {
		min-height: 100vh;
		background: var(--bg, #0f0f11);
		padding-bottom: 60px;
	}

	nav {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 10px 20px;
		background: var(--bg-surface, #1a1a1f);
		border-bottom: 1px solid var(--border, #2e2e36);
		margin-bottom: 24px;
	}

	.back {
		color: var(--accent, #f97316);
		text-decoration: none;
		font-size: 13px;
		font-weight: 600;
	}

	.app {
		color: var(--text-primary, #f0eff4);
		font-size: 13px;
		font-weight: 700;
	}

	.tabs {
		display: flex;
		gap: 6px;
		margin-left: auto;
	}

	nav button,
	nav select {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		padding: 5px 12px;
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
	}

	nav button.active {
		border-color: var(--accent, #f97316);
		color: var(--accent, #f97316);
	}

	.note {
		color: var(--text-secondary, #9d9baa);
		text-align: center;
		font-size: 14px;
	}
</style>
