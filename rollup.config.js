import buble from 'rollup-plugin-buble'
import packageJson from './package.json'

const bubleOpts = {
  transforms: { dangerousForOf: true },
  objectAssign: 'Object.assign'
}

export default {
  input: 'src/index.js',
  output: [
    { file: packageJson.main, format: 'cjs' },
    { file: packageJson.module, format: 'es' }
  ],
  plugins: [buble(bubleOpts)],
  sourcemap: true
}
