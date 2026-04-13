/**
 * Curated list of popular Google Fonts for the font selector.
 * Each entry: { family, category }
 */
export const GOOGLE_FONTS = [
	{ family: 'Inter', category: 'sans-serif' },
	{ family: 'Roboto', category: 'sans-serif' },
	{ family: 'Open Sans', category: 'sans-serif' },
	{ family: 'Lato', category: 'sans-serif' },
	{ family: 'Montserrat', category: 'sans-serif' },
	{ family: 'Poppins', category: 'sans-serif' },
	{ family: 'Raleway', category: 'sans-serif' },
	{ family: 'Nunito', category: 'sans-serif' },
	{ family: 'Nunito Sans', category: 'sans-serif' },
	{ family: 'Work Sans', category: 'sans-serif' },
	{ family: 'DM Sans', category: 'sans-serif' },
	{ family: 'Outfit', category: 'sans-serif' },
	{ family: 'Manrope', category: 'sans-serif' },
	{ family: 'Plus Jakarta Sans', category: 'sans-serif' },
	{ family: 'Space Grotesk', category: 'sans-serif' },
	{ family: 'Sora', category: 'sans-serif' },
	{ family: 'Figtree', category: 'sans-serif' },
	{ family: 'Rubik', category: 'sans-serif' },
	{ family: 'Karla', category: 'sans-serif' },
	{ family: 'Cabin', category: 'sans-serif' },
	{ family: 'Source Sans 3', category: 'sans-serif' },
	{ family: 'Josefin Sans', category: 'sans-serif' },
	{ family: 'Ubuntu', category: 'sans-serif' },
	{ family: 'Quicksand', category: 'sans-serif' },
	{ family: 'Barlow', category: 'sans-serif' },
	{ family: 'Mulish', category: 'sans-serif' },
	{ family: 'Lexend', category: 'sans-serif' },
	{ family: 'Albert Sans', category: 'sans-serif' },
	{ family: 'Playfair Display', category: 'serif' },
	{ family: 'Merriweather', category: 'serif' },
	{ family: 'Lora', category: 'serif' },
	{ family: 'PT Serif', category: 'serif' },
	{ family: 'Bitter', category: 'serif' },
	{ family: 'Libre Baskerville', category: 'serif' },
	{ family: 'Crimson Text', category: 'serif' },
	{ family: 'DM Serif Display', category: 'serif' },
	{ family: 'Cormorant Garamond', category: 'serif' },
	{ family: 'Noto Serif', category: 'serif' },
	{ family: 'Source Serif 4', category: 'serif' },
	{ family: 'Vollkorn', category: 'serif' },
	{ family: 'Fira Code', category: 'monospace' },
	{ family: 'JetBrains Mono', category: 'monospace' },
	{ family: 'Space Mono', category: 'monospace' },
	{ family: 'IBM Plex Mono', category: 'monospace' },
	{ family: 'Bebas Neue', category: 'display' },
	{ family: 'Righteous', category: 'display' },
	{ family: 'Fredoka', category: 'display' },
	{ family: 'Abril Fatface', category: 'display' },
	{ family: 'Lobster', category: 'display' },
	{ family: 'Pacifico', category: 'handwriting' },
	{ family: 'Dancing Script', category: 'handwriting' },
	{ family: 'Caveat', category: 'handwriting' },
	{ family: 'Satisfy', category: 'handwriting' },
	{ family: 'Sacramento', category: 'handwriting' },
];

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
