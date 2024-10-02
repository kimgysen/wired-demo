import {Point, Rectangle} from "@maxgraph/core";
import {KpPoint} from "../lib/flow-example.ts";

const offsetLeft = 200;

export const calculatePathLength = (points: KpPoint[]): number => {
	let length = 0;
	for (let i = 0; i < points.length - 1; i++) {
		let dx = points[i + 1].x - points[i].x;
		let dy = points[i + 1].y - points[i].y;
		length += Math.sqrt(dx * dx + dy * dy);
	}

	return length;
}

function moveBallTo(ballElement: HTMLElement, x: number, y: number): void {
	ballElement.style.left = `${offsetLeft + x}px`;
	ballElement.style.top = `${y}px`;
}

export async function animateBall(points: KpPoint[], ballElement: HTMLElement, speed: number): Promise<void> {
	return new Promise((resolve) => {
		const pathLength = calculatePathLength(points);
		const totalTime = pathLength / speed; // in seconds
		const startTime = Date.now();

		ballElement.style.display = 'block';
		moveBallTo(ballElement, points[0].x, points[0].y);

		function step(): void {
			const currentTime = Date.now();
			const elapsedTime = (currentTime - startTime) / 1000; // in seconds
			let t = elapsedTime / totalTime;

			if (t > 1) {
				t = 1; // Ensure t does not exceed 1
			}

			const distance = t * pathLength;
			let traveled = 0;
			let currentX = points[0].x;
			let currentY = points[0].y;

			for (let i = 0; i < points.length - 1; i++) {
				const segmentLength = Math.sqrt(
					Math.pow(points[i + 1].x - points[i].x, 2) + Math.pow(points[i + 1].y - points[i].y, 2)
				);
				if (traveled + segmentLength >= distance) {
					const remaining = distance - traveled;
					const ratio = remaining / segmentLength;
					currentX = points[i].x + ratio * (points[i + 1].x - points[i].x);
					currentY = points[i].y + ratio * (points[i + 1].y - points[i].y);
					break;
				}
				traveled += segmentLength;
			}

			// Move the ball to the current position
			moveBallTo(ballElement, currentX, currentY);

			// Continue the animation
			if (t < 1) {
				requestAnimationFrame(step);
			} else {
				resolve();
			}
		}

		// Start the animation
		requestAnimationFrame(step);

	});
}

export function getIntersectionPoint(vertexBounds: Rectangle, edgePoint: Point): Point | null {
	const cx = vertexBounds.getCenterX();
	const cy = vertexBounds.getCenterY();

	const dx = edgePoint.x - cx;
	const dy = edgePoint.y - cy;

	const halfWidth = vertexBounds.width / 2;
	const halfHeight = vertexBounds.height / 2;

	const scaleX = Math.abs(halfWidth / dx);
	const scaleY = Math.abs(halfHeight / dy);

	let scale = Math.min(scaleX, scaleY);

	if (scale > 0) {
		const x = cx + dx * scale;
		const y = cy + dy * scale;

		// Check if the point is within the bounds of the rectangle
		if (x >= vertexBounds.x && x <= vertexBounds.x + vertexBounds.width &&
			y >= vertexBounds.y && y <= vertexBounds.y + vertexBounds.height) {
			return new Point(x, y);
		}
	}

	return null;
}
