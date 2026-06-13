<script>
	import favicon from '$lib/assets/favicon.svg';
	import { auth } from '$lib/stores/auth.svelte.js';
	import { projects } from '$lib/stores/projects.svelte.js';

	let { children } = $props();

	$effect(() => {
		(async () => {
			await auth.init();
			if (auth.user) {
				await projects.loadAll();
			}
		})();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
