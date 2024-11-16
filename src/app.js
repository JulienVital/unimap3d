import maplibregl from 'maplibre-gl';
import * as dat from "lil-gui";
import outlineVertexShader from "./shaders/outline/vertex.glsl";
import outlineFragmentShader from "./shaders/outline/fragment.glsl";
import 'maplibre-gl/dist/maplibre-gl.css';
import { zoneCoordinates } from './zone';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const MAPTILER_KEY = 'HSEn1GJ1lpRklVKZ4CyJ';
const map = new maplibregl.Map({
    style: `https://api.maptiler.com/maps/b0dcfcd5-55b3-4040-8d0d-a369aa70a131/style.json?key=HSEn1GJ1lpRklVKZ4CyJ`,
    center: [-0.361538, 49.191356],
    zoom: 21,
    container: 'map',
    antialias: true,
    minZoom: 5,
    maxPitch: 85,
    pitch:0
});
const gui = new dat.GUI();
// The 'building' layer in the streets vector source contains building-height data from OpenStreetMap.
map.on('load', () => {
    map.setSky({
        "sky-color": "#9BD1E9",
        "sky-horizon-blend":0.5,
        "horizon-color": "#FFFFFF",
        "horizon-fog-blend": 1,
        "fog-color": "#FFFFFF",
        "fog-ground-blend": 0,

    });
    map.addSource('zone-geojson', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: zoneCoordinates,
                    },
                    properties: {}
                }
            ]
        }
    });

    map.addSource("terrainSource", {
        type: "raster-dem",
        url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${MAPTILER_KEY}`,
        tileSize: 256,
    });
    
    map.setTerrain({ source: "terrainSource", exaggeration: 0 });
    // Ajouter la couche "fill" pour dessiner la zone avec un contour
    map.addLayer({
        id: 'zone-fill',
        type: 'fill',
        source: 'zone-geojson',
        paint: {
            'fill-color': '#FF573340', // Couleur du remplissage de la zone
            'fill-opacity': 0.4 // Opacité
        },
        maxzoom: 15, 
        minzoom: 12, 
                 // La couche sera visible uniquement à partir du niveau de zoom 12
    });

    // Ajouter une couche "line" pour dessiner le contour de la zone
    map.addLayer({
        id: 'zone-line',
        type: 'line',
        source: 'zone-geojson',
        paint: {
            'line-color': '#C70039', // Couleur du contour
            'line-width': 3 // Largeur du contour
        },
                
        maxzoom: 15,  
        minzoom: 11, 
        // La couche sera visible uniquement à partir du niveau de zoom 12

    });
    map.addSource('circle-source', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [-0.364738, 49.191056],
                    },
                    properties: {}
                }
            ]
        }
    });

    map.addLayer({
        id: 'circle-layer',
        type: 'circle',
        source: 'circle-source',
        maxzoom: 12,  
        minzoom: 0, // La couche sera visible uniquement à partir du niveau de zoom 12
        
        paint: {
            'circle-radius': 12,   // Rayon du cercle (en pixels)
            'circle-color': '#FF0000', // Couleur du cercle
            'circle-opacity': 0.3  // Opacité du cercle
        }
    });
    map.addLayer(customLayer)
});


const customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    maxzoom: 17,
    onAdd(map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // Lumière
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Matériau de contour
        this.outlineMaterial = new THREE.ShaderMaterial({
            vertexShader: outlineVertexShader,
            fragmentShader: outlineFragmentShader,
            uniforms: {
                lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
                color: { value: new THREE.Color("black") },
                outlineThickness: { value: 0.03 }, // Valeur initiale
            },
            side: THREE.BackSide,
        });

        // Matériau principal
        const material = new THREE.MeshToonMaterial();
        material.color.set(0xebebc6);

        // Charger le modèle GLTF
        const loader = new GLTFLoader();
        loader.load(
            'test.glb',
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        child.material = material;
                        // Créer un mesh de contour
                        const outlineMesh = new THREE.Mesh(child.geometry, this.outlineMaterial);
                        outlineMesh.position.copy(child.position);
                        outlineMesh.rotation.copy(child.rotation);
                        outlineMesh.scale.copy(child.scale);
                        outlineMesh.scale.multiplyScalar(1.0); // Ajustement initial
                        child.parent.add(outlineMesh);
                        
                        if(child.userData.name ==="Bâtiment L"){

                            const edgesGeometry = new THREE.EdgesGeometry(child.geometry); // Géométrie des arêtes
                            const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Matériau des arêtes
                            const edgesMesh = new THREE.LineSegments(edgesGeometry, edgesMaterial);
                            edgesMesh.position.copy(child.position);
                            edgesMesh.rotation.copy(child.rotation);
                            edgesMesh.scale.copy(child.scale);
                            child.parent.add(edgesMesh);
                        }
                    }
                });
                this.scene.add(gltf.scene);
            }
        );

        // Initialiser MapLibre et THREE.js
        this.map = map;
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });
        this.renderer.autoClear = false;

        // Écouter le zoom pour ajuster l'épaisseur
        this.map.on('zoom', () => {
            const zoom = this.map.getZoom();
            const newThickness = 0.01 + (zoom - 10) * 0.005; // Calculer l'épaisseur en fonction du zoom
            this.outlineMaterial.uniforms.outlineThickness.value = Math.max(0.01, newThickness); // Limiter à 0.01 minimum
            this.map.triggerRepaint(); // Repeindre la scène
        });
    },
    render(gl, matrix) {
        const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            modelTransform.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            modelTransform.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            modelTransform.rotateZ
        );

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
            .makeTranslation(
                modelTransform.translateX,
                modelTransform.translateY,
                modelTransform.translateZ
            )
            .scale(
                new THREE.Vector3(
                    modelTransform.scale,
                    -modelTransform.scale,
                    modelTransform.scale
                )
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }
};


const modelOrigin = [-0.364019, 49.192190]
const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0, 0];

const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
);

// transformation parameters to position, rotate and scale the 3D model onto the map
const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    /* Since our 3D model is in real world meters, a scale transform needs to be
    * applied since the CustomLayerInterface expects units in MercatorCoordinates.
    */
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
};

