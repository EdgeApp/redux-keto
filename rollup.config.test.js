import config from './rollup.config.js'

export default {
  external: ['chai', 'redux'],
  input: 'test/tests.js',
  output: [{ file: 'build/tests.js', format: 'cjs' }],
  plugins: config.plugins,
  sourcemap: true
}
