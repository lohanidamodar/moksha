/**
 * The project the studio is editing, for the server side of the app.
 *
 * The studio is always opened on one project — `moksha studio` passes it in
 * MOKSHA_PROJECT — so this resolves it per request rather than holding state
 * that could go stale behind an edit made by the CLI.
 */
import { findProjectFile, loadProject } from '$core/node/project-file.js';

export class NoProjectError extends Error {}

/** The project file this studio session acts on. */
export function projectPath() {
	const path = findProjectFile({});
	if (!path) {
		throw new NoProjectError(
			'No project. Start the studio with `moksha studio` from an app repo, ' +
				'or set MOKSHA_PROJECT.'
		);
	}
	return path;
}

/** Load it fresh, so an edit made by the CLI shows up on reload. */
export function currentProject() {
	return loadProject(projectPath());
}
