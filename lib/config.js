'use strict'

const assert = require('assert')
const path = require('path')
const fs = require('fs')
const Config = require('./models/config')
const util = require('./util')

function loadConfig (configPath) {
  const options = {}
  const base = options.base = path.dirname(configPath)
  const config = loadConfigFile(configPath)

  assert(config.taskFile, '"taskFile" must be specified in config file.')

  if (config.preset) {
    const presetPath = resolvePresetPath(config.preset, base)
    options.preset = loadConfig(presetPath)
  }

  const tasks = require(path.resolve(base, config.taskFile))

  return new Config(config, tasks, options)
}
exports.loadConfig = loadConfig

function loadConfigFile (configPath) {
  const ext = path.extname(configPath)

  assert(
    ext === '.js' || ext === '.json',
    path.basename(configPath) + ' is non-supported file format.'
  )

  return require(path.resolve(configPath))
}

function resolvePresetPath (preset, base) {
  if (!util.isLocalPath(preset)) {
    return require.resolve(preset)
  }
  return require.resolve(path.resolve(base, preset))
}

function findConfig (dirname, exists) {
  exists = exists || fs.existsSync

  const jsConfig = path.join(dirname, 'houl.config.js')
  if (exists(jsConfig)) {
    return jsConfig
  }

  const jsonConfig = path.join(dirname, 'houl.config.json')
  if (exists(jsonConfig)) {
    return jsonConfig
  }

  const parent = path.dirname(dirname)
  if (parent === dirname) {
    return null
  }

  return findConfig(parent, exists)
}
exports.findConfig = findConfig
