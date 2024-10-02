import {from} from 'rxjs';
import {exampleFlowJson, KpFlow} from "./flow-example.ts";
import {readScript} from "./scripts-util.ts";
import {loadFunctionFromModuleWithDeps} from "./ts-compiler2.ts";
import {loadModuleFromVirtualFS} from "./npm/import-module.ts";

// Vertex interface with a function that takes input from the previous result
export interface PipelineVertex {
	id: string;
	type: string;
	func: (input: any) => Promise<any>;
	result?: any;
}

// Generator function that triggers vertex execution step by step, passing result to the next step
function* pipelineGenerator(vertices: PipelineVertex[], initVal) {
	let previousResult = initVal; // Hold the result of the previous step
	for (const vertex of vertices) {
		console.log('vertex type', vertex.type);
		console.log(`Executing function in vertex ${vertex.id} with input: ${previousResult}`);
		const promise = vertex.func(previousResult); // Call the vertex function and yield the promise
		previousResult = yield promise; // Resume the generator once the promise resolves
		vertex.result = previousResult; // Store the result in the vertex
		console.log(`Result of vertex ${vertex.id}: ${previousResult}`);
	}
	return 'Pipeline execution completed';
}

// Pipeline class to manage vertex execution
class Pipeline {
	vertices: PipelineVertex[] = [];
	generator: Generator;
	currentPromise: any = null;

	constructor(vertices: PipelineVertex[]) {
		this.vertices = vertices;
	}

	run(initVal) {
		this.generator = pipelineGenerator(this.vertices, initVal);
		this.waitForNextStep(); // Trigger the first step
	}

	nextStep() {
		if (this.currentPromise) {
			// Wait for the current promise to resolve before moving to the next step
			this.currentPromise.then(result => {
				console.log('Passing result to next step:', result);
				this.waitForNextStep(result); // Pass the result of the current step to the next
			});
		}
	}

	// Wait for the next step in the generator
	waitForNextStep(input: any = null) {
		console.log('input', input);
		const {value: promise, done} = this.generator.next(input); // Pass input to the generator and get the next promise

		if (!done && promise instanceof Promise) {
			// Store the current promise, but do not automatically continue until the next button click
			this.currentPromise = promise;
		} else if (done) {
			console.log('Pipeline completed');
			this.currentPromise = null; // No more steps
		}
	}

}

// Example of a module to be imported dynamically
// const imports = {
// 	'./greetModule': 'data:text/javascript,' + encodeURIComponent(`
//         export function greet(name) {
//             return 'Hello, ' + name;
//         }
//     `)
// };

const applyType = (type: string, fn: Function, ...ars) => {
	switch(type) {
		case 'mapper':
			return
			break;
	}
}

export const mapFlowToPipeline = (flow: KpFlow, timeout: number): PipelineVertex[] => {
	return flow.vertices.map((v) => {
		const fn = async (input) => {
			return new Promise(async (resolve, reject) => {
				setTimeout(async () => {
					const jsModule = readScript(v.data.script);

					try {
						const imports = {};
						// const res = await createWorkerFromCode(jsModule, imports, v.data.method, [input]);
						// const fn = await loadFunctionFromModuleWithDeps(jsModule, {'helper': helperCode}, 'myFilter')
						const lodashCode = await loadModuleFromVirtualFS('demo', 'lodash');
						const dependencies = {
							'lodash': lodashCode, // Ensure lodash is treated as a dependency
						};
						const fn = await loadFunctionFromModuleWithDeps(jsModule, dependencies, v.data.method);
						console.log('input', input);
						console.log('fn', fn);
						const res = fn.call(null, input);
						console.log('res', res);
						resolve(res);

					} catch (e) {
						reject(e);
					}

				}, timeout);
			});
		}

		return {
			id: v.id,
			type: v.type,
			func: fn
		}

	});
}

export const createPipeline = (flow: KpFlow): Pipeline => {
	const vertices = mapFlowToPipeline(flow, 0);
	return new Pipeline(vertices);
}


let pipeline;
// Simulate button click to go to the next step
document.getElementById('btn-generator').addEventListener('click', () => {
	pipeline = createPipeline(exampleFlowJson);
	pipeline.run(5);
});

document.getElementById('btn-generator-next').addEventListener('click', () => {
	pipeline.nextStep(); // Move to the next step on each button click
});
