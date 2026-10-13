// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';

export default [
    {
        input: './modules/modules.js', // Entry point for editor modules
        output: {
            file: './modules.dist.js', // Output file
            format: 'iife',
            name: 'SketchManager',
            sourcemap: true,
            globals: {
                react: 'React',
                'react-dom': 'ReactDOM'
            }
        },
        external: ['react', 'react-dom'],
        plugins: [
            resolve({
                extensions: ['.js', '.jsx'],
            }),
            commonjs(),
            babel({
                presets: ['@babel/preset-react'],
                babelHelpers: 'bundled',
                exclude: 'node_modules/**',
                extensions: ['.js', '.jsx'],
            }),
            postcss({
                inject: true,
            }),
        ],
    },
    {
        input: './src/player/main.js', // Entry point for player module
        output: {
            file: './player.dist.js', // Output artifact for player
            format: 'iife',
            name: 'HydraliskPlayer',
            sourcemap: true
        },
        plugins: [
            resolve({
                extensions: ['.js'],
            }),
            commonjs()
        ]
    }
];