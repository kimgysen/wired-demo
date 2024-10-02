// flow json to flow tree objects
// Validation

// mapper
import {Cell, Graph, Point} from "@maxgraph/core";
import {KpEdge} from "./flow-example.ts";

const images = {
	input: '/src/public/img/input.svg',
	apiClient: '/src/public/img/api_download.svg',
	mapper: '/src/public/img/mapper.svg',
	filter: '/src/public/img/filter.svg',
	output: '/src/public/img/output.svg'
}


const getVertexById = (graph: Graph, id) => {
	// Use the model to get the cell (vertex or edge) by ID
	var cell = graph.model.getCell(id);

	// Check if the cell is a vertex (optional if you expect a vertex)
	if (cell?.isVertex()) {
		return cell; // This is the vertex object
	} else {
		return null; // The ID does not correspond to a vertex
	}
}


const initVertices = (graph: Graph, verticesJson) => {
	const defaultWidth = 40;
	const defaulHeight = 40;

	verticesJson.forEach(vertex => {
		const width = vertex.props.width || defaultWidth;
		const height = vertex.props.height || defaulHeight;

		const {x, y} = vertex.props;

		const prefix = {shape: 'image', image: images[vertex.type]};

		const userObj = {kind: 'vertex', type: vertex.type, id: vertex.id, data: vertex.data};

		return graph.insertVertex(null, vertex.id, userObj
			, x, y, width, height, {
			...prefix,
			verticalLabelPosition: 'bottom',
			verticalAlign: 'top'
		})
	});
}

const initEdges = (graph: Graph, edgesJson: KpEdge[]) => {
	edgesJson.forEach(edgeJson => {
		const source = getVertexById(graph, edgeJson.source);
		const target = getVertexById(graph, edgeJson.target);
		const pathPoints = edgeJson.points;

		const edge = graph.insertEdge(null, edgeJson.id, '', source, target);

		if (pathPoints) {
			const geometry = edge.getGeometry();

			geometry!.points = pathPoints.map(({x, y}) => {
				return new Point(x, y);
			});

			graph.model.setGeometry(edge, geometry!);
			graph.refresh();
		}
	});
}

export const initFlowToDiagram = (graph: Graph, flowJson) => {
	initVertices(graph, flowJson.vertices);
	initEdges(graph, flowJson.edges);

	document.getElementById('getGraphAsJson').addEventListener('click', () => {
		const json = getAllVerticesAndEdges(graph);
		console.log('json', json);
	});

}


export function getEdgePath(graph: Graph, edge: Cell) {
	// Get the view state of the edge, which contains the rendered points
	var state = graph.view.getState(edge);

	if (!state || !state.absolutePoints) {
		return [];
	}

	// Extract the points from the state
	return state.absolutePoints.map(function (point) {
		return {x: point!.x, y: point!.y};
	});

}

// Flow tree objects to json
const getEdgeAsJson = (graph, edge) => {
	var geometry = edge.getGeometry();
	var pointsArray = [];
	if (geometry != null && geometry.points != null) {
		for (let i = 0; i < geometry.points.length; i++) {
			let point = geometry.points[i];
			pointsArray.push({x: point.x, y: point.y});
		}
	}

	// Get the source and target vertices
	const source = edge.source ? edge.source.id : null;
	const target = edge.target ? edge.target.id : null;

	const path = getEdgePath(graph, edge);

	// Build the full JSON object
	return {
		id: edge.id,
		source: source,
		target: target,
		points: pointsArray
	};

}


// Function to get all vertices and edges from the graph
const getAllVerticesAndEdges = (graph: Graph) => {
	const vertices = [];
	const edges = [];

	// Get all cells from the model
	const cells = graph.model.cells;

	// Iterate over each cell in the graph
	for (let id in cells) {
		const cell = cells![id];

		// Check if the cell is a vertex
		if (cell.isVertex()) {
			const geom = cell.getGeometry();
			const vertexJson = {
				id: cell.id,
				props: {
					x: geom?.x,
					y: geom?.y,
					width: geom?.width,
					height: geom?.height
				}
			}
			vertices.push(vertexJson);
		}
		// Check if the cell is an edge
		else if (cell.isEdge()) {
			const edgeJson = getEdgeAsJson(graph, cell);
			edges.push(edgeJson);
		}
	}

	return {
		vertices: vertices,
		edges: edges
	};
}
