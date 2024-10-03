import esbuild from 'esbuild-wasm';
import {readFile} from "./idb-fs.ts";

(async() => {
	await init();

})();

async function init() {
	if (!esbuild) {
		throw new Error('esbuild not loaded');
	}
	await esbuild.initialize({
		wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@latest/esbuild.wasm',
	});
}

const loadScript = async (filePath) => {
	return readFile(filePath); // Your custom IndexedDB logic

};

// Create a custom plugin to load files from the virtual filesystem
export const buildVirtualFileSystemPlugin = (dependencies) => {
	return {
		name: 'virtual-filesystem',
		setup(build) {
			// Dynamically resolve dependencies based on the provided dependency list
			build.onResolve({filter: /.*/}, (args) => {
				const dep = dependencies[args.path];

				// Check if the requested path matches one of the dependencies
				if (dep) {
					// Dynamically extract the file extension (e.g., .ts, .js, etc.)
					const extMatch = dep.match(/\.(\w+)$/);
					const ext = extMatch ? extMatch[1] : null;

					// Ensure the file has a valid extension
					if (ext) {
						return {path: `/virtual/${args.path}`, namespace: 'virtual', pluginData: {ext}};
					}
				}

				// Return null for non-virtual files so that esBuild can handle them normally
				return null;
			});

			// Dynamically load the file contents for virtual files
			build.onLoad({filter: /.*/, namespace: 'virtual'}, async (args) => {
				console.log('onLoad', args);
				// Extract the file extension from the pluginData set in onResolve
				const ext = args.pluginData?.ext || 'js';  // Default to 'js' if none found

				// Get the requested module's name from the path
				const moduleName = args.path.replace('/virtual/', '');

				// Load the module content from the virtual filesystem (e.g., IndexedDB)
				if (dependencies[moduleName]) {
					console.log('dependency', dependencies[moduleName]);
					const moduleContent = await loadScript(dependencies[moduleName]);

					// Return the contents with the appropriate loader based on the extension
					return {contents: moduleContent, loader: ext};
				}

				// If the file wasn't found, return an empty result (though this shouldn't happen)
				return {contents: ''};
			});
		}
	}
}

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


export const initEsBuild = (script: string, plugin = virtualFileSystemPlugin) => {
	document.getElementById('btn-es-build').addEventListener('click', async () => {
		const module = await runEsBuild(script, plugin);

		const res = module['mapNumbers']([1, 2, 3, 4]); // Call your function
		// console.log(`${helloMessage}`);
		console.log(`Mapped numbers: ${res}`);
	});

}

export async function runEsBuild(script: string, plugin) {
	console.log('Bundling...');
	// Run esbuild with the plugin and bundle everything
	const result = await esbuild.build({
		entryPoints: [script],  // Entry point is the TypeScript file
		bundle: true,
		format: 'esm',
		plugins: [plugin],
		write: false,
	});

	// Now create a Blob URL to load the bundled result dynamically
	const blob = new Blob([result.outputFiles[0].text], {type: 'application/javascript'});
	const url = URL.createObjectURL(blob);

	// Wait for the script to load, then execute
	console.log('Bundling complete! Executing...');
	return import(url);


}
