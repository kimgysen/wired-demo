import {Cell, Graph} from "@maxgraph/core";
import {getEdgePath} from "./flow-mapper.ts";
import {animateBall} from "../animation/animate-ball.ts";
import {createPipeline} from "./state-machine.ts";
import {exampleFlowJson} from "./flow-example.ts";


let gen;
let pipeline;

export const initEdgeAnimation = (graph: Graph) => {

	document.getElementById('initPipeline').addEventListener('click', function (e) {
		const parent = graph.getDefaultParent(); // This is usually the root of the graph
		const edges = graph.getChildEdges(parent);

		gen = animateBallGenerator(graph, edges);

		pipeline = createPipeline(exampleFlowJson);
		pipeline.run(5);

	});

	document.getElementById('pipeline-next').addEventListener('click', function () {
		gen.next();
	});

	graph.setEnabled(true);
};

async function* animateBallGenerator(graph: Graph, edges: Cell[]) {
	const speed = 140; // Pixels per second
	const ballElement = document.getElementById("ball")!; // The ball element to be animated

	for (let edge of edges) {
		// let points: Point[] = edge.getGeometry()!.points || [];
		let points = getEdgePath(graph, edge);
		await animateBall(points, ballElement, speed);
		pipeline.nextStep();
		yield edge;

	}

}
