import { json } from '@sveltejs/kit';
import { renderAsset } from '$lib/renderer/server-canvas.js';
import { assetTypes } from '$lib/assets/index.js';
import { GRADIENTS, MESH, SOLIDS, PATTERNS } from '$lib/renderer/backgrounds.js';
import { ANCHOR_IDS } from '$lib/renderer/text-overlays.js';

/**
 * POST /api/render
 *
 * Renders a single asset and returns a PNG image.
 *
 * Accepts multipart/form-data with:
 * - config: JSON string with rendering configuration
 * - screenshot: image file (optional)
 * - logo: image file (optional)
 * - icon: image file (optional)
 *
 * Or application/json with:
 * - Same config object (no image support in JSON mode)
 */
export async function POST({ request }) {
	try {
		let config;
		const imageBuffers = {};

		const contentType = request.headers.get('content-type') || '';

		if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			const configStr = formData.get('config');
			if (!configStr) {
				return json({ error: 'Missing "config" field' }, { status: 400 });
			}
			config = JSON.parse(configStr);

			// Extract image files
			for (const key of ['screenshot', 'logo', 'icon']) {
				const file = formData.get(key);
				if (file && file instanceof File) {
					imageBuffers[key] = Buffer.from(await file.arrayBuffer());
				}
			}
		} else {
			config = await request.json();
		}

		// Validate
		if (!config.assetType) {
			return json({ error: 'Missing "assetType" in config' }, { status: 400 });
		}

		const pngBuffer = await renderAsset(config, imageBuffers);

		return new Response(pngBuffer, {
			headers: {
				'Content-Type': 'image/png',
				'Content-Disposition': `inline; filename="${config.assetType}-${config.layout || 'default'}.png"`
			}
		});
	} catch (err) {
		console.error('Render error:', err);
		return json({ error: err.message }, { status: 500 });
	}
}

/**
 * GET /api/render
 *
 * Returns the API schema and available options.
 */
export async function GET() {
	const schema = {
		description: 'Moksha Asset Generator API',
		endpoints: {
			'POST /api/render': 'Render a single asset (returns PNG)',
			'POST /api/render/batch': 'Render multiple assets (returns ZIP)',
			'GET /api/render': 'This schema'
		},
		config: {
			assetType: {
				required: true,
				options: assetTypes.map((a) => ({
					id: a.id,
					label: a.label,
					platform: a.platform,
					sizes: a.sizes,
					layouts: a.layouts.map((l) => l.id),
					inputs: a.inputs,
					defaultPhoneFrame: a.defaultPhoneFrame,
					allowedPhoneFrames: a.allowedPhoneFrames
				}))
			},
			sizeId: 'string — size variant id (defaults to first size)',
			layout: 'string — layout id (defaults to first layout)',
			background: {
				type: 'gradient | mesh | solid',
				id: 'string — preset id (e.g. "sunset-pink", "aurora", "navy")'
			},
			pattern: {
				note: 'Optional texture overlay drawn on top of the background. Pass null for no pattern.',
				id: 'string — pattern preset id (e.g. "dots", "topography", "bokeh")',
				color: 'string (optional) — override overlay color, defaults to white on dark / black on light',
				opacity: 'number (optional) — override opacity, defaults to 0.08 on dark / 0.06 on light'
			},
			texts: 'object — key/value pairs matching the asset type inputs (e.g. { title, subtitle })',
			fonts: {
				title: 'string — Google Font family name (default: Montserrat)',
				subtitle: 'string — Google Font family name (default: Open Sans)'
			},
			phoneFrame: {
				options: ['iphone-dynamic-island', 'iphone-notch', 'ipad', 'android-punch-hole', 'android-clean', 'frameless'],
				note: 'Each screenshot asset type has its own defaultPhoneFrame and allowedPhoneFrames — use those to pick frame.'
			},
			transforms: {
				phone: { x: 'number (-50 to 50)', y: 'number (-50 to 50)', scale: 'number (0.3 to 2)', rotation: 'number (-45 to 45)' },
				logo: { x: 'number (-50 to 50)', y: 'number (-50 to 50)', scale: 'number (0.3 to 2)', rotation: 'number (-45 to 45)' }
			},
			textOverlays: {
				note: 'Free-form text drawn on top of the asset. Each entry positions a single text block with its own font/size/color/alignment.',
				type: 'array of overlay objects',
				overlay: {
					text: 'string — the text to draw (supports \\n for line breaks)',
					anchor: `string (optional) — named position. One of: ${ANCHOR_IDS.join(', ')}. Use this for convenience presets like "top-left", "center", etc.`,
					offsetX: 'number (optional, used with anchor) — fraction of canvas width to nudge from the anchor (e.g. 0.05)',
					offsetY: 'number (optional, used with anchor) — fraction of canvas height to nudge from the anchor',
					x: 'number (0..1) — fraction of canvas width. Used when no anchor is provided.',
					y: 'number (0..1) — fraction of canvas height. Used when no anchor is provided.',
					fontSize: 'number (0..1) — font size as fraction of canvas width (default 0.06)',
					font: 'string — Google Font family (default: Inter)',
					weight: 'number (100..900) — font weight (default 700)',
					color: 'string (optional) — CSS color. Omit for auto-contrast against the background.',
					align: 'string — left | center | right (defaults from anchor or to "center")',
					rotation: 'number — degrees',
					shadow: 'boolean — soft drop shadow for legibility (default true)'
				}
			}
		},
		availableBackgrounds: {
			gradient: GRADIENTS.map((g) => ({ id: g.id, label: g.label, tone: g.tone })),
			mesh: MESH.map((m) => ({ id: m.id, label: m.label, tone: m.tone })),
			solid: SOLIDS.map((s) => ({ id: s.id, label: s.label, tone: s.tone }))
		},
		availablePatterns: PATTERNS.map((p) => ({ id: p.id, label: p.label })),
		assetTypeOverview: {
			'iphone-screenshot': 'iPhone screenshot mockup. Renders 4 sizes (5.5"–6.7"). Use iPhone frames.',
			'ipad-screenshot': 'iPad screenshot mockup. Renders 2 sizes (10.5", 12.9"). Use iPad frame.',
			'android-phone-screenshot': 'Android phone screenshot mockup. Use Android frames.',
			'android-tablet-screenshot': 'Android tablet screenshot mockup. Renders 7" and 10" sizes.',
			'feature-graphic': 'Play Store feature graphic (1024x500).',
			'promo-banner': 'Promotional banner with logo, headline, optional screenshot.',
			'app-icon-showcase': 'App icon presented on a styled background (1024x1024 or 512x512).',
			'social-card': 'Open Graph / Twitter / Instagram cards.'
		},
		examples: {
			iphone: {
				assetType: 'iphone-screenshot',
				layout: 'tilt-right',
				background: { type: 'gradient', id: 'sunset-pink' },
				texts: { title: 'My App', subtitle: 'Best app ever' },
				phoneFrame: 'iphone-dynamic-island'
			},
			androidPhone: {
				assetType: 'android-phone-screenshot',
				layout: 'hero-center',
				background: { type: 'gradient', id: 'midnight-purple' },
				pattern: { id: 'dots' },
				texts: { title: 'Amazing App', subtitle: 'Download now' },
				fonts: { title: 'Bebas Neue', subtitle: 'Lato' },
				phoneFrame: 'android-punch-hole',
				transforms: { phone: { x: 0, y: -5, scale: 1.1, rotation: 0 } }
			},
			meshWithPattern: {
				assetType: 'iphone-screenshot',
				layout: 'float-up',
				background: { type: 'mesh', id: 'aurora' },
				pattern: { id: 'soft-grid' },
				texts: { title: 'Hello World', subtitle: 'Mesh + pattern overlay' },
				phoneFrame: 'iphone-dynamic-island'
			},
			ipad: {
				assetType: 'ipad-screenshot',
				layout: 'float-up',
				background: { type: 'gradient', id: 'ocean' },
				texts: { title: 'Tablet App', subtitle: 'Optimized for iPad' },
				phoneFrame: 'ipad'
			},
			featureGraphic: {
				assetType: 'feature-graphic',
				layout: 'logo-center',
				background: { type: 'gradient', id: 'blue-violet' },
				texts: { tagline: 'Your Tagline', subtitle: 'A short description' }
			},
			withTextOverlays: {
				assetType: 'iphone-screenshot',
				layout: 'tilt-right',
				background: { type: 'gradient', id: 'sunset-pink' },
				phoneFrame: 'iphone-dynamic-island',
				textOverlays: [
					{ text: 'NEW', anchor: 'top-right', font: 'Bebas Neue', fontSize: 0.08, color: '#ffd60a', rotation: -8 },
					{ text: 'Tap to start', anchor: 'bottom-center', font: 'Inter', fontSize: 0.04 },
					{ text: 'Custom\nplacement', x: 0.18, y: 0.4, align: 'left', font: 'Montserrat', weight: 800, fontSize: 0.07 }
				]
			}
		},
		imageFields: {
			screenshot: 'Image file — used by iphone-screenshot, ipad-screenshot, android-phone-screenshot, android-tablet-screenshot, promo-banner, social-card',
			logo: 'Image file — used by feature-graphic, promo-banner, social-card',
			icon: 'Image file — used by app-icon-showcase'
		},
		curlExamples: [
			'curl -X POST http://localhost:3000/api/render -H "Content-Type: application/json" -d \'{"assetType":"iphone-screenshot","layout":"tilt-right","background":{"type":"gradient","id":"sunset-pink"},"texts":{"title":"Hello World"}}\' --output mockup.png',
			'curl -X POST http://localhost:3000/api/render -F \'config={"assetType":"android-phone-screenshot","layout":"hero-center","phoneFrame":"android-punch-hole","texts":{"title":"My App"}}\' -F screenshot=@screenshot.png --output mockup.png'
		]
	};

	return json(schema);
}
