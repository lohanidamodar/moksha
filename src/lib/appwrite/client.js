import { Client, Account, Databases, Storage } from 'appwrite';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

export const APPWRITE_ENDPOINT = env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = env.VITE_APPWRITE_PROJECT_ID || 'moksha';

export const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID || 'moksha';
export const PROJECTS_COLLECTION = env.VITE_APPWRITE_PROJECTS_COLLECTION || 'projects';
export const ASSETS_COLLECTION = env.VITE_APPWRITE_ASSETS_COLLECTION || 'assets';
export const DESIGNS_COLLECTION = env.VITE_APPWRITE_DESIGNS_COLLECTION || 'designs';

export const BUCKET_ID = env.VITE_APPWRITE_BUCKET_ID || 'moksha-assets';

let _client = null;
let _account = null;
let _databases = null;
let _storage = null;

function getClient() {
	if (_client) return _client;
	_client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
	return _client;
}

export function getAccount() {
	if (!_account) _account = new Account(getClient());
	return _account;
}

export function getDatabases() {
	if (!_databases) _databases = new Databases(getClient());
	return _databases;
}

export function getStorage() {
	if (!_storage) _storage = new Storage(getClient());
	return _storage;
}

/** Construct the URL for previewing/downloading an Appwrite Storage file. */
export function getFileViewURL(fileId) {
	return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}
