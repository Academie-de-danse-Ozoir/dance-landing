import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = dirname(fileURLToPath(import.meta.url))

/** Chemins où Nitro / Node peuvent trouver `server/pdf-assets` (dev, build, déploiement). */
function assetRoots(): string[] {
  return [
    join(moduleDir, '../pdf-assets'),
    join(process.cwd(), 'server', 'pdf-assets'),
    join(process.cwd(), '.output', 'server', 'pdf-assets')
  ]
}

export function resolvePdfAssetPath(fileName: string): string | null {
  for (const root of assetRoots()) {
    const path = join(root, fileName)
    if (existsSync(path)) return path
  }

  const publicFallbacks = [
    join(process.cwd(), 'public', 'images', fileName),
    join(process.cwd(), 'public', 'fonts', fileName),
    join(process.cwd(), 'public', fileName),
    join(process.cwd(), '.output', 'public', 'images', fileName),
    join(process.cwd(), '.output', 'public', 'fonts', fileName),
    join(process.cwd(), '.output', 'public', fileName)
  ]
  for (const path of publicFallbacks) {
    if (existsSync(path)) return path
  }

  return null
}

export function readPdfAssetBuffer(fileName: string): Buffer | null {
  const path = resolvePdfAssetPath(fileName)
  if (!path) return null
  try {
    return readFileSync(path)
  } catch {
    return null
  }
}

/** Fichier local puis stockage Nitro `assets:pdf-assets` (build / déploiement). */
export async function loadPdfAssetBuffer(fileName: string): Promise<Buffer | null> {
  const fromDisk = readPdfAssetBuffer(fileName)
  if (fromDisk) return fromDisk

  try {
    const { useStorage } = await import('nitropack/runtime')
    const storage = useStorage('assets:pdf-assets')
    const raw = await storage.getItemRaw(fileName)
    if (!raw) return null
    if (Buffer.isBuffer(raw)) return raw
    return Buffer.from(raw as ArrayBuffer | Uint8Array)
  } catch {
    return null
  }
}
