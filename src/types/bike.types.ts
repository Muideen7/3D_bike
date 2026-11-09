import * as THREE from 'three';

export interface SuperbikeRefs {
  root: THREE.Group;
  frontForkGroup: THREE.Group;
  frontTire: THREE.Mesh;
  rearTire: THREE.Mesh;
  riderGroup: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  kneeSliderL: THREE.Mesh;
  kneeSliderR: THREE.Mesh;
  nosFlame: THREE.Mesh;
  flameMat: THREE.MeshBasicMaterial;
  bodyMat: THREE.MeshLambertMaterial;
}
