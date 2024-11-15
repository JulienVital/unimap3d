import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { zoneCoordinates } from './zone';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const MAPTILER_KEY = 'HSEn1GJ1lpRklVKZ4CyJ';
const map = new maplibregl.Map({
    style: `https://api.maptiler.com/maps/b0dcfcd5-55b3-4040-8d0d-a369aa70a131/style.json?key=HSEn1GJ1lpRklVKZ4CyJ`,
    center: [-0.364738, 49.191056],
    zoom: 15.5,
    container: 'map',
    antialias: true,
    minZoom: 5,
    maxPitch: 85,
    pitch:85
});

// The 'building' layer in the streets vector source contains building-height data from OpenStreetMap.
map.on('load', () => {
    map.setSky({
        "sky-color": "#9BD1E9",
        "sky-horizon-blend":0.5,
        "horizon-color": "#FFFFFF",
        "horizon-fog-blend": 1,
        "fog-color": "#FFFFFF",
        "fog-ground-blend": 0.5,

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

    map.addSource('hillshadeSource', {
        type: 'raster-dem',
        url: 'https://api.maptiler.com/maps/b0dcfcd5-55b3-4040-8d0d-a369aa70a131/style.json?key=HSEn1GJ1lpRklVKZ4CyJ',
        tileSize: 256
    });
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
    map.setTerrain({ source: 'hillshadeSource' })
});


const customLayer = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    maxzoom: 17,
    onAdd (map, gl) {
        
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();
        
        // create two three.js lights to illuminate the model
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);
        
        // use the three.js GLTF loader to add the 3D model to the three.js scene
        const loader = new GLTFLoader();
        loader.load(
            'https://docs.mapbox.com/mapbox-gl-js/assets/metlife-building.gltf',
            (gltf) => {

                this.scene.add(gltf.scene);
            }
        );
        this.map = map;

        // use the MapLibre GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });

        this.renderer.autoClear = false;
    },
    render (gl, matrix) {
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

const modelOrigin = [-0.364738, 49.191056]
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

