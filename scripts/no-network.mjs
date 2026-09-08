/**
 * Preloaded with `node --import` to make network access an error.
 *
 * The claim under test is that a fresh clone renders its own defaults, and
 * Devanagari, with no network at all. Proxy environment variables would not
 * prove it — node's fetch ignores them unless explicitly opted in — so the
 * block has to be real, or the check is a false guarantee.
 *
 * fetch is the whole surface: it is the only way anything here reaches out.
 */
globalThis.fetch = () => {
	throw new Error(
		'fetch() during an offline check: rendering the bundled defaults must need no network.'
	);
};
