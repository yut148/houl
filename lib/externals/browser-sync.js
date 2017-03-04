'use strict'

const fs = require('fs')
const path = require('path')
const url = require('url')
const vfs = require('vinyl-fs')
const browserSync = require('browser-sync')
const util = require('../util')

const defaultBsOptions = {
  ui: false,
  ghostMode: false,
  notify: false
}

module.exports = (config) => {
  const bs = browserSync.create()

  const bsOptions = util.clone(defaultBsOptions)

  bsOptions.server = config.output
  injectMiddleware(bsOptions, createMiddleware(config))

  bs.init(bsOptions)

  return bs
}

function injectMiddleware (options, middleware) {
  if (Array.isArray(options.middleware)) {
    options.middleware.push(middleware)
    return
  }

  if (options.middleware) {
    options.middleware = [options.middleware, middleware]
    return
  }

  options.middleware = [middleware]
}

function createMiddleware (config) {
  return (req, res, next) => {
    const outputPath = normalizePath(url.parse(req.url).pathname)
    const rule = config.findRuleByOutput(outputPath, inputPath => {
      return fs.existsSync(path.join(config.input, inputPath))
    })

    if (!rule) return next()

    const inputPath = path.join(
      config.input,
      rule.getInputPath(outputPath)
    )

    rule.task(vfs.src(inputPath))
      .on('data', file => res.end(file.contents))
  }
}

function normalizePath (pathname) {
  if (/\/$/.test(pathname)) {
    pathname = path.join(pathname, 'index.html')
  }
  return pathname
}