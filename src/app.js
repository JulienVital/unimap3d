import maplibregl from 'maplibre-gl';
import * as dat from "lil-gui";
import 'maplibre-gl/dist/maplibre-gl.css';
import { zoneCoordinates } from './zone';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MAPTILER_KEY, mapObject, mapStyle, modelOrigin, modelAltitude, modelRotate } from './map-config.js';
import { guiParams, outlineMaterial, outlineMaterial2, materials } from './three-config.js';
import Stats from 'stats.js'
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

const map = new maplibregl.Map({
    style: mapStyle,
    center: [-0.361538, 49.191356],
    zoom: mapObject.zoom,
    container: 'map',
    antialias: true,
    minZoom: 5,
    maxPitch: 85,
    bearing: mapObject.bearing,
    pitch: mapObject.pitch,
});
const gui = new dat.GUI();
const guiMap = gui.addFolder( 'Carte' );
const guiColor = gui.addFolder( 'Couleurs' );
const guiTree = guiColor.addFolder( 'Arbres' );
const guiBatiment = guiColor.addFolder( 'Batiments' );
guiMap.add(mapObject, "zoom").min(5).max(25).name("zoom").onChange(
    function(){
        map.setZoom(mapObject.zoom)
    }
 )
 guiMap.add(mapObject, "pitch").min(0).max(85).name("pitch").onChange(
    function(){
        map.setPitch(mapObject.pitch)
    }
 )
 guiMap.add(mapObject, "bearing").name("bearing").min(0).max(360).onChange(
    function(){
        map.setBearing(mapObject.bearing)
    }
 )
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
const material = materials.building;
const material2 = materials.tree;
const edgesMaterial = materials.edges;

const customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd(map, gl) {
        this.zoomHandler = () => {
            const currentZoom = map.getZoom();
            
            // Masquer ou afficher la scène en fonction du zoom
            if (currentZoom < 15) {
                this.scene.visible = false;
                map.triggerRepaint();
            } else {
                this.scene.visible = true;
                map.triggerRepaint();
            }
        };

        map.on('zoom', this.zoomHandler);
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // Lumière
        const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
        // directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Matériau de contour
      

        // Matériau principal
        const guiParams = {
            edgeColor: "#757575", // Couleur initiale des arêtes en hexadécimal
            face: "#FcFFC1", // Couleur initiale des arêtes en hexadécimal
            face2: "#c2ffdf", // Couleur initiale des arêtes en hexadécimal
        };

        
        guiBatiment.addColor(guiParams, "edgeColor").name("Bordure").onChange((value) => {
            edgesMaterial.color.set(value); // Mettre à jour la couleur du matériau
        });
        guiBatiment.addColor(guiParams, "face").name("Batiment").onChange((value) => {
            material.color.set(value); // Mettre à jour la couleur du matériau
        });
        guiTree.addColor(guiParams, "face2").name("Arbre").onChange((value) => {
            material2.color.set(value); // Mettre à jour la couleur du matériau
        });
        guiTree.addColor(mapObject, "outLine").name("Bordure").onChange((value) => {
            outlineMaterial2.uniforms.color.value.set(value);
        });
        
        guiBatiment.add(mapObject, "outlineMax").min(0).max(1).name("Bordure max").step(0.01).onChange(
            (value)=>{
                            const minThickness = mapObject.outlineMin; // Définie par l'utilisateur
            const maxThickness = mapObject.outlineMax; // Définie par l'utilisateur
            const zoom = map.getZoom();
            // Interpolation linéaire entre min et max en fonction du zoom (0 -> min, 15 -> max)
            const newThickness = minThickness + (maxThickness - minThickness) * (zoom / 15);
                outlineMaterial.uniforms.outlineThickness.value =newThickness
            }
         )



        // Charger le modèle GLTF
        const loader = new GLTFLoader();
        loader.load(
            'univExtrude.glb',
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        // Créer un mesh de contour
                        if(child.userData.type ==="batiment"){
                        child.material = material;
                            const outlineMesh = new THREE.Mesh(child.geometry, outlineMaterial);
                            outlineMesh.position.copy(child.position);
                            outlineMesh.rotation.copy(child.rotation);
                            outlineMesh.scale.copy(child.scale);
                            outlineMesh.scale.multiplyScalar(1.0); // Ajustement initial
                            child.parent.add(outlineMesh);

                            const edgesGeometry = new THREE.EdgesGeometry(child.geometry); // Géométrie des arêtes
                            const edgesMesh = new THREE.LineSegments(edgesGeometry, edgesMaterial);
                            edgesMesh.position.copy(child.position);
                            edgesMesh.rotation.copy(child.rotation);
                            edgesMesh.scale.copy(child.scale);
                            child.parent.add(edgesMesh);
                        }
                        if(child.userData.type ==="tree"){                            child.material = material;
                            child.material = material2;
                            const outlineMesh = new THREE.Mesh(child.geometry, outlineMaterial2);
                            outlineMesh.position.copy(child.position);
                            outlineMesh.rotation.copy(child.rotation);
                            outlineMesh.scale.copy(child.scale);
                            outlineMesh.scale.multiplyScalar(1.0); // Ajustement initial
                            child.parent.add(outlineMesh);
                        }
                        else{

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
            const zoom = map.getZoom();
            const oldThickness = 0.01 + (zoom - 10) * 0.005; // Ajustez selon vos besoins
            
            // Définitions des valeurs min et max pour l'épaisseur
            const minThickness = mapObject.outlineMin; // Définie par l'utilisateur
            const maxThickness = mapObject.outlineMax; // Définie par l'utilisateur
        
            // Calcul de l'épaisseur : plus on s'éloigne de 0, plus on tend vers maxThickness
            const newThickness = minThickness + (maxThickness - minThickness) * (zoom / 25);
        
        
            // Mise à jour des uniformes
            outlineMaterial.uniforms.outlineThickness.value = maxThickness;
        
            outlineMaterial.uniforms.outlineThickness.value = newThickness;

            outlineMaterial2.uniforms.outlineThickness.value = Math.max(0.01, oldThickness);
            map.triggerRepaint(); // Repeindre la scène
        });
    },
    render(gl, matrix) {
        stats.begin()

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
        stats.end()

    }
};


const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
);

const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
};

