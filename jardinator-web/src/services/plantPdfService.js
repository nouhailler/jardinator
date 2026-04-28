import { GROUPE_COLORS, MONTH_LABELS, ACTIVITY_COLORS } from './vegetableService';

const ALL_MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];

const ACTIVITIES = [
  { key: 'sowingIndoor',  color: '#1976D2', bg: '#E3F2FD', border: '#90CAF9' },
  { key: 'sowingOutdoor', color: '#F57C00', bg: '#FFF3E0', border: '#FFCC80' },
  { key: 'planting',      color: '#388E3C', bg: '#E8F5E9', border: '#A5D6A7' },
  { key: 'harvest',       color: '#C62828', bg: '#FFEBEE', border: '#EF9A9A' },
];

function esc(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Convertit du markdown en HTML simple pour le PDF
function markdownToHtml(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const out = [];
  let inUl = false;
  let inOl = false;

  const closeList = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };

  const inlineHtml = (s) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:0.9em;">$1</code>');

  for (const line of lines) {
    if (/^###\s+(.+)/.test(line)) {
      closeList();
      out.push(`<h4 class="md-h4">${inlineHtml(line.replace(/^###\s+/, ''))}</h4>`);
    } else if (/^##\s+(.+)/.test(line)) {
      closeList();
      out.push(`<h3 class="md-h3">${inlineHtml(line.replace(/^##\s+/, ''))}</h3>`);
    } else if (/^#\s+(.+)/.test(line)) {
      closeList();
      out.push(`<h2 class="md-h2">${inlineHtml(line.replace(/^#\s+/, ''))}</h2>`);
    } else if (/^---+$/.test(line.trim())) {
      closeList();
      out.push('<hr class="md-hr">');
    } else if (/^\s*[-*]\s+(.+)/.test(line)) {
      if (!inUl) { if (inOl) { out.push('</ol>'); inOl = false; } out.push('<ul class="md-ul">'); inUl = true; }
      out.push(`<li>${inlineHtml(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
    } else if (/^\s*\d+\.\s+(.+)/.test(line)) {
      if (!inOl) { if (inUl) { out.push('</ul>'); inUl = false; } out.push('<ol class="md-ul">'); inOl = true; }
      out.push(`<li>${inlineHtml(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
    } else if (/^\|/.test(line.trim()) && !/^[\s|:\-]+$/.test(line.replace(/\|/g, ''))) {
      closeList();
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      out.push(`<div class="md-table-row">${cells.map(c => `<span class="md-table-cell">${inlineHtml(c)}</span>`).join('')}</div>`);
    } else if (!line.trim()) {
      closeList();
      out.push('<div class="md-spacer"></div>');
    } else {
      closeList();
      out.push(`<p class="md-p">${inlineHtml(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

function calendarHTML(plant) {
  const monthHeaders = ALL_MONTHS.map(m =>
    `<th class="cal-th">${MONTH_LABELS[m]}</th>`
  ).join('');

  const rows = ACTIVITIES.map(act => {
    const cells = ALL_MONTHS.map(m => {
      const active = plant[act.key]?.includes(m);
      return active
        ? `<td style="background:${act.bg};border:1px solid ${act.border};"></td>`
        : `<td style="border:1px solid #e8e8e8;"></td>`;
    }).join('');
    return `
      <tr>
        <td class="cal-row-label" style="color:${act.color};">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${act.color};margin-right:5px;vertical-align:middle;"></span>
          ${ACTIVITY_COLORS[act.key]?.label || act.key}
        </td>
        ${cells}
      </tr>`;
  }).join('');

  return `
    <table class="cal-table">
      <thead>
        <tr>
          <th class="cal-label-th"></th>
          ${monthHeaders}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function infoRowHTML(label, value) {
  if (!value && value !== 0) return '';
  return `
    <div class="info-row">
      <span class="info-label">${esc(label)}</span>
      <span class="info-value">${esc(value)}</span>
    </div>`;
}

function sectionHTML(title, content) {
  if (!content || content.trim() === '') return '';
  return `
    <div class="section">
      <div class="section-title">${title}</div>
      ${content}
    </div>`;
}

export function printPlantPdf(plant, imageUrl, adviceText = null, historyText = null) {
  const groupeColor = GROUPE_COLORS[plant.groupe] || '#78909C';
  const now = new Date();

  // ── Hero image or placeholder ───────────────────────────────────────────────
  const heroImg = imageUrl
    ? `<img src="${esc(imageUrl)}" alt="${esc(plant.name)}" class="hero-img" />`
    : `<div class="hero-placeholder" style="background:linear-gradient(135deg,${groupeColor}22,${groupeColor}55);">
         <span style="font-size:64px;color:${groupeColor};">${esc(plant.name.charAt(0).toUpperCase())}</span>
       </div>`;

  // ── Badges ──────────────────────────────────────────────────────────────────
  const badges = [
    plant.groupe
      ? `<span class="badge" style="background:${groupeColor}22;color:${groupeColor};border:1px solid ${groupeColor}66;">${esc(plant.groupe)}</span>`
      : '',
    plant.family
      ? `<span class="badge" style="background:#f3f4f6;color:#374151;border:1px solid #d1d5db;">${esc(plant.family)}</span>`
      : '',
    plant.sol?.bisannuelle
      ? `<span class="badge" style="background:#fce7f3;color:#9d174d;border:1px solid #fbcfe8;">Bisannuelle</span>`
      : '',
  ].join('');

  // ── Calendrier ──────────────────────────────────────────────────────────────
  const calSection = sectionHTML('📅 Calendrier de culture', calendarHTML(plant));

  // ── Températures ────────────────────────────────────────────────────────────
  const tempOutMin = plant.tempOutdoorMin !== null ? `${plant.tempOutdoorMin}°C` : '—';
  const tempOutMax = plant.tempOutdoorMax !== null ? `${plant.tempOutdoorMax}°C` : '—';
  const tempGhMin  = plant.tempGreenhouseMin !== null ? `${plant.tempGreenhouseMin}°C` : '—';
  const tempGhMax  = plant.tempGreenhouseMax !== null ? `${plant.tempGreenhouseMax}°C` : '—';
  const tempSection = sectionHTML('🌡️ Températures', `
    <div class="temp-grid">
      <div class="temp-card temp-outdoor">
        <div class="temp-label">🌳 Plein air</div>
        <div class="temp-range">${tempOutMin} — ${tempOutMax}</div>
      </div>
      <div class="temp-card temp-greenhouse">
        <div class="temp-label">🏠 Sous abri</div>
        <div class="temp-range">${tempGhMin} — ${tempGhMax}</div>
      </div>
    </div>`);

  // ── Entretien ────────────────────────────────────────────────────────────────
  const entretienContent = [
    infoRowHTML('💧 Arrosage', plant.arrosage),
    infoRowHTML('☀️ Exposition', plant.exposition),
    infoRowHTML('⏱ Durée de croissance', plant.dureeCroissanceJours ? `${plant.dureeCroissanceJours} jours` : null),
  ].join('');
  const entretienSection = sectionHTML('🌿 Entretien', entretienContent);

  // ── Infos complémentaires ────────────────────────────────────────────────────
  const infosContent = [
    infoRowHTML('Profondeur de semis', plant.infos?.profondeurSemisCm ? `${plant.infos.profondeurSemisCm} cm` : null),
    plant.infos?.germinationJoursMin
      ? infoRowHTML('Germination', `${plant.infos.germinationJoursMin}–${plant.infos.germinationJoursMax || plant.infos.germinationJoursMin} jours`)
      : '',
    infoRowHTML('Hauteur', plant.infos?.hauteurPlantsCm ? `${plant.infos.hauteurPlantsCm} cm` : null),
    infoRowHTML('Facilité germination', plant.infos?.faciliteGermination),
    infoRowHTML('Facilité culture', plant.infos?.faciliteCulture),
  ].join('');
  const infosSection = infosContent.trim() ? sectionHTML('📋 Informations complémentaires', infosContent) : '';

  // ── Sous-variétés ────────────────────────────────────────────────────────────
  const svSection = plant.sousVarietes?.length > 0
    ? sectionHTML('🌿 Sous-variétés',
        `<div class="tags-wrap">${plant.sousVarietes.map(v => `<span class="tag">${esc(v)}</span>`).join('')}</div>`)
    : '';

  // ── Type de semis ─────────────────────────────────────────────────────────────
  const semis = plant.typesSemis || {};
  const semisTags = [
    semis.poquet && '<span class="tag">En poquet</span>',
    semis.ligne  && '<span class="tag">En ligne</span>',
    semis.volee  && '<span class="tag">À la volée</span>',
    semis.surface && '<span class="tag">En surface</span>',
  ].filter(Boolean).join('');
  const semisSection = semisTags ? sectionHTML('🌱 Type de semis', `<div class="tags-wrap">${semisTags}</div>`) : '';

  // ── Sol et compost ────────────────────────────────────────────────────────────
  const solContent = [
    plant.sol?.typeSol?.length > 0 ? infoRowHTML('Type de sol', plant.sol.typeSol.join(', ')) : '',
    infoRowHTML('Compost', plant.sol?.compostType),
  ].join('');
  const solSection = solContent.trim() ? sectionHTML('🪱 Sol et compost', solContent) : '';

  // ── Distances ─────────────────────────────────────────────────────────────────
  const distContent = [
    infoRowHTML('Entre les plants', plant.distances?.distanceRangCm ? `${plant.distances.distanceRangCm} cm` : null),
    infoRowHTML('Entre les rangs', plant.distances?.distanceRangsCm ? `${plant.distances.distanceRangsCm} cm` : null),
    infoRowHTML('Éclaircissage', plant.distances?.eclaircissageCm ? `${plant.distances.eclaircissageCm} cm` : null),
  ].join('');
  const distSection = distContent.trim() ? sectionHTML('📏 Distances de plantation', distContent) : '';

  // ── Associations ─────────────────────────────────────────────────────────────
  const favorables   = plant.associations?.favorables   || [];
  const defavorables = plant.associations?.defavorables || [];
  let assocContent = '';
  if (favorables.length || defavorables.length) {
    assocContent = `
      <div class="assoc-row">
        <div class="assoc-col">
          <div class="assoc-col-title" style="color:#2E7D32;">✅ Favorables</div>
          <div class="tags-wrap">
            ${favorables.length
              ? favorables.map(a => `<span class="tag tag-fav">${esc(a)}</span>`).join('')
              : '<span style="color:#999;font-size:12px;">—</span>'}
          </div>
        </div>
        <div class="assoc-col">
          <div class="assoc-col-title" style="color:#C62828;">❌ Défavorables</div>
          <div class="tags-wrap">
            ${defavorables.length
              ? defavorables.map(a => `<span class="tag tag-def">${esc(a)}</span>`).join('')
              : '<span style="color:#999;font-size:12px;">—</span>'}
          </div>
        </div>
      </div>`;
  }
  const assocSection = assocContent ? sectionHTML('🤝 Associations de plantes', assocContent) : '';

  // ── Conseil IA ────────────────────────────────────────────────────────────────
  const adviceSection = adviceText
    ? sectionHTML('✨ Conseil IA', `<div class="ai-block ai-advice">${markdownToHtml(adviceText)}</div>`)
    : '';

  // ── Historique IA ─────────────────────────────────────────────────────────────
  const historySection = historyText
    ? sectionHTML('📜 Historique & origine', `<div class="ai-block ai-history">${markdownToHtml(historyText)}</div>`)
    : '';

  // ── Full HTML ────────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${esc(plant.name)} — Jardinator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #212121; padding: 12mm; max-width: 210mm; }

    /* ── Hero ── */
    .hero { display: flex; gap: 24px; margin-bottom: 28px; align-items: flex-start; }
    .hero-img { width: 210px; height: 160px; object-fit: cover; border-radius: 12px; flex-shrink: 0; box-shadow: 0 2px 12px rgba(0,0,0,0.12); }
    .hero-placeholder { width: 210px; height: 160px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .hero-info { flex: 1; }
    .plant-name { font-size: 28px; font-weight: 800; color: #1B5E20; line-height: 1.15; }
    .plant-latin { font-style: italic; color: #666; font-size: 15px; margin: 5px 0 10px; }
    .badges { margin-bottom: 10px; }
    .badge { display: inline-block; padding: 3px 11px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-right: 5px; }
    .description { color: #444; line-height: 1.65; font-size: 13px; margin-top: 8px; }

    /* ── Sections ── */
    .section { margin-bottom: 22px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: 700; color: #2E7D32; border-bottom: 2px solid #c8e6c9; padding-bottom: 5px; margin-bottom: 10px; }

    /* ── Calendar ── */
    .cal-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .cal-th { background: #388E3C; color: white; padding: 5px 3px; text-align: center; border: 1px solid #1B5E20; font-size: 9px; min-width: 30px; }
    .cal-label-th { background: #1B5E20; min-width: 120px; }
    .cal-row-label { font-size: 10px; padding: 4px 6px; white-space: nowrap; border: 1px solid #e0e0e0; }
    .cal-table td { height: 18px; }

    /* ── Temperatures ── */
    .temp-grid { display: flex; gap: 12px; }
    .temp-card { flex: 1; padding: 10px 14px; border-radius: 8px; text-align: center; }
    .temp-outdoor { background: #e8f5e9; }
    .temp-greenhouse { background: #e3f2fd; }
    .temp-label { font-size: 11px; font-weight: 600; color: #555; margin-bottom: 4px; }
    .temp-range { font-size: 18px; font-weight: 700; color: #1B5E20; }

    /* ── Info rows ── */
    .info-row { display: flex; align-items: baseline; padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
    .info-label { width: 170px; color: #666; font-size: 12px; flex-shrink: 0; }
    .info-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }

    /* ── Tags ── */
    .tags-wrap { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
    .tag { display: inline-block; padding: 3px 10px; border-radius: 14px; font-size: 11px; font-weight: 500; background: #e8f5e9; color: #2E7D32; border: 1px solid #a5d6a7; }
    .tag-fav { background: #E8F5E9; color: #2E7D32; border-color: #a5d6a7; }
    .tag-def { background: #FFEBEE; color: #C62828; border-color: #ef9a9a; }

    /* ── Associations ── */
    .assoc-row { display: flex; gap: 20px; }
    .assoc-col { flex: 1; }
    .assoc-col-title { font-size: 12px; font-weight: 700; margin-bottom: 6px; }

    /* ── Blocs IA ── */
    .ai-block { border-radius: 8px; padding: 14px 16px; font-size: 12px; line-height: 1.7; }
    .ai-advice { background: #f0fdf4; border: 1px solid #86efac; }
    .ai-history { background: #fffbeb; border: 1px solid #fde68a; }

    /* ── Markdown dans les blocs IA ── */
    .md-h2 { font-size: 13px; font-weight: 700; margin: 14px 0 6px; padding-bottom: 3px; border-bottom: 1.5px solid rgba(0,0,0,0.08); }
    .ai-advice .md-h2 { color: #166534; border-bottom-color: #86efac; }
    .ai-history .md-h2 { color: #92400e; border-bottom-color: #fde68a; }
    .md-h3 { font-size: 12px; font-weight: 700; margin: 10px 0 4px; }
    .ai-advice .md-h3 { color: #15803d; }
    .ai-history .md-h3 { color: #78350f; }
    .md-h4 { font-size: 11px; font-weight: 600; margin: 8px 0 3px; }
    .md-p { margin: 0 0 6px; }
    .md-ul { margin: 4px 0 8px 20px; padding: 0; }
    .md-ul li { margin-bottom: 3px; }
    .ai-advice .md-ul li::marker { color: #16a34a; }
    .ai-history .md-ul li::marker { color: #d97706; }
    .md-hr { border: none; border-top: 1px solid rgba(0,0,0,0.08); margin: 10px 0; }
    .md-spacer { height: 6px; }
    .md-table-row { display: flex; border-bottom: 1px solid rgba(0,0,0,0.06); }
    .md-table-cell { flex: 1; padding: 3px 6px; font-size: 11px; }

    /* ── Footer ── */
    .footer { margin-top: 28px; text-align: right; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 8px; }

    @media print {
      body { padding: 8mm; }
      @page { margin: 10mm; size: A4 portrait; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Hero -->
  <div class="hero">
    ${heroImg}
    <div class="hero-info">
      <div class="plant-name">${esc(plant.name)}</div>
      ${plant.nameLatin ? `<div class="plant-latin">${esc(plant.nameLatin)}</div>` : ''}
      <div class="badges">${badges}</div>
      ${plant.description ? `<div class="description">${esc(plant.description)}</div>` : ''}
    </div>
  </div>

  ${calSection}
  ${tempSection}
  ${entretienSection}
  ${infosSection}
  ${svSection}
  ${semisSection}
  ${solSection}
  ${distSection}
  ${assocSection}
  ${adviceSection}
  ${historySection}

  <div class="footer">
    Généré le ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · Jardinator 🌱
  </div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) {
    alert('Veuillez autoriser les pop-ups pour exporter en PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}
