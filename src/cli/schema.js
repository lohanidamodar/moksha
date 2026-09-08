/**
 * `moksha schema` — every option a project file may legally use, as JSON.
 *
 * The same information the studio has, without needing it running: this is
 * what lets a coding agent or a CI job discover the options with one command.
 */
import { assetSchema } from '../core/node/project-file.js';
import { GRADIENTS, MESH, SOLIDS, PATTERNS } from '../core/renderer/backgrounds.js';
import { PHONE_FRAMES } from '../core/renderer/phone-frame.js';
import { ANCHOR_IDS } from '../core/renderer/text-overlays.js';
import { GOOGLE_FONTS } from '../core/fonts.js';
import { PROJECT_VERSION, emptyProject } from '../core/project.js';

export function schema() {
	console.log(
		JSON.stringify(
			{
				projectVersion: PROJECT_VERSION,
				assetTypes: assetSchema(),
				backgrounds: {
					gradient: GRADIENTS.map((g) => g.id),
					mesh: MESH.map((m) => m.id),
					solid: [...SOLIDS.map((s) => s.id), 'custom']
				},
				patterns: PATTERNS.map((p) => p.id),
				phoneFrames: PHONE_FRAMES.map((f) => f.id ?? f),
				textAnchors: ANCHOR_IDS,
				fonts: GOOGLE_FONTS.map((f) => f.family),
				example: exampleProject()
			},
			null,
			2
		)
	);
	return 0;
}

/** A project that renders, so the shape is shown rather than described. */
function exampleProject() {
	return {
		...emptyProject('Example App'),
		locales: ['en', 'ne'],
		design: {
			background: { type: 'mesh', id: 'aurora' },
			pattern: { id: 'dots' },
			font: 'Montserrat',
			frames: { 'android-phone-screenshot': 'pixel-black' }
		},
		assets: [
			{
				id: 'home',
				assetType: 'iphone-screenshot',
				layout: 'tilt-right',
				images: { screenshot: 'captures/ios/home.png' },
				text: [
					{
						text: { en: 'Everything in one place', ne: 'सबै एकै ठाउँमा' },
						anchor: 'top-left',
						fontSize: 0.07,
						weight: 800
					}
				]
			},
			{
				id: 'feature',
				assetType: 'feature-graphic',
				layout: 'logo-center',
				images: { logo: 'captures/logo.png' },
				pattern: null,
				text: [{ text: { en: 'Example App', ne: 'उदाहरण एप' }, anchor: 'bottom-center', fontSize: 0.1 }]
			}
		]
	};
}
