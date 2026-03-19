/// <reference types="node" />

import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {describe, expect, it} from 'vitest'

const indexCss = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8')

describe('index.css', () => {
  it('keeps core element defaults in the base layer so Tailwind utilities can override them', () => {
    expect(indexCss).toMatch(/@layer base\s*\{/)
    expect(indexCss).toMatch(/@layer base\s*\{[\s\S]*?body\s*\{/)
    expect(indexCss).toMatch(/@layer base\s*\{[\s\S]*?button\s*\{/)
    expect(indexCss).toMatch(/@layer base\s*\{[\s\S]*?p\s*\{\s*text-wrap:\s*pretty;/)
  })
})
