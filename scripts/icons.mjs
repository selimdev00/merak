import sharp from 'sharp'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const svgPath = path.join(publicDir, 'favicon.svg')

const BINDER = { r: 0xF3, g: 0xEF, b: 0xE6 }

const svgBuffer = fs.readFileSync(svgPath)

async function rasterize(size) {
  return sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toBuffer()
}

async function main() {
  // favicon-32.png
  const f32 = await rasterize(32)
  const p32 = path.join(publicDir, 'favicon-32.png')
  await sharp(f32).toFile(p32)
  console.log('wrote', p32)

  // apple-touch-icon.png (180x180, opaque binder background — no transparency)
  const glyph180 = await rasterize(180)
  const p180 = path.join(publicDir, 'apple-touch-icon.png')
  await sharp({
    create: { width: 180, height: 180, channels: 3, background: BINDER },
  })
    .composite([{ input: glyph180, top: 0, left: 0 }])
    .png()
    .toFile(p180)
  console.log('wrote', p180)

  // icon-192.png
  const glyph192 = await rasterize(192)
  const p192 = path.join(publicDir, 'icon-192.png')
  await sharp(glyph192).toFile(p192)
  console.log('wrote', p192)

  // icon-512.png
  const glyph512 = await rasterize(512)
  const p512 = path.join(publicDir, 'icon-512.png')
  await sharp(glyph512).toFile(p512)
  console.log('wrote', p512)

  // og-image.png (1200x630) — binder canvas, icon centered at ~300px
  const glyphOG = await rasterize(300)
  const pOG = path.join(publicDir, 'og-image.png')
  const left = Math.round((1200 - 300) / 2)
  const top = Math.round((630 - 300) / 2)
  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: BINDER },
  })
    .composite([{ input: glyphOG, left, top }])
    .png()
    .toFile(pOG)
  console.log('wrote', pOG)

  console.log('\nAll icons generated successfully.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
