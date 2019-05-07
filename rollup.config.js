import resolve from 'rollup-plugin-node-resolve'

import commonjs from 'rollup-plugin-commonjs'
import pkg from './package.json'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'

export default [
  // browser-friendly UMD build
  {
    input: 'index.js',
    output: [{
      name: 'OkibaScroller',
      file: 'dist/okiba-scroller.umd.js',
      format: 'umd'
    }],
    plugins: [
      babel(),
      resolve(), // so Rollup can find external dependencies
      commonjs() // so Rollup can convert external deps to an ES module
    ]
  },
  {
    input: 'index.js',
    output: [{
      name: 'OkibaScroller',
      file: 'dist/okiba-scroller.umd.min.js',
      format: 'umd'
    }],
    plugins: [
      babel(),
      resolve(), // so Rollup can find external dependencies
      uglify({sourcemap: true}),
      commonjs() // so Rollup can convert external deps to an ES module
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'index.js',
    external: ['ms'],
    plugins: [
      resolve(), // so Rollup can find external dependencies
      babel(),
      commonjs() // so Rollup can convert external deps to an ES module
    ],
    output: [
      { file: pkg.main, format: 'cjs', exports: 'named'},
      { file: pkg.module, format: 'es', exports: 'named'}
    ]
  }
]
