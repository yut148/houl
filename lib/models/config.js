'use strict'

const path = require('path')
const minimatch = require('minimatch')
const Rule = require('./rule')
const util = require('../util')

module.exports = class Config {
  /**
   * options = { preset, base }
   */
  constructor (config, tasks, options) {
    options = options || {}

    const preset = options.preset
    this.base = options.base

    const resolve = makeResolve(this.base || '')

    // Resolve input/output paths
    if (typeof config.input === 'string') {
      this.input = resolve(config.input)
    }
    if (typeof config.output === 'string') {
      this.output = resolve(config.output)
    }

    // `exclude` option excludes matched files from `input`
    this.exclude = config.exclude

    // Resolve and merge rules by traversing preset
    this.rules = this._resolveRules(config.rules || {}, tasks, preset)
  }

  get vinylInput () {
    const res = [
      path.join(this.input, '**/*')
    ]

    if (this.exclude) {
      res.push('!' + this.exclude)
    }

    return res
  }

  /**
   * Check the pathname matches `exclude` pattern or not.
   */
  isExclude (pathname) {
    if (!this.exclude) {
      return false
    }

    if (path.isAbsolute(pathname)) {
      pathname = path.relative(this.input, pathname)
    }

    return minimatch(pathname, this.exclude)
  }

  findRuleByInput (inputName) {
    const ext = path.extname(inputName).slice(1)
    const rule = this.rules[ext]

    if (
      !rule ||
      rule.exclude && minimatch(inputName, rule.exclude)
    ) {
      return null
    }

    return rule
  }

  /**
   * Detect cooresponding rule from output path
   * It is not deterministic unlike findRuleByInput,
   * we query whether the input file is exists
   * to determine what rule we should select.
   * If a possible input file path is not found, we skip the rule.
   */
  findRuleByOutput (outputName, exists) {
    const ext = path.extname(outputName).slice(1)
    const rules = Object.keys(this.rules)
      .map(key => this.rules[key])
      .concat(Rule.empty)

    for (const rule of rules) {
      if (!rule.isEmpty && rule.outputExt !== ext) continue

      const inputName = rule.getInputPath(outputName)

      if (!exists(inputName)) continue

      if (rule.exclude && minimatch(inputName, rule.exclude)) {
        continue
      }

      return rule
    }

    return null
  }

  _resolveRules (rules, tasks, preset) {
    rules = util.mapValues(rules, (rule, key) => {
      return new Rule(rule, key, tasks)
    })

    if (!preset) return rules

    return util.merge(preset.rules, rules)
  }
}

function makeResolve (base) {
  return pathname => {
    return path.resolve(base, pathname)
  }
}
