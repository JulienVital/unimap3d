import glsl from 'vite-plugin-glsl'

export default {

    build:
    {
        outDir: '../dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true // Add sourcemap
    },
    plugins:
    [
        glsl()
    ]
}