import ts from 'typescript';
import {removeComments} from "./npm/import-module.ts";

// Function to compile TypeScript code to JavaScript
export function compileTypeScript(tsCode) {
	const result = ts.transpileModule(tsCode, {
		compilerOptions: {module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022}
	});

	return result.outputText;
}

// Function to load an exported function from the module with support for dependencies
export async function loadFunctionFromModuleWithDeps(mainTsCode, dependencies = {}, mainFunction = 'default') {
	return new Promise(async (resolve, reject) => {
		// Step 1: Compile and create Blob URLs for each dependency module
		const dependencyUrls = {};
		for (const [depName, depCode] of Object.entries(dependencies)) {
			const depJavaScript = compileTypeScript(depCode);
			// const convertedJS = await transpileToEsModule(depJavaScript);
			// const convertedJS = transformUMDtoESModule(depJavaScript);
			const convertedJS = depJavaScript;
			console.log('convertedJS', removeComments(convertedJS));
			const depBlob = new Blob([convertedJS], {type: 'application/javascript'});
			dependencyUrls[depName] = URL.createObjectURL(depBlob);
		}

		// Replace import statements in the main module with Blob URLs of dependencies
		for (const [depName, depUrl] of Object.entries(dependencyUrls)) {
			// const importPattern = new RegExp(`import\\s+.+\\s+from\\s+['"]${depName}['"]`, 'g');
			//
			const importPatternDefault = new RegExp(`import\\s+([^{}]+)\\s+from\\s+['"]${depName}['"]`, 'g');
			const importPatternNamed = new RegExp(`import\\s+{([^}]+)}\\s+from\\s+['"]${depName}['"]`, 'g');

			// Replace default imports (e.g., import _ from 'lodash')
			mainTsCode = mainTsCode.replace(importPatternDefault, `import $1 from '${depUrl}'`);

			// Replace named imports (e.g., import { map, filter } from 'lodash')
			mainTsCode = mainTsCode.replace(importPatternNamed, `import { $1 } from '${depUrl}'`);

		}

		// Step 2: Compile main module and replace imports with Blob URLs
		let mainJavaScript = compileTypeScript(mainTsCode);

		// Step 3: Create Blob URL for the main module
		const mainBlob = new Blob([mainJavaScript], {type: 'application/javascript'});
		const mainUrl = URL.createObjectURL(mainBlob);

		// Step 4: Dynamically import the main module and extract the function
		import(mainUrl).then(module => {
			const func = module[mainFunction];

			if (typeof func === 'function') {
				resolve(func);
			} else {
				reject(new Error('No function exported with the given name'));
			}
		}).catch(reject);
	});
}