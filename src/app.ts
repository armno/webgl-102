import { mat4, glMatrix } from 'gl-matrix';
export class App {
  private gl: WebGLRenderingContext;
  private canvasWidth: number;
  private canvasHeight: number;

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
    this.canvasHeight = canvas.height;
    this.canvasWidth = canvas.width;
    this.draw();
  }

  private draw() {
    // this.gl.clearColor(0.75, 0.85, 0.8, 1);
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.clearScreen();

    // shader code
    const vs = `
		precision mediump float;

		attribute vec3 vertPosition;
		attribute vec3 vertColor;

    varying vec3 fragColor;
    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

		void main() {
			fragColor = vertColor;
			gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
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
		[ // x, y, z          R, G, B
			 0.0, 0.5, 0.0,     1.0, 0.2, 0.0,
			-0.5, -0.5, 0.0,    0.8, 0.5, 0.7,
			 0.5, -0.5, 0.0,    0.0, 0.3, 0.9
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
			3, // number of elements (floats) per attribute
			this.gl.FLOAT, // type of elements
			false, // dont normalize - note: there is no gl.FALSE
			6 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex
			0 // offset from the beginning of a single vertex to this attribute
		);

    // prettier-ignore
    this.gl.vertexAttribPointer(
			colorAttributeLocation, // now we use the color attribute
			3, // for colors we have R,G,B values so it's 3
			this.gl.FLOAT, // we still use floats here
			false, // nope
			6 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex (same as positionAttributeLocation)
			3 * Float32Array.BYTES_PER_ELEMENT // offset: 2 from the beginning of each vertex
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
    // note: commented out in Part 2
    // this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

    // now we should get a tomato-ish color triangle on the screen

    // -----

    // passing information from vertex shader to fragment shader
    // update shaders code:
    // - add `vertColor` attribtue to the vertex shader
    // - add `fragColor` varying (return) to the vertex shader
    // - set `fragColor = vertColor` - send color values from vertices
    // - use `fragColor` in fragment shader instead hard-coded color values

    // then we update `vertices` array by adding color values to _each vertex_

    // ----- //

    /**
     * Part 2 - A Rotating Cube
     * 1. update vertex shader.
     * - add 3 matrices to transform the vertPosition
     * - in OpenGL, transformation applies in reverse order
     *    m1 * m2 * m3 * vert
     *    means: vert * m3 first, then * with m2, and then * with m1 - in this order
     *
     * 2. update vertPosition type from vec2 to vec3
     * 3. in `vertices` arrays, add the Z position to each vertex
     * 4. update vertex attribute pointer position in `vertexAttribPointer` - now it's 3 (X,Y,Z) instead of 2 (X,Y)
     *
     * at this point, it doesn't draw anything yet because by default, all matices in the vertex shader is 0
     * and thus it doesn't draw.
     * we have to pass in matrices to the vertex shader from our main program.
     *
     * */

    // target locations of those uniforms in the vertex shader
    const matWorldUniformLocation = this.gl.getUniformLocation(
      program,
      'mWorld'
    );
    const matViewUniformLocation = this.gl.getUniformLocation(program, 'mView');
    const matProjUniformLocation = this.gl.getUniformLocation(program, 'mProj');

    // create an empty matrix for each
    // then convert each matrix to an Identity matrix using glMatrix
    // note: mat4.identity expects a parameter with type `mat4` instead of `Float32Array`

    // const worldMatrix = new Float32Array(16);
    // const viewMatrix = new Float32Array(16);
    // const projMatrix = new Float32Array(16);
    // mat4.identity(<mat4>worldMatrix);
    // mat4.identity(<mat4>viewMatrix);
    // mat4.identity(<mat4>projMatrix);

    // this does the same - create 3 identity matrices!
    // const worldMatrix = mat4.create();
    // const viewMatrix = mat4.create();
    // const projMatrix = mat4.create();

    // set positions in 3d space
    const viewMatrix = new Float32Array(16);
    const eyePosition = [0, 0, -3];
    const centerPosition = [0, 0, 0];
    const upPosition = [0, 1, 0];
    mat4.lookAt(<mat4>viewMatrix, eyePosition, centerPosition, upPosition);

    // projection matrix: control how the 3D space is projected in to 2D
    const projMatrix = new Float32Array(16);
    const verticalFieldOfView = glMatrix.toRadian(45); // 45 degree in vertical
    const aspectRatio = this.canvasWidth / this.canvasHeight;
    const near = 0.1;
    const far = 1000;
    mat4.perspective(
      <mat4>projMatrix,
      verticalFieldOfView,
      aspectRatio,
      near,
      far
    );

    const worldMatrix = new Float32Array(16);

    // pass on matices to the shaders
    // "uniform matrix with 4 points, floats, and whatever v is"
    this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
    this.gl.uniformMatrix4fv(matViewUniformLocation, false, viewMatrix);
    this.gl.uniformMatrix4fv(matProjUniformLocation, false, projMatrix);

    // main render loop - make things animate!
    // update worldMatrix every frame
    let angle = 0;
    const identityMatrix = mat4.create();
    const yAxis = [0, 1, 0];
    const intervalInSeconds = 3;
    function render() {
      // performance.now() returns relative time in ms since page loads
      // ` / 1000` to convert from ms to seconds
      // ` / 6` to get value of angle to increase per each frame
      // result = 1 full rotation every 6 seconds
      angle = (performance.now() / 1000 / intervalInSeconds) * 2 * Math.PI;
      mat4.rotate(<mat4>worldMatrix, identityMatrix, angle, yAxis);

      // send worldMatrix to the GPU
      this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);

      this.clearScreen();
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

      requestAnimationFrame(render.bind(this));
    }
    requestAnimationFrame(render.bind(this));
  }

  clearScreen() {
    this.gl.clearColor(0.75, 0.85, 0.8, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }
}
