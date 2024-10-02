// Function to find the main entry file from the package.json
import {listDirectory, readFile} from "./idb-fs.ts";
import {compileTypeScript} from "../ts-compiler2.ts";




export function removeComments(code) {
	return code
		.replace(/\/\/.*$/gm, '')        // Remove single-line comments
		.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
}

// Helper to load a module's code from the virtual filesystem
export async function loadModuleFromVirtualFS(projectName: string, moduleName: string) {
	const modulePath = `/${projectName}/node_modules/${moduleName}`;
	const packageJsonContent = await findPackageJsonFile(modulePath);

	const mainFilePath = await findMainEntryFromPackageJson(packageJsonContent, modulePath);

	return readFile(mainFilePath); // Implement this based on your virtual FS logic
}

// Helper to create a Blob from a JavaScript string
function createBlobFromCode(code) {
	return new Blob([code], {type: 'application/javascript'});
}

async function findPackageJsonFile (modulePath: string){
	return readFile(`${modulePath}/package.json`);
}

async function findMainEntryFromPackageJson(packageJsonContent: string, modulePath: string) {
	const packageJson = JSON.parse(packageJsonContent);

	// 1. Check if "main" field exists
	if (packageJson.main) {
		return resolvePath(modulePath, packageJson.main);
	}

	// 2. Check if "exports" field exists
	if (packageJson.exports) {
		// Handle both string and object cases for exports
		if (typeof packageJson.exports === 'string') {
			return resolvePath(modulePath, packageJson.exports);
		} else if (typeof packageJson.exports === 'object') {
			// Check for "import" or "require" paths for browser-friendly or default export
			const exportPath = packageJson.exports['.']?.import || packageJson.exports['.']?.require;
			if (exportPath) {
				return resolvePath(modulePath, exportPath);
			}
		}
	}

	// 3. Fallback to checking if there is a dist folder
	const distFolderPath = `${modulePath}/dist`;
	const distFile = await findDistFile(distFolderPath);
	if (distFile) {
		return distFile;
	}

	// 4. If no dist file or main entry is found, default to index.js in root
	return resolvePath(modulePath, 'index.js');
}

// Helper to resolve the correct file path based on the module's base path
function resolvePath(modulePath, relativePath) {
	return `${modulePath}/${relativePath}`.replace(/\/\//g, '/');
}

// Helper to find a JS or minified file in the dist folder
async function findDistFile(distFolderPath) {
	// Use your virtual filesystem to check for files in the dist folder
	const filesInDist = await listDirectory(distFolderPath); // You need to implement this based on your virtual FS

	// Search for minified or bundled JS files
	const distFile = filesInDist.find(file =>
		file.endsWith('.min.js') || file.endsWith('.js')
	);

	if (distFile) {
		return `${distFolderPath}/${distFile}`;
	}
	return null;
}
