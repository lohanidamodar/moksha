import { json, error } from '@sveltejs/kit';
import { saveProject, assetSchema, displayPath } from '$core/node/project-file.js';
import { normalizeProject, PROJECT_VERSION } from '$core/project.js';
import { GRADIENTS, MESH, SOLIDS, PATTERNS } from '$core/renderer/backgrounds.js';
import { PHONE_FRAMES } from '$core/renderer/phone-frame.js';
import { ANCHOR_IDS } from '$core/renderer/text-overlays.js';
import { GOOGLE_FONTS } from '$core/fonts.js';
import { currentProject, projectPath, NoProjectError } from '$lib/server/project.js';

/** The project the studio is editing, plus everything it may legally contain. */
export function GET() {
	let loaded;
	try {
		loaded = currentProject();
	} catch (e) {
		if (e instanceof NoProjectError) return json({ project: null, reason: e.message }, { status: 404 });
		return error(500, e instanceof Error ? e.message : String(e));
	}

	return json({
		path: loaded.path,
		label: displayPath(process.cwd(), loaded.path),
		project: loaded.project,
		problems: loaded.problems,
		options: {
			projectVersion: PROJECT_VERSION,
			assetTypes: assetSchema(),
			backgrounds: {
				gradient: GRADIENTS.map((g) => g.id),
				mesh: MESH.map((m) => m.id),
				solid: [...SOLIDS.map((s) => s.id), 'custom']
			},
			patterns: PATTERNS.map((p) => p.id),
			phoneFrames: PHONE_FRAMES.map((f) => f.id ?? f),
			textAnchors: ANCHOR_IDS,
			fonts: GOOGLE_FONTS.map((f) => f.family)
		}
	});
}

/**
 * Write the project back.
 *
 * Normalised before writing, so a studio that omits a field cannot quietly
 * drop it from the file the CLI reads.
 */
export async function PUT({ request }) {
	let path;
	try {
		path = projectPath();
	} catch (e) {
		return error(404, e instanceof Error ? e.message : String(e));
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') return error(400, 'Expected a project object.');

	saveProject(path, normalizeProject(body));
	return json({ saved: true, path });
}
