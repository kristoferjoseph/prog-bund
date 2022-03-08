const esbuild = require('esbuild')
const crypto = require('crypto')
const path = require('path')
const {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} = require('fs')

const getFolder = require('../get-static-folder')
const getDist = require('../get-static-bundle')

/** implements progressive bundle locally */
module.exports = async function sandbox ({ file }) {

  // ensure public/_bundle/manifest.json
  let dist = await getDist()
  let folder = await getFolder()
  let manifestBase = dist.path
  let manifestPath = path.join(manifestBase, 'manifest.json')
  let exists = existsSync(manifestPath)
  if (exists === false) {
    mkdirSync(manifestBase)
    writeFileSync(manifestPath, JSON.stringify({}))
  }

  // check for cached value
  let manifest = JSON.parse(readFileSync(manifestPath).toString())
  if (!!manifest[file] === false) {

    // bundle
    console.time('bundle')
    const input = readFileSync(path.join(folder, file), 'utf8')
    console.log('INPUT', input)
    let bundle = esbuild.transformSync(input, { format: 'esm' })
    let source = bundle.code
    console.timeEnd('bundle')

    // fingerprint
    console.time('fingerprint')
    let hash = crypto.createHash('sha1')
    hash.update(source)
    let sha = hash.digest('hex').substr(0, 7)
    let parts = file.split('/')
    let last = parts.pop()
    let [ filename, extension ] = last.split('.')
    let fingerprint = `${parts.join('/')}/${filename}-${sha}.${extension}`
    console.timeEnd('fingerprint')

    // write file and update manifest.json
    console.time('write')
    manifest[file] = `/_static/${dist.value}${fingerprint}`
    writeFileSync(manifestPath, JSON.stringify(manifest))
    writeFileSync(path.join(dist.path, fingerprint), source)
    console.timeEnd('write')
  }

  return manifest[file]
}
