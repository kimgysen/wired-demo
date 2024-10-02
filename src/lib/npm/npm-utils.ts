import {arrayBufferToBlob, listDirectory, saveFile, storeFilesBatch} from "./idb-fs.ts";
import {extractTarball, isTarFile} from "./tar-util.ts";
import {
	buildNpmModulePath,
	getFileNameAndExtension,
	getFilePathFromTarFile
} from "./path-util.ts";


export const initNpmInstallListener = () => {
	document.getElementById('btn-npm-install').addEventListener('click', async (e) => {

		// const latestVersion = await getNpmModuleLatestVersion('@types/lodash');
		// const npmModule = {module: '@types/lodash', version: latestVersion};
		// console.log('npmModule install', npmModule);
		const latestVersion = await getNpmModuleLatestVersion('lodash');
		const npmModule = {module: 'lodash', version: latestVersion};

		await runNpmInstall(npmModule);

		// await writeFile('/project/node_modules/lodash/test.js', 'bla');
		// Refresh monaco editor types

	});

	document.getElementById('btn-npm-list').addEventListener('click', async (e) => {
		// await listFiles();
		console.log('do something');
		await listDirectory('/demo/node_modules');
	});

	document.getElementById('btn-npm-types').addEventListener('click', async (e) => {
		// Find npm module types

		// Install if absent

	});

}

const getNpmModuleLatestVersion = async (module: string) => {
	const registryUrl = `https://registry.npmjs.org/${module}`;

// Fetch the package metadata
	const metadataResponse = await fetch(registryUrl);
	const metadata = await metadataResponse.json();
	console.log('metadata', metadata);

// Get the latest version
	return metadata['dist-tags'].latest;

}

const runNpmInstall = async (dep) => {
	const tarball = await fetchNpmModuleAsTarball(dep);
	const tarEntries = await extractTarball(tarball);
	console.log('extractedFiles', tarEntries);

	const projectName = 'demo';
	const module = dep.module;

	const files = [];
	const npmModulePath = buildNpmModulePath(projectName, module);

	for (const tarEntry of tarEntries) {
		if (isTarFile(tarEntry)) {
			const filePath = npmModulePath + '/' + getFilePathFromTarFile(tarEntry);
			const file = getFileNameAndExtension(filePath);

			if (file.extension && file.extension !== ''){
				const idbFile = {
					filePath,
					content: await arrayBufferToBlob(tarEntry.buffer as ArrayBuffer),
					extension: file.extension
				}

				files.push(idbFile);
			}
		}

	}

	console.log('files', files);
	await storeFilesBatch(files);

	// await writePackageJson(dep);
}

const getModuleName = (moduleName: string) => {
	if (isTsTypesModule(moduleName)) {
		return moduleName.split("/")[1];
	}
	return moduleName;
}

const isTsTypesModule = (moduleName: string) => {
	const splitted = moduleName.split("/");

	return splitted
		&& splitted.length > 0
		&& splitted[0] === '@types';
}

const fetchNpmModuleAsTarball = async (dep) => {
	const {module, version} = dep;

	const tarBallName = getModuleName(module);

	const url = `https://registry.npmjs.org/${module}/-/${tarBallName}-${version}.tgz`;

	const response = await fetch(url);

	return response.arrayBuffer(); // Get the tarball as binary data

}

// const writePackageJson = (npmModulePath: string) => {
// 	try {
//
// 		await saveFile(npmModulePath + '/package.json', 'json')
// 		// fs.writeFileSync(PATH_PACKAGE_JSON, `{"dependencies": ${JSON.stringify(dep)}`);
// 		// console.log('File written to the virtual filesystem!');
//
// 	} catch (e) {
// 		throw e;
//
// 	}
// }



