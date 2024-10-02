import {Cell, EdgeStyle, Graph, Point, Rectangle} from "@maxgraph/core";
import {animateBall, getIntersectionPoint} from "./animation/animate-ball.ts";
import {KpEdge} from "./lib/flow-example.ts";
import {getEdgePath} from "./lib/flow-mapper.ts";

export const overrideEdgeStyle = (graph: Graph) => {
	const style = graph.getStylesheet().getDefaultEdgeStyle();
	style.rounded = true;
	style.edgeStyle = 'manhattanEdgeStyle';

	// style['edge'] = ElbowConnector; // Optional: Set edge style (e.g., elbow connector)
	style['strokeWidth'] = 2;
}



// Alternatively, you can define a completely new style

// var customEdgeStyle = {
// 	[Constants.STYLE_STROKECOLOR]: '#00FF00',  // Green color
// 	[mxConstants.STYLE_DASHED]: 1,               // Dashed line
// 	[mxConstants.STYLE_STROKEWIDTH]: 2,          // Thicker line
// 	[mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_CLASSIC, // Arrow at the end
// };