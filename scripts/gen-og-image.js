import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '../public/og-image.svg')
const pngPath = join(__dirname, '../public/og-image.png')

const svg = readFileSync(svgPath, 'utf-8')
const resvg = new Resvg(svg, { width: 1200, height: 630 })
const rendered = resvg.render()
writeFileSync(pngPath, rendered.asPng())
console.log('✅ og-image.png 생성 완료 (1200x630)')
