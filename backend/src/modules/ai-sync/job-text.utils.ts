const NAMED_HTML_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeHtmlEntities(value: string) {
  return value.replace(
    /&(#x?[0-9a-fA-F]+|nbsp|amp|lt|gt|quot|apos);/g,
    (match, entity: string) => {
      if (entity[0] === '#') {
        const isHex = entity[1]?.toLowerCase() === 'x';
        const raw = isHex ? entity.slice(2) : entity.slice(1);
        const codePoint = Number.parseInt(raw, isHex ? 16 : 10);

        return Number.isFinite(codePoint)
          ? String.fromCodePoint(codePoint)
          : match;
      }

      return NAMED_HTML_ENTITIES[entity] ?? match;
    },
  );
}

function normalizeLineWhitespace(value: string) {
  return value.replace(/[^\S\n]+/g, ' ');
}

export function normalizeHtmlToPlainText(value?: string | null) {
  if (typeof value !== 'string') {
    return '';
  }

  let normalized = value.replace(/\r\n?/g, '\n');

  normalized = normalized.replace(
    /<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    ' ',
  );
  normalized = normalized.replace(/<\s*br\s*\/?>/gi, '\n');
  normalized = normalized.replace(/<\s*hr\s*\/?>/gi, '\n');
  normalized = normalized.replace(/<\s*li\b[^>]*>/gi, '\n- ');
  normalized = normalized.replace(/<\s*\/\s*li\s*>/gi, '');
  normalized = normalized.replace(
    /<\s*\/?\s*(p|div|section|article|header|footer|aside|main|blockquote|pre|table|thead|tbody|tfoot|tr|td|th|ul|ol|h[1-6])\b[^>]*>/gi,
    '\n',
  );
  normalized = normalized.replace(/<[^>]+>/g, ' ');

  normalized = decodeHtmlEntities(normalized).replace(/\u00a0/g, ' ');
  normalized = normalizeLineWhitespace(normalized);

  const lines = normalized
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line, index, array) => {
      if (line !== '-' && line !== '*') {
        return true;
      }

      return array[index + 1] !== undefined;
    });

  return lines
    .join('\n')
    .replace(/\n{2,}(- )/g, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildAiJobDescription(
  description?: string | null,
  requirements?: string | null,
) {
  const cleanedDescription = normalizeHtmlToPlainText(description);
  const cleanedRequirements = normalizeHtmlToPlainText(requirements);

  const sections = [
    cleanedDescription ? `Description:\n${cleanedDescription}` : null,
    cleanedRequirements ? `Requirements:\n${cleanedRequirements}` : null,
  ].filter(Boolean);

  return sections.join('\n\n');
}
