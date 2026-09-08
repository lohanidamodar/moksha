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

export const PROJECT_VERSION = 1;

/** The filename, and the directory it conventionally sits in. */
export const PROJECT_DIRNAME = 'moksha';
export const PROJECT_FILENAME = 'moksha.json';

/** A project with nothing in it yet, as `moksha init` would write. */
export function emptyProject(appName = '') {
	return {
		version: PROJECT_VERSION,
		app: { name: appName },
		locales: ['en'],
		out: 'out',
		design: {
			background: { type: 'gradient', id: 'sunset-pink' },
			pattern: null,
			font: 'Montserrat',
			frames: {}
		},
		assets: []
	};
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
	const base = emptyProject();
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
		layout: asset.layout ?? module?.layouts?.[0]?.id,
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

	if (isLocalisedCopy(project.design?.font)) {
		for (const locale of project.locales) {
			if (!(locale in project.design.font)) {
				error('design.font', `No font for "${locale}".`);
			}
		}
	}
	if (!project.assets.length) warn('assets', 'The project has no assets yet.');

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
