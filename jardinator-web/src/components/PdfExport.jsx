import { useState } from 'react';
import useStore from '../store/useStore';
import { getAllPlants, GROUPE_COLORS, ACTIVITY_COLORS, MONTH_LABELS } from '../services/vegetableService';

const ALL_MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];

const ACTIVITY_KEYS = [
  { key: 'sowingIndoor',  short: 'SI', color: '#1976D2' },
  { key: 'sowingOutdoor', short: 'SE', color: '#F57C00' },
  { key: 'planting',      short: 'Pl', color: '#388E3C' },
  { key: 'harvest',       short: 'Rc', color: '#C62828' },
];

/** Generate a printable HTML page and open print dialog */
function printCalendar(plants, title) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const rows = plants.map(plant => {
    const color = GROUPE_COLORS[plant.groupe] || '#78909C';
    const cells = ALL_MONTHS.map(m => {
      const acts = ACTIVITY_KEYS.filter(a => plant[a.key].includes(m));
      const isCurrent = m === currentMonth;
      const cellBg = isCurrent ? '#f0fdf4' : 'white';
      const content = acts.length > 0
        ? acts.map(a => `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${a.color};margin:1px;font-size:9px;line-height:14px;color:white;text-align:center">${a.short[0]}</span>`).join('')
        : '';
      return `<td style="background:${cellBg};border:1px solid #e0e0e0;text-align:center;padding:3px 2px;">${content}</td>`;
    }).join('');

    return `
      <tr>
        <td style="padding:4px 8px;border:1px solid #e0e0e0;white-space:nowrap;max-width:200px;overflow:hidden;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px;vertical-align:middle;"></span>
          <strong style="font-size:11px">${plant.name}</strong>
          <span style="color:#888;font-size:9px;display:block;padding-left:15px">${plant.nameLatin}</span>
        </td>
        ${cells}
      </tr>`;
  }).join('');

  const monthHeaders = ALL_MONTHS.map(m => {
    const isCurrent = m === currentMonth;
    return `<th style="background:${isCurrent ? '#2E7D32' : '#388E3C'};color:white;padding:6px 4px;font-size:10px;text-align:center;border:1px solid #1B5E20;min-width:36px">${MONTH_LABELS[m]}</th>`;
  }).join('');

  const legend = ACTIVITY_KEYS.map(a =>
    `<span style="margin-right:12px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${a.color};margin-right:3px;vertical-align:middle"></span><span style="font-size:10px">${ACTIVITY_COLORS[a.key].label}</span></span>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #212121; padding: 12mm; }
    h1 { font-size: 18px; color: #2E7D32; margin-bottom: 4px; }
    .subtitle { color: #555; font-size: 11px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { white-space: nowrap; }
    .legend { margin: 8px 0; }
    @media print {
      body { padding: 8mm; }
      @page { margin: 8mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <h1>🌱 Jardinator — ${title}</h1>
  <div class="subtitle">
    Généré le ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · ${plants.length} plante${plants.length !== 1 ? 's' : ''}
  </div>
  <div class="legend">${legend}</div>
  <table>
    <thead>
      <tr>
        <th style="background:#1B5E20;color:white;padding:6px 8px;font-size:10px;text-align:left;border:1px solid #1B5E20;min-width:180px">Plante</th>
        ${monthHeaders}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1200,height=800');
  if (!win) {
    alert('Veuillez autoriser les pop-ups pour exporter en PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

export default function PdfExport() {
  const { plants, search, groupe, family, climateZone } = useStore();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState('filtered'); // 'filtered' | 'all'

  const hasFilters = !!(search || groupe || family || climateZone);

  const handleExport = () => {
    const list = scope === 'all' ? getAllPlants() : plants;
    const parts = [];
    if (scope === 'filtered' && hasFilters) parts.push('vue filtrée');
    else parts.push('calendrier annuel');
    const title = parts.join(' — ');
    printCalendar(list, title.charAt(0).toUpperCase() + title.slice(1));
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="export-btn"
        onClick={() => setOpen(o => !o)}
        title="Exporter le calendrier en PDF"
      >
        📄 PDF
      </button>

      {open && (
        <div className="pdf-dropdown">
          <div className="pdf-dropdown-title">📄 Exporter en PDF</div>
          <label className="pdf-radio-label">
            <input type="radio" name="scope" value="filtered" checked={scope === 'filtered'} onChange={() => setScope('filtered')} />
            Vue actuelle ({plants.length} plante{plants.length !== 1 ? 's' : ''})
            {hasFilters && <span className="pdf-filter-badge"> (filtrée)</span>}
          </label>
          <label className="pdf-radio-label">
            <input type="radio" name="scope" value="all" checked={scope === 'all'} onChange={() => setScope('all')} />
            Toutes les plantes ({getAllPlants().length})
          </label>
          <p className="pdf-note">💡 Une boîte de dialogue d'impression s'ouvrira. Choisissez « Enregistrer en PDF ».</p>
          <button className="gp-btn-primary" style={{ width: '100%' }} onClick={handleExport}>
            🖨️ Générer
          </button>
        </div>
      )}
    </div>
  );
}
