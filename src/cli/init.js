import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { initProject } from '../core/node/project-file.js';
import { PROJECT_DIRNAME, PROJECT_FILENAME } from '../core/project.js';

/** `moksha init [name]` — create a project file next to the app it describes. */
export function init({ flags, positional }) {
	const name = positional.join(' ');
	const target =
		typeof flags.project === 'string'
			? resolve(flags.project)
			: join(process.cwd(), PROJECT_DIRNAME, PROJECT_FILENAME);

	if (existsSync(target)) {
		console.error(`${target} already exists.`);
		return 1;
	}

	const written = initProject(target, name);
	console.log(`Wrote ${written}`);
	console.log('\nNext: add an asset to `assets`, then `moksha studio` to design it.');
	return 0;
}
