import { GeneralPDFSection } from '@/types';

/**
 * Converts structured GeneralPDFSection items into clean, readable Markdown.
 */
export function sectionsToMarkdown(sections: GeneralPDFSection[]): string {
  const parts: string[] = [];

  for (const sec of sections) {
    switch (sec.type) {
      case 'heading': {
        const title = sec.title?.trim() || '';
        const headingPrefix = title.startsWith('#') ? '' : '## ';
        parts.push(`${headingPrefix}${title}\n`);
        break;
      }

      case 'paragraph': {
        const content = sec.content?.trim() || '';
        if (content) {
          parts.push(`${content}\n`);
        }
        break;
      }

      case 'key_value': {
        if (sec.pairs && sec.pairs.length > 0) {
          const lines = sec.pairs.map((p) => `- **${p.key || ''}**: ${p.value || ''}`);
          parts.push(`${lines.join('\n')}\n`);
        }
        break;
      }

      case 'table': {
        const headers = sec.headers || [];
        const rows = sec.rows || [];
        if (headers.length > 0) {
          const headerLine = `| ${headers.join(' | ')} |`;
          const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
          const rowLines = rows.map((r) => {
            const cells = headers.map((_, i) => (r[i] !== undefined ? r[i] : ''));
            return `| ${cells.join(' | ')} |`;
          });
          parts.push([headerLine, separatorLine, ...rowLines].join('\n') + '\n');
        }
        break;
      }

      case 'divider': {
        parts.push('---\n');
        break;
      }

      case 'spacer': {
        parts.push('<br/>\n');
        break;
      }

      default:
        break;
    }
  }

  return parts.join('\n').trim();
}

/**
 * Converts Markdown text into structured GeneralPDFSection items.
 * Robustly supports standard Markdown, numbered headings ("1. Executive Overview"),
 * pipe tables, dashed/pandoc tables, list key-values, and alternating key-value blocks.
 */
export function markdownToSections(markdown: string): GeneralPDFSection[] {
  if (!markdown || !markdown.trim()) {
    return [];
  }

  const rawLines = markdown.replace(/\r\n/g, '\n').split('\n');
  const sections: GeneralPDFSection[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const content = currentParagraphLines.join('\n').trim();
      if (content) {
        // Filter out footer markers like "admin·Confidential & Proprietary"
        if (/Confidential\s*&\s*Proprietary/i.test(content) && content.length < 80) {
          currentParagraphLines = [];
          return;
        }

        // Check if paragraph is actually an alternating Key / Value block
        // e.g.:
        // Platform Name
        // Docora
        // Platform Category
        // Document Operations Platform
        const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 4 && lines.length % 2 === 0) {
          let isKeyValueBlock = true;
          const candidatePairs: { key: string; value: string }[] = [];
          for (let k = 0; k < lines.length; k += 2) {
            const keyCandidate = lines[k];
            const valCandidate = lines[k + 1];
            // Keys are usually short (under 45 chars) without terminal period
            if (keyCandidate.length > 45 || keyCandidate.endsWith('.') || valCandidate.length > 200) {
              isKeyValueBlock = false;
              break;
            }
            candidatePairs.push({ key: keyCandidate, value: valCandidate });
          }

          if (isKeyValueBlock && candidatePairs.length >= 2) {
            sections.push({
              type: 'key_value',
              pairs: candidatePairs,
            });
            currentParagraphLines = [];
            return;
          }
        }

        sections.push({
          type: 'paragraph',
          content,
        });
      }
      currentParagraphLines = [];
    }
  };

  let i = 0;
  while (i < rawLines.length) {
    const rawLine = rawLines[i];
    const line = rawLine.trim();

    // 1. Empty lines separate paragraphs
    if (!line) {
      flushParagraph();
      i++;
      continue;
    }

    // Filter out top metadata lines if directly pasted into body
    if (
      line.startsWith('#DOC-') ||
      line.startsWith('DOC-') ||
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}$/i.test(line) ||
      /Confidential\s*&\s*Proprietary/i.test(line)
    ) {
      flushParagraph();
      i++;
      continue;
    }

    // 2. Markdown Headings (# Heading, ## Heading, etc.)
    const mdHeadingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (mdHeadingMatch) {
      flushParagraph();
      sections.push({
        type: 'heading',
        title: mdHeadingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 3. Numbered Headings (e.g. "1. Executive Overview", "2. Key Platform Capabilities")
    const numberedHeadingMatch = line.match(/^(\d{1,2}\.|\bSection\s+\d+:?)\s+([A-Za-z0-9].*)$/);
    if (numberedHeadingMatch && line.length < 80) {
      flushParagraph();
      sections.push({
        type: 'heading',
        title: line,
      });
      i++;
      continue;
    }

    // 4. Horizontal Dividers (--- or *** or ___)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph();
      sections.push({
        type: 'divider',
      });
      i++;
      continue;
    }

    // 5. Spacers (<br>, <br/>, or [spacer])
    if (/^(<br\s*\/?>|\[spacer\])$/i.test(line)) {
      flushParagraph();
      sections.push({
        type: 'spacer',
      });
      i++;
      continue;
    }

    // 6. Standard Pipe Table (| Header 1 | Header 2 |)
    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph();
      const headers = line
        .slice(1, -1)
        .split('|')
        .map((h) => h.trim());

      let hasDivider = false;
      if (i + 1 < rawLines.length) {
        const nextLine = rawLines[i + 1].trim();
        if (nextLine.startsWith('|') && nextLine.endsWith('|')) {
          const cells = nextLine.slice(1, -1).split('|').map((c) => c.trim());
          if (cells.every((c) => /^:?-+:?$/.test(c))) {
            hasDivider = true;
          }
        }
      }

      if (hasDivider) {
        i += 2; // skip header and divider row
        const rows: string[][] = [];
        while (i < rawLines.length) {
          const rowLine = rawLines[i].trim();
          if (!rowLine.startsWith('|') || !rowLine.endsWith('|')) {
            break;
          }
          const rowCells = rowLine
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          rows.push(rowCells);
          i++;
        }

        sections.push({
          type: 'table',
          headers,
          rows,
        });
        continue;
      }
    }

    // 7. Grid / Pandoc Table with dashed separator:
    // Module            Key Features      Status            Owner
    // ----------------- ----------------- ----------------- -----------------
    if (i + 1 < rawLines.length) {
      const nextLine = rawLines[i + 1].trim();
      const isDashedSeparator = /^[-]{2,}(\s+[-]{2,})+$/.test(nextLine);
      if (isDashedSeparator) {
        flushParagraph();
        const dashMatches = Array.from(rawLines[i + 1].matchAll(/(-+)/g));
        if (dashMatches.length >= 2) {
          const colBounds = dashMatches.map((m) => ({
            start: m.index || 0,
            end: (m.index || 0) + m[0].length,
          }));

          const extractCols = (str: string) => {
            return colBounds.map((b, idx) => {
              const start = b.start;
              const end = idx === colBounds.length - 1 ? str.length : colBounds[idx + 1].start;
              return (str.slice(start, end) || '').trim();
            });
          };

          const headers = extractCols(rawLines[i]);
          i += 2; // skip header and dashed divider

          const rows: string[][] = [];
          let currentRow: string[] = Array(headers.length).fill('');

          while (i < rawLines.length) {
            const tableLine = rawLines[i];
            const trimmed = tableLine.trim();
            if (!trimmed) {
              if (currentRow.some((c) => c !== '')) {
                rows.push([...currentRow]);
                currentRow = Array(headers.length).fill('');
              }
              i++;
              if (i < rawLines.length && !rawLines[i].trim()) break;
              continue;
            }

            // Stop table on headings or dividers
            if (/^(#{1,6}\s|\d{1,2}\.\s|---|\*\*\*)/.test(trimmed)) {
              break;
            }

            const cols = extractCols(tableLine);
            if (cols[0] && currentRow.some((c) => c !== '')) {
              rows.push([...currentRow]);
              currentRow = cols;
            } else {
              for (let c = 0; c < headers.length; c++) {
                if (cols[c]) {
                  currentRow[c] = currentRow[c] ? `${currentRow[c]} ${cols[c]}` : cols[c];
                }
              }
            }
            i++;
          }

          if (currentRow.some((c) => c !== '')) {
            rows.push([...currentRow]);
          }

          sections.push({
            type: 'table',
            headers,
            rows,
          });
          continue;
        }
      }
    }

    // 8. Key-Value pairs with bullet markdown (- **Key**: Value or * **Key**: Value)
    const kvMatch = line.match(/^[-*]\s*\*\*(.*?)\*\*:\s*(.*)$/);
    if (kvMatch) {
      flushParagraph();
      const pairs: { key: string; value: string }[] = [];
      pairs.push({ key: kvMatch[1].trim(), value: kvMatch[2].trim() });
      i++;

      while (i < rawLines.length) {
        const nextLine = rawLines[i].trim();
        const nextKvMatch = nextLine.match(/^[-*]\s*\*\*(.*?)\*\*:\s*(.*)$/);
        if (!nextKvMatch) {
          break;
        }
        pairs.push({ key: nextKvMatch[1].trim(), value: nextKvMatch[2].trim() });
        i++;
      }

      sections.push({
        type: 'key_value',
        pairs,
      });
      continue;
    }

    // 9. Regular text line accumulates into current paragraph
    currentParagraphLines.push(rawLine);
    i++;
  }

  flushParagraph();
  return sections;
}

/**
 * Extracts title and subtitle from text / markdown headers.
 */
export function extractTitleMetadata(markdown: string): {
  title?: string;
  subtitle?: string;
  body: string;
} {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  if (lines.length === 0) return { body: markdown };

  let title: string | undefined = undefined;
  let subtitle: string | undefined = undefined;
  let bodyStartIndex = 0;

  // Pattern 1: # Title
  if (lines[0].startsWith('# ')) {
    title = lines[0].replace(/^#\s+/, '').trim();
    bodyStartIndex = 1;
  }
  // Pattern 2: "Docora -- Document Operations Platform" (plain text header)
  else if (lines[0].includes('--') || (lines[0].length < 70 && !lines[0].includes('.'))) {
    const firstLine = lines[0].trim();
    if (firstLine && !firstLine.startsWith('|') && !firstLine.startsWith('-')) {
      title = firstLine.replace('--', '—').trim();
      bodyStartIndex = 1;
    }
  }

  // Look for subtitle in following non-empty line
  while (bodyStartIndex < lines.length && !lines[bodyStartIndex].trim()) {
    bodyStartIndex++;
  }

  if (
    bodyStartIndex < lines.length &&
    lines[bodyStartIndex].length < 100 &&
    !lines[bodyStartIndex].startsWith('#') &&
    !lines[bodyStartIndex].startsWith('|') &&
    !lines[bodyStartIndex].startsWith('-') &&
    !/^\d+\./.test(lines[bodyStartIndex].trim())
  ) {
    subtitle = lines[bodyStartIndex].trim();
    bodyStartIndex++;
  }

  // Skip stray date / doc-id metadata lines right below title
  while (bodyStartIndex < lines.length) {
    const l = lines[bodyStartIndex].trim();
    if (
      !l ||
      l.startsWith('#DOC-') ||
      l.startsWith('DOC-') ||
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}$/i.test(l) ||
      l === 'admin'
    ) {
      bodyStartIndex++;
    } else {
      break;
    }
  }

  const body = lines.slice(bodyStartIndex).join('\n');
  return { title, subtitle, body };
}
