import glsl from 'vite-plugin-glsl'

export default {
    build: {
        outDir: 'dist' // Dossier de sortie
    },
    plugins:
    [
        glsl()
    ]
}