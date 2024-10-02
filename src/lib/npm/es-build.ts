import esbuild from 'esbuild-wasm';
import {readFile} from "./idb-fs.ts";

const loadScript = async (filePath) => {
	return readFile(filePath); // Your custom IndexedDB logic

};

// Create a custom plugin to load files from the virtual filesystem
const virtualFileSystemPlugin = {
	name: 'virtual-filesystem',
	setup(build) {
		// This handles file imports like 'import { map } from "lodash";'
		build.onResolve({filter: /.*/}, (args) => {
			// Handle lodash as a special case, if necessary
			if (args.path === 'lodash') {
				return {path: '/virtual/lodash.js', namespace: 'virtual'};
			}

			// Handle generic files in the virtual filesystem
			if (args.path === 'myModule.ts') {
				return {path: '/virtual/myModule.ts', namespace: 'virtual'};
			}

			// For npm modules or other virtual files, treat them similarly
			return {path: `/virtual/${args.path}`, namespace: 'virtual'};
		});

		// Load the actual file contents for virtual files
		build.onLoad({filter: /.*/, namespace: 'virtual'}, async (args) => {
			// Handle loading 'myModule.ts'
			if (args.path === '/virtual/myModule.ts') {
				const myModule = await loadScript('/demo/scripts/test.ts');  // Load TypeScript module from IndexedDB
				return {contents: myModule, loader: 'ts'};  // TypeScript loader
			}

			// Handle loading 'lodash.js' or any other generic npm modules
			if (args.path === '/virtual/lodash.js') {
				const lodash = await loadScript('/demo/node_modules/lodash/lodash.js');  // Load lodash from IndexedDB
				return {contents: lodash, loader: 'js'};  // JavaScript loader
			}

			// Add logic here to load other npm modules if needed
			// Example:
			// const moduleContent = await loadScript(args.path);
			// return { contents: moduleContent, loader: 'js' or 'ts' depending on the file };
		});
	}
};


export const initEsBuild = () => {
	document.getElementById('btn-es-build').addEventListener('click', async () => {
		const module = await runEsBuild();
		const res = module.mapNumbers([1, 2, 3, 4]); // Call your function
		// console.log(`${helloMessage}`);
		console.log(`Mapped numbers: ${res}`);
	});

}

export async function runEsBuild() {
	await init();

	console.log('Bundling...');

	// Run esbuild with the plugin and bundle everything
	const result = await esbuild.build({
		entryPoints: ['myModule.ts'],  // Entry point is the TypeScript file
		bundle: true,
		format: 'esm',
		plugins: [virtualFileSystemPlugin],
		write: false,
	});

	// Now create a Blob URL to load the bundled result dynamically
	const blob = new Blob([result.outputFiles[0].text], {type: 'application/javascript'});
	const url = URL.createObjectURL(blob);

	// Wait for the script to load, then execute
	console.log('Bundling complete! Executing...');
	return import(url);


}

async function init() {
	if (!esbuild) {
		throw new Error('esbuild not loaded');
	}
	await esbuild.initialize({
		wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@latest/esbuild.wasm',
	});
}