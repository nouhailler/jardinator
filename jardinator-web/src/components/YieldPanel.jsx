import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getYieldsForYear, getYieldYears, saveYieldEntry, deleteYieldEntry,
  clearYieldsForYear, newEntry, buildSuggestionPrompt,
  askOllamaYieldStream, askOpenRouterYieldStream,
  buildYearSummaryPrompt, getYearBilan, saveYearBilan, deleteYearBilan,
} from '../services/yieldService';
import { getOllamaUrl, getOllamaModel } from '../services/ollamaService';
import { getApiKey, getSavedModel } from '../services/aiService';
import { getAllPlants } from '../services/vegetableService';

const UNITS = ['kg', 'g', 'nombre', 'litre'];
const CURRENT_YEAR = new Date().getFullYear();

// ── Stats visuelles ───────────────────────────────────────────────────────────
function YieldStats({ entries }) {
  const totals = {};
  let bestEntry = null, bestVal = -1;

  entries.forEach(e => {
    const val = parseFloat(e.harvested);
    if (!isNaN(val) && val > 0 && e.unit) {
      totals[e.unit] = (totals[e.unit] || 0) + val;
      if (val > bestVal) { bestVal = val; bestEntry = e; }
    }
  });

  const totalNamed  = entries.filter(e => e.plantName).length;
  const withHarvest = entries.filter(e => parseFloat(e.harvested) > 0).length;

  return (
    <div className="yield-stats-bar">
      {Object.entries(totals).map(([unit, total]) => (
        <div key={unit} className="yield-stat-chip">
          <span className="yield-stat-val">{Number.isInteger(total) ? total : total.toFixed(1)}</span>
          <span className="yield-stat-unit"> {unit}</span>
        </div>
      ))}
      {bestEntry && (
        <div className="yield-stat-chip highlight">
          🏆 <strong>{bestEntry.plantName}</strong>{bestEntry.variety ? ` · ${bestEntry.variety}` : ''}
        </div>
      )}
      <div className="yield-stat-chip muted">
        {withHarvest}/{totalNamed} plante{totalNamed > 1 ? 's' : ''} récoltée{withHarvest > 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ── Bilan annuel IA ───────────────────────────────────────────────────────────
function YearSummary({ entries, year, provider }) {
  const [text, setText]     = useState(() => getYearBilan(year)?.text || '');
  const [status, setStatus] = useState(() => getYearBilan(year) ? 'done' : 'idle');
  const [error, setError]   = useState('');
  const abortRef            = useRef(false);

  useEffect(() => {
    const saved = getYearBilan(year);
    setText(saved?.text || '');
    setStatus(saved ? 'done' : 'idle');
    setError('');
  }, [year]);

  const ollamaModel = getOllamaModel();
  const orKey       = getApiKey();
  const orModel     = getSavedModel();
  const hasEntries  = entries.filter(e => e.plantName).length > 0;

  const canGenerate = hasEntries && (
    provider === 'ollama' ? !!ollamaModel : !!(orKey && orModel)
  );

  async function generate() {
    setStatus('loading');
    setError('');
    abortRef.current = false;
    const prompt = buildYearSummaryPrompt(entries, year);
    let full = '';

    try {
      const stream = provider === 'ollama'
        ? askOllamaYieldStream(prompt, getOllamaUrl(), ollamaModel)
        : askOpenRouterYieldStream(prompt);

      for await (const chunk of stream) {
        if (abortRef.current) break;
        full += chunk;
        setText(full);
      }
      setStatus('done');
      if (full) saveYearBilan(year, full);
    } catch (err) {
      const msgs = { NO_KEY: 'Clé API manquante.', NO_MODEL: 'Modèle non configuré.', BAD_KEY: 'Clé invalide.', RATE_LIMIT: '⏳ Limite atteinte — attendez ~60s.' };
      setError(msgs[err.message] || err.message);
      setStatus('error');
    }
  }

  function stop()  { abortRef.current = true; setStatus('done'); }
  function remove() { deleteYearBilan(year); setText(''); setStatus('idle'); }

  return (
    <div className="yield-summary">
      <div className="yield-summary-header">
        <span className="yield-summary-title">✨ Bilan IA {year}</span>
        <div className="yield-summary-actions">
          {status === 'loading'
            ? <button className="yield-btn-stop" onClick={stop}>⏹ Arrêter</button>
            : (
              <button
                className="yield-btn-generate"
                onClick={generate}
                disabled={!canGenerate}
                title={canGenerate ? `Générer le bilan ${year}` : 'Ajoutez des plantes ou configurez un modèle IA dans Paramètres'}
              >
                {text ? '🔄 Régénérer' : '✨ Générer le bilan'}
              </button>
            )
          }
          {text && status !== 'loading' && (
            <button className="yield-btn-delete-bilan" onClick={remove} title="Supprimer le bilan">🗑</button>
          )}
        </div>
      </div>

      {error && <div className="yield-suggestion-error">{error}</div>}

      {text ? (
        <div className="yield-summary-text md-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          {status === 'loading' && <span className="chat-cursor">▋</span>}
        </div>
      ) : status === 'idle' && hasEntries && (
        <p className="yield-summary-hint">
          Synthèse IA de vos {entries.filter(e => e.plantName).length} cultures — points forts, axes d'amélioration et plan pour {year + 1}.
        </p>
      )}
    </div>
  );
}

// ── Comparaison inter-années ──────────────────────────────────────────────────
function YearComparison({ allYears, currentYear }) {
  const sortedYears = [...allYears].sort((a, b) => Number(b) - Number(a)).slice(0, 4);

  const table = {};
  sortedYears.forEach(y => {
    getYieldsForYear(y).forEach(e => {
      if (!e.plantName || !e.harvested || parseFloat(e.harvested) <= 0) return;
      if (!table[e.plantName]) table[e.plantName] = {};
      table[e.plantName][y] = `${e.harvested} ${e.unit}`;
    });
  });

  const plants = Object.keys(table).sort();
  if (plants.length === 0) return null;

  return (
    <div className="yield-comparison">
      <div className="yield-comparison-title">📊 Évolution inter-années</div>
      <div className="yield-comparison-wrap">
        <table className="yield-comparison-table">
          <thead>
            <tr>
              <th className="yield-comp-th">Plante</th>
              {sortedYears.map(y => (
                <th key={y} className={`yield-comp-th${Number(y) === Number(currentYear) ? ' current' : ''}`}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plants.map(plant => (
              <tr key={plant} className="yield-comp-row">
                <td className="yield-comp-plant">{plant}</td>
                {sortedYears.map(y => (
                  <td key={y} className={`yield-comp-val${Number(y) === Number(currentYear) ? ' current' : ''}`}>
                    {table[plant][y] || <span className="yield-comp-empty">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Champ éditable inline avec sauvegarde sur blur/Enter
function InlineField({ value, onChange, onSave, placeholder, className = '', type = 'text', list }) {
  return (
    <input
      type={type}
      className={`yield-inline-input ${className}`}
      value={value}
      placeholder={placeholder}
      list={list}
      onChange={e => onChange(e.target.value)}
      onBlur={onSave}
      onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } }}
    />
  );
}

// Suggestion IA pour une entrée
function SuggestionCell({ entry, year, provider }) {
  const [text, setText]     = useState(entry.suggestion || '');
  const [status, setStatus] = useState(entry.suggestion ? 'done' : 'idle');
  const [error, setError]   = useState('');
  const abortRef            = useRef(false);

  const ollamaModel = getOllamaModel();
  const orKey       = getApiKey();
  const orModel     = getSavedModel();
  const activeModel = provider === 'ollama' ? ollamaModel : orModel;

  const canGenerate = entry.plantName && (
    provider === 'ollama' ? !!ollamaModel
    : provider === 'openrouter' ? !!(orKey && orModel)
    : false
  );

  async function generate() {
    setStatus('loading');
    setError('');
    abortRef.current = false;
    const prompt = buildSuggestionPrompt(entry, year);
    let full = '';

    try {
      const stream = provider === 'ollama'
        ? askOllamaYieldStream(prompt, getOllamaUrl(), ollamaModel)
        : askOpenRouterYieldStream(prompt);

      for await (const chunk of stream) {
        if (abortRef.current) break;
        full += chunk;
        setText(full);
      }
      setStatus('done');

      // Persister la suggestion dans l'entrée
      if (full) {
        const updated = {
          ...entry,
          suggestion: full,
          suggestionModel: activeModel,
          suggestionProvider: provider,
          updatedAt: new Date().toISOString(),
        };
        saveYieldEntry(year, updated);
      }
    } catch (err) {
      const msgs = { NO_KEY: 'Clé API manquante.', NO_MODEL: 'Modèle non configuré.', BAD_KEY: 'Clé invalide.', RATE_LIMIT: '⏳ Limite atteinte — attendez ~60s.' };
      setError(msgs[err.message] || err.message);
      setStatus('error');
    }
  }

  function stop() { abortRef.current = true; setStatus('done'); }

  // Sync quand l'entrée change (ex: sauvegarde depuis parent)
  useEffect(() => {
    if (entry.suggestion && entry.suggestion !== text) {
      setText(entry.suggestion);
      setStatus('done');
    }
  }, [entry.suggestion]);

  return (
    <div className="yield-suggestion-cell">
      {text ? (
        <div className="yield-suggestion-text md-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          {status === 'loading' && <span className="chat-cursor">▋</span>}
        </div>
      ) : (
        status === 'idle' && (
          <span className="yield-suggestion-placeholder">—</span>
        )
      )}
      {status === 'error' && <div className="yield-suggestion-error">{error}</div>}
      <div className="yield-suggestion-actions">
        {status === 'loading'
          ? <button className="yield-btn-stop" onClick={stop}>⏹</button>
          : (
            <button
              className="yield-btn-generate"
              onClick={generate}
              disabled={!canGenerate}
              title={canGenerate ? 'Générer une suggestion IA' : 'Configurez un modèle IA dans Paramètres'}
            >
              {text ? '🔄' : '✨'} {text ? 'Régénérer' : 'Suggestion IA'}
            </button>
          )
        }
      </div>
    </div>
  );
}

export default function YieldPanel() {
  const [year, setYear]         = useState(CURRENT_YEAR);
  const [entries, setEntries]   = useState(() => getYieldsForYear(CURRENT_YEAR));
  const [years, setYears]       = useState(() => {
    const existing = getYieldYears();
    return existing.includes(String(CURRENT_YEAR)) ? existing : [String(CURRENT_YEAR), ...existing];
  });
  const [provider, setProvider] = useState('ollama');
  const [plantNames]            = useState(() => {
    try { return [...new Set(getAllPlants().map(p => p.name))].sort(); }
    catch { return []; }
  });

  function switchYear(y) {
    setYear(Number(y));
    setEntries(getYieldsForYear(y));
  }

  function addEntry() {
    const e = newEntry();
    const updated = saveYieldEntry(year, e);
    setEntries([...updated]);
    refreshYears();
  }

  function refreshYears() {
    const existing = getYieldYears();
    setYears(existing.includes(String(year)) ? existing : [String(year), ...existing]);
  }

  function updateField(entry, field, value) {
    const updated = { ...entry, [field]: value, updatedAt: new Date().toISOString() };
    saveYieldEntry(year, updated);
    setEntries(getYieldsForYear(year));
  }

  function handleDelete(id) {
    if (!window.confirm('Supprimer cette entrée ?')) return;
    deleteYieldEntry(year, id);
    setEntries(getYieldsForYear(year));
    refreshYears();
  }

  function handleClearYear() {
    if (!window.confirm(`Effacer toutes les entrées de ${year} ?`)) return;
    clearYieldsForYear(year);
    setEntries([]);
    refreshYears();
  }

  const ollamaModel = getOllamaModel();
  const orKey       = getApiKey();
  const orModel     = getSavedModel();
  const warning = provider === 'ollama' && !ollamaModel
    ? '⚠️ Modèle Ollama non configuré'
    : provider === 'openrouter' && (!orKey || !orModel)
      ? '⚠️ OpenRouter non configuré'
      : null;

  return (
    <div className="yield-panel">

      {/* ── Barre de contrôle ── */}
      <div className="yield-toolbar">
        <div className="yield-toolbar-left">
          <label className="yield-year-label">Année :</label>
          <select
            className="yield-year-select"
            value={year}
            onChange={e => switchYear(e.target.value)}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
            {/* Permettre de naviguer vers une année précédente non encore saisie */}
            {[...Array(5)].map((_, i) => {
              const y = String(CURRENT_YEAR - 1 - i);
              if (years.includes(y)) return null;
              return <option key={y} value={y}>{y} (vide)</option>;
            })}
          </select>

          <button className="yield-btn-add" onClick={addEntry}>
            ➕ Ajouter une plante
          </button>

          {entries.length > 0 && (
            <button className="yield-btn-clear" onClick={handleClearYear} title={`Effacer ${year}`}>
              🗑️ Effacer l'année
            </button>
          )}
        </div>

        <div className="yield-toolbar-right">
          <span className="yield-provider-label">IA :</span>
          <button
            className={`chat-provider-btn ${provider === 'ollama' ? 'active' : ''}`}
            onClick={() => setProvider('ollama')}
          >🖥️ Ollama</button>
          <button
            className={`chat-provider-btn ${provider === 'openrouter' ? 'active' : ''}`}
            onClick={() => setProvider('openrouter')}
          >☁️ OpenRouter</button>
          {warning && <span className="chat-warning">{warning}</span>}
        </div>
      </div>

      {/* ── Datalist pour autocomplete plantes ── */}
      <datalist id="yield-plant-names">
        {plantNames.map(n => <option key={n} value={n} />)}
      </datalist>

      {/* ── Contenu principal ── */}
      {entries.length === 0 ? (
        <div className="yield-empty">
          <div className="yield-empty-icon">🌾</div>
          <p>Aucune entrée pour {year}.<br />Cliquez sur <strong>➕ Ajouter une plante</strong> pour commencer.</p>
        </div>
      ) : (
        <div className="yield-table-wrap">
          <YieldStats entries={entries} />
          <table className="yield-table">
            <thead>
              <tr>
                <th className="yield-th yield-th-plant">Plante / Variété</th>
                <th className="yield-th yield-th-planted">Quantité semée / plantée</th>
                <th className="yield-th yield-th-harvest">Récolte</th>
                <th className="yield-th yield-th-unit">Unité</th>
                <th className="yield-th yield-th-notes">Notes</th>
                <th className="yield-th yield-th-suggestion">✨ Suggestion année suivante ({Number(year) + 1})</th>
                <th className="yield-th yield-th-del"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="yield-row">

                  {/* Plante + variété */}
                  <td className="yield-td yield-td-plant">
                    <InlineField
                      value={entry.plantName}
                      placeholder="Plante…"
                      list="yield-plant-names"
                      onChange={v => updateField(entry, 'plantName', v)}
                      onSave={() => {}}
                    />
                    <InlineField
                      value={entry.variety}
                      placeholder="Variété (optionnel)"
                      onChange={v => updateField(entry, 'variety', v)}
                      onSave={() => {}}
                      className="yield-variety"
                    />
                  </td>

                  {/* Semé/planté */}
                  <td className="yield-td">
                    <InlineField
                      value={entry.planted}
                      placeholder="ex: 10 pieds"
                      onChange={v => updateField(entry, 'planted', v)}
                      onSave={() => {}}
                    />
                  </td>

                  {/* Récolte quantité */}
                  <td className="yield-td">
                    <InlineField
                      value={entry.harvested}
                      placeholder="0"
                      type="text"
                      onChange={v => updateField(entry, 'harvested', v)}
                      onSave={() => {}}
                    />
                  </td>

                  {/* Unité */}
                  <td className="yield-td yield-td-unit">
                    <select
                      className="yield-unit-select"
                      value={entry.unit}
                      onChange={e => updateField(entry, 'unit', e.target.value)}
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>

                  {/* Notes */}
                  <td className="yield-td yield-td-notes">
                    <InlineField
                      value={entry.notes}
                      placeholder="Observations…"
                      onChange={v => updateField(entry, 'notes', v)}
                      onSave={() => {}}
                    />
                  </td>

                  {/* Suggestion IA */}
                  <td className="yield-td yield-td-suggestion">
                    <SuggestionCell
                      key={entry.id}
                      entry={entry}
                      year={year}
                      provider={provider}
                    />
                  </td>

                  {/* Supprimer */}
                  <td className="yield-td yield-td-del">
                    <button
                      className="btn-delete-entry"
                      onClick={() => handleDelete(entry.id)}
                      title="Supprimer"
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <YearSummary entries={entries} year={year} provider={provider} />
          {years.length >= 2 && <YearComparison allYears={years} currentYear={year} />}
        </div>
      )}
    </div>
  );
}
