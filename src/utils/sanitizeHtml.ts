const ALLOWED_TAGS = new Set([
  'a', 'b', 'blockquote', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4',
  'i', 'li', 'ol', 'p', 'span', 'strong', 'u', 'ul'
]);

/**
 * Strip scripts, event handlers, and tags the meeting-minutes editor does not need.
 * This is a display sanitizer for stored HTML, not a general-purpose HTML parser.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  const withoutDangerousBlocks = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<\/?(script|style|iframe|object|embed|link|meta|form|input|button)\b[^>]*>/gi, '');

  return withoutDangerousBlocks.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, rawTag, rawAttrs) => {
    const tag = String(rawTag).toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    const isClosing = match.startsWith('</');
    if (isClosing) return `</${tag}>`;

    const attrs: string[] = [];
    const attrText = String(rawAttrs || '');
    const hrefMatch = attrText.match(/\shref\s*=\s*("([^"]*)"|'([^']*)')/i);
    if (tag === 'a' && hrefMatch) {
      const href = hrefMatch[2] ?? hrefMatch[3] ?? '';
      if (/^(https?:|mailto:)/i.test(href)) {
        attrs.push(`href="${href.replace(/"/g, '&quot;')}"`, 'rel="noopener noreferrer"');
      }
    }
    return attrs.length ? `<${tag} ${attrs.join(' ')}>` : `<${tag}>`;
  });
}
