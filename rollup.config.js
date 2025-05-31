// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';

export default {
    input: './modules/modules.js', // Entry point
    output: {
        file: './modules.dist.js', // Output file
        format: 'iife', // Immediately Invoked Function Expression for browser compatibility
        name: 'SketchManager', // Global variable name for the bundled module
        sourcemap: true, // Enable source maps for debugging
    },
    plugins: [
        resolve({
            extensions: ['.js', '.jsx'], // Include .jsx files for resolution
        }),
        commonjs(), // Converts CommonJS modules to ES modules
        babel({
            presets: ['@babel/preset-react'], // Transpile JSX
            babelHelpers: 'bundled', // Use bundled Babel helpers
            exclude: 'node_modules/**', // Exclude node_modules from transpilation
            extensions: ['.js', '.jsx'], // Include .jsx files for Babel transpilation
        }),
        postcss({
            inject: true, // Inject CSS into the HTML dynamically
        }),
    ],
};