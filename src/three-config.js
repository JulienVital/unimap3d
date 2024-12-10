import * as THREE from 'three';
import outlineVertexShader from "./shaders/outline/vertex.glsl";
import outlineFragmentShader from "./shaders/outline/fragment.glsl";

// Couleurs et paramètres généraux pour Three.js
export const guiParams = {
    edgeColor: "#757575", // Couleur des arêtes
    face: "#FcFFC1",      // Couleur des bâtiments
    face2: "#c2ffdf",     // Couleur des arbres
};

export const outlineMaterial = new THREE.ShaderMaterial({
    vertexShader: outlineVertexShader,
    fragmentShader: outlineFragmentShader,
    uniforms: {
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        color: { value: new THREE.Color("black") },
        outlineThickness: { value: 0.14 }, // Valeur initiale
    },
    side: THREE.BackSide,
});

export const outlineMaterial2 = new THREE.ShaderMaterial({
    vertexShader: outlineVertexShader,
    fragmentShader: outlineFragmentShader,
    uniforms: {
        lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
        color: { value: new THREE.Color("#37a136") },
        outlineThickness: { value: 0.03 }, // Valeur initiale
    },
    side: THREE.BackSide,
});

export const materials = {
    building: new THREE.MeshToonMaterial({ color: guiParams.face, side: THREE.DoubleSide }),
    tree: new THREE.MeshToonMaterial({ color: guiParams.face2, side: THREE.DoubleSide }),
    edges: new THREE.LineBasicMaterial({ color: guiParams.edgeColor }),
};
