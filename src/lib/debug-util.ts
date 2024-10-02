import {editor} from "monaco-editor";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;


function insertDebuggerStatements(jsCode, breakpoints) {
	const lines = jsCode.split('\n');
	breakpoints.forEach(breakpoint => {
		lines[breakpoint.lineNumber - 1] = `debugger; \n${lines[breakpoint.lineNumber - 1]}`;
	});
	return lines.join('\n');
}
// 1. Monaco Editor for TypeScript Code and Breakpoints
const codeWithBreakPoints = (editor: IStandaloneCodeEditor) => {
	const breakpoints = new Set();

	editor.decor
	editor.onMouseDown(e => {
		const lineNumber = e.target.position?.lineNumber;
		if (!breakpoints.has(lineNumber)) {
			breakpoints.add(lineNumber);
			editor.deltaDecorations([], [{
				range: new monaco.Range(lineNumber, 1, lineNumber, 1),
				options: {isWholeLine: true, className: 'myBreakpoint'}
			}]);
		} else {
			breakpoints.delete(lineNumber);
			// TODO: Remove breakpoint highlight
		}
	});

	// Retrieve code with breakpoints to pass to the debugger
	const code = editor.getValue();
}

// OR 2. Insert debugger; Statements for Breakpoints
function insertDebuggerStatements(jsCode, breakpoints) {
	const lines = jsCode.split('\n');
	breakpoints.forEach(breakpoint => {
		lines[breakpoint.lineNumber - 1] = `debugger; \n${lines[breakpoint.lineNumber - 1]}`;
	});
	return lines.join('\n');
}

//2. Compile TypeScript Code to JavaScript


// 3. Create a Debugger with Execution Control
function runDebugger(jsLines: string[], currentLine: number) {
	if (currentLine >= jsLines.length) {
		console.log("Execution finished");
		return;
	}

	const line = jsLines[currentLine];

	try {
		// Execute the current line
		new Function(line)();
	} catch (e) {
		console.error("Error executing line " + currentLine + ": ", e);
	}

	// Simulate stepping to the next line
	currentLine++;
}

// 4. Pausing and Resuming Execution
function runDebugger(jsLines: string[], currentLine: number, breakpoints) {
	if (currentLine >= jsLines.length) {
		console.log("Execution finished");
		return;
	}

	const line = jsLines[currentLine];
	currentLine++;

	// Execute the current line after a delay
	setTimeout(() => {
		try {
			new Function(line)();
		} catch (e) {
			console.error("Error executing line " + currentLine + ": ", e);
		}

		// After execution, step to the next line
		if (breakpoints.has(currentLine)) {
			console.log("Paused at breakpoint on line " + currentLine);
			return; // Pause execution at the breakpoint
		} else {
			// runDebugger(); // Continue execution
		}
	}, 500); // 500ms delay between lines
}

// 5. Tracking and Displaying Variable Values
const context = {
	add: (a, b) => a + b,
	console
};

// Wrap the context in a Proxy to observe changes
const proxy = new Proxy(context, {
	get(target, prop) {
		console.log(`Getting value of ${prop}`);
		return target[prop];
	},
	set(target, prop, value) {
		console.log(`Setting value of ${prop} to ${value}`);
		target[prop] = value;
		return true;
	}
});

// Execute the function in the proxy context
new Function('with(this) { console.log(add(2, 3)); }').call(proxy);