/**
 * icsService.js
 * Génère un fichier .ics (iCalendar) à partir des données de plantes Jardinator.
 * Compatible Google Agenda, Apple Calendar, Outlook, Thunderbird.
 */

import semisData from '../data/semis.json';
import legumesData from '../data/legumes.json';

// ── Mois FR → numéro ─────────────────────────────────────────────────────────

const MONTH_MAP = {
  'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
  'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
  'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12,
};

function monthNum(name) {
  return MONTH_MAP[name.trim().toLowerCase()] || null;
}

// Convertit une liste de mois FR (chaîne "mars, avril" ou tableau) en tableau de numéros
function parseMonths(value) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : value.split(',');
  return arr.map(m => monthNum(m)).filter(Boolean);
}

// ── Formatage ICS ─────────────────────────────────────────────────────────────

/** Formate une date en YYYYMMDD (événement journée entière). */
function icsDate(year, month, day = 1) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}${m}${d}`;
}

/** Timestamp actuel en format ICS. */
function icsNow() {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** Échappe les caractères spéciaux ICS. */
function icsEscape(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Découpe les lignes ICS à 75 octets (RFC 5545). */
function foldLine(line) {
  const maxLen = 75;
  if (line.length <= maxLen) return line;
  let result = '';
  let pos = 0;
  while (pos < line.length) {
    if (pos === 0) {
      result += line.slice(0, maxLen) + '\r\n';
      pos = maxLen;
    } else {
      result += ' ' + line.slice(pos, pos + maxLen - 1) + '\r\n';
      pos += maxLen - 1;
    }
  }
  return result;
}

/** Construit un VEVENT journée entière avec rappel optionnel. */
function buildEvent({ uid, summary, description, dtstart, dtend, categories, alarm }) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsNow()}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `CATEGORIES:${icsEscape(categories)}`,
    'TRANSP:TRANSPARENT',
  ];

  if (alarm) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape(summary)}`,
      `TRIGGER:-P${alarm}D`,  // alarm jours avant
      'END:VALARM',
    );
  }

  lines.push('END:VEVENT');
  return lines.map(foldLine).join('\r\n');
}

// ── Construction des événements ───────────────────────────────────────────────

/**
 * @param {object} options
 * @param {string[]} options.plantNames   — noms de plantes à exporter
 * @param {number}   options.year         — année cible
 * @param {boolean}  options.semisInt     — inclure semis intérieur
 * @param {boolean}  options.semisExt     — inclure semis extérieur
 * @param {boolean}  options.plantation   — inclure plantation
 * @param {boolean}  options.recolte      — inclure récolte
 * @param {number}   options.alarmDays    — jours de rappel (0 = pas de rappel)
 * @returns {string} contenu du fichier .ics
 */
export function generateIcs(options) {
  const {
    plantNames,
    year,
    semisInt   = true,
    semisExt   = true,
    plantation = true,
    recolte    = true,
    alarmDays  = 3,
  } = options;

  const events = [];
  const stamp  = icsNow();
  const alarm  = alarmDays > 0 ? alarmDays : null;

  // Index legumes.json par nom pour accès rapide
  const legumesByName = {};
  legumesData.forEach(l => { legumesByName[l.nom] = l; });

  for (const name of plantNames) {
    const semis  = semisData[name]  || {};
    const legume = legumesByName[name] || {};

    // 1. Semis intérieur
    if (semisInt) {
      for (const month of parseMonths(semis.semis_interieur)) {
        const dtstart = icsDate(year, month, 1);
        const dtend   = icsDate(year, month, 2);
        events.push(buildEvent({
          uid: `jardinator-semis-int-${name}-${year}-${month}@jardinator`,
          summary: `🌱 Semis intérieur — ${name}`,
          description: `Période optimale pour les semis en intérieur de ${name}. Mois : ${month}/${year}.`,
          dtstart, dtend,
          categories: 'JARDINAGE,SEMIS,INTÉRIEUR',
          alarm,
        }));
      }
    }

    // 2. Semis extérieur
    if (semisExt) {
      for (const month of parseMonths(semis.semis_exterieur)) {
        const dtstart = icsDate(year, month, 1);
        const dtend   = icsDate(year, month, 2);
        events.push(buildEvent({
          uid: `jardinator-semis-ext-${name}-${year}-${month}@jardinator`,
          summary: `🌿 Semis extérieur — ${name}`,
          description: `Période optimale pour les semis en extérieur de ${name}. Mois : ${month}/${year}.`,
          dtstart, dtend,
          categories: 'JARDINAGE,SEMIS,EXTÉRIEUR',
          alarm,
        }));
      }
    }

    // 3. Plantation (mois_plantation dans legumes.json)
    if (plantation && legume.mois_plantation) {
      for (const month of parseMonths(legume.mois_plantation)) {
        const dtstart = icsDate(year, month, 10);  // vers le 10 du mois
        const dtend   = icsDate(year, month, 11);
        events.push(buildEvent({
          uid: `jardinator-plantation-${name}-${year}-${month}@jardinator`,
          summary: `🪴 Plantation — ${name}`,
          description: `Période de plantation de ${name}. Mois : ${month}/${year}.${legume.description ? '\n' + legume.description : ''}`,
          dtstart, dtend,
          categories: 'JARDINAGE,PLANTATION',
          alarm,
        }));
      }
    }

    // 4. Récolte (mois_recolte dans legumes.json) — événement sur le 1er du mois
    if (recolte && legume.mois_recolte) {
      const months = parseMonths(legume.mois_recolte);
      if (months.length > 0) {
        // Créer un événement par mois de récolte
        for (const month of months) {
          const dtstart = icsDate(year, month, 1);
          const dtend   = icsDate(year, month, 2);
          events.push(buildEvent({
            uid: `jardinator-recolte-${name}-${year}-${month}@jardinator`,
            summary: `🌾 Récolte — ${name}`,
            description: `Période de récolte de ${name}. Mois : ${month}/${year}.`,
            dtstart, dtend,
            categories: 'JARDINAGE,RÉCOLTE',
            alarm: null,  // pas de rappel sur les récoltes (elles durent longtemps)
          }));
        }
      }
    }
  }

  if (events.length === 0) return null;

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jardinator//Calendrier du jardinier//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Jardinator ${year}`,
    `X-WR-CALDESC:Semis\\, plantations et récoltes générés par Jardinator`,
    'X-WR-TIMEZONE:Europe/Paris',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return calendar;
}

/** Déclenche le téléchargement du fichier .ics. */
export function downloadIcs(content, year) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `jardinator-agenda-${year}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
