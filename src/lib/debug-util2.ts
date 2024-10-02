function* runDebugger(jsLines, breakpoints) {
	let currentLine = 0;

	while (currentLine < jsLines.length) {
		const line = jsLines[currentLine];
		currentLine++;

		// Execute the current line
		try {
			console.log(`Executing line ${currentLine}: ${line}`);
			new Function(line)();
		} catch (e) {
			console.error(`Error executing line ${currentLine}:`, e);
		}

		// Check for breakpoints
		if (breakpoints.has(currentLine)) {
			console.log(`Paused at breakpoint on line ${currentLine}`);
			yield;  // Pause execution and wait for resume
		}
	}

	console.log("Execution finished");
}

// Usage example:
const jsCode = `
console.log("Line 1");
console.log("Line 2");
console.log("Line 3");
console.log("Line 4");
console.log("Line 5");
`;

const jsLines = jsCode.split('\n');
const breakpoints = new Set([3, 5]);  // Pauses at line 3 and 5

// Initialize the debugger
const debuggerInstance = runDebugger(jsLines, breakpoints);

// Start execution
function step() {
	const result = debuggerInstance.next();
	if (result.done) {
		console.log("Debugger has finished execution");
	} else {
		console.log("Execution paused, waiting to resume...");
	}
}

// Call `step` to move to the next line
document.getElementById('stepButton').addEventListener('click', step);