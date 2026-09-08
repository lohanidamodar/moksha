<script>
	/**
	 * The project-wide design: what every asset inherits unless it overrides.
	 *
	 * Editing this in the studio is the difference between the file being
	 * readable from here and being editable from here — the template, the font
	 * and the shared background otherwise meant hand-editing moksha.json.
	 */
	import { project } from '$lib/stores/project.svelte.js';
	import { assetTypes } from '$core/assets/index.js';
	import { GRADIENTS, MESH, SOLIDS, PATTERNS } from '$core/renderer/backgrounds.js';
	import { GOOGLE_FONTS } from '$core/fonts.js';
	import { isLocalisedCopy, resolveCopy } from '$core/project.js';

	const BACKGROUNDS = {
		gradient: GRADIENTS.map((g) => g.id),
		mesh: MESH.map((m) => m.id),
		solid: SOLIDS.map((s) => s.id)
	};

	const templates = $derived(project.options?.templates ?? []);

	/**
	 * The catalogue, plus whatever the project already uses.
	 *
	 * Any Google Font renders, so a hand-edited moksha.json may name one the
	 * curated list does not. Without this the select shows blank, which reads
	 * as "no font chosen" for a project that has one.
	 */
	const fontOptions = $derived.by(() => {
		const families = new Set(GOOGLE_FONTS.map((f) => f.family));
		for (const locale of project.locales) {
			const used = fontFor(locale);
			if (used) families.add(used);
		}
		return [...families].sort((a, b) => a.localeCompare(b));
	});
	const design = $derived(project.project?.design ?? {});
	const framed = assetTypes.filter((a) => a.allowedPhoneFrames?.length);

	/** The font for one locale, whether the file stores one string or a record. */
	function fontFor(locale) {
		return resolveCopy(design.font, locale) || '';
	}

	function setFont(locale, family) {
		// Once a project has more than one language its font is per-locale, and
		// staying a plain string would force every locale to share a typeface
		// that may not cover its script.
		if (project.locales.length === 1 && !isLocalisedCopy(design.font)) {
			project.setDesign({ font: family });
			return;
		}
		const record = isLocalisedCopy(design.font)
			? { ...design.font }
			: Object.fromEntries(project.locales.map((l) => [l, design.font ?? '']));
		record[locale] = family;
		project.setDesign({ font: record });
	}

	function setBackground(type, id) {
		project.setDesign({ background: { type, id } });
	}

	function setFrame(assetType, frame) {
		const frames = { ...(design.frames ?? {}) };
		if (frame) frames[assetType] = frame;
		else delete frames[assetType];
		project.setDesign({ frames });
	}
</script>

<div class="design-panel">
	<label class="field">
		<span>Template</span>
		<select
			value={typeof design.template === 'string' ? design.template : 'custom'}
			onchange={(e) => project.setDesign({ template: e.currentTarget.value })}
			disabled={Array.isArray(design.template)}
		>
			{#each templates as template (template.id)}
				<option value={template.id} title={template.description}>{template.label}</option>
			{/each}
			{#if Array.isArray(design.template)}
				<option value="custom">Custom sequence ({design.template.length})</option>
			{/if}
		</select>
	</label>

	<label class="field">
		<span>Background</span>
		<select
			value={`${design.background?.type ?? 'gradient'}:${design.background?.id ?? ''}`}
			onchange={(e) => {
				const [type, id] = e.currentTarget.value.split(':');
				setBackground(type, id);
			}}
		>
			{#each Object.entries(BACKGROUNDS) as [type, ids] (type)}
				<optgroup label={type}>
					{#each ids as id (id)}
						<option value={`${type}:${id}`}>{id}</option>
					{/each}
				</optgroup>
			{/each}
		</select>
	</label>

	<label class="field">
		<span>Pattern</span>
		<select
			value={design.pattern?.id ?? ''}
			onchange={(e) =>
				project.setDesign({
					pattern: e.currentTarget.value ? { id: e.currentTarget.value } : null
				})}
		>
			<option value="">None</option>
			{#each PATTERNS as pattern (pattern.id)}
				<option value={pattern.id}>{pattern.id}</option>
			{/each}
		</select>
	</label>

	{#each project.locales as locale (locale)}
		<label class="field">
			<span>Font{project.locales.length > 1 ? ` · ${locale}` : ''}</span>
			<select value={fontFor(locale)} onchange={(e) => setFont(locale, e.currentTarget.value)}>
				{#each fontOptions as family (family)}
					<option value={family}>{family}</option>
				{/each}
			</select>
		</label>
	{/each}

	{#each framed as type (type.id)}
		<label class="field">
			<span>{type.label} frame</span>
			<select
				value={design.frames?.[type.id] ?? ''}
				onchange={(e) => setFrame(type.id, e.currentTarget.value)}
			>
				<option value="">Default ({type.defaultPhoneFrame})</option>
				{#each type.allowedPhoneFrames as id (id)}
					<option value={id}>{id}</option>
				{/each}
			</select>
		</label>
	{/each}
</div>

<style>
	.design-panel {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
		gap: 8px 14px;
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid var(--border, #2e2e36);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 3px;
		font-size: 11px;
		color: var(--text-secondary, #9d9baa);
	}

	.field select {
		background: var(--bg-card, #222228);
		color: var(--text-primary, #f0eff4);
		border: 1px solid var(--border, #2e2e36);
		border-radius: 6px;
		padding: 4px 7px;
		font-size: 12px;
		font-family: inherit;
	}

	.field select:disabled {
		opacity: 0.6;
	}
</style>
