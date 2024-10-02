import {openDB} from 'idb';

let store;

export interface IdbFile {
	filePath: string;
	content: string;
	extension: string;
}

let dbPromise;

// Initialize the database and create the object store and index if needed
async function initializeDB() {
	dbPromise = await openDB('virtual-fs', 1, {
		upgrade(db) {
			if (!db.objectStoreNames.contains('filesystem')) {
				const store = db.createObjectStore('filesystem', {
					keyPath: 'filePath',
				});
				store.createIndex('extension', 'extension');
				console.log('Object store and index created');
			}
		},
	});
	return dbPromise;
}

// Function to retrieve the database handle
async function getDB() {
	if (!dbPromise) {
		dbPromise = initializeDB();
	}
	return dbPromise;
}

export async function storeFilesBatch(files: IdbFile[]) {
	const batchSize = 100;
	const totalFiles = files.length;

	const db = await getDB();
	const tx = db.transaction('filesystem', 'readwrite');
	const store = tx.objectStore('filesystem');


	for (let i = 0; i < totalFiles; i += batchSize) {
		const batchFiles = files.slice(i, i + batchSize);
		const transaction = db.transaction('filesystem', 'readwrite');
		const store = transaction.objectStore('filesystem');

		for (const file of batchFiles) {
			const {filePath, content, extension} = file;

			await store.put({filePath, content, extension});
			// console.log(`File created: ${filePath}`);
		}
	}

	await tx.done;
	console.log('Batch insert completed');

}

async function removeDirectoriesRecursivelyBatch(directories) {
	const db = await getDB();
	const tx = db.transaction('filesystem', 'readwrite');
	const store = tx.objectStore('filesystem');

	for (const directoryPath of directories) {
		const range = IDBKeyRange.bound(directoryPath, `${directoryPath}/~`, false, true);
		const cursor = await store.openCursor(range);

		while (cursor) {
			const currentPath = cursor.key;
			console.log(`Deleting: ${currentPath}`);

			// Delete the current file or directory
			await store.delete(currentPath);

			await cursor.continue();
		}
	}

	await tx.done;
	console.log('Batch directory deletion complete');
}

export async function saveFile(filePath, content, extension) {
	const db = await getDB();
	await db.put('filesystem', {
		filePath,       // The path to the file, e.g., "/project/file.txt"
		extension,
		content,    // File content can be text or binary (as a Blob or ArrayBuffer)
	});
	// console.log(`Saved file at ${filePath}`);
}

async function storeFileAsBlob(filePath, blob, extension) {
	const db = await getDB();
	await db.put('filesystem', {filePath, content: blob, extension});
	// console.log(`Stored binary file at ${filePath}`);
}

async function retrieveFileAsBlob(filePath) {
	const db = await getDB();
	const file = await db.get('filesystem', filePath);
	if (file) {
		return file.content;  // This is a Blob or ArrayBuffer
	} else {
		console.error(`File not found: ${filePath}`);
		return null;
	}
}

export function arrayBufferToBlob (arrayBuffer: ArrayBuffer) {
	return new Blob([arrayBuffer], {type: 'application/octet-stream'});
}

// Convert Blob to text
export async function blobToText(blob) {
	return await blob.text();
}

// Convert text to Blob
export function textToBlob(text) {
	return new Blob([text], {type: 'application/octet-stream'});
}

export async function readFile(filePath): Promise<string> {
	const db = await getDB();
	console.log('readFile', filePath);
	const file = await db.get('filesystem', filePath);
	if (file) {
		return blobToText(file.content);

	} else {
		throw new Error('File not found or not a file');
	}
}

export async function listDirectory(path) {
	const db = await getDB();
	const tx = db.transaction('filesystem');
	const store = tx.objectStore('filesystem');
	const files = [];
	let cursor = await store.openCursor();

	while (cursor) {
		if (cursor.value.filePath.startsWith(path) && cursor.value.filePath !== path) {
			files.push(cursor.value);
		}
		cursor = await cursor.continue();
	}

	console.log(`Contents of ${path}:`, files);
	return files;
}

export async function getFilesWithExtension(extension) {
	const db = await getDB();

	// Start a transaction to access the store and index
	const transaction = db.transaction('filesystem', 'readonly');
	const store = transaction.objectStore('filesystem');
	const index = store.index('extension');

	// Use the index to get all files with the specified extension
	return index.getAll(extension);

}

// const decoder = new TextDecoder('utf-8');
// const text = decoder.decode(tarEntry.buffer);
