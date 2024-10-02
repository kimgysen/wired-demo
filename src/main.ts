// Initialize the graph
import {
	Cell, Client, ConnectionHandler, Geometry,
	gestureUtils,
	getDefaultPlugins,
	Graph,
	GraphDataModel,
	HTMLImageElementWithProps, ImageBox, InternalEvent,
	KeyHandler,
	RubberBandHandler, styleUtils
} from "@maxgraph/core";
import '@maxgraph/core/css/common.css'; // required by RubberBandHandler
import './style.css';
import './css/animation.css';
import {CellStyle} from "@maxgraph/core/dist/types";
import {createGraphContainer} from "./shared/configure";
import {overrideEdgeStyle} from "./CustomEdge.ts";
import {isNearCenter} from "./lib/vertex-util.ts";
import {initFlowToDiagram} from "./lib/flow-mapper.ts";
import {exampleFlowJson} from "./lib/flow-example.ts";
import {initValidation} from "./lib/validate-utils.ts";
import {createMonacoEditor, getExportedFunctions} from "./lib/monaco-editor.ts";
import './lib/state-machine.ts';
import {readScript, saveDemoScripts} from "./lib/scripts-util.ts";
import {initEdgeAnimation} from "./lib/run-diagram.ts";
import {initNpmInstallListener} from "./lib/npm/npm-utils.ts";
import {initEsBuild} from "./lib/npm/es-build.ts";


const div = document.getElementById('graphContainer');
const container = createGraphContainer({width: '100%', height: '100%'});
div.appendChild(container);

const plugins = getDefaultPlugins();
plugins.push(RubberBandHandler);

const graph = new Graph(container, new GraphDataModel(), plugins);
graph.container.setAttribute('tabindex', '0');  // Make it focusable

initValidation(graph);

graph.convertValueToString = (cell) => {
	if (cell.value?.kind === 'vertex') {
		// Display the 'name' property or any other specific property
		return cell.value.id;
	}
}


// // Activate delete
const keyHandler = new KeyHandler(graph);

// You can also manually bind the delete key
keyHandler.bindKey(46 /* Delete key */, function () {
	console.log('graph is enabled', graph.isEnabled());
	if (graph.isEnabled()) {
		graph.removeCells(graph.getSelectionCells());
	}
});

// document.addEventListener('keydown', (event) => {
// 	console.log('triggered', graph.getSelectionCells());
// 	if (event.key === 'Delete' || event.key === 46) {
// 		if (graph.isEnabled() && graph.getSelectionCells().length > 0) {
// 			graph.removeCells(graph.getSelectionCells());
// 		}
// 	}
// });

// Enables new connections in the graph
graph.setEnabled(true);
graph.setAllowDanglingEdges(false);
graph.setConnectable(true);
graph.setMultigraph(false);
// Enable HTML labels to allow HTML content inside vertex labels
graph.setHtmlLabels(true);

// Defines an icon for creating new connections in the connection handler.
// This will automatically disable the highlighting of the source vertex.
// 	`${Client.imageBasePath}/connector.gif`,
const connectionHandler = graph.getPlugin<ConnectionHandler>('ConnectionHandler');
// connectionHandler.connectImage = new ImageBox(
// 	`/src/public/img/cable.svg`,
// 	24,
// 	24
// );

const originalMouseMove = connectionHandler.mouseMove.bind(connectionHandler);

let hoveredCell = null;
connectionHandler.mouseMove = function (sender, me) {
	const cell = me.getCell();
	const mouseEvent = me.getEvent();
	const x = mouseEvent.clientX;
	const y = mouseEvent.clientY;

	// Check if the mouse is near the center of the vertex
	if (cell && cell.isVertex() && isNearCenter(graph, cell, x, y)) {
		// Show the connector icon
		this.connectImage = new ImageBox(`/src/public/img/cable.svg`, 24, 24);

		// Make the vertex semi-transparent when hovered near the center
		hoveredCell = cell;
		graph.setCellStyles('opacity', '15', [hoveredCell]);

	} else {
		// Reset the connector icon and vertex transparency
		this.connectImage = null;
		if (hoveredCell) {
			graph.setCellStyles('opacity', '100', [hoveredCell]);
			hoveredCell = null;
		}

	}

	// Call the original mouseMove function
	originalMouseMove(sender, me);
};

overrideEdgeStyle(graph);
initEdgeAnimation(graph);


// const inputVertex = addInputOutputVertex('/src/public/img/input.svg', '', 350, 20);
// const outputVertex = addInputOutputVertex('/src/public/img/output.svg', '', 350, 560);
//
// function addInputOutputVertex(image, label, x, y) {
// 	const prefix = {shape: 'image', image};
//
//
// 	// Insert the vertex with the SVG image and label below it
// 	const vertex = graph.createVertex(null, null, label, x, y, 30, 30, {
// 		...prefix,
// 		verticalLabelPosition: 'bottom',
// 		verticalAlign: 'top'
// 	});
//
// 	graph.addCell(vertex, null);
//
// 	return vertex;
// }
//
// graph.isCellResizable = function (cell) {
// 	return cell !== inputVertex && cell !== outputVertex;
// };
//
// graph.isCellMovable = function (cell) {
// 	return cell !== inputVertex && cell !== outputVertex;
// };

initFlowToDiagram(graph, exampleFlowJson);

// Toolbar items for shapes
const restApiItems = [
	{image: '/src/public/img/server.svg', title: 'api'},
	{image: '/src/public/img/api_download.svg', title: 'api download'},
	{image: '/src/public/img/api_upload.svg', title: 'api upload'}
];

// Toolbar items for connectors
const localStorageItems = [
	{image: '/src/public/img/localstorage.svg', title: 'localstorage'},
	{image: '/src/public/img/localstorage_download.svg', title: 'download'},
	{image: '/src/public/img/localstorage_upload.svg', title: 'upload'}
];

// Toolbar items for connectors
const mapperItems = [
	{image: '/src/public/img/mapper.svg', title: 'mapper'},
	{image: '/src/public/img/filter.svg', title: 'filter'}
];

const eventingItems = [
	{image: '/src/public/img/event_sender.svg', title: 'event sender'}
];

type InternalHTMLElementWithProps = HTMLElement & {
	enabled?: boolean;
};

function addVertex(graph, containerId, item, w: number, h: number, style: CellStyle) {
	const vertex = new Cell(null, new Geometry(0, 0, w, h), style);
	vertex.setVertex(true);

	const img: InternalHTMLElementWithProps = addToolbarItem(graph, containerId, vertex, item);
	img.enabled = true;

	graph.getSelectionModel().addListener(InternalEvent.CHANGE, () => {
		const tmp = graph.isSelectionEmpty();
		styleUtils.setOpacity(img, tmp ? 100 : 20);
		img.enabled = tmp;
	});
}

function addMode(container: HTMLElement, item, className): HTMLElement {
	// const img = (document.createElement(icon != null ? 'img' : 'button'));
	const div = document.createElement('div');
	div.className = className;
	div.innerHTML = `<img src="${item.image}" alt="${item.title}" />`;

	container.appendChild(div);
	return div;
}


// Function to add items to the toolbar
function addToolbarItem(graph: Graph, containerId, prototype: Cell, item) {
	const container = document.getElementById(containerId);
	const img: InternalHTMLElementWithProps = addMode(container, item, 'toolbar-item');

	// Function that is executed when the image is dropped on the graph.
	// The cell argument points to the cell under the mouse pointer if there is one.
	const dropHandler = (graph: Graph, _evt: MouseEvent, _cell: Cell | null, x?: number, y?: number) => {
		graph.stopEditing(false);

		// style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
		const prefix = {shape: 'image', image: item.image};

		// Insert the vertex with the SVG image and label below it
		const vertex = graph.createVertex(null, null, '', 0, 0, 40, 40, {
			...prefix,
			verticalLabelPosition: 'bottom',
			verticalAlign: 'top'
		});

		if (vertex?.geometry) {
			x !== undefined && (vertex.geometry.x = x);
			y !== undefined && (vertex.geometry.y = y);
		}

		graph.addCell(vertex, null);
		graph.setSelectionCell(vertex);
	};

	// const img: InternalHTMLImageElementWithProps = addToToolbar(null, image, (evt: MouseEvent, cell: Cell) => {
	// 	const pt = graph.getPointForEvent(evt);
	// 	dropHandler(graph, evt, cell, pt.x, pt.y);
	// }, '');

	img.title = item.title;

	InternalEvent.addListener(img, 'mousedown', (evt: MouseEvent) => {
		if (img.enabled == false) {
			InternalEvent.consume(evt);
		}
	});

	gestureUtils.makeDraggable(img, graph, dropHandler);
	return img;

}

// Add shapes and connectors to their respective sections
restApiItems.forEach(item => addVertex(graph, 'rest-api', item, 40, 40, {}));
localStorageItems.forEach(item => addVertex(graph, 'localstorage', item, 40, 40, {}));
mapperItems.forEach(item => addVertex(graph, 'mapping', item, 40, 40, {}));
eventingItems.forEach(item => addVertex(graph, 'eventing', item, 40, 40, {}));

const editor = await createMonacoEditor('monaco-editor');
initNpmInstallListener();
initEsBuild();
(async () => {
	await saveDemoScripts();
})();

document.getElementById('btn-function').addEventListener('click', () => {

	// checkFunctionDetails(editor, 'mapPerson');
	const fn = getExportedFunctions(editor.getValue());
	console.log('fn', fn);
});

// Selection listener: selection results in monaco editor
let isEdgeDragging = false;

// Add listener for mouse down to detect edge dragging
graph.addListener(InternalEvent.MOUSE_DOWN, function (sender, evt) {
	var cell = evt.getProperty('cell');

	if (cell != null && cell.isEdge()) {
		isEdgeDragging = true; // Start of edge dragging
	} else {
		isEdgeDragging = false; // No dragging or not an edge
	}

});

// Add listener for mouse up to reset dragging flag
graph.addListener(InternalEvent.MOUSE_UP, function (sender, evt) {
	isEdgeDragging = false; // Reset after mouse up
});

// Add selection listener
graph.getSelectionModel().addListener(InternalEvent.CHANGE, function (sender, evt) {
	if (isEdgeDragging) {
		return; // Ignore if dragging
	}

	var selectedCells = graph.getSelectionCells();

	if (selectedCells.length > 0) {
		var cell = selectedCells[0]; // Get the first selected cell

		// Check if it's a vertex or edge, but ignore during dragging
		if (cell.isVertex() || cell.isEdge()) {
			// Get the user object (custom properties)
			console.log('cell', cell);
			var userObject = cell.value;

			// Perform your custom action with the user object
			if (userObject) {
				console.log('Selected user object:', userObject.data);
				const script = readScript(userObject.data.script);
				editor.setValue(script);
				// Custom action here
			}
		}
	}
});

// Losing focus deactivates the graph
graph.container.addEventListener('click', () => {
	console.log('re-activate graph');
	graph.container.focus();  // Set focus to the graph container
	graph.setEnabled(true);   // Ensure the graph is enabled
});

