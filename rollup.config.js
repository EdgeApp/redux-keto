import buble from '@rollup/plugin-buble'
import flowEntry from 'rollup-plugin-flow-entry'

import packageJson from './package.json'

const bubleOpts = {
  transforms: { dangerousForOf: true },
  objectAssign: 'Object.assign'
}

export default {
  input: 'src/index.js',
  output: [
    { file: packageJson.main, format: 'cjs', sourcemap: true },
    { file: packageJson.module, format: 'es', sourcemap: true }
  ],
  plugins: [
    buble(bubleOpts),
    flowEntry({
      types: './src/index.flow.js'
    })
  ]
}
