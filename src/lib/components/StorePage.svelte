<script>
	/**
	 * The listing as a shopper meets it.
	 *
	 * Isolated PNGs in a folder do not tell you whether a strip reads — whether
	 * the headlines repeat, whether tile three earns its place, whether the
	 * first two are enough to make someone tap. This renders the project's
	 * assets into the product page they will actually sit in, for both stores.
	 */
	import { getAssetType } from '$core/assets/index.js';
	import { resolveAsset, resolveCopy } from '$core/project.js';
	import { resolveSpan, compositionConfig } from '$core/panorama.js';
	import { layoutSpan } from '$core/assets/_screenshot-shared.js';

	let { project, locale, imageUrl, store = 'ios' } = $props();

	/** Tiles are drawn small: the question is whether the strip reads, not pixel fidelity. */
	const TILE_HEIGHT = 380;

	const phoneTypes = {
		ios: 'iphone-screenshot',
		android: 'android-phone-screenshot'
	};

	let tiles = $state([]);
	/** Play puts the feature graphic at the head of the listing, not in the carousel. */
	let banner = $state(null);
	let rendering = $state(false);

	const meta = $derived(project?.store ?? {});
	const strip = $derived(
		(project?.assets ?? []).filter((a) => a.assetType === phoneTypes[store])
	);
	const featureGraphic = $derived(
		(project?.assets ?? []).find((a) => a.assetType === 'feature-graphic')
	);

	$effect(() => {
		// Re-draw whenever the store, the locale or the project itself changes.
		void [store, locale, project];
		render();
	});

	async function render() {
		if (!project) return;
		rendering = true;
		try {
			const drawn = [];
			for (const asset of strip) drawn.push(...(await drawAsset(asset)));
			tiles = drawn;

			banner =
				store === 'android' && featureGraphic
					? ((await drawAsset(featureGraphic, 200))[0] ?? null)
					: null;
		} finally {
			rendering = false;
		}
	}

	async function drawAsset(asset, height = TILE_HEIGHT) {
		const module = getAssetType(asset.assetType);
		if (!module) return [];

		const config = resolveAsset(project, asset, locale, module);
		const size = module.sizes.find((s) => s.id === asset.sizeId) ?? module.sizes[0];
		const span = resolveSpan(asset.span, layoutSpan(config.layout));
		const images = await loadImages(asset);

		// Draw the composition once at preview scale, then slice it, exactly as
		// the renderer does — so a panorama previews as the strip it becomes.
		const scale = height / size.h;
		const tileW = Math.round(size.w * scale);
		const tileH = Math.round(size.h * scale);

		const composition = document.createElement('canvas');
		composition.width = tileW * span;
		composition.height = tileH;
		module.render(
			composition.getContext('2d'),
			{ ...compositionConfig(config, span), images },
			composition.width,
			tileH
		);

		const out = [];
		for (let index = 0; index < span; index++) {
			const tile = document.createElement('canvas');
			tile.width = tileW;
			tile.height = tileH;
			tile
				.getContext('2d')
				.drawImage(composition, index * tileW, 0, tileW, tileH, 0, 0, tileW, tileH);
			out.push({
				key: `${asset.id}-${index}`,
				label: span > 1 ? `${asset.id}-${index + 1}` : asset.id,
				url: tile.toDataURL('image/png'),
				width: tileW,
				height: tileH
			});
		}
		return out;
	}

	async function loadImages(asset) {
		const images = {};
		for (const [input, ref] of Object.entries(asset.images ?? {})) {
			if (!ref) continue;
			const img = await new Promise((resolve) => {
				const el = new Image();
				el.onload = () => resolve(el);
				el.onerror = () => resolve(null);
				el.src = imageUrl(ref);
			});
			if (img) images[input] = img;
		}
		return images;
	}

	const subtitle = $derived(resolveCopy(meta.subtitle, locale));
	const description = $derived(resolveCopy(meta.description, locale));
</script>

<div class="store-page" class:android={store === 'android'}>
	{#if banner}
		<!-- Play's listing header. Getting it out of the carousel matters:
		     it is the one asset a shopper sees before deciding to scroll. -->
		<img class="banner" src={banner.url} alt="Feature graphic" />
	{/if}

	<header class="listing">
		<div class="icon" aria-hidden="true">{(project?.app?.name ?? '?').slice(0, 1)}</div>
		<div class="identity">
			<h1>{project?.app?.name || 'Untitled'}</h1>
			{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
			<p class="developer">{meta.developer || 'Developer'}</p>
		</div>
		<button class="get">{meta.price || (store === 'ios' ? 'Get' : 'Install')}</button>
	</header>

	<div class="stats">
		<div><strong>{meta.rating ?? '—'}</strong><span>{meta.ratingCount || 'Ratings'}</span></div>
		<div><strong>{meta.ageRating || '4+'}</strong><span>Age</span></div>
		<div><strong>{meta.category || 'Apps'}</strong><span>Category</span></div>
	</div>

	<h2>Preview</h2>
	{#if rendering && tiles.length === 0}
		<p class="hint">Rendering the strip…</p>
	{:else if tiles.length === 0}
		<p class="hint">
			No {store === 'ios' ? 'iPhone' : 'Android phone'} screenshots in this project yet.
		</p>
	{:else}
		<!-- Scrolls horizontally, which is the whole point: a panorama only
		     reads if the tiles sit next to each other the way they will here. -->
		<div class="strip" class:seamless={true}>
			{#each tiles as tile (tile.key)}
				<figure style="width: {tile.width}px">
					<img src={tile.url} alt={tile.label} width={tile.width} height={tile.height} />
					<figcaption>{tile.label}</figcaption>
				</figure>
			{/each}
		</div>
	{/if}

	{#if description}
		<h2>Description</h2>
		<p class="description">{description}</p>
	{/if}
</div>

<style>
	.store-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 24px;
		background: #fff;
		color: #111;
		border-radius: 14px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
	}

	.store-page.android {
		font-family: Roboto, 'Segoe UI', system-ui, sans-serif;
	}

	.banner {
		display: block;
		width: 100%;
		border-radius: 10px;
		margin-bottom: 18px;
	}

	.listing {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.icon {
		width: 96px;
		height: 96px;
		border-radius: 22px;
		background: linear-gradient(140deg, #f97316, #db2777);
		color: #fff;
		font-size: 44px;
		font-weight: 700;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}

	.store-page.android .icon {
		border-radius: 50%;
	}

	.identity {
		flex: 1;
		min-width: 0;
	}

	h1 {
		margin: 0;
		font-size: 22px;
		line-height: 1.2;
	}

	.subtitle {
		margin: 2px 0 0;
		color: #6b7280;
		font-size: 14px;
	}

	.developer {
		margin: 6px 0 0;
		color: #2563eb;
		font-size: 13px;
	}

	.store-page.android .developer {
		color: #01875f;
	}

	.get {
		border: 0;
		border-radius: 999px;
		background: #2563eb;
		color: #fff;
		font-weight: 700;
		font-size: 14px;
		padding: 8px 22px;
		cursor: default;
	}

	.store-page.android .get {
		border-radius: 8px;
		background: #01875f;
	}

	.stats {
		display: flex;
		gap: 28px;
		margin: 20px 0 4px;
		padding: 12px 0;
		border-top: 1px solid #e5e7eb;
		border-bottom: 1px solid #e5e7eb;
	}

	.stats div {
		display: flex;
		flex-direction: column;
	}

	.stats strong {
		font-size: 15px;
	}

	.stats span {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #6b7280;
	}

	h2 {
		font-size: 17px;
		margin: 22px 0 10px;
	}

	.strip {
		display: flex;
		gap: 10px;
		overflow-x: auto;
		padding-bottom: 10px;
	}

	figure {
		margin: 0;
		flex-shrink: 0;
	}

	figure img {
		display: block;
		border-radius: 10px;
		border: 1px solid #e5e7eb;
	}

	figcaption {
		font-size: 10px;
		color: #9ca3af;
		font-family: ui-monospace, monospace;
		margin-top: 4px;
	}

	.description {
		white-space: pre-wrap;
		font-size: 14px;
		line-height: 1.55;
		color: #374151;
	}

	.hint {
		color: #6b7280;
		font-size: 14px;
	}
</style>
