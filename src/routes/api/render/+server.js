import { json } from '@sveltejs/kit';
import { renderAsset } from '$lib/renderer/server-canvas.js';
import { assetTypes } from '$lib/assets/index.js';

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
					sizes: a.sizes,
					layouts: a.layouts.map((l) => l.id),
					inputs: a.inputs
				}))
			},
			sizeId: 'string — size variant id (defaults to first size)',
			layout: 'string — layout id (defaults to first layout)',
			background: {
				type: 'gradient | solid | pattern',
				id: 'string — preset id (e.g. "sunset-pink", "navy", "dots")'
			},
			texts: 'object — key/value pairs matching the asset type inputs (e.g. { title, subtitle })',
			fonts: {
				title: 'string — Google Font family name (default: Montserrat)',
				subtitle: 'string — Google Font family name (default: Open Sans)'
			},
			phoneFrame: {
				options: ['iphone-dynamic-island', 'iphone-notch', 'ipad', 'android-punch-hole', 'android-clean', 'frameless'],
				default: 'iphone-dynamic-island'
			},
			transforms: {
				phone: { x: 'number (-50 to 50)', y: 'number (-50 to 50)', scale: 'number (0.3 to 2)', rotation: 'number (-45 to 45)' },
				logo: { x: 'number (-50 to 50)', y: 'number (-50 to 50)', scale: 'number (0.3 to 2)', rotation: 'number (-45 to 45)' }
			}
		},
		examples: {
			simple: {
				assetType: 'screenshot-mockup',
				layout: 'tilt-right',
				background: { type: 'gradient', id: 'sunset-pink' },
				texts: { title: 'My App', subtitle: 'Best app ever' }
			},
			withOptions: {
				assetType: 'screenshot-mockup',
				sizeId: 'android-phone',
				layout: 'hero-center',
				background: { type: 'pattern', id: 'dots' },
				texts: { title: 'Amazing App', subtitle: 'Download now' },
				fonts: { title: 'Bebas Neue', subtitle: 'Lato' },
				phoneFrame: 'android-punch-hole',
				transforms: { phone: { x: 0, y: -5, scale: 1.1, rotation: 0 } }
			},
			featureGraphic: {
				assetType: 'feature-graphic',
				layout: 'logo-center',
				background: { type: 'gradient', id: 'blue-violet' },
				texts: { tagline: 'Your Tagline', subtitle: 'A short description' }
			}
		},
		imageFields: {
			screenshot: 'Image file — used by screenshot-mockup, promo-banner, social-card',
			logo: 'Image file — used by feature-graphic, promo-banner, social-card',
			icon: 'Image file — used by app-icon-showcase'
		},
		curlExamples: [
			'curl -X POST http://localhost:3000/api/render -H "Content-Type: application/json" -d \'{"assetType":"screenshot-mockup","layout":"tilt-right","background":{"type":"gradient","id":"sunset-pink"},"texts":{"title":"Hello World"}}\' --output mockup.png',
			'curl -X POST http://localhost:3000/api/render -F \'config={"assetType":"screenshot-mockup","layout":"hero-center","texts":{"title":"My App"}}\' -F screenshot=@screenshot.png --output mockup.png'
		]
	};

	return json(schema);
}
