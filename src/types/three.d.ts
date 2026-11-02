declare module "three" {
  export const Scene: any;
  export const PerspectiveCamera: any;
  export const WebGLRenderer: any;
  export const AmbientLight: any;
  export const DirectionalLight: any;
  export const PlaneGeometry: any;
  export const CanvasTexture: any;
  export const MeshBasicMaterial: any;
  export const Mesh: any;
  export const Group: any;
  export const Box3: any;
  export const Vector3: any;
  export const AnimationMixer: any;
  export const Clock: any;
  export const SRGBColorSpace: any;
  export const ACESFilmicToneMapping: any;
  export const MathUtils: {
    lerp: (x: number, y: number, t: number) => number;
    mapLinear: (x: number, a1: number, a2: number, b1: number, b2: number) => number;
  };
  export type Scene = any;
  export type PerspectiveCamera = any;
  export type WebGLRenderer = any;
  export type AnimationMixer = any;
  export type Group = any;
  export type Mesh = any;
}

declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  export class GLTFLoader {
    load(
      url: string,
      onLoad: (gltf: any) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: any) => void
    ): void;
  }
}
