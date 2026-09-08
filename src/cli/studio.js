/**
 * `moksha studio` — the editor, opened on this project.
 *
 * The studio is the SvelteKit app built by `npm run build`, served by its own
 * adapter-node server. The CLI's job is to point it at the right project and
 * open a browser, so the editor and the CLI always act on the same file.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { findProjectFile } from '../core/node/project-file.js';
import { NoProjectError, displayPath } from './project-arg.js';

/** The built server, relative to this file, in a checkout and in the package. */
function serverEntry() {
	return fileURLToPath(new URL('../../build/index.js', import.meta.url));
}

export function studio({ flags }) {
	const projectPath = findProjectFile({
		explicit: typeof flags.project === 'string' ? flags.project : undefined
	});
	if (!projectPath) throw new NoProjectError();

	const entry = serverEntry();
	if (!existsSync(entry)) {
		throw new Error(
			`The studio has not been built (${entry} is missing).\n` +
				'In a checkout, run `npm run build` first.'
		);
	}

	const port = Number(flags.port) || 4321;
	const url = `http://localhost:${port}`;

	const child = spawn(process.execPath, [entry], {
		stdio: 'inherit',
		env: { ...process.env, PORT: String(port), MOKSHA_PROJECT: projectPath }
	});

	console.log(`studio  ${url}`);
	console.log(`project ${displayPath(process.cwd(), projectPath)}`);
	if (!flags['no-open']) openInBrowser(url);

	return new Promise((resolve) => {
		child.on('exit', (code) => resolve(code ?? 0));
		// Ctrl-C should stop the server, not orphan it.
		for (const signal of ['SIGINT', 'SIGTERM']) {
			process.on(signal, () => child.kill(signal));
		}
	});
}

function openInBrowser(url) {
	const command =
		process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
	const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
	try {
		spawn(command, args, { stdio: 'ignore', detached: true }).unref();
	} catch {
		// A headless host has no browser to open; the URL is printed above.
	}
}
