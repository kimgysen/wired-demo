import pako from 'pako';
import untar from 'js-untar';

interface FileBuffer {
	byteLength: number;
}

interface TarEntry {
	name: string;
	buffer: FileBuffer;
	type: 0 | 5;

	readAsString: any;
}

export const isTarDir = (file: TarEntry) => {
	return file.type === 5 || file.buffer.byteLength == 0;
}

export const isTarFile = (file: TarEntry) => {
	return file.buffer.byteLength > 0 && file.type == 0;
}

export const extractTarball = async (tarball: ArrayBuffer) => {
	const decompressed = pako.inflate(tarball); // Decompress gzip using pako
	const arrayBuffer = decompressed.buffer; // Get ArrayBuffer from the Uint8Array pako returns

	return untar(arrayBuffer); // js-untar returns a list of files (See https://github.com/InvokIT/js-untar#file-object for details)

};
