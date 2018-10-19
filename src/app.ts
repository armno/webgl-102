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
    this.canvasHeight = canvas.clientHeight;
    this.canvasWidth = canvas.clientWidth;
    fetch('./car.json')
      .then(response => response.json())
      .then(model => {
        this.draw(model);
      });
  }

  private draw(model: any) {
    const { vertexShader, fragmentShader } = this.createShaders(this.gl);
    const program = this.createProgram(this.gl, vertexShader, fragmentShader);

    const objectsToDraw = [...model.meshes].map((object, i) => {
      const objectBuffers = this.createBuffers(this.gl, program, object);
      let objectTexture = this.createTexture(i);
      return {
        texture: objectTexture,
        ...objectBuffers
      };
    });

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.frontFace(this.gl.CCW);
    this.gl.cullFace(this.gl.BACK);

    this.gl.useProgram(program);

    // Create texture
    // const wallTexture = this.loadTexture('wall.png');
    const redTexture = this.createTextureFromColor([200, 50, 0, 255]);

    // lighting
    const ambientLightUniformLocation = this.gl.getUniformLocation(
      program,
      'ambientLightIntensity'
    );
    const sunlightIntUniformLocation = this.gl.getUniformLocation(
      program,
      'sunlightIntensity'
    );
    const sunlightDirUniformLocation = this.gl.getUniformLocation(
      program,
      'sunlightDirection'
    );
    this.gl.uniform3f(ambientLightUniformLocation, 0.2, 0.2, 0.2);
    this.gl.uniform3f(sunlightIntUniformLocation, 1.0, 1.0, 1.0);
    this.gl.uniform3f(sunlightDirUniformLocation, -5.0, 3.0, 0.0);

    // target locations of those uniforms in the vertex shader
    const matWorldUniformLocation = this.gl.getUniformLocation(
      program,
      'mWorld'
    );
    const matViewUniformLocation = this.gl.getUniformLocation(program, 'mView');
    const matProjUniformLocation = this.gl.getUniformLocation(program, 'mProj');

    // set positions in 3d space
    const viewMatrix = new Float32Array(16);
    const eyePosition = [0, 200, -600];
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

    // const worldMatrix = new Float32Array(16);
    const worldMatrix = mat4.create();

    // pass on matices to the shaders
    // "uniform matrix with 4 points, floats, and whatever v is"
    this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);
    this.gl.uniformMatrix4fv(matViewUniformLocation, false, viewMatrix);
    this.gl.uniformMatrix4fv(matProjUniformLocation, false, projMatrix);

    // main render loop - make things animate!
    // update worldMatrix every frame
    let angle = 0;
    const identityMatrix = mat4.create();
    const intervalInSeconds = 20;

    function render() {
      this.resize(this.gl.canvas);
      // performance.now() returns relative time in ms since page loads
      // ` / 1000` to convert from ms to seconds
      // ` / 6` to get value of angle to increase per each frame
      // result = 1 full rotation every 6 seconds
      angle = (performance.now() / 1000 / intervalInSeconds) * 2 * Math.PI;

      // rotate the worldMatrix, by identityMatrix, by `angle` each time, around `yAxis`
      // mat4.rotate(<mat4>xRotationMatrix, identityMatrix, angle * 0.1, xAxis);

      // create 2 rotation matrices for each axis
      mat4.rotate(<mat4>worldMatrix, identityMatrix, angle, [0, 1, 0]);
      // mat4.rotate(<mat4>worldMatrix, worldMatrix, angle * 0.1, [0, 0, 1]);
      // mat4.multiply(worldMatrix, worldMatrix, <mat4>xRotationMatrix);

      // mat4.translate(worldMatrix, worldMatrix, [5, 0, 0]);

      // send the updated worldMatrix to the GPU
      this.gl.uniformMatrix4fv(matWorldUniformLocation, false, worldMatrix);

      this.clearScreen();

      // this.gl.bindTexture(this.gl.TEXTURE_2D, redTexture);
      // this.gl.activeTexture(this.gl.TEXTURE0);

      objectsToDraw.forEach((object: any, index: number) => {
        this.gl.bindTexture(this.gl.TEXTURE_2D, object.texture);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.index.buffer);

        const positionAttributeLocation = this.gl.getAttribLocation(
          program,
          'vertPosition'
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.vertex.buffer);
        // prettier-ignore
        this.gl.vertexAttribPointer(
          positionAttributeLocation, // position of the attribute we found just above
          3, // number of elements (floats) per attribute
          this.gl.FLOAT, // type of elements
          false, // dont normalize
          0,
          0 // offset from the beginning of a single vertex to this attribute
        );
        this.gl.enableVertexAttribArray(positionAttributeLocation);

        const textureAttributeLocation = this.gl.getAttribLocation(
          program,
          'vertTexCoord'
        );
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.texCoords.buffer);
        // prettier-ignore
        this.gl.vertexAttribPointer(
          textureAttributeLocation,
          2, // u and v in texture coords
          this.gl.FLOAT, // we still use floats here
          false, // nope
          2 * Float32Array.BYTES_PER_ELEMENT, // changed to 5 in Texture chapter
          0
        );
        this.gl.enableVertexAttribArray(textureAttributeLocation);

        // for the normals
        const normalAttributeLocation = this.gl.getAttribLocation(
          program,
          'vertNormal'
        );
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.normal.buffer);
        this.gl.vertexAttribPointer(
          normalAttributeLocation,
          3,
          this.gl.FLOAT,
          true,
          3 * Float32Array.BYTES_PER_ELEMENT,
          0
        );
        this.gl.enableVertexAttribArray(normalAttributeLocation);

        this.gl.drawElements(
          this.gl.TRIANGLES,
          object.index.numElements,
          this.gl.UNSIGNED_SHORT,
          0
        );
      });

      requestAnimationFrame(render.bind(this));
    }

    requestAnimationFrame(render.bind(this));
  }

  clearScreen() {
    this.gl.clearColor(0.75, 0.85, 0.8, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  private createTexture(i: number): WebGLTexture {
    let objectTexture: WebGLTexture;
    if (i === 5) {
      objectTexture = this.createTextureFromColor([66, 140, 224, 255]);
    } else if (
      i === 1 ||
      i === 2 ||
      i === 9 ||
      i === 10 ||
      i === 12 ||
      i === 13
    ) {
      objectTexture = this.createTextureFromColor([0, 0, 0, 255]);
    } else if (i === 3) {
      // strips
      objectTexture = this.createTextureFromColor([255, 255, 255, 255]);
    } else if (i === 6 || i === 7) {
      // lights
      objectTexture = this.createTextureFromColor([255, 230, 104, 255]);
    } else if (i === 14) {
      // platform
      objectTexture = this.createTextureFromColor([180, 180, 180, 255]);
    } else {
      // base color - red
      objectTexture = this.createTextureFromColor([180, 10, 10, 255]);
    }
    return objectTexture;
  }

  private createTextureFromColor(color: number[]): WebGLTexture {
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // source: mdn
    // the image can take some time to load over the network
    // while it is downloading, we fill the texture with gray pixels
    const level = 0;
    const internalFormat = this.gl.RGBA;
    const srcFormat = this.gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const pixel = new Uint8Array(color);

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      this.gl.UNSIGNED_BYTE,
      pixel
    );

    return texture;
  }

  private createShaders(
    gl: WebGLRenderingContext
  ): {
    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
  } {
    // shader code
    const vs = `
		precision mediump float;

		attribute vec3 vertPosition;
    attribute vec2 vertTexCoord;
    attribute vec3 vertNormal;

    varying vec2 fragTexCoord;
    varying vec3 fragNormal;

    uniform mat4 mWorld;
    uniform mat4 mView;
    uniform mat4 mProj;

		void main() {
      fragTexCoord = vertTexCoord;
      fragNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;
      gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
		}
		`;

    const fs = `
    precision mediump float;

    uniform vec3 ambientLightIntensity;
    uniform vec3 sunlightIntensity;
    uniform vec3 sunlightDirection;

    varying vec2 fragTexCoord;
    varying vec3 fragNormal;

    uniform sampler2D sampler;

		void main() {

      vec3 surfaceNormal = normalize(fragNormal);
      vec3 sunDirNormal = normalize(sunlightDirection);

      vec4 texel = texture2D(sampler, fragTexCoord);

      vec3 lightIntensity = ambientLightIntensity + sunlightIntensity * max(dot(fragNormal, sunDirNormal), 0.0);

      gl_FragColor = vec4(texel.rgb * lightIntensity, texel.a);
		}
		`;

    // create shaders by specifying the shader type
    const vertexShader: WebGLShader = gl.createShader(this.gl.VERTEX_SHADER);
    const fragmentShader: WebGLShader = gl.createShader(
      this.gl.FRAGMENT_SHADER
    );

    // specifying shader source (the shader code)
    // (attach source code to each shader)
    gl.shaderSource(vertexShader, vs);
    gl.shaderSource(fragmentShader, fs);

    // then compile each shader
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    // check if the shader compiles (no syntax errors in the shader code)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error(
        'Error compiling vertex shader',
        gl.getShaderInfoLog(vertexShader)
      );
      return;
    }

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error(
        'Error compiling fragment shader',
        gl.getShaderInfoLog(fragmentShader)
      );
      return;
    }

    return {
      vertexShader,
      fragmentShader
    };
  }

  private createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram {
    const program: WebGLProgram = gl.createProgram();

    // combine 2 shaders: tell opengl to use these shaders in a "program"
    // create new webgl "program"

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

    return program;
  }

  private createBuffers(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    object: any
  ): any {
    const { vertices, normals } = object;
    const indices = [].concat(...object.faces);
    const texCoords = object.texturecoords[0];

    const vertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const texCoordsBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    const indexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );

    const normalBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    return {
      vertex: {
        buffer: vertexBufferObject,
        numElements: vertices.length
      },
      texCoords: {
        buffer: texCoordsBufferObject,
        numElements: texCoords.length
      },
      index: {
        buffer: indexBufferObject,
        numElements: indices.length
      },
      normal: {
        buffer: normalBufferObject,
        numElements: normals.length
      }
    };
  }

  private drawPlatform(platform: any, program: WebGLProgram) {
    const carVertices = platform.vertices;
    const carIndices = [].concat(...platform.faces); // flatten the faces
    const carTexCoords = platform.texturecoords[0];
    const carNormals = platform.normals;

    // create buffer for the car object
    const carVertexBufferObject = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, carVertexBufferObject);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(carVertices),
      this.gl.STATIC_DRAW
    );

    // model
    // create another buffer for texture coords
    const carTexCoordsBufferObject = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, carTexCoordsBufferObject);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(carTexCoords),
      this.gl.STATIC_DRAW
    );

    const carIndexBufferObject = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, carIndexBufferObject);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(carIndices),
      this.gl.STATIC_DRAW
    );

    const carNormalBufferObject = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, carNormalBufferObject);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(carNormals),
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

    const textureAttributeLocation = this.gl.getAttribLocation(
      program,
      'vertTexCoord'
    );

    // here comes a monster method
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, carVertexBufferObject);
    // prettier-ignore
    this.gl.vertexAttribPointer(
      positionAttributeLocation, // position of the attribute we found just above
      3, // number of elements (floats) per attribute
      this.gl.FLOAT, // type of elements
      false, // dont normalize - note: there is no gl.FALSE
      // 6 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex
      3 * Float32Array.BYTES_PER_ELEMENT, // changed to 5 in Texture chapter
      0 // offset from the beginning of a single vertex to this attribute
    );
    this.gl.enableVertexAttribArray(positionAttributeLocation);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, carTexCoordsBufferObject);
    // prettier-ignore
    this.gl.vertexAttribPointer(
      // colorAttributeLocation, // now we use the color attribute
      textureAttributeLocation,
      // 3, // for colors we have R,G,B values so it's 3
      2, // u and v in texture coords
      this.gl.FLOAT, // we still use floats here
      false, // nope
      // 6 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex (same as positionAttributeLocation)
      2 * Float32Array.BYTES_PER_ELEMENT, // changed to 5 in Texture chapter
      0
    );
    this.gl.enableVertexAttribArray(textureAttributeLocation);

    // for the normals
    const normalAttributeLocation = this.gl.getAttribLocation(
      program,
      'vertNormal'
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, carNormalBufferObject);
    this.gl.vertexAttribPointer(
      normalAttributeLocation,
      3,
      this.gl.FLOAT,
      true,
      3 * Float32Array.BYTES_PER_ELEMENT,
      0
    );
    this.gl.enableVertexAttribArray(normalAttributeLocation);
  }

  private resize(canvas: HTMLCanvasElement) {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (displayWidth !== canvas.width || displayHeight !== canvas.height) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);
  }
}
