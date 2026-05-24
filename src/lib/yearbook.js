// Yearbook PDF generator — lazy-loads jsPDF so the ~150KB library isn't
// in the initial bundle. Generates a styled multi-page PDF for one person
// across one school year.

import { CATEGORY_HEX, TIER_META, formatSchoolYear } from './achievements.js';

async function loadJsPDF() {
  const mod = await import('jspdf');
  return mod.jsPDF ?? mod.default ?? mod;
}

function colorForPerson(name, people) {
  const m = people.find((p) => (p.name || '').toLowerCase() === (name || '').toLowerCase());
  return m?.color || '#3b6dff';
}

function hexToRgb(hex) {
  const h = (hex || '#3b6dff').replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function wrapText(pdf, text, maxWidth) {
  if (!text) return [];
  return pdf.splitTextToSize(String(text), maxWidth);
}

export async function generateYearbook({ person, year, achievements, people }) {
  const JsPDF = await loadJsPDF();
  const pdf = new JsPDF({ unit: 'pt', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();   // 595
  const H = pdf.internal.pageSize.getHeight();  // 842
  const M = 48;                                 // margin

  const accent = hexToRgb(colorForPerson(person, people));
  const ink = [15, 23, 42];
  const muted = [100, 116, 139];
  const faint = [148, 163, 184];

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  pdf.setFillColor(...accent);
  pdf.rect(0, 0, W, 180, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text('LIFE MANAGER · YEARBOOK', M, 64);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(40);
  pdf.text(person || 'Family', M, 130);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(18);
  pdf.text(formatSchoolYear(year), M, 158);

  // Summary box
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(M, 220, W - M * 2, 120, 12, 12, 'F');
  pdf.setTextColor(...ink);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('This year at a glance', M + 24, 252);

  const golds = achievements.filter((a) => a.tier === 'Gold').length;
  const silvers = achievements.filter((a) => a.tier === 'Silver').length;
  const bronzes = achievements.filter((a) => a.tier === 'Bronze').length;
  const cats = new Set(achievements.map((a) => a.category)).size;

  const stats = [
    [String(achievements.length), 'achievements'],
    [String(golds), 'gold'],
    [String(silvers + bronzes), 'silver / bronze'],
    [String(cats), 'categories'],
  ];
  let x = M + 24;
  for (const [n, lbl] of stats) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor(...accent);
    pdf.text(n, x, 295);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...muted);
    pdf.text(lbl, x, 314);
    x += (W - M * 2 - 48) / stats.length;
  }

  // Category breakdown
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...ink);
  pdf.text('By category', M, 380);

  const byCat = {};
  for (const a of achievements) byCat[a.category] = (byCat[a.category] || 0) + 1;
  const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  let cy = 400;
  for (const [cat, n] of sortedCats) {
    const cHex = CATEGORY_HEX[cat] || '#64748b';
    const c = hexToRgb(cHex);
    pdf.setFillColor(...c);
    pdf.circle(M + 6, cy, 4, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(...ink);
    pdf.text(cat, M + 18, cy + 4);
    pdf.setTextColor(...muted);
    pdf.text(`${n}`, W - M, cy + 4, { align: 'right' });
    cy += 22;
    if (cy > H - 100) break;
  }

  pdf.setTextColor(...faint);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Generated ${new Date().toLocaleDateString()} · Life Manager`, M, H - 32);

  // ── DETAIL PAGES ───────────────────────────────────────────────────────────
  // Sort newest first
  const sorted = [...achievements].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  pdf.addPage();
  let y = M + 10;

  // Page header
  pdf.setFillColor(...accent);
  pdf.rect(0, 0, W, 4, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(...ink);
  pdf.text(`${person} · ${formatSchoolYear(year)}`, M, y);
  y += 30;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(M, y, W - M, y);
  y += 16;

  for (const a of sorted) {
    // Estimate height needed for this entry
    const descLines = wrapText(pdf, a.description || '', W - M * 2 - 16);
    const quoteLines = a.quote ? wrapText(pdf, `"${a.quote}"`, W - M * 2 - 32) : [];
    const tagsLine = (a.tags && a.tags.length) ? `Tags: ${a.tags.join(', ')}` : '';
    const need = 72 + descLines.length * 14 + quoteLines.length * 13 + (tagsLine ? 18 : 0);

    if (y + need > H - M) {
      pdf.addPage();
      y = M + 10;
      pdf.setFillColor(...accent);
      pdf.rect(0, 0, W, 4, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(...ink);
      pdf.text(`${person} · ${formatSchoolYear(year)}`, M, y);
      y += 30;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(M, y, W - M, y);
      y += 16;
    }

    // Tier color stripe
    const tier = TIER_META[a.tier] ?? TIER_META['—'];
    const tierC = hexToRgb(tier.hex);
    pdf.setFillColor(...tierC);
    pdf.roundedRect(M, y, 4, need - 12, 2, 2, 'F');

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...ink);
    pdf.text(a.title || '(Untitled)', M + 14, y + 14);

    // Meta line
    const metaParts = [];
    if (a.date) metaParts.push(new Date(a.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }));
    if (a.category) metaParts.push(a.category);
    if (a.tier && a.tier !== '—') metaParts.push(tier.label);
    if (a.grade_level) metaParts.push(a.grade_level);
    if (a.issuer) metaParts.push(a.issuer);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...muted);
    pdf.text(metaParts.join(' · '), M + 14, y + 30);

    let textY = y + 50;
    if (descLines.length > 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(...ink);
      for (const line of descLines) {
        pdf.text(line, M + 14, textY);
        textY += 14;
      }
    }
    if (quoteLines.length > 0) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      pdf.setTextColor(...accent);
      for (const line of quoteLines) {
        pdf.text(line, M + 22, textY);
        textY += 13;
      }
      pdf.setFont('helvetica', 'normal');
    }
    if (tagsLine) {
      pdf.setFontSize(9);
      pdf.setTextColor(...faint);
      pdf.text(tagsLine, M + 14, textY + 4);
      textY += 18;
    }
    y = textY + 18;
  }

  // Footer with page numbers
  const pages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...faint);
    pdf.text(`${i} / ${pages}`, W - M, H - 24, { align: 'right' });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const safeName = (person || 'family').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  pdf.save(`yearbook-${safeName}-${formatSchoolYear(year).replace('–', '-')}-${stamp}.pdf`);
}
