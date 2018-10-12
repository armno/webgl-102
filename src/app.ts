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

		// shader code
		const vs = `
		precision mediump float;

		attribute vec2 vertPosition;
		attribute vec3 vertColor;

		varying vec3 fragColor;

		void main() {
			fragColor = vertColor;
			gl_Position = vec4(vertPosition, 0.0, 1.0);
		}
		`;

		const fs = `
		precision mediump float;

		varying vec3 fragColor;

		void main() {
			gl_FragColor = vec4(fragColor, 1.0);
		}
		`;

		// create shaders by specifying the shader type
		const vertexShader: WebGLShader = this.gl.createShader(
			this.gl.VERTEX_SHADER
		);
		const fragmentShader: WebGLShader = this.gl.createShader(
			this.gl.FRAGMENT_SHADER
		);

		// specifying shader source (the shader code)
		// (attach source code to each shader)
		this.gl.shaderSource(vertexShader, vs);
		this.gl.shaderSource(fragmentShader, fs);

		// then compile each shader
		this.gl.compileShader(vertexShader);
		this.gl.compileShader(fragmentShader);

		// check if the shader compiles (no syntax errors in the shader code)
		if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
			console.error(
				'Error compiling vertex shader',
				this.gl.getShaderInfoLog(vertexShader)
			);
			return;
		}

		if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
			console.error(
				'Error compiling fragment shader',
				this.gl.getShaderInfoLog(fragmentShader)
			);
			return;
		}

		// -----

		// combine 2 shaders: tell opengl to use these shaders in a "program"
		// create new webgl "program"
		const program: WebGLProgram = this.gl.createProgram();

		// then attach compiled shaders to the program
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);

		// compile-attach, and then "link" the program
		this.gl.linkProgram(program);

		// we can also check if a program is successfully "linked"
		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			console.error(
				'Error linking program',
				this.gl.getProgramInfoLog(program)
			);
			return;
		}

		// validate the program .. for some reason
		// and check if the program is validated
		this.gl.validateProgram(program);
		if (!this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS)) {
			console.error(
				'Error validatiing program',
				this.gl.getProgramInfoLog(program)
			);
			return;
		}

		// -----

		// now our shaders are ready. then we can start drawing something!
		// first create an array of vertices: points in opengl coordinates system
		// to tell opengl where to put these points.

		// we create 3 vertex, each vertex contains 2 floats: x and y
		// prettier-ignore
		const vertices: number[] =
		[ // x, y         R, G, B
			   0, 0.5,     1.0, 0.2, 0.0,
			-0.5, -0.5,    0.8, 0.5, 0.7,
			 0.5, -0.5,    0.0, 0.3, 0.9
			];

		// `vertices` is an array of numbers lives on the CPU (browser),
		// the GPU will not understand this format.
		// we need to convert this array into a "buffer" - something the GPU can understand

		// by creating a buffer, we allocate some memory in the GPU
		const triangleBuffer = this.gl.createBuffer();

		// then we bind the `vertices` array to the created buffer
		// we want to use ARRAY_BUFFER as a "target"
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, triangleBuffer);

		// specify data for the buffer
		// - target use ARRAY_BUFFER as the target
		// - data: convert `vertices` array to something that works with opengl - the Float32Array
		// - usage: tell opengl that the `data` will not change after it is used
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array(vertices),
			this.gl.STATIC_DRAW
		);

		// -----

		// now we need to send our `vertices` data to the vertex shader
		// first by getting the position (memory address i think) of the attribute `vertPosition`
		// in the vertex shader.

		// note: we can attribute location from the created `program`, not from the vertex shader itself.
		const positionAttributeLocation = this.gl.getAttribLocation(
			program,
			'vertPosition'
		);

		const colorAttributeLocation = this.gl.getAttribLocation(
			program,
			'vertColor'
		);

		// here comes a monster method
		// prettier-ignore
		this.gl.vertexAttribPointer(
			positionAttributeLocation, // position of the attribute we found just above
			2, // number of elements (floats) per attribute
			this.gl.FLOAT, // type of elements
			false, // dont normalize - note: there is no gl.FALSE
			5 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex
			0 // offset from the beginning of a single vertex to this attribute
		);

		// prettier-ignore
		this.gl.vertexAttribPointer(
			colorAttributeLocation, // now we use the color attribute
			3, // for colors we have R,G,B values so it's 3
			this.gl.FLOAT, // we still use floats here
			false, // nope
			5 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex (same as positionAttributeLocation)
			2 * Float32Array.BYTES_PER_ELEMENT // offset: 2 from the beginning of each vertex
		)

		// enable attributes
		this.gl.enableVertexAttribArray(positionAttributeLocation);
		this.gl.enableVertexAttribArray(colorAttributeLocation);

		// -----

		// main render loop
		this.gl.useProgram(program);

		// draw using arrays of points (as opposed of draw elements)
		// - draw in triangles mode
		// - skip 0 indexes
		// - there are 3 vertex to draw
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

		// now we should get a tomato-ish color triangle on the screen

		// -----

		// passing information from vertex shader to fragment shader
		// update shaders code:
		// - add `vertColor` attribtue to the vertex shader
		// - add `fragColor` varying (return) to the vertex shader
		// - set `fragColor = vertColor` - send color values from vertices
		// - use `fragColor` in fragment shader instead hard-coded color values

		// then we update `vertices` array by adding color values to _each vertex_
	}
}
