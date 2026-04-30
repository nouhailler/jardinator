import { useRef } from 'react';
import useStore from '../store/useStore';
import { getAllCached, saveImage } from '../services/imageService';
import { getAllSavedAdvice, saveAdvice } from '../services/aiService';
import { getAllSavedHistory, saveHistory } from '../services/historyService';
import { loadCustomPlants, saveCustomPlant } from '../services/customPlantsService';
import { loadGardenBeds, saveGardenBeds, loadCropHistory, saveCropHistory } from '../services/gardenService';
import { loadFavorites } from '../services/favoritesService';
import { getDiagnosticHistory } from '../services/diagnosticService';
import { getIdentificationHistory } from '../services/identificationService';
import { loadGardenHistory } from '../services/gardenHistoryService';
import { loadCompostData, saveCompostData, loadTreatments, saveTreatmentEntry } from '../services/inputsService';
import { getYieldYears } from '../services/yieldService';

const YIELDS_KEY     = 'jardinator_yields';
const FAVORITES_KEY  = 'jardinator_favorites';
const DIAG_KEY       = 'jardinator_diagnostic_history';
const ID_KEY         = 'jardinator_identification_history';
const GARDEN_AI_KEY  = 'jardinator_garden_ai_history';

function rawLS(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

export default function ExportImport() {
  const fileRef = useRef(null);
  const { imageOverrides, savedAdvice, savedHistory, customPlants, gardenBeds, cropHistory, favorites, init } = useStore();

  const handleExport = () => {
    const bundle = {
      _jardinator: true,
      _version: 4,
      _date: new Date().toISOString(),

      // ── Fiches plantes personnalisées ──────────────────────────────────────
      customPlants: loadCustomPlants(),

      // ── Plan potager ───────────────────────────────────────────────────────
      gardenBeds:   loadGardenBeds(),
      cropHistory:  loadCropHistory(),

      // ── Favoris ────────────────────────────────────────────────────────────
      favorites: [...loadFavorites()],

      // ── Images / conseils IA / historique culture ─────────────────────────
      images:  getAllCached(),
      advice:  getAllSavedAdvice(),
      history: getAllSavedHistory(),

      // ── Historique analyses IA jardin ──────────────────────────────────────
      gardenAiHistory: loadGardenHistory(),

      // ── Diagnostic phytosanitaire ──────────────────────────────────────────
      diagnosticHistory: getDiagnosticHistory(),

      // ── Identification de plantes ──────────────────────────────────────────
      identificationHistory: getIdentificationHistory(),

      // ── Rendements ─────────────────────────────────────────────────────────
      yields: rawLS(YIELDS_KEY) || {},

      // ── Intrants (compost + traitements) ──────────────────────────────────
      compost:    loadCompostData(),
      treatments: loadTreatments(),
    };

    const counts = [
      bundle.customPlants.length        && `${bundle.customPlants.length} fiche(s) perso`,
      bundle.gardenBeds.length          && `${bundle.gardenBeds.length} planche(s)`,
      bundle.favorites.length           && `${bundle.favorites.length} favori(s)`,
      Object.keys(bundle.images).filter(k => bundle.images[k]).length && `${Object.keys(bundle.images).filter(k => bundle.images[k]).length} image(s)`,
      Object.keys(bundle.advice).length && `${Object.keys(bundle.advice).length} conseil(s) IA`,
      bundle.diagnosticHistory.length   && `${bundle.diagnosticHistory.length} diagnostic(s)`,
      bundle.identificationHistory.length && `${bundle.identificationHistory.length} identification(s)`,
      Object.keys(bundle.yields).length && `rendements ${Object.keys(bundle.yields).join('/')}`,
      bundle.treatments.length          && `${bundle.treatments.length} traitement(s)`,
    ].filter(Boolean);

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `jardinator-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (counts.length === 0) alert('Aucune donnée à exporter.');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const bundle = JSON.parse(ev.target.result);
        if (typeof bundle !== 'object') throw new Error('format invalide');

        const counts = [];

        // ── Rétrocompatibilité v2/v3 (images seules ou avec advice/history) ──
        const images  = bundle._jardinator ? bundle.images  : bundle;
        const advice  = bundle._jardinator ? (bundle.advice  || {}) : {};
        const history = bundle._jardinator ? (bundle.history || {}) : {};

        // ── Images ────────────────────────────────────────────────────────────
        let imgCount = 0;
        for (const [plantId, url] of Object.entries(images || {})) {
          saveImage(plantId, url);
          if (url !== null) imgCount++;
        }
        if (imgCount) counts.push(`${imgCount} image(s)`);

        // ── Conseils IA ───────────────────────────────────────────────────────
        let advCount = 0;
        for (const [plantId, text] of Object.entries(advice || {})) {
          if (text) { saveAdvice(plantId, text); advCount++; }
        }
        if (advCount) counts.push(`${advCount} conseil(s) IA`);

        // ── Historique culture ────────────────────────────────────────────────
        let histCount = 0;
        for (const [plantName, text] of Object.entries(history || {})) {
          if (text) { saveHistory(plantName, text); histCount++; }
        }
        if (histCount) counts.push(`${histCount} historique(s) culture`);

        // ── Fiches plantes personnalisées (v4) ────────────────────────────────
        if (Array.isArray(bundle.customPlants) && bundle.customPlants.length > 0) {
          for (const plant of bundle.customPlants) saveCustomPlant(plant);
          counts.push(`${bundle.customPlants.length} fiche(s) personnalisée(s)`);
        }

        // ── Plan potager (v4) ─────────────────────────────────────────────────
        if (Array.isArray(bundle.gardenBeds) && bundle.gardenBeds.length > 0) {
          saveGardenBeds(bundle.gardenBeds);
          counts.push(`${bundle.gardenBeds.length} planche(s) de potager`);
        }
        if (bundle.cropHistory && typeof bundle.cropHistory === 'object') {
          saveCropHistory(bundle.cropHistory);
        }

        // ── Favoris (v4) ──────────────────────────────────────────────────────
        if (Array.isArray(bundle.favorites) && bundle.favorites.length > 0) {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(bundle.favorites));
          counts.push(`${bundle.favorites.length} favori(s)`);
        }

        // ── Historique analyses IA jardin (v4) ────────────────────────────────
        if (Array.isArray(bundle.gardenAiHistory) && bundle.gardenAiHistory.length > 0) {
          localStorage.setItem(GARDEN_AI_KEY, JSON.stringify(bundle.gardenAiHistory));
          counts.push(`${bundle.gardenAiHistory.length} analyse(s) IA jardin`);
        }

        // ── Diagnostic (v4) ───────────────────────────────────────────────────
        if (Array.isArray(bundle.diagnosticHistory) && bundle.diagnosticHistory.length > 0) {
          localStorage.setItem(DIAG_KEY, JSON.stringify(bundle.diagnosticHistory));
          counts.push(`${bundle.diagnosticHistory.length} diagnostic(s)`);
        }

        // ── Identification (v4) ───────────────────────────────────────────────
        if (Array.isArray(bundle.identificationHistory) && bundle.identificationHistory.length > 0) {
          localStorage.setItem(ID_KEY, JSON.stringify(bundle.identificationHistory));
          counts.push(`${bundle.identificationHistory.length} identification(s)`);
        }

        // ── Rendements (v4) ───────────────────────────────────────────────────
        if (bundle.yields && typeof bundle.yields === 'object' && Object.keys(bundle.yields).length > 0) {
          localStorage.setItem(YIELDS_KEY, JSON.stringify(bundle.yields));
          const years = Object.keys(bundle.yields);
          counts.push(`rendements ${years.join('/')}`);
        }

        // ── Intrants — compost (v4) ───────────────────────────────────────────
        if (bundle.compost && typeof bundle.compost === 'object') {
          saveCompostData(bundle.compost);
        }

        // ── Intrants — traitements (v4) ───────────────────────────────────────
        if (Array.isArray(bundle.treatments) && bundle.treatments.length > 0) {
          for (const t of bundle.treatments) saveTreatmentEntry(t);
          counts.push(`${bundle.treatments.length} traitement(s) bio`);
        }

        init();

        if (counts.length > 0) {
          alert(`✅ Importé avec succès :\n• ${counts.join('\n• ')}`);
        } else {
          alert('✅ Fichier importé (aucune donnée nouvelle trouvée).');
        }
      } catch (err) {
        alert(`❌ Fichier invalide.\n${err.message}\nUtilisez un fichier exporté depuis Jardinator.`);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const customCount = customPlants?.length ?? 0;
  const bedsCount   = gardenBeds?.length ?? 0;
  const imgCount    = Object.values(imageOverrides).filter(v => v !== null).length;
  const advCount    = Object.keys(savedAdvice).length;
  const histCount   = Object.keys(savedHistory).length;
  const favCount    = favorites?.size ?? 0;
  const total       = customCount + bedsCount + imgCount + advCount + histCount + favCount;

  const tooltip = [
    customCount && `${customCount} fiche(s) perso`,
    bedsCount   && `${bedsCount} planche(s)`,
    favCount    && `${favCount} favori(s)`,
    imgCount    && `${imgCount} image(s)`,
    advCount    && `${advCount} conseil(s) IA`,
    histCount   && `${histCount} historique(s)`,
  ].filter(Boolean).join(' + ') || 'aucune donnée';

  return (
    <div className="export-import">
      <button
        className="export-btn"
        onClick={handleExport}
        title={`Exporter : ${tooltip}`}
      >
        💾 Exporter ({total})
      </button>
      <button
        className="import-btn"
        onClick={() => fileRef.current?.click()}
        title="Importer une sauvegarde Jardinator (.json)"
      >
        📂 Importer
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
    </div>
  );
}
