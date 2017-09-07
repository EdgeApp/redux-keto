import babel from 'rollup-plugin-babel'
import packageJson from './package.json'

const babelOpts = {
  presets: ['es2015-rollup'],
  plugins: ['transform-object-rest-spread']
}

export default {
  input: 'src/index.js',
  output: [
    { file: packageJson.main, format: 'cjs' },
    { file: packageJson.module, format: 'es' }
  ],
  plugins: [babel(babelOpts)],
  sourcemap: true
}
