import { error } from '@sveltejs/kit';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { imagePath } from '$core/node/project-file.js';
import { json } from '@sveltejs/kit';
import { currentProject, NoProjectError } from '$lib/server/project.js';

const TYPES = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp'
};

/**
 * Serve an image a project asset references, so the canvas can draw the real
 * capture rather than asking the user to upload it again.
 *
 * Confined to the project directory: the reference comes out of a file the
 * user edits by hand, and this process can read everything they can.
 */
export function GET({ url }) {
	const reference = url.searchParams.get('ref');
	if (!reference) return error(400, 'Expected ?ref=<path from the project file>');

	let loaded;
	try {
		loaded = currentProject();
	} catch (e) {
		if (e instanceof NoProjectError) return error(404, e.message);
		return error(500, e instanceof Error ? e.message : String(e));
	}

	const root = resolve(loaded.dir);
	const target = resolve(imagePath(root, reference));
	const inside = relative(root, target);
	if (inside.startsWith(`..${sep}`) || inside === '..' || resolve(inside) === inside) {
		return error(403, 'Images must live inside the project directory.');
	}

	if (!existsSync(target) || !statSync(target).isFile()) return error(404, `No file at "${reference}".`);

	const type = TYPES[extname(target).toLowerCase()];
	if (!type) return error(415, `${extname(target)} is not an image Moksha reads.`);

	return new Response(readFileSync(target), {
		headers: { 'content-type': type, 'cache-control': 'no-cache' }
	});
}

/** Where the studio puts an image someone drags in. */
const UPLOAD_DIR = 'captures';

/**
 * Accept an image from the studio and write it into the project.
 *
 * The studio holds uploads as blobs the browser owns, which the CLI cannot
 * see. Without somewhere on disk to put them, an asset designed in the studio
 * could not be saved to a file that renders. So an upload becomes a file in
 * the project, and the project references it by path like any other.
 */
export async function POST({ request }) {
	let loaded;
	try {
		loaded = currentProject();
	} catch (e) {
		if (e instanceof NoProjectError) return error(404, e.message);
		return error(500, e instanceof Error ? e.message : String(e));
	}

	const form = await request.formData().catch(() => null);
	const file = form?.get('file');
	if (!(file instanceof File)) return error(400, 'Expected a `file` field.');

	const extension = extname(file.name).toLowerCase();
	if (!TYPES[extension]) return error(415, `${extension || file.name} is not an image Moksha reads.`);

	const dir = resolve(loaded.dir, UPLOAD_DIR);
	mkdirSync(dir, { recursive: true });

	const name = uniqueName(dir, safeName(file.name, extension), extension);
	writeFileSync(join(dir, name), Buffer.from(await file.arrayBuffer()));

	// The reference is what goes in the project file, so it must be relative
	// and use forward slashes on every platform.
	return json({ ref: `${UPLOAD_DIR}/${name}` });
}

/** A filename that cannot escape the upload directory or surprise a shell. */
function safeName(original, extension) {
	const base = original
		.slice(0, original.length - extension.length)
		.replace(/[^A-Za-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
	return base || 'image';
}

function uniqueName(dir, base, extension) {
	for (let n = 0; ; n++) {
		const name = n === 0 ? `${base}${extension}` : `${base}-${n}${extension}`;
		if (!existsSync(join(dir, name))) return name;
	}
}
