/**
 * Finding adb.
 *
 * "Install the Android SDK platform-tools" is the wrong advice on a machine
 * that already has them: adb is frequently installed and not on the PATH,
 * and on WSL the tools live on the Windows side, where the Linux PATH never
 * looks. Both are the normal state of a Flutter developer's machine rather
 * than a misconfiguration, so this looks in the places it is actually kept.
 */
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename } from 'node:path';

/** Candidate adb paths, best first. */
export function adbCandidates(env = process.env, platform = process.platform, home = homedir()) {
	const candidates = [];
	const exe = platform === 'win32' ? 'adb.exe' : 'adb';

	// An explicit override always wins.
	if (env.MOKSHA_ADB) candidates.push(env.MOKSHA_ADB);

	// The PATH, both spellings: under WSL the Windows PATH is often inherited,
	// where the tool is adb.exe.
	candidates.push('adb');
	if (platform !== 'win32') candidates.push('adb.exe');

	for (const root of [env.ANDROID_HOME, env.ANDROID_SDK_ROOT].filter(Boolean)) {
		candidates.push(join(root, 'platform-tools', exe));
	}

	// Where the SDK installs itself, per platform.
	const conventional =
		platform === 'darwin'
			? [join(home, 'Library', 'Android', 'sdk')]
			: platform === 'win32'
				? [join(env.LOCALAPPDATA ?? join(home, 'AppData', 'Local'), 'Android', 'Sdk')]
				: [join(home, 'Android', 'Sdk')];

	for (const root of conventional) candidates.push(join(root, 'platform-tools', exe));

	// WSL: the SDK is usually installed on the Windows side, and the Linux
	// PATH never looks there.
	if (platform === 'linux') {
		for (const user of windowsUserDirs(env, home)) {
			candidates.push(join(user, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'));
		}
	}

	return [...new Set(candidates)];
}

/** Windows home directories reachable from this WSL instance. */
function windowsUserDirs(env, home) {
	const dirs = [];
	// WSL exposes the Windows profile through interop when it is set.
	if (env.USERPROFILE) dirs.push(env.USERPROFILE.replace(/^([A-Za-z]):\\/, (_, d) => `/mnt/${d.toLowerCase()}/`).replace(/\\/g, '/'));
	// Otherwise guess the same username under the usual mount.
	const user = env.USER || env.LOGNAME || basename(home);
	if (user) dirs.push(`/mnt/c/Users/${user}`);
	return dirs;
}

/**
 * The adb this machine should use.
 *
 * A bare name is returned as-is for the PATH to resolve; a path is only
 * returned when the file is really there.
 */
export function findAdb(env = process.env, platform = process.platform, home = homedir()) {
	for (const candidate of adbCandidates(env, platform, home)) {
		const isBareName = !candidate.includes('/') && !candidate.includes('\\');
		if (isBareName) continue; // the PATH is tried by running it
		if (existsSync(candidate)) return candidate;
	}
	return null;
}
