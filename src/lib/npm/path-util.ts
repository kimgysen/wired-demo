

export const buildNpmModulePath = (projectName: string, module: string) => {
	return `/${projectName}/node_modules/${module}`;
}

export const getFilePathFromTarFile = (file) => {
	return removeFirstSegment(file.name);
}

export function getFileNameAndExtension(filePath) {
	// Extract the base name of the file from the path
	const fileName = filePath.split('/').pop(); // Get the last part of the path (the actual filename)

	// Check for known special cases first (e.g., LICENSE, README)
	if (!fileName.includes('.')) {
		return {
			name: fileName,
			extension: null  // No extension
		};
	}

	// Special handling for `.d.ts`
	if (fileName.endsWith('.d.ts')) {
		return {
			name: fileName.slice(0, -5),  // Remove `.d.ts` from the end
			extension: 'd.ts'
		};
	}

	// General case: split by the last dot to separate name and extension
	const lastDotIndex = fileName.lastIndexOf('.');
	return {
		name: fileName.slice(0, lastDotIndex),  // Everything before the last dot is the name
		extension: fileName.slice(lastDotIndex + 1)  // Everything after the last dot is the extension
	};
}

function removeFirstSegment(path: string): string {
	const segments = path.split('/');
	segments.shift(); // Remove the first segment
	return segments.join('/');
}

