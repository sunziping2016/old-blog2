/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs-extra')
const glob = require('globby')

function toDest(file) {
  return file.replace(/^src\//, 'dist/')
}

glob.sync('src/shared/**/*.{d.ts,js}').forEach((file) => {
  fs.copy(file, toDest(file))
})
