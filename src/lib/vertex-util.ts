// Function to calculate if the mouse is near the center of the vertex

const offset = 200;

export const isNearCenter = (graph, vertex, x, y) => {
	var geo = graph.getView().getState(vertex);

	if (geo != null) {
		var bounds = geo.getCellBounds();

		// Define the area as the center 50% of the width and height
		var centerX = offset + bounds.x + bounds.width / 4;
		var centerY = bounds.y + bounds.height / 4;
		var centerWidth = bounds.width / 2;
		var centerHeight = bounds.height / 2;

		// Check if the mouse (x, y) is within the center area
		if (x >= centerX && x <= centerX + centerWidth &&
			y >= centerY && y <= centerY + centerHeight) {
			return true;
		}
	}
	return false;
}