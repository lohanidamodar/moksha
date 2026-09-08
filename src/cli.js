#!/usr/bin/env node
/**
 * The `moksha` command.
 *
 * Run from an app repo: the project file is found by walking up from the
 * working directory, so `moksha render` in a Flutter repo rebuilds that app's
 * store assets. Everything the renderer needs is plain JS under src/core, so
 * this needs no bundler and no Vite.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';
import { capture } from './cli/capture.js';
import { doctor } from './cli/doctor.js';
import { init } from './cli/init.js';
import { render } from './cli/render.js';
import { schema } from './cli/schema.js';
import { studio } from './cli/studio.js';
import { validate } from './cli/validate.js';

const USAGE = `
moksha — store assets for the app in this repo

  moksha init [name]   Write moksha/moksha.json for this app
  moksha doctor        Check the project, the toolchain and the font cache
  moksha validate      Check the project against the store rules, without rendering
  moksha capture       Drive the app with Patrol and photograph its screens
  moksha render        Render every asset, for every locale, and verify it
  moksha studio        Open the editor on this project (--port <n>, --no-open)
  moksha schema        Every legal option, as JSON
  moksha version       Print the installed version

Options
  --project <path>     Project file (default: moksha/moksha.json, searched upwards)
  --locale <code>      Only this locale (default: every locale in the project)
  --asset <id>         Only this asset (repeatable)
  --out <dir>          Override the project's output directory

capture options
  --platform <p>       android (default) or ios; iOS needs a macOS host
  --device <id>        Which attached device, when several are
  --test <path>        The Patrol test to run, overriding the project's
  --scaffold           Print the two Dart files the app repo needs, and stop
`;

const COMMANDS = { init, doctor, validate, capture, render, studio, schema };

/** A tiny flag parser: --name value, --flag, and bare positionals. */
export function parseArgv(argv) {
	const flags = {};
	const positional = [];
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (!arg.startsWith('--')) {
			positional.push(arg);
			continue;
		}
		const name = arg.slice(2);
		const next = argv[i + 1];
		if (next === undefined || next.startsWith('--')) {
			flags[name] = true;
		} else {
			// Repeatable flags collect rather than overwrite, so --asset a
			// --asset b renders both.
			flags[name] = name in flags ? [].concat(flags[name], next) : next;
			i++;
		}
	}
	return { flags, positional };
}

function version() {
	const pkg = new URL('../package.json', import.meta.url);
	return JSON.parse(readFileSync(pkg, 'utf8')).version;
}

async function main() {
	const [command, ...rest] = process.argv.slice(2);

	if (!command || command === 'help' || command === '--help' || command === '-h') {
		console.log(USAGE);
		return 0;
	}

	if (command === 'version' || command === '-v' || command === '--version') {
		console.log(version());
		return 0;
	}

	const handler = COMMANDS[command];
	if (!handler) {
		console.error(`Unknown command "${command}"\n${USAGE}`);
		return 1;
	}

	return handler(parseArgv(rest));
}

/**
 * True when this file is what node was asked to run, rather than something a
 * test or another module imported. Without the guard, importing anything from
 * here ran the whole CLI and exited the importing process.
 */
function invokedDirectly() {
	if (!argv[1]) return false;
	try {
		return realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url));
	} catch {
		return false;
	}
}

if (invokedDirectly()) {
	main()
		.then((code) => process.exit(code ?? 0))
		.catch((err) => {
			console.error(`\n${err instanceof Error ? err.message : err}\n`);
			process.exit(1);
		});
}
