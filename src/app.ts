export class App {
	private gl: WebGLRenderingContext;
	init() {
		const canvas = <HTMLCanvasElement>document.getElementById('webgl-102');

		// try to get WebGL context.
		// fallback to`experimental-webgl`
		// for ie11, edge, and older android browser
		let gl = canvas.getContext('webgl');
		if (!gl) {
			gl = canvas.getContext('experimental-webgl');
		}

		if (!gl) {
			console.warn('WebGL is not supported in your browser.');
			return;
		}

		this.gl = gl;
		this.draw();
	}

	private draw() {
		this.gl.clearColor(0.75, 0.85, 0.8, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}
}
