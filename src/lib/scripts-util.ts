import {arrayBufferToBlob, storeFilesBatch, textToBlob} from "./npm/idb-fs.ts";

export const customTypes = `
declare module 'myTypes' {
  export interface Person {
    name: string;
    age: number;
  }
	
  export interface Order {
    orderId: string;
    product: Product;
  }
	
	export interface Product {
		type: string;
		name: string
	}
}
`;

const testScript = `
import { map } from 'lodash';

export function mapNumbers(numbers: number[]): number[]
{
	return map(numbers, n => n * 2);
}
`;

const inputScript = `
export function input(personId: string): string
{
	return personId;
}`;

const apiClientScript = `
import { Order } from 'myTypes';


export function getOrdersFromApi(personId: string): Order[]
{
	return [
		{orderId: '1', product: {type: 'book', name: 'Marie-Antoinette'}},
		{orderId: '2', product: {type: 'book', name: 'Steppenwolf'}},
		{orderId: '3', product: {type: 'book', name: 'Suske & Wiske'}},
		{orderId: '4', product: {type: 'dummy', name: 'some dummy'}}
	];
}`;

const mapperScript = `
import { Product, Order } from 'myTypes';
import { map } from 'lodash';

export function mapOrdersToProducts(orders: Order[]): Product[]
{
	return map(orders, o => o.product);
}`;

const filterScript = `
import { Product } from 'myTypes';

export function filterBooks(products: Product[]): Product[]
{
	return products.filter(p => p.type === 'book');
}`;

const outputScript = `
import { Product } from 'myTypes';

export function output(products: Product[]): Product[]
{
	return products;
}`;


// Create a virtual filesystem
const fs = {
	'/demo/scripts/test.ts': testScript,
	'/demo/scripts/input.ts': inputScript,
	'/demo/scripts/apiClient.ts': apiClientScript,
	'/demo/scripts/mapper.ts': mapperScript,
	'/demo/scripts/filter.ts': filterScript,
	'/demo/scripts/output.ts': outputScript,
};

export const saveDemoScripts = async () => {
	const files = [];
	for (const [filePath, script] of Object.entries(fs)) {
		const idbFile = {
			filePath,
			content: await textToBlob(script),
			extension: 'ts'
		}
		files.push(idbFile);
	}

	await storeFilesBatch(files);
}

// Reading from the virtual filesystem
// const content = vol.readFileSync('/virtual/file.txt', 'utf-8');
// console.log('Read file content:', content);  // Outputs: Hello from the browser virtual world!

export const readScript = (path) => {
	return fs[path];
}


// // Function to create a zip file in the browser
// const zipVirtualFileSystem = async () => {
// 	const zip = new JSZip();
//
// 	// Add files to the zip from the virtual filesystem
// 	const fileTree = vol.toJSON(); // Get the in-memory file structure
// 	for (const filePath in fileTree) {
// 		const fileContent = fileTree[filePath];
// 		zip.file(filePath, fileContent);
// 	}
//
// 	// Generate the zip file and create a Blob
// 	const blob = await zip.generateAsync({type: 'blob'});
//
// 	// Trigger download
// 	const link = document.createElement('a');
// 	link.href = URL.createObjectURL(blob);
// 	link.download = 'output.zip';
// 	link.click();
//
// 	console.log('Zip file has been created and downloaded.');
// };
//
// // Call the function to zip the virtual filesystem
// // zipVirtualFileSystem();
