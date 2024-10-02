import {Graph, InternalEvent, Multiplicity} from "@maxgraph/core";

export const initValidation = (graph: Graph) => {
	// Suppress the default validation popup
	graph.validationAlert = function (message) {
		// Custom handling of the validation message (e.g., logging)
		console.log('Validation error:', message);
		// Optionally show the message in your custom UI or ignore it
	};

	graph.multiplicities.push(new Multiplicity(
		true,  // true = source vertex
		'',  // no style check
		'',  // no attribute check
		'',  // no value check
		1,     // minimum connections
		1,     // maximum connections
		[],  // we manually handle valid neighbors
		'Too many outgoing connections',
		'Managers can only connect to employees'
	));

	// Rule for incoming connections (employees cannot connect to managers)
	graph.multiplicities.push(new Multiplicity(
		false,  // false = target vertex
		'',   // no style check
		'',   // no attribute check
		'',   // no value check
		0,      // minimum connections
		-1,     // maximum connections (-1 for unlimited)
		[],   // manually handle valid neighbors
		'',
		'Employees cannot receive connections from managers'
	));

	graph.multiplicities[0].check = function (graph, edge, source, target) {
		if (source.value && source.value.type === 'input' && target.value && target.value.type !== 'output') {
			return null;  // Allow the connection
		} else {
			// console.log('Input cannot connect to output!')
			return 'Input cannot connect to output!';
		}
	};

	const listener = function (sender, evt) {
		graph.validateGraph();
	};

	graph.getDataModel().addListener(InternalEvent.CHANGE, listener);

}
