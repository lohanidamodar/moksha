/**
 * The capture handshake.
 *
 * Host and test have to agree on *when* to photograph the screen. Watching
 * Patrol's log stream for a scene marker is racy — the frame you catch is not
 * necessarily the settled one. So the test asks, and blocks:
 *
 *   await captureScene('home');   // GET /capture?scene=home
 *
 * The request does not return until the host has taken and written the shot,
 * so the test cannot navigate away mid-capture, and the test's own
 * pumpAndSettle has already run before the request leaves. Deterministic, and
 * identical on Android and iOS.
 *
 * On Android the device's localhost is its own, so the caller sets up
 * `adb reverse` first; on an iOS simulator localhost is already the host's.
 */
import { createServer } from 'node:http';

/**
 * Serve the handshake.
 *
 * @param {{onCapture: (scene: string) => Promise<{path: string, width?: number, height?: number}>,
 *          port?: number}} options
 *   onCapture does the actual photograph; whatever it throws is reported to
 *   the test as a 500, so a broken capture fails the test rather than passing
 *   with nothing written.
 */
export async function startCaptureServer({ onCapture, port = 0 }) {
	/** @type {{scene: string, path?: string, error?: string}[]} */
	const captured = [];

	const server = createServer((req, res) => {
		const url = new URL(req.url, 'http://localhost');

		if (url.pathname === '/health') {
			res.writeHead(200, { 'content-type': 'application/json' });
			res.end(JSON.stringify({ ok: true, captured: captured.length }));
			return;
		}

		if (url.pathname !== '/capture') {
			res.writeHead(404, { 'content-type': 'text/plain' });
			res.end('Expected /capture?scene=<name>');
			return;
		}

		const scene = url.searchParams.get('scene');
		if (!scene) {
			res.writeHead(400, { 'content-type': 'text/plain' });
			res.end('Expected /capture?scene=<name>');
			return;
		}

		// The response is the acknowledgement: the test resumes only once the
		// file is on disk.
		onCapture(scene).then(
			(result) => {
				captured.push({ scene, path: result?.path });
				res.writeHead(200, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ scene, ...result }));
			},
			(error) => {
				const message = error instanceof Error ? error.message : String(error);
				captured.push({ scene, error: message });
				res.writeHead(500, { 'content-type': 'application/json' });
				res.end(JSON.stringify({ scene, error: message }));
			}
		);
	});

	await new Promise((resolve, reject) => {
		server.once('error', reject);
		// Loopback only: this endpoint writes files, and nothing off this
		// machine has any business asking it to.
		server.listen(port, '127.0.0.1', resolve);
	});

	return {
		port: server.address().port,
		captured,
		close: () => new Promise((resolve) => server.close(resolve))
	};
}
