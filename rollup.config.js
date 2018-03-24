import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';

export default {
    input: 'dist/bootstrap.js',
    output: {
        format: 'iife',
        name: "CycleSES",
        file: "dist/main.js"
    },
    plugins: [
        resolve({
            browser: true,
        }),
        builtins(),
        commonjs()
    ],
};
