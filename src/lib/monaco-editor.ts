import * as monaco from 'monaco-editor';
import * as ts from 'typescript';
import {openDB} from 'idb';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import {customTypes} from "./scripts-util.ts";
import {getFilesWithExtension, readFile} from "./npm/idb-fs.ts";
import {resolveReferencesAndImports} from "./ts-compiler.ts";


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.MonacoEnvironment = {
	getWorker(_: string, label: string) {
		if (label === 'typescript' || label === 'javascript') return new TsWorker()
		if (label === 'json') return new JsonWorker()
		if (label === 'css') return new CssWorker()
		if (label === 'html') return new HtmlWorker()
		return new EditorWorker()
	}
}

export const createMonacoEditor = async (elementId) => {

	document.getElementById('btn-ts-emit').addEventListener('click', () => {
		triggerEmit(monaco, editor);
	});

	// monaco.languages.typescript.typescriptDefaults.addExtraLib(customTypes, 'file:///myLib.d.ts');
	monaco.languages.typescript.typescriptDefaults.addExtraLib(customTypes);

	await addTypesToMonaco(monaco);

	const testDts = `
  declare module 'test-lib' {
    export function testFunc(): void;
  }
`;

	// import {testFun} from 'test-lib';
	// monaco.languages.typescript.typescriptDefaults.addExtraLib(testDts, '/node_modules/@types/test-lib/index.d.ts');
	// monaco.languages.typescript.typescriptDefaults.addExtraLib(testDts, '/node_modules/@types/test-lib/index.d.ts');

	// monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
	// 	// module: monaco.languages.typescript.ModuleKind.ES2022,
	// 	// target: monaco.languages.typescript.ScriptTarget.ES2022,
	// 	// baseUrl: "/node_modules",
	// 	// paths: {
	// 	// 	"test-lib": ["/node_modules/@types/test-lib/index.d.ts"]
	// 	// }
	// });

	monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
	// setCompilerOptions('demo', monaco);
	monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
		noSemanticValidation: false,
		noSyntaxValidation: false
	});

	const code = ``;

	const editor = monaco.editor.create(document.getElementById(elementId), {
		value: code,
		language: 'typescript',
		theme: 'vs-dark',
		automaticLayout: true
	});

	overrideWorker(monaco);

	return editor;
}

function triggerEmit(monaco, editor) {
	// Get the model associated with the current editor content
	const model = editor.getModel();

	if (model.getLanguageId() === 'typescript' || model.getLanguageId() === 'javascript') {
		// Access the TypeScript worker
		monaco.languages.typescript.getTypeScriptWorker().then(workerFactory => {
			workerFactory(model.uri).then(worker => {
				// Manually trigger the getEmitOutput call
				worker.getEmitOutput(model.uri.toString()).then(output => {
					console.log('Emitted output:', output);
					if (output.outputFiles.length > 0) {
						console.log('JavaScript Output:', output.outputFiles[0].text);
					} else {
						console.log('No output generated for the current file.');
					}
				}).catch(err => {
					console.error('Error emitting output:', err);
				});
			});
		});
	}
}

function overrideWorker(monaco) {
	// Hook into the worker creation
	monaco.languages.typescript.getTypeScriptWorker().then(workerFactory => {
		workerFactory().then(worker => {
			const originalGetEmitOutput = worker.getEmitOutput.bind(worker);

			// Override getEmitOutput in the existing worker
			worker.getEmitOutput = async function (uri) {
				// Since uri is a string, use it as is
				const currentFilePath = uri;
				console.log('Overriding getEmitOutput for:', currentFilePath);

				// Get the Monaco model by the URI (this will give you the file content)
				// const model = monaco.editor.getModel(uri);
				// if (!model) {
				// 	console.error(`Model not found for URI: ${uri}`);
				// 	return originalGetEmitOutput(uri);
				// }
				//
				// // Extract the file content
				// const fileContent = model.getValue();
				// console.log('fileContent', fileContent);

				// Example custom logic: Lazy-load modules based on current file's imports
				// const modulesToLoad = findModulesInFile(fileContent);
				const modulesToLoad = await resolveReferencesAndImports(monaco, `/demo/node_modules/@types/lodash/index.d.ts`);
				console.log('modulesToLoad', modulesToLoad);

				for (const [key, value] of Object.entries(modulesToLoad)) {
					try {
						// const moduleContent = await resolveModule('demo', moduleName, currentFilePath);
						const simplifiedKey = key.replace('/demo/node_modules/', ''); // Remove the base path
						console.log(simplifiedKey);
						monaco.languages.typescript.typescriptDefaults.addExtraLib(value, key);

					} catch (error) {
						console.error(`Error loading module ${key}:`, error);
					}
				}

				monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
					target: monaco.languages.typescript.ScriptTarget.ES2020,
					allowNonTsExtensions: true,
					baseUrl: '/demo/node_modules/', // Base URL for module resolution
					paths: {
						"@types/*": ["@types/*"], // Map @types to the @types directory in the virtual filesystem
						"lodash": ["@types/lodash/index.d.ts"], // Specific mapping for lodash
					},
					moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs
				});

				// for (const moduleName of modulesToLoad) {
				// 	try {
				// 		const moduleContent = await resolveModule('demo', moduleName, currentFilePath);
				// 		monaco.languages.typescript.typescriptDefaults.addExtraLib(
				// 			moduleContent, `/node_modules/${moduleName}/index.d.ts`
				// 		);
				// 	} catch (error) {
				// 		console.error(`Error loading module ${moduleName}:`, error);
				// 	}
				// }

				// Call the original getEmitOutput with the uri string
				return originalGetEmitOutput(uri);
			};
		}).catch(err => {
			console.error("Error creating TypeScript worker:", err);
		});
	}).catch(err => {
		console.error("Error accessing TypeScript worker factory:", err);
	});
}

async function addTypesToMonaco(monaco) {
	const dtsFiles = await getFilesWithExtension('d.ts');

	for (const {filePath} of dtsFiles) {
		const fileContent = await readFile(filePath);
		// console.log('filePath', filePath);
		// console.log('fileContent', fileContent);
		monaco.languages.typescript.typescriptDefaults.addExtraLib(fileContent, 'file://' + filePath);
	}
}

// function setCompilerOptions(projectName: string, monaco) {
// 	// /demo/node_modules/@types/lodash
// 	monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
// 		module: monaco.languages.typescript.ModuleKind.ES2022,
// 		target: monaco.languages.typescript.ScriptTarget.ES2022,
// 		baseUrl: `/${projectName}/node_modules/@types`,  // Adjust to your IndexedDB path
// 		paths: {
// 			"lodash/*": [`/${projectName}/node_modules/@types/lodash/*`]
// 		}
// 	});
// }

function findModulesInFile(fileContent) {
	const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"];?/g;
	const modules = [];
	let match;

	while ((match = importRegex.exec(fileContent)) !== null) {
		modules.push(match[1]); // Add the module name (captured group)
	}

	return modules;
}

async function resolveModule(projectName, moduleName, currentFilePath, visitedModules = new Set()) {
	// Check if module has already been loaded to avoid cyclic dependencies
	if (visitedModules.has(moduleName)) {
		return;
	}

	visitedModules.add(moduleName);

	// Fetch the module's content (assuming this function exists)
	const moduleUri = `${projectName}/node_modules/${moduleName}/index.d.ts`;
	const moduleContent = await fetchModuleContent(moduleName);

	// Add the module content to Monaco's extra libraries
	if (moduleContent) {
		monaco.languages.typescript.typescriptDefaults.addExtraLib(moduleContent, moduleUri);
	} else {
		console.error(`Module ${moduleName} not found`);
		return;
	}

	// Find any further modules imported within this module
	const modulesToLoad = findModulesInFile(moduleContent);

	// Recursively resolve any nested imports
	for (const nestedModule of modulesToLoad) {
		try {
			await resolveModule(nestedModule, moduleUri, visitedModules);
		} catch (error) {
			console.error(`Error loading nested module ${nestedModule}:`, error);
		}
	}
}

// Simulated function to fetch the content of a module (could fetch from a virtual filesystem)
async function fetchModuleContent(moduleName) {

}



export function getExportedFunctions(code: string) {
	// Create a TypeScript SourceFile from the code
	const sourceFile = ts.createSourceFile('code.ts', code, ts.ScriptTarget.Latest, true);

	// Array to store the details of exported functions
	const exportedFunctions: { name: string, parameters: string[], returnType: string }[] = [];

	// Traverse the AST
	function visit(node: ts.Node) {
		// Handle function declarations
		if (ts.isFunctionDeclaration(node) && node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
			const functionName = node.name?.getText() || 'anonymous';
			const parameters = node.parameters.map(param => param.getText());
			const returnType = node.type ? node.type.getText() : 'void';

			exportedFunctions.push({
				name: functionName,
				parameters,
				returnType
			});
		}

		// Handle variable declarations with function expressions
		if (ts.isVariableDeclaration(node) && node.initializer) {
			if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
				const functionName = node.name.getText();
				const initializer = node.initializer as ts.FunctionExpression;
				const parameters = initializer.parameters.map(param => param.getText());
				const returnType = initializer.type ? initializer.type.getText() : 'void';

				// Check if the parent of this variable declaration is an exported variable declaration list
				if (node.parent && ts.isVariableDeclarationList(node.parent)) {
					const parent = node.parent;
					if (parent.parent && ts.isVariableStatement(parent.parent) && parent.parent.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
						exportedFunctions.push({
							name: functionName,
							parameters,
							returnType
						});
					}
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	return exportedFunctions;
}

