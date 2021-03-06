'use strict'

const path = require('path')
const normalize = require('normalize-path')
const loadConfig = require('../../lib/config').loadConfig
const findConfig = require('../../lib/config').findConfig

const read = pathname => {
  return loadConfig(path.join('test/fixtures/configs', pathname))
}

describe('Config', () => {
  it('loads js file', () => {
    read('normal.config.js')
  })

  it('loads json file', () => {
    read('test.config.json')
  })

  it('throws if try loading other file', () => {
    expect(() => read('test.coffee'))
      .toThrowError(/test\.coffee is non-supported file format/)
  })

  it('search config file', () => {
    function exists (pathname) {
      return '/path/houl.config.js' === normalize(pathname)
    }

    expect(findConfig('/path/to/project', exists)).toBePath('/path/houl.config.js')
  })

  it('also search json config file', () => {
    function exists (pathname) {
      return '/path/houl.config.json' === normalize(pathname)
    }

    expect(findConfig('/path/to/project', exists)).toBePath('/path/houl.config.json')
  })

  it('prefers js config', () => {
    function exists (pathname) {
      return [
        '/path/to/houl.config.json',
        '/path/to/houl.config.js'
      ].indexOf(normalize(pathname)) >= 0
    }

    expect(findConfig('/path/to/', exists)).toBePath('/path/to/houl.config.js')
  })

  it('returns null if not found', () => {
    function exists (pathname) {
      return '/path/to/houl.config.json' === normalize(pathname)
    }

    expect(findConfig('/path/other/project', exists)).toBe(null)
  })
})
