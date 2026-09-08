import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgv } from './cli.js';

test('flags take a value, and bare flags are true', () => {
	const { flags } = parseArgv(['--project', 'moksha/moksha.json', '--no-open']);
	assert.equal(flags.project, 'moksha/moksha.json');
	assert.equal(flags['no-open'], true);
});

test('a flag at the end with no value is still a flag', () => {
	assert.deepEqual(parseArgv(['--no-open']).flags, { 'no-open': true });
});

test('a repeated flag collects, so --asset can name several', () => {
	const { flags } = parseArgv(['--asset', 'home', '--asset', 'feature', '--asset', 'about']);
	assert.deepEqual(flags.asset, ['home', 'feature', 'about']);
});

test('positionals are kept in order, which is how init takes a name', () => {
	const { positional } = parseArgv(['My', 'App', '--project', 'x.json']);
	assert.deepEqual(positional, ['My', 'App']);
});

test('a flag followed by another flag does not swallow it', () => {
	const { flags } = parseArgv(['--no-open', '--port', '5000']);
	assert.equal(flags['no-open'], true);
	assert.equal(flags.port, '5000');
});
