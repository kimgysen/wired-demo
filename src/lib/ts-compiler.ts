import ts from 'typescript';
import * as fs from './npm/idb-fs.ts';


const virtualFs: Record<string, string> = {};

async function loadFilesAsync(filePaths: string[]): Promise<Record<string, string>> {

	for (const filePath of filePaths) {
		virtualFs[filePath] = await fs.readFile(filePath);
	}

	return virtualFs;
}

function resolveModulePath(moduleName: string, currentFilePath: string): string {
	// Assuming your modules are located in a certain directory
	const baseDir = '/demo/src'; // Base directory for your project

	// Handle relative imports or reference paths (e.g., './module', '../module')
	if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
		// Create an absolute path from the current file's directory
		const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
		const resolvedPath = new URL(moduleName, `file://${currentDir}/`).pathname; // Resolve to an absolute path
		return resolvedPath; // Return the resolved file path
	}

	// Handle absolute imports or references (e.g., 'module')
	const resolvedPath = `${baseDir}/${moduleName}.ts`; // Assumes that the modules have a .ts extension

	// Normalize the path (remove `..` and `.` parts)
	return resolvedPath.replace(/\/\.\//g, '/').replace(/\/[^/]+\/\.\.\//g, '/');
}

async function loadFilesAndReferences(filePath: string): Promise<void> {
	// Check if the file is already loaded in virtualFs
	if (virtualFs[filePath]) {
		return; // File already loaded, skip it
	}

	// Load the current file into virtualFs
	virtualFs[filePath] = await fs.readFile(filePath);

	// Create a source file to check for references
	const sourceFile = ts.createSourceFile(
		filePath,
		virtualFs[filePath],
		ts.ScriptTarget.ES2022
	);

	// Load all referenced files recursively
	for (const reference of sourceFile.referencedFiles) {
		const referenceFilePath = resolveModulePath(reference.fileName, filePath);
		await loadFilesAndReferences(referenceFilePath); // Recursively load references
	}

	// Handle `/// <reference lib="..." />` directives manually
	for (const libReference of sourceFile.libReferenceDirectives) {
		const libFileName = `lib.${libReference.fileName}.d.ts`;
		const libFilePath = `/demo/node_modules/typescript/lib/${libFileName}`;

		if (!virtualFs[libFilePath]) {
			console.log(`Loading lib reference: ${libFilePath}`);
			await loadFilesAndReferences(libFilePath); // Load the lib file recursively
		}
	}

	// You can also handle imports in a similar fashion if needed:
	ts.forEachChild(sourceFile, async (node) => {
		if (ts.isImportDeclaration(node)) {
			const moduleSpecifier = node.moduleSpecifier as ts.StringLiteral;
			const importPath = resolveModulePath(moduleSpecifier.text, filePath);
			await loadFilesAndReferences(importPath); // Recursively load imports
		}
	});
}

export async function resolveReferencesAndImports(monaco, entryFilePath) {
	// Create a virtual file system host
	// const virtualFs = await loadFilesAsync([tsEntryFilePath, entryFilePath], fs);
	console.log('virtualFs', virtualFs);
// Preload the entry file and all of its dependencies
	const tsEntryFilePath = "/demo/node_modules/typescript/lib/lib.es2022.d.ts";
	await loadFilesAndReferences(tsEntryFilePath);
	console.log('virtualFs', virtualFs);
	await loadFilesAndReferences(entryFilePath);
	console.log('virtualFs', virtualFs);

	// const defaultCompilerOptions = monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
	// Merge any custom options, ensuring necessary fields are provided
	const compilerHost: ts.CompilerHost = {
		writeFile(fileName: string, text: string, writeByteOrderMark: boolean, onError: ((message: string) => void) | undefined, sourceFiles: readonly ts.SourceFile[] | undefined, data: ts.WriteFileCallbackData | undefined): void {
			virtualFs[fileName] = text; // Store the emitted file in virtual filesystem
			console.log(`File written: ${fileName}`);
		},
		fileExists(fileName: string): boolean {
			return fileName in virtualFs;
			},
		getCanonicalFileName(fileName: string): string {
			return fileName.toLowerCase();  // Normalize file name
		},
		getCurrentDirectory(): string {
			return "/";  // Root directory or your base path
		},
		getDefaultLibFileName(options: ts.CompilerOptions): string {
			return "/demo/node_modules/typescript/lib/lib.es2022.d.ts";  // Use the appropriate lib for your target
		},
		getNewLine(): string {
			return "\n";  // Default new line character
		},
		getSourceFile(fileName: string, languageVersionOrOptions: ts.ScriptTarget | ts.CreateSourceFileOptions, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): ts.SourceFile | undefined {
			const fileContent = virtualFs[fileName];
			if (fileContent) {
				return ts.createSourceFile(fileName, fileContent, languageVersionOrOptions as ts.ScriptTarget);
			}
			return undefined;  // File not found
		},
		readFile(fileName: string): string | undefined {
			return virtualFs[fileName] || undefined;
		},
		useCaseSensitiveFileNames(): boolean {
			return false;  // Depending on your environment, this could be true or false
		}

	};

	// const compilerOptions = {
	// 	...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
	// 	lib: ["/demo/node_modules/typescript/lib/lib.d.ts"],  // Add the required libraries
	// };


	// Create the TypeScript program
	const program = ts.createProgram([tsEntryFilePath, entryFilePath], {
		module: ts.ModuleKind.ES2022,
		target: ts.ScriptTarget.ES2022,
		lib: ["/demo/node_modules/typescript/lib/lib.es2022.d.ts"]
	}, compilerHost);

// Log all source files being loaded by the program
// 	const sourceFiles = program.getSourceFiles();
// 	sourceFiles.forEach((file) => {
// 		console.log(`Loaded file: ${file.fileName}`);
// 	});

// Check for diagnostics
	const diagnostics = ts.getPreEmitDiagnostics(program);
	if (diagnostics.length > 0) {
		diagnostics.forEach((diagnostic) => {
			const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
			if (diagnostic.file) {
				const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
				console.error(`Error at ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
			} else {
				console.error(`Error: ${message}`);
			}
		});
	} else {
		console.log("No diagnostics found.");
	}

	return virtualFs;
}