import {KpFlow} from "./flow-example.ts";

import yaml from 'js-yaml';

const model = {
	name: 'test',
	flow: []
};

const flowToJson = (inputFlow: KpFlow) => {
	// Validate first
	const flow = inputFlow.vertices.map(v => v.data);

	return {...model, flow};

}

export const exportToYaml = (flow: KpFlow) => {
	return flowToJson(flow);
}
