/** Découpe une chaîne avec des segments **en gras** (markdown minimal) pour affichage en template. */
export function parseBoldSegments(text: string): { bold: boolean; text: string }[] {
  const out: { bold: boolean; text: string }[] = []
  const re = /\*\*(.+?)\*\*/gs
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ bold: false, text: text.slice(last, m.index) })
    out.push({ bold: true, text: m[1] })
    last = re.lastIndex
  }
  if (last < text.length) out.push({ bold: false, text: text.slice(last) })
  return out.length ? out : [{ bold: false, text }]
}
