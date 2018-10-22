export interface Child {
  name: string;
  transformation: number[];
  meshes: number[];
}

export interface Rootnode {
  name: string;
  transformation: number[];
  children: Child[];
}

export interface Mesh {
  name: string;
  materialindex: number;
  primitivetypes: number;
  vertices: number[];
  normals: number[];
  tangents: number[];
  bitangents: number[];
  numuvcomponents: number[];
  texturecoords: number[][];
  faces: number[][];
}

export interface Property {
  key: string;
  semantic: number;
  index: number;
  type: number;
  value: any;
}

export interface Material {
  properties: Property[];
}

export interface RootObject {
  rootnode: Rootnode;
  flags: number;
  meshes: Mesh[];
  materials: Material[];
}
