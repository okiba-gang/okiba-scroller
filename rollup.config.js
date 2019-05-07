import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import pkg from './package.json'
import babel from 'rollup-plugin-babel'

export default [
  // browser-friendly UMD build
  {
    input: 'index.js',
    output: [{
      name: 'OkibaScroller',
      file: pkg.browser,
      format: 'umd'
    }],
    plugins: [
      resolve(), // so Rollup can find external dependencies
      babel({
        exclude: 'node_modules/**'
      }),
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
      babel({
        exclude: 'node_modules/**'
      }),
      commonjs() // so Rollup can convert external deps to an ES module
    ],
    output: [
      { file: pkg.main, format: 'cjs', exports: 'named'},
      { file: pkg.module, format: 'es', exports: 'named'}
    ]
  }
]