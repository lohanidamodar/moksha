/**
 * `moksha render` — every asset in the project, for every locale, checked
 * against the store it targets.
 *
 * Exits non-zero when anything breaks a rule, so a release pipeline fails here
 * rather than at upload.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAssetType } from '../core/assets/index.js';
import { resolveAsset } from '../core/project.js';
import { renderStoreAsset } from '../core/node/canvas.js';
import { imagePath, outputDir } from '../core/node/project-file.js';
import { requireProject, selectedAssets, selectedLocales, displayPath } from './project-arg.js';

export async function render({ flags }) {
	const { path, dir, project, problems } = requireProject(flags);

	// A project that does not describe a renderable set is a stop, not a
	// warning: rendering it would produce assets nobody asked for.
	const fatal = problems.filter((p) => p.level === 'error');
	if (fatal.length) {
		console.error(`${displayPath(process.cwd(), path)} cannot be rendered:`);
		for (const problem of fatal) console.error(`  ✗ ${problem.where}: ${problem.message}`);
		return 1;
	}
	for (const problem of problems) console.warn(`  ! ${problem.where}: ${problem.message}`);

	const assets = selectedAssets(project, flags);
	const locales = selectedLocales(project, flags);
	const root = typeof flags.out === 'string' ? imagePath(dir, flags.out) : outputDir(dir, project);

	if (!assets.length) {
		console.error('Nothing to render: the project has no assets.');
		return 1;
	}

	let failed = 0;
	let written = 0;

	// One directory a locale only when the PROJECT has more than one — not when
	// this run does. Keyed on the selection, `--locale ne` would write where a
	// full render never looks.
	const perLocale = project.locales.length > 1;

	for (const locale of locales) {
		const localeDir = perLocale ? join(root, locale) : root;

		for (const asset of assets) {
			const module = getAssetType(asset.assetType);
			const config = resolveAsset(project, asset, locale, module);
			const images = loadImages(dir, asset);

			const { buffer, size, problems: assetProblems } = await renderStoreAsset(config, images);
			const target = join(localeDir, folderFor(module, size), `${asset.id}.png`);
			mkdirSync(join(localeDir, folderFor(module, size)), { recursive: true });
			writeFileSync(target, buffer);
			written++;

			const shown = displayPath(dir, target);
			if (assetProblems.length) {
				failed++;
				console.error(`✗ ${shown}  ${size.w}x${size.h}`);
				for (const problem of assetProblems) console.error(`    ${problem.message}`);
			} else {
				console.log(`✓ ${shown}  ${size.w}x${size.h}`);
			}
		}
	}

	console.log(`\n${written - failed}/${written} asset(s) -> ${displayPath(process.cwd(), root)}`);
	return failed === 0 ? 0 : 1;
}

function loadImages(projectDir, asset) {
	const images = {};
	for (const [input, reference] of Object.entries(asset.images ?? {})) {
		if (reference) images[input] = readFileSync(imagePath(projectDir, reference));
	}
	return images;
}

/**
 * Where an asset lands. Grouped the way an upload does it — by store, then by
 * what the asset is — so a folder can be dragged into App Store Connect or the
 * Play Console without sorting anything first.
 */
function folderFor(module, size) {
	const platform = size.platform ?? module.platform;
	if (platform === 'ios' || platform === 'android') {
		return join(platform, subfolderFor(module.id));
	}
	if (module.id === 'social-card') return 'social';
	if (module.id === 'app-icon-showcase') return 'icon';
	return 'general';
}

function subfolderFor(assetTypeId) {
	switch (assetTypeId) {
		case 'iphone-screenshot':
		case 'android-phone-screenshot':
			return join('screenshots', 'phone');
		case 'ipad-screenshot':
		case 'android-tablet-screenshot':
			return join('screenshots', 'tablet');
		case 'feature-graphic':
			return 'feature-graphic';
		case 'promo-banner':
			return 'promo-banner';
		default:
			return assetTypeId;
	}
}
