import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assetTypes, getAssetType } from './index.js';
import { PHONE_FRAMES } from '../renderer/phone-frame.js';
import { getLayout } from './_screenshot-shared.js';

const frameIds = new Set(PHONE_FRAMES.map((f) => f.id ?? f));

test('asset type ids are unique', () => {
	const ids = assetTypes.map((a) => a.id);
	assert.equal(new Set(ids).size, ids.length);
});

test('getAssetType finds every registered type and nothing else', () => {
	for (const type of assetTypes) assert.equal(getAssetType(type.id), type);
	assert.equal(getAssetType('nope'), undefined);
});

test('every size declares the store rules that apply to it', () => {
	// A size with no storeKind silently skips validation, which is how a
	// rejectable asset used to reach the zip looking fine.
	for (const type of assetTypes) {
		for (const size of type.sizes) {
			assert.ok(
				['screenshot', 'feature-graphic', 'icon', 'none'].includes(size.storeKind),
				`${type.id}/${size.id} has storeKind ${JSON.stringify(size.storeKind)}`
			);
		}
	}
});

test('every size has positive dimensions and an id', () => {
	for (const type of assetTypes) {
		assert.ok(type.sizes.length > 0, `${type.id} has no sizes`);
		for (const size of type.sizes) {
			assert.ok(size.id, `${type.id} has a size with no id`);
			assert.ok(size.w > 0 && size.h > 0, `${type.id}/${size.id} is ${size.w}x${size.h}`);
		}
	}
});

test('each asset type has at least one layout, with unique ids', () => {
	for (const type of assetTypes) {
		const ids = type.layouts.map((l) => l.id);
		assert.ok(ids.length > 0, `${type.id} has no layouts`);
		assert.equal(new Set(ids).size, ids.length, `${type.id} repeats a layout id`);
	}
});

test('a default phone frame is always one of the allowed frames, and a real one', () => {
	for (const type of assetTypes) {
		if (!type.defaultPhoneFrame) continue;
		assert.ok(frameIds.has(type.defaultPhoneFrame), `${type.id} defaults to unknown frame`);
		if (type.allowedPhoneFrames) {
			assert.ok(
				type.allowedPhoneFrames.includes(type.defaultPhoneFrame),
				`${type.id} defaults to a frame it does not allow`
			);
		}
	}
});

test('every allowed phone frame exists', () => {
	for (const type of assetTypes) {
		for (const id of type.allowedPhoneFrames ?? []) {
			assert.ok(frameIds.has(id), `${type.id} allows unknown frame ${id}`);
		}
	}
});

test('screenshot layouts place the device at finite coordinates for every size', () => {
	const screenshotTypes = assetTypes.filter((t) => t.id.endsWith('-screenshot'));
	assert.ok(screenshotTypes.length === 4);

	for (const type of screenshotTypes) {
		for (const size of type.sizes) {
			for (const layout of type.layouts) {
				const { phone } = getLayout(layout.id, size.w, size.h);
				for (const key of ['x', 'y', 'w', 'h']) {
					assert.ok(Number.isFinite(phone[key]), `${type.id}/${size.id}/${layout.id}: ${key}`);
				}
				assert.ok(phone.w > 0 && phone.h > 0, `${type.id}/${layout.id} has no size`);
				// The frame keeps the device's aspect, so it should never be wider
				// than tall for a portrait canvas.
				assert.ok(phone.h > phone.w, `${type.id}/${size.id}/${layout.id} is not portrait`);
			}
		}
	}
});

test('an unknown layout id falls back to a centred device rather than throwing', () => {
	const { phone } = getLayout('does-not-exist', 1000, 2000);
	assert.equal(phone.x, 500);
	assert.equal(phone.angle, 0);
});
