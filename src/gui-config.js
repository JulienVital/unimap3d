import * as dat from "lil-gui";

// Initialisation des dossiers GUI
export const gui = new dat.GUI();
export const guiMap = gui.addFolder('Carte');
export const guiColor = gui.addFolder('Couleurs');
export const guiTree = guiColor.addFolder('Arbres');
export const guiBatiment = guiColor.addFolder('Bâtiments');

// Fonction pour configurer les paramètres de la carte
export function setupMapGUI(mapObject, map) {
    guiMap.add(mapObject, "zoom").min(5).max(25).name("Zoom").onChange(() => {
        map.setZoom(mapObject.zoom);
    });

    guiMap.add(mapObject, "pitch").min(0).max(85).name("Pitch").onChange(() => {
        map.setPitch(mapObject.pitch);
    });

    guiMap.add(mapObject, "bearing").min(0).max(360).name("Orientation").onChange(() => {
        map.setBearing(mapObject.bearing);
    });
}

// Fonction pour configurer les paramètres des bâtiments
export function setupBuildingGUI(guiParams, materials, outlineMaterial) {
    guiBatiment.addColor(guiParams, "edgeColor").name("Bordure").onChange((value) => {
        materials.edges.color.set(value);
    });

    guiBatiment.addColor(guiParams, "face").name("Bâtiment").onChange((value) => {
        materials.building.color.set(value);
    });

    guiBatiment.add(outlineMaterial.uniforms.outlineThickness, "value").min(0).max(1).name("Épaisseur").step(0.01);
}

// Fonction pour configurer les paramètres des arbres
export function setupTreeGUI(guiParams, materials, outlineMaterial2) {
    guiTree.addColor(guiParams, "face2").name("Arbre").onChange((value) => {
        materials.tree.color.set(value);
    });

    guiTree.addColor(guiParams, "edgeColor").name("Bordure Arbre").onChange((value) => {
        outlineMaterial2.uniforms.color.value.set(value);
    });
}
