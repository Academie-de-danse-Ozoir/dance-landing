/**
 * Logo email : fond #1a1a2e opaque (évite l’inversion sombre Gmail / Apple Mail sur PNG transparent).
 * Exécuter : node scripts/generate-email-logo.mjs
 */
import sharp from 'sharp'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'public', 'brand-logo-light.png')
const out = join(root, 'public', 'brand-logo-email.png')

const FOOTER_BG = { r: 26, g: 26, b: 46 }

await sharp(src)
  .resize({ width: 88 })
  .flatten({ background: FOOTER_BG })
  .png()
  .toFile(out)

console.log(`[generate-email-logo] Wrote ${out}`)
