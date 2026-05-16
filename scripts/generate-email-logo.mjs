/**
 * Logo email : PNG blanc transparent (redimensionné pour le pied de page).
 * Le fond #1a1a2e est appliqué dans le HTML de l’email — pas dans l’image,
 * pour éviter l’inversion sombre (logo noir + cadre blanc sur mobile).
 * Exécuter : node scripts/generate-email-logo.mjs
 */
import sharp from 'sharp'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'public', 'brand-logo-light.png')
const out = join(root, 'public', 'brand-logo-email.png')

await sharp(src).resize({ width: 88 }).png().toFile(out)

console.log(`[generate-email-logo] Wrote ${out} (transparent)`)
