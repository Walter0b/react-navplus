import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default {
    input: 'src/index.ts',
    external: ['react', 'react-dom', 'react-router-dom'],
    output: [
        {
            file: pkg.main,       // e.g. "dist/index.cjs.js"
            format: 'cjs',
            sourcemap: true
        },
        {
            file: pkg.module,     // e.g. "dist/index.esm.js"
            format: 'es',
            sourcemap: true
        }
    ],
    plugins: [
        peerDepsExternal(),
        resolve(),
        commonjs(),
        typescript({
            useTsconfigDeclarationDir: true,
            clean: true
        })
    ]
};
