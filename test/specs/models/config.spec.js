'use strict'

const Config = require('../../../lib/models/config')

describe('Config model', () => {
  it('resolves input/output paths besed on base path', () => {
    const c = new Config({
      input: 'path/to/src',
      output: 'to/dist/'
    }, {}, {
      base: '/path/to/base'
    })
    expect(c.input).toBe('/path/to/base/path/to/src')
    expect(c.output).toBe('/path/to/base/to/dist')
  })

  it('resolves paths in execute options based on cwd', () => {
    const c = new Config({
      execute: [
        {
          input: 'src/img/_assets/*.svg',
          output: 'dist/img/share'
        }
      ]
    }, {}, {
      base: '/path/to/'
    })
    const e = c.execute[0]
    expect(e.input).toBe('/path/to/src/img/_assets/*.svg')
    expect(e.output).toBe('/path/to/dist/img/share')
  })

  it('loads tasks', () => {
    const c = new Config({
      rules: {
        js: 'foo',
        scss: {
          task: 'bar'
        }
      }
    }, {
      foo: () => 'foo',
      bar: () => 'bar'
    })
    expect(c.rules.js.task()).toBe('foo')
    expect(c.rules.scss.task()).toBe('bar')
  })

  it('add inputExt/outputExt in each rule object', () => {
    const c = new Config({
      rules: {
        js: 'foo',
        scss: {
          task: 'bar',
          outputExt: 'css'
        }
      }
    }, {
      foo: () => 'foo',
      bar: () => 'bar'
    })
    expect(c.rules.js.inputExt).toBe('js')
    expect(c.rules.js.outputExt).toBe('js')
    expect(c.rules.scss.inputExt).toBe('scss')
    expect(c.rules.scss.outputExt).toBe('css')
  })

  it('merges rules of preset', () => {
    const preset = new Config({
      rules: {
        scss: {
          task: 'baz',
          outputExt: 'css'
        },
        png: 'qux'
      }
    }, {
      baz: () => 'baz',
      qux: () => 'qux'
    })

    const c = new Config({
      rules: {
        js: 'foo',
        scss: 'bar'
      }
    }, {
      foo: () => 'foo',
      bar: () => 'bar'
    }, {
      preset
    })

    expect(c.rules.js.task()).toBe('foo')
    expect(c.rules.scss.task()).toBe('bar')
    expect(c.rules.scss.outputExt).toBe('scss')
    expect(c.rules.png.task()).toBe('qux')
  })

  it('finds rule by input file path', () => {
    const c = new Config({
      rules: {
        js: 'foo',
        scss: 'bar'
      }
    }, {
      foo: () => 'foo',
      bar: () => 'bar'
    })

    let rule = c.findRuleByInput('path/to/test.js')
    expect(rule.task()).toBe('foo')
    rule = c.findRuleByInput('path/to/test.scss')
    expect(rule.task()).toBe('bar')
    rule = c.findRuleByInput('path/to/test.js.html')
    expect(rule).toBe(null)
  })

  it('excludes matched input file path for rule', () => {
    const c = new Config({
      rules: {
        js: {
          task: 'foo',
          exclude: '**/vendor/**'
        }
      }
    }, {
      foo: () => 'foo'
    })

    let rule = c.findRuleByInput('path/to/test.js')
    expect(rule.task()).toBe('foo')
    rule = c.findRuleByInput('path/to/vendor/test.js')
    expect(rule).toBe(null)
  })

  it('finds rule by output file path', () => {
    function exists (pathname) {
      return [
        'path/to/test.js',
        'path/to/test.scss'
      ].indexOf(pathname) >= 0
    }

    const c = new Config({
      input: '',
      output: '',
      rules: {
        js: 'foo',
        scss: {
          task: 'bar',
          outputExt: 'css'
        }
      }
    }, {
      foo: () => 'foo',
      bar: () => 'bar'
    })

    let rule = c.findRuleByOutput('path/to/test.js', exists)
    expect(rule.task()).toBe('foo')

    rule = c.findRuleByOutput('path/to/test.css', exists)
    expect(rule.task()).toBe('bar')

    // There is no matched rule but file is found -> empty rule
    rule = c.findRuleByOutput('path/to/test.scss', exists)
    expect(rule.isEmpty).toBe(true)

    // File is not found -> null
    rule = c.findRuleByOutput('path/to/not-found.js', exists)
    expect(rule).toBe(null)
  })

  it('excludes matched output file path for rule', () => {
    function exists (pathname) {
      return [
        'path/to/test_1.scss',
        'path/to/vendor/test.css',
        'path/to/vendor/test.scss',
        'path/to/test_2.less'
      ].indexOf(pathname) >= 0
    }

    const c = new Config({
      input: '',
      output: '',
      rules: {
        scss: {
          task: 'foo',
          outputExt: 'css',
          exclude: '**/vendor/**'
        },
        css: 'bar',
        less: {
          task: 'baz',
          outputExt: 'css'
        }
      }
    }, {
      foo: () => 'foo',
      bar: () => 'bar',
      baz: () => 'baz'
    })

    let rule = c.findRuleByOutput('path/to/test_1.css', exists)
    expect(rule.task()).toBe('foo')

    // Ignored by scss rule
    rule = c.findRuleByOutput('path/to/vendor/test.css', exists)
    expect(rule.task()).toBe('bar')

    // Should not match if possible input file is not found
    rule = c.findRuleByOutput('path/to/test_2.css', exists)
    expect(rule.task()).toBe('baz')
  })
})