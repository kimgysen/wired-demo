/*
Copyright 2022-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import '@maxgraph/core/css/common.css'; // required by RubberBandHandler
import './style.css';
import './css/animation.css';

import {
	Cell,
	Geometry,
	gestureUtils,
	getDefaultPlugins,
	Graph,
	GraphDataModel,
	HTMLImageElementWithProps,
	InternalEvent,
	KeyHandler,
	MaxToolbar,
	RubberBandHandler,
	styleUtils,
} from '@maxgraph/core';
import {CellStyle} from "@maxgraph/core/dist/types";
import {configureImagesBasePath, createGraphContainer} from "./shared/configure";

// const initializeGraph = (container: HTMLElement) => {
// 	// Disables the built-in context menu
// 	InternalEvent.disableContextMenu(container);
//
// 	const graph = new Graph(container, undefined, [
// 		...getDefaultPlugins(),
// 		RubberBandHandler, // Enables rubber band selection
// 	]);
// 	graph.setPanning(true); // Use mouse right button for panning
//
// 	graph.convertValueToString = function (cell) {
// 		if (cell.value instanceof KpComponent) {
// 			// Display the 'name' property or any other specific property
// 			return cell.value.name;
// 		}
//
// 		// return graph.convertValueToString.call(this, cell);
// 	};
//
// 	function applyAnimationToEdge(edge) {
// 		graph.model.beginUpdate();
// 		const edgeState = graph.view.getState(edge);
// 		if (edgeState) {
// 			// Target the correct path element (second one in your case)
// 			const paths = edgeState!.shape!.node.getElementsByTagName('path');
// 			if (paths.length > 1) {
// 				for (let path of paths) {
// 					const visiblePath = path;
// 					// const visiblePath = paths[1]; // The main visible path
// 					console.log('visiblePath', visiblePath);
// 					visiblePath.removeAttribute('visibility');
// 					visiblePath.setAttribute('stroke-width', '6');
// 					visiblePath.setAttribute('stroke', '#222');
// 					visiblePath.setAttribute('class', 'radiating-spot');
//
// 				}
// 			}
// 		}
//
// 		graph.view.invalidate(edge);
// 		graph.refresh();
// 		graph.model.endUpdate();
// 	}
//
// 	let e1;
// 	let v1;
// 	let v2;
//
// 	// shapes and styles
// 	registerCustomShapes();
//
// 	// Gets the default parent for inserting new cells. This
// 	// is normally the first child of the root (ie. layer 0).
// 	const parent = graph.getDefaultParent();
//
//
// 	const vertexStyle = {
// 		shape: 'cylinder',
// 		strokeWidth: 2,
// 		fillColor: '#ffffff',
// 		strokeColor: 'black',
// 		gradientColor: '#a0a0a0',
// 		fontColor: 'black',
// 		fontStyle: 1,
// 		spacingTop: 14,
// 	};
//
// 	graph.batchUpdate(() => {
//
// 		const apiClient = new KpApiClient('ApiClient');
// 		const mapper = new KpMapper('Mapper');
//
//
// 		v1 = graph.insertVertex({
// 			parent,
// 			value: apiClient,
// 			position: [20, 20],
// 			size: [60, 60],
// 			style: vertexStyle,
// 		});
//
// 		v2 = graph.insertVertex({
// 			parent,
// 			value: mapper,
// 			position: [200, 150],
// 			size: [60, 60],
// 			style: vertexStyle,
// 		});
//
// 		e1 = graph.insertEdge({
// 			parent,
// 			source: v1,
// 			target: v2,
// 			style: {
// 				strokeWidth: '6',
// 				endArrow: 'block',
// 				endSize: 2,
// 				endFill: 1,
// 				strokeColor: 'black',
// 				rounded: 1
// 			} as CellStyle
// 		});
// 		e1.geometry.points = [new Point(230, 50)];
// 		graph.orderCells(true, [e1]);
// 	});
//
// 	// var layout = new CompactTreeLayout(graph);
// 	// layout.execute(graph.getDefaultParent());
//
// 	// Adds animation to edge shape and makes "pipe" visible
// 	const e1State = graph.view.getState(e1);
// 	e1State!.shape!.node.getElementsByTagName('path')[0].removeAttribute('visibility');
// 	e1State!.shape!.node.getElementsByTagName('path')[0].setAttribute('stroke-width', '6');
// 	e1State!.shape!.node.getElementsByTagName('path')[0].setAttribute('stroke', '#222');
// 	// state!.shape!.node.getElementsByTagName('path')[1].setAttribute('class', 'radiating-spot');
//
// 	document.getElementById('initPipeline').addEventListener('click', function () {
// 		const ballElement = document.getElementById("ball")!; // The ball element to be animated
//
// // Retrieve the edge points
// 		let points: Point[] = e1.getGeometry().points || [];
//
// 		const sourceState = graph.getView().getState(v1);
// 		const targetState = graph.getView().getState(v2);
//
// 		if (!sourceState || !targetState) {
// 			console.error('Source or target state not found');
// 			return;
// 		}
//
// 		const sourceBounds = sourceState.getCellBounds() as Rectangle;
// 		const targetBounds = targetState.getCellBounds() as Rectangle;
//
// 		// Determine the start point on the source perimeter
// 		const startPoint = getIntersectionPoint(sourceBounds, points ? points[0] : new Point(
// 			targetBounds.getCenterX(), targetBounds.getCenterY()));
//
// 		if (startPoint) {
// 			points.unshift(startPoint);
// 		}
//
// 		// Add intermediate points if they exist
// 		// if (points && points.length > 0) {
// 		// 	points.push(...points.map((p: any) => new Point(p.x, p.y)));
// 		// }
//
// 		// Determine the end point on the target perimeter
// 		const endPoint = getIntersectionPoint(targetBounds, points ? points[points.length - 1] : new Point(
// 			sourceBounds.getCenterX(), sourceBounds.getCenterY()));
//
// 		if (endPoint) {
// 			points.push(endPoint);
// 		}
//
// 		if (points.length < 2) {
// 			console.error('Not enough points to animate');
// 			return;
// 		}
//
//
// // Include source and target vertices in the path
// // 		const sourcePoint: Point = new Point(
// // 			v1.geometry.x + v1.geometry.width / 2,
// // 			v1.geometry.y + v1.geometry.height / 2);
// //
// // 		const targetPoint: Point = new Point(
// // 			v2.geometry.x + v2.geometry.width / 2,
// // 			v2.geometry.y + v2.geometry.height / 2);
// //
// // 		points.unshift(sourcePoint); // Add source at the beginning
// // 		points.push(targetPoint);     // Add target at the end
//
// 		const speed = 300; // Pixels per second
//
// // Start the animation
// 		animateBall(points, ballElement, speed);
// 	});
//
// };
//
// // display the maxGraph version in the footer
// const footer = <HTMLElement>document.querySelector('footer');
// footer.innerText = `Built with maxGraph ${Client.VERSION}`;
//
// // Creates the graph inside the given container
// initializeGraph(<HTMLElement>document.querySelector('#graph-container'));

/******/
configureImagesBasePath();

const div = document.createElement('div');
div.style.display = 'flex';

// Creates the div for the toolbar
const tbContainer = document.createElement('div');
tbContainer.style.display = 'flex';
tbContainer.style.flexDirection = 'column';
tbContainer.style.marginRight = '.5rem';
div.appendChild(tbContainer);

// Creates new toolbar without event processing
const toolbar = new MaxToolbar(tbContainer);
toolbar.enabled = false;

// Creates the div for the graph
// const container = <HTMLElement>document.querySelector('#graph-container');//
const container = createGraphContainer({width: '800', height: '400'});

div.appendChild(container);

// Enables rubberband selection
const plugins = getDefaultPlugins();
plugins.push(RubberBandHandler);

// Creates the model and the graph inside the container using the fastest rendering available on the browser
const graph = new Graph(container, new GraphDataModel(), plugins);

// Activate delete
const keyHandler = new KeyHandler(graph);

// You can also manually bind the delete key
keyHandler.bindKey(46 /* Delete key */, function () {
	if (graph.isEnabled()) {
		graph.removeCells(graph.getSelectionCells());
	}
});

// Enables new connections in the graph
graph.setEnabled(true);
graph.setConnectable(true);
graph.setMultigraph(false);
// Enable HTML labels to allow HTML content inside vertex labels
graph.setHtmlLabels(true);
addInputOutputVertex('/src/public/img/input.svg', '', 200, 20);
addInputOutputVertex('/src/public/img/output.svg', '', 200, 340);

function addInputOutputVertex(image, label, x, y) {
	const prefix = {shape: 'image', image};


	// Insert the vertex with the SVG image and label below it
	const vertex = graph.createVertex(null, null, label, x, y, 30, 30, {
		...prefix,
		verticalLabelPosition: 'bottom',
		verticalAlign: 'top'
	});

	graph.addCell(vertex, null);


}


addVertex('/src/public/img/api_download.svg', 'api client', 40, 40, {});
addVertex('/src/public/img/localstorage.svg', 'localstorage', 40, 40, {});
addVertex('/src/public/img/mapper.svg', 'mapper', 40, 40, {});
addVertex('/src/public/img/filter.svg', 'filter', 40, 40, {});
// addVertex('/src/public/images/rounded.gif', 100, 40, {rounded: true});
// addVertex('/src/public/images/ellipse.gif', 40, 40, {
// 	shape: 'ellipse',
// 	perimeter: 'ellipsePerimeter',
// });
// addVertex('/src/public/images/rhombus.gif', 40, 40, {
// 	shape: 'rhombus',
// 	perimeter: 'rhombusPerimeter',
// });
// addVertex('/src/public/images/triangle.gif', 40, 40, {
// 	shape: 'triangle',
// 	perimeter: 'trianglePerimeter',
// });
// addVertex('/src/public/images/cylinder.gif', 40, 40, {shape: 'cylinder'});
// addVertex('/src/public/images/actor.gif', 30, 40, {shape: 'actor'});


type InternalHTMLImageElementWithProps = HTMLImageElementWithProps & {
	enabled?: boolean;
};


function addVertex(icon: string, title, w: number, h: number, style: CellStyle) {
	const vertex = new Cell(null, new Geometry(0, 0, w, h), style);
	vertex.setVertex(true);

	const img: InternalHTMLImageElementWithProps = addToolbarItem(graph, toolbar, vertex, icon, title);
	img.enabled = true;

	graph.getSelectionModel().addListener(InternalEvent.CHANGE, () => {
		const tmp = graph.isSelectionEmpty();
		styleUtils.setOpacity(img, tmp ? 100 : 20);
		img.enabled = tmp;
	});
}

function addToolbarItem(graph: Graph, toolbar: MaxToolbar, prototype: Cell, image: string, title: string) {
	// Function that is executed when the image is dropped on the graph.
	// The cell argument points to the cell under the mouse pointer if there is one.
	const dropHandler = (graph: Graph, _evt: MouseEvent, _cell: Cell | null, x?: number, y?: number) => {
		graph.stopEditing(false);

		// style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
		const prefix = {shape: 'image', image};


		// Insert the vertex with the SVG image and label below it
		const vertex = graph.createVertex(null, null, title, 0, 0, 40, 40, {
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

	// Creates the image which is used as the drag icon (preview)
	const img: InternalHTMLImageElementWithProps = toolbar.addMode(null, image, (evt: MouseEvent, cell: Cell) => {
		const pt = graph.getPointForEvent(evt);
		dropHandler(graph, evt, cell, pt.x, pt.y);
	}, '');

	img.title = title;

	InternalEvent.addListener(img, 'mousedown', (evt: MouseEvent) => {
		if (img.enabled == false) {
			InternalEvent.consume(evt);
		}
	});

	gestureUtils.makeDraggable(img, graph, dropHandler);
	return img;
}

document.body.appendChild(div);
