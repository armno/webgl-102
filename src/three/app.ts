import * as THREE from 'three';
export class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.Mesh;
  private car: any;

  init() {
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();

    this.setupScene();
    this.setupLight();

    this.animate();
    requestAnimationFrame(() => this.animate());
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    // possible scene config here ...
    return scene;
  }

  // add objects to the scene.
  // set camera position
  private setupScene() {
    this.cube = this.createCube();
    this.scene.add(this.cube);
    this.camera.position.z = 5;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const fieldOfView = 45;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const aspectRatio = windowWidth / windowHeight;
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(
      fieldOfView,
      aspectRatio,
      near,
      far
    );

    return camera;
  }

  private createRenderer() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(windowWidth, windowHeight);
    document.body.appendChild(renderer.domElement);

    return renderer;
  }

  private animate() {
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(() => this.animate());
  }

  private createCube(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00aabb });
    const cube = new THREE.Mesh(geometry, material);

    return cube;
  }

  private setupLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.7);
    pointLight.position.setZ(5);

    this.scene.add(pointLight);
  }
}
