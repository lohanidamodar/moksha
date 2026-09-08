import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adbCandidates } from './android-sdk.js';

const at = (list, needle) => list.findIndex((c) => c.includes(needle));

test('an explicit override comes first', () => {
	const candidates = adbCandidates({ MOKSHA_ADB: '/custom/adb' }, 'linux', '/home/x');
	assert.equal(candidates[0], '/custom/adb');
});

test('the PATH is tried before any guess', () => {
	const candidates = adbCandidates({ ANDROID_HOME: '/sdk' }, 'linux', '/home/x');
	assert.ok(at(candidates, 'adb') < at(candidates, '/sdk'));
});

test('under WSL, adb.exe is a candidate too', () => {
	// The Windows PATH is often inherited, where the tool has the extension.
	assert.ok(adbCandidates({}, 'linux', '/home/x').includes('adb.exe'));
	// On Windows itself the bare name already resolves to the .exe.
	assert.ok(!adbCandidates({}, 'win32', 'C:\\Users\\x').includes('adb.exe'));
});

test('ANDROID_HOME and ANDROID_SDK_ROOT are both honoured', () => {
	const candidates = adbCandidates(
		{ ANDROID_HOME: '/a', ANDROID_SDK_ROOT: '/b' },
		'linux',
		'/home/x'
	);
	assert.ok(candidates.some((c) => c.startsWith('/a/platform-tools/adb')));
	assert.ok(candidates.some((c) => c.startsWith('/b/platform-tools/adb')));
});

test('each platform looks where its SDK actually installs', () => {
	assert.ok(
		adbCandidates({}, 'darwin', '/Users/x').some((c) => c.includes('/Library/Android/sdk/'))
	);
	assert.ok(adbCandidates({}, 'linux', '/home/x').some((c) => c.includes('/home/x/Android/Sdk/')));
	assert.ok(
		adbCandidates({ LOCALAPPDATA: 'C:\\Users\\x\\AppData\\Local' }, 'win32', 'C:\\Users\\x').some(
			(c) => c.includes('Android') && c.endsWith('adb.exe')
		)
	);
});

test('from WSL, the Windows-side SDK is reachable', () => {
	// The case on a normal Flutter-on-Windows machine: the tools are installed,
	// and the Linux PATH never looks at them.
	const viaUserprofile = adbCandidates(
		{ USERPROFILE: 'C:\\Users\\dana' },
		'linux',
		'/home/dana'
	);
	assert.ok(
		viaUserprofile.some((c) => c === '/mnt/c/Users/dana/AppData/Local/Android/Sdk/platform-tools/adb.exe'),
		viaUserprofile.join('\n')
	);

	const viaUsername = adbCandidates({ USER: 'dana' }, 'linux', '/home/dana');
	assert.ok(viaUsername.some((c) => c.startsWith('/mnt/c/Users/dana/')));
});

test('candidates are unique, so nothing is probed twice', () => {
	const candidates = adbCandidates({ ANDROID_HOME: '/a', ANDROID_SDK_ROOT: '/a' }, 'linux', '/home/x');
	assert.equal(new Set(candidates).size, candidates.length);
});
