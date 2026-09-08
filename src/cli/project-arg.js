/**
 * Resolving the project a command acts on, and reporting what is wrong with
 * it. Shared by every command so they all fail the same way.
 */
import { findProjectFile, loadProject, displayPath } from '../core/node/project-file.js';
import { PROJECT_DIRNAME, PROJECT_FILENAME } from '../core/project.js';

export class NoProjectError extends Error {
	constructor() {
		super(
			`No ${PROJECT_FILENAME} found here or in any parent directory.\n` +
				`Run \`moksha init <app name>\` to create ${PROJECT_DIRNAME}/${PROJECT_FILENAME}, ` +
				'or point at one with --project.'
		);
		this.name = 'NoProjectError';
	}
}

/** Load the project a command was pointed at, or explain that there isn't one. */
export function requireProject(flags) {
	const path = findProjectFile({ explicit: typeof flags.project === 'string' ? flags.project : undefined });
	if (!path) throw new NoProjectError();
	return loadProject(path);
}

/** The assets a run covers: all of them, or the ones --asset named. */
export function selectedAssets(project, flags) {
	if (!flags.asset) return project.assets;
	const wanted = new Set([].concat(flags.asset));
	const found = project.assets.filter((a) => wanted.has(a.id));
	const missing = [...wanted].filter((id) => !project.assets.some((a) => a.id === id));
	if (missing.length) {
		throw new Error(
			`No asset with id ${missing.map((m) => `"${m}"`).join(', ')} in this project. ` +
				`It has: ${project.assets.map((a) => a.id).join(', ') || '(none)'}.`
		);
	}
	return found;
}

/** The locales a run covers: all of them, or the one --locale named. */
export function selectedLocales(project, flags) {
	if (typeof flags.locale !== 'string') return project.locales;
	if (!project.locales.includes(flags.locale)) {
		throw new Error(
			`"${flags.locale}" is not a locale of this project. ` +
				`It has: ${project.locales.join(', ')}.`
		);
	}
	return [flags.locale];
}

/**
 * Print problems grouped by severity.
 * @returns {boolean} true when nothing was fatal
 */
export function reportProblems(problems, { dir, label = 'project' } = {}) {
	const errors = problems.filter((p) => p.level === 'error');
	const warnings = problems.filter((p) => p.level === 'warning');

	for (const problem of warnings) console.warn(`  ! ${problem.where ?? label}: ${problem.message}`);
	for (const problem of errors) console.error(`  ✗ ${problem.where ?? label}: ${problem.message}`);

	if (!problems.length) console.log('  ✓ no problems');
	return errors.length === 0;
}

export { displayPath };
