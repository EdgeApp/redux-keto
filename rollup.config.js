import buble from '@rollup/plugin-buble'

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
  plugins: [buble(bubleOpts)]
}
