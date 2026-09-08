/**
 * Browser font loading for the studio. The catalogue itself lives in core,
 * so the renderer and the picker can never drift apart.
 */
export { GOOGLE_FONTS } from '../core/fonts.js';

const loadedFonts = new Set();

/**
 * Load a Google Font dynamically. Only loads once per family.
 * @param {string} family
 * @returns {Promise<void>}
 */
export async function loadFont(family) {
	if (loadedFonts.has(family)) return;
	loadedFonts.add(family);

	const encoded = family.replace(/ /g, '+');
	const url = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800;900&display=swap`;

	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = url;
	document.head.appendChild(link);

	// Wait for the font to actually load
	try {
		await document.fonts.load(`800 48px "${family}"`);
	} catch {
		// Font loading failed silently — canvas will fall back
	}
}
