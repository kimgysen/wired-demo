import * as monaco from 'monaco-editor';
import {editor} from "monaco-editor";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

function debugEditor(editor: IStandaloneCodeEditor) {

	const breakpoints = new Set();
	let currentDebugLine = null;

	// Create a decorations collection
	const decorationsCollection = editor.createDecorationsCollection([]);

	// Function to toggle breakpoints
	function toggleBreakpoint(lineNumber) {
		if (breakpoints.has(lineNumber)) {
			breakpoints.delete(lineNumber);
		} else {
			breakpoints.add(lineNumber);
		}
		updateDecorations();
	}

	// Function to visually update decorations for breakpoints and the current debug line
	function updateDecorations() {
		const newDecorations = [];

		// Add decorations for breakpoints
		breakpoints.forEach(line => {
			newDecorations.push({
				range: new monaco.Range(line, 1, line, 1),
				options: {
					isWholeLine: true,
					className: 'myBreakpointLine',
					glyphMarginClassName: 'myBreakpointGlyph'
				}
			});
		});

		// Add decoration for current debug line
		if (currentDebugLine) {
			newDecorations.push({
				range: new monaco.Range(currentDebugLine, 1, currentDebugLine, 1),
				options: {
					isWholeLine: true,
					className: 'myCurrentDebugLine'
				}
			});
		}

		// Set the new decorations using the decorations collection
		decorationsCollection.set(newDecorations);
	}

	// Set breakpoints on line number clicks
	editor.onMouseDown(event => {
		if (event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
			const lineNumber = event.target.position.lineNumber;
			toggleBreakpoint(lineNumber);
		}
	});

	// Step through the code execution
	const jsCode = editor.getValue().split('\n');
	let currentLine = 0;

	function stepThroughCode() {
		if (currentLine < jsCode.length) {
			const line = jsCode[currentLine];
			currentLine++;

			if (breakpoints.has(currentLine)) {
				currentDebugLine = currentLine;
				updateDecorations();
				console.log(`Paused at line ${currentLine}: ${line}`);
			} else {
				currentDebugLine = null;
				updateDecorations();
				new Function(line)();
				stepThroughCode();
			}
		} else {
			console.log('Execution finished');
		}
	}

	document.getElementById('stepButton').addEventListener('click', stepThroughCode);

}

// CSS for custom styles
const style = document.createElement('style');
style.textContent = `
        .myBreakpointGlyph {
            background: red;
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        .myBreakpointLine {
            background-color: rgba(255, 0, 0, 0.3);
        }

        .myCurrentDebugLine {
            background-color: rgba(0, 255, 0, 0.3);
        }
    `;
document.head.appendChild(style);