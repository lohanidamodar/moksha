/**
 * The Moksha project file: moksha.json, living in the app's own repo.
 *
 * A store listing is a set of assets that share a look and a voice, and the
 * whole point of keeping it in a file is that it is diffable, re-runnable and
 * versioned with the app it advertises. Before this, the editor held a queue
 * in memory and a reload lost the work, so "re-make last release's screenshots
 * against the new build" was not a thing you could ask for.
 *
 * Shapes here match what the renderer already takes, so nothing translates
 * between the file and the draw code. What the file adds on top is defaults
 * every asset inherits, and copy that can carry one string per locale.
 */

import { templateLayout, isTemplateId, TEMPLATE_IDS } from './templates.js';

export const PROJECT_VERSION = 1;

/** The filename, and the directory it conventionally sits in. */
export const PROJECT_DIRNAME = 'moksha';
export const PROJECT_FILENAME = 'moksha.json';

/**
 * What a field means when a project file leaves it out.
 *
 * The template default is deliberately `uniform`: filling a missing template
 * with a real rhythm would silently relayout every asset in a project that
 * never asked for one. `moksha init` writes a livelier choice into the file
 * itself, where it is visible and editable.
 */
const DESIGN_DEFAULTS = {
	background: { type: 'gradient', id: 'sunset-pink' },
	pattern: null,
	font: 'Montserrat',
	template: 'uniform',
	frames: {}
};

/** The defaults a project falls back to, for anything normalising a file. */
export function projectDefaults() {
	return {
		version: PROJECT_VERSION,
		app: { name: '' },
		locales: ['en'],
		out: 'out',
		design: { ...DESIGN_DEFAULTS },
		// Only the studio's store preview reads this; it is what turns a row of
		// PNGs into something you can judge the way a shopper sees it.
		store: {},
		// How `moksha capture` drives the app. Absent means captures come from
		// somewhere else, which is fine — captures/ is a plain PNG folder.
		capture: {},
		assets: []
	};
}

/** A project with nothing in it yet, as `moksha init` writes it. */
export function emptyProject(appName = '') {
	const project = projectDefaults();
	project.app.name = appName;
	// A new project starts with a rhythm rather than five identical tiles; it
	// is written into the file so it can be seen and changed.
	project.design.template = 'editorial';
	return project;
}

/**
 * Pick the string for [locale] out of a copy value.
 *
 * Copy is either a plain string — the common case, one language — or a record
 * keyed by locale. A record missing the asked-for locale falls back to the
 * first entry rather than rendering an empty headline; validateProject reports
 * the gap separately, so the fallback is a safety net, not a silent pass.
 *
 * @param {string | Record<string, string> | undefined} value
 * @param {string} locale
 * @returns {string}
 */
export function resolveCopy(value, locale) {
	if (value == null) return '';
	if (typeof value === 'string') return value;
	if (typeof value !== 'object') return String(value);
	if (locale in value) return value[locale];
	const first = Object.values(value)[0];
	return typeof first === 'string' ? first : '';
}

/** True when a copy value carries per-locale strings rather than one string. */
export function isLocalisedCopy(value) {
	return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Fill in defaults and normalise a parsed moksha.json.
 *
 * Tolerant on read: a hand-edited file with fields missing still loads, and
 * validateProject is what reports the parts that are actually wrong.
 */
export function normalizeProject(raw) {
	const base = projectDefaults();
	const project = {
		version: Number(raw?.version) || PROJECT_VERSION,
		app: { ...base.app, ...(raw?.app ?? {}) },
		locales: Array.isArray(raw?.locales) && raw.locales.length ? [...raw.locales] : base.locales,
		out: typeof raw?.out === 'string' && raw.out ? raw.out : base.out,
		design: {
			...base.design,
			...(raw?.design ?? {}),
			frames: { ...(raw?.design?.frames ?? {}) }
		},
		store: { ...base.store, ...(raw?.store ?? {}) },
		capture: { ...base.capture, ...(raw?.capture ?? {}) },
		assets: Array.isArray(raw?.assets) ? raw.assets.map(normalizeAsset) : []
	};
	return project;
}

function normalizeAsset(raw, index) {
	return {
		id: typeof raw?.id === 'string' && raw.id ? raw.id : `asset-${index + 1}`,
		assetType: raw?.assetType,
		sizeId: raw?.sizeId ?? null,
		layout: raw?.layout ?? null,
		span: raw?.span ?? null,
		images: { ...(raw?.images ?? {}) },
		background: raw?.background ?? null,
		pattern: raw?.pattern === undefined ? undefined : raw.pattern,
		phoneFrame: raw?.phoneFrame ?? null,
		transforms: raw?.transforms ?? undefined,
		text: Array.isArray(raw?.text) ? raw.text.map((t) => ({ ...t })) : []
	};
}

/**
 * Turn one project asset into the config the renderer takes, for one locale.
 *
 * Precedence for every visual choice: the asset's own value, then the
 * project's design, then the asset type's own default.
 *
 * @param {object} project
 * @param {object} asset
 * @param {string} locale
 * @param {object} module — the asset type from the registry
 */
export function resolveAsset(project, asset, locale, module) {
	const design = project.design ?? {};
	// The font is locale-aware for the same reason the copy is: Montserrat
	// covers English and has no Devanagari at all, so a Nepali listing needs a
	// different family, not different words in the same one.
	const designFont = resolveCopy(design.font, locale) || undefined;

	return {
		assetType: asset.assetType,
		sizeId: asset.sizeId ?? undefined,
		layout: resolveLayout(project, asset, module),
		background: asset.background ?? design.background,
		// A pattern is meaningfully absent, so `null` on the asset means "no
		// pattern here" and must not fall through to the project's.
		pattern: asset.pattern !== undefined ? asset.pattern : (design.pattern ?? null),
		phoneFrame:
			asset.phoneFrame ??
			design.frames?.[asset.assetType] ??
			module?.defaultPhoneFrame ??
			undefined,
		transforms: asset.transforms,
		textOverlays: (asset.text ?? []).map((overlay) => ({
			...overlay,
			text: resolveCopy(overlay.text, locale),
			font: resolveCopy(overlay.font, locale) || designFont
		}))
	};
}

/**
 * The layout one asset renders with.
 *
 * Precedence: the asset's own choice, then the template's entry for its
 * position in its type's strip, then the project default, then the asset
 * type's first layout.
 */
export function resolveLayout(project, asset, module) {
	if (asset.layout) return asset.layout;

	const position = (project.assets ?? [])
		.filter((a) => a.assetType === asset.assetType)
		.findIndex((a) => a.id === asset.id);

	const fromTemplate =
		position === -1 ? undefined : templateLayout(project.design?.template, position);

	const candidate = fromTemplate ?? project.design?.layout;
	// A template may name a layout an asset type does not have — a feature
	// graphic has no "tilt-right" — so fall through rather than render nothing.
	if (candidate && module?.layouts?.some((l) => l.id === candidate)) return candidate;
	return module?.layouts?.[0]?.id;
}

/**
 * Check a project against the asset registry.
 *
 * File existence is not checked here — that needs a filesystem, and this
 * module stays loadable in a browser. The node layer adds those.
 *
 * @param {object} project — already normalised
 * @param {{getAssetType: (id: string) => object|undefined, frameIds: Set<string>}} registry
 * @returns {{level: 'error'|'warning', where: string, message: string}[]}
 */
export function validateProject(project, registry) {
	const problems = [];
	const error = (where, message) => problems.push({ level: 'error', where, message });
	const warn = (where, message) => problems.push({ level: 'warning', where, message });

	if (project.version > PROJECT_VERSION) {
		error(
			'version',
			`This project is version ${project.version}; this Moksha understands up to ${PROJECT_VERSION}.`
		);
	}

	if (!project.app?.name) warn('app.name', 'No app name, so the studio has nothing to label.');

	const capture = project.capture ?? {};
	if (Object.keys(capture).length) {
		if (!capture.test) {
			error('capture.test', 'A capture block needs a `test` — the Patrol test to run.');
		}
		if (capture.scenes != null && !Array.isArray(capture.scenes)) {
			error('capture.scenes', 'scenes must be an array of scene names.');
		}
	}

	const template = project.design?.template;
	if (template && !Array.isArray(template) && !isTemplateId(template)) {
		error(
			'design.template',
			`Unknown template "${template}". Try one of: ${TEMPLATE_IDS.join(', ')}, ` +
				'or give an array of layout ids.'
		);
	}

	if (isLocalisedCopy(project.design?.font)) {
		for (const locale of project.locales) {
			if (!(locale in project.design.font)) {
				error('design.font', `No font for "${locale}".`);
			}
		}
	}
	if (!project.assets.length) warn('assets', 'The project has no assets yet.');

	for (const field of ['subtitle', 'description', 'promoText']) {
		const value = project.store?.[field];
		if (!isLocalisedCopy(value)) continue;
		for (const locale of project.locales) {
			if (!(locale in value)) error(`store.${field}`, `No "${locale}" value.`);
		}
	}

	const seen = new Set();
	for (const asset of project.assets) {
		const where = `assets.${asset.id}`;
		if (seen.has(asset.id)) error(where, `Duplicate asset id "${asset.id}".`);
		seen.add(asset.id);

		const module = registry.getAssetType(asset.assetType);
		if (!module) {
			error(where, `Unknown assetType "${asset.assetType}".`);
			continue;
		}

		if (asset.sizeId && !module.sizes.some((s) => s.id === asset.sizeId)) {
			error(
				where,
				`"${asset.sizeId}" is not a size of ${asset.assetType}. ` +
					`Try one of: ${module.sizes.map((s) => s.id).join(', ')}.`
			);
		}

		if (asset.layout && !module.layouts.some((l) => l.id === asset.layout)) {
			error(
				where,
				`"${asset.layout}" is not a layout of ${asset.assetType}. ` +
					`Try one of: ${module.layouts.map((l) => l.id).join(', ')}.`
			);
		}

		if (asset.span != null) {
			const span = Number(asset.span);
			if (!Number.isInteger(span) || span < 1 || span > 5) {
				error(where, `span must be a whole number from 1 to 5; got ${JSON.stringify(asset.span)}.`);
			} else if (span > 1 && !asset.assetType.endsWith('-screenshot')) {
				// Only a screenshot strip is scrolled through, so only it has
				// neighbouring tiles for a composition to span.
				error(where, `${asset.assetType} is a single asset; it cannot span ${span} tiles.`);
			}
		}

		const frame = asset.phoneFrame ?? project.design?.frames?.[asset.assetType];
		if (frame && !registry.frameIds.has(frame)) {
			error(where, `Unknown phone frame "${frame}".`);
		} else if (frame && module.allowedPhoneFrames && !module.allowedPhoneFrames.includes(frame)) {
			warn(
				where,
				`Frame "${frame}" is not one ${asset.assetType} is designed for; ` +
					'it will render, but the bezel will not match the device.'
			);
		}

		for (const input of module.inputs ?? []) {
			if (input.type === 'image' && !asset.images?.[input.id] && !input.label?.includes('optional')) {
				warn(where, `No ${input.id} image, so that layer renders empty.`);
			}
		}

		// A locale with no string for it is the failure that ships an empty
		// headline to one store listing and nobody notices until a review.
		for (const [index, overlay] of (asset.text ?? []).entries()) {
			for (const [field, value] of [['text', overlay.text], ['font', overlay.font]]) {
				if (!isLocalisedCopy(value)) continue;
				for (const locale of project.locales) {
					if (!(locale in value)) {
						error(`${where}.text[${index}].${field}`, `No "${locale}" value.`);
					}
				}
			}
		}
	}

	return problems;
}
