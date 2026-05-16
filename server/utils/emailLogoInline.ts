import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Content-ID Mailjet / MIME pour le logo pied de page (`src="cid:…"`). */
export const EMAIL_FOOTER_LOGO_CID = 'brand-logo-footer'

export async function readEmailFooterLogoBase64(): Promise<string | null> {
  try {
    const path = join(process.cwd(), 'public', 'brand-logo-email.png')
    const buf = await readFile(path)
    return buf.length > 0 ? buf.toString('base64') : null
  } catch {
    return null
  }
}

export function mailjetInlineEmailLogoAttachment(base64Content: string) {
  return {
    ContentType: 'image/png',
    Filename: 'brand-logo-email.png',
    ContentID: EMAIL_FOOTER_LOGO_CID,
    Base64Content: base64Content
  }
}
