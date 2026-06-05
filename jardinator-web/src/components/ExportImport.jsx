import { useRef, useState } from 'react';
import useStore from '../store/useStore';
import { getAllCached, saveImage } from '../services/imageService';
import { getAllSavedAdvice, saveAdvice, getSavedAdvice } from '../services/aiService';
import { getAllSavedHistory, saveHistory, getSavedHistory } from '../services/historyService';
import { loadCustomPlants, saveCustomPlant } from '../services/customPlantsService';
import { invalidatePlantsCache } from '../services/vegetableService';
import { loadGardenBeds, saveGardenBeds, loadCropHistory, saveCropHistory } from '../services/gardenService';
import { loadFavorites } from '../services/favoritesService';
import { getDiagnosticHistory } from '../services/diagnosticService';
import { getIdentificationHistory } from '../services/identificationService';
import { loadGardenHistory } from '../services/gardenHistoryService';
import { loadCompostData, saveCompostData, loadTreatments, saveTreatmentEntry } from '../services/inputsService';
import { getYieldYears } from '../services/yieldService';
import { getAllSavedConsumption, saveConsumption, getSavedConsumption } from '../services/consumptionService';
import { getAllSavedProfiles, saveProfile, getSavedProfile } from '../services/profileService';

const YIELDS_KEY      = 'jardinator_yields';
const YIELDS_BILAN    = 'jardinator_yields_bilan';
const FAVORITES_KEY   = 'jardinator_favorites';
const DIAG_KEY        = 'jardinator_diagnostic_history';
const ID_KEY          = 'jardinator_identification_history';
const GARDEN_AI_KEY   = 'jardinator_garden_ai_history';

function rawLS(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

export default function ExportImport() {
  const fileRef = useRef(null);
  const [protectExisting, setProtectExisting] = useState(true);
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

      // ── Historique analyses IA jardin (20 dernières) ───────────────────────
      gardenAiHistory: loadGardenHistory().slice(0, 20),

      // ── Diagnostic phytosanitaire (20 derniers, sans imageId inter-appareils)
      diagnosticHistory: getDiagnosticHistory().slice(0, 20).map(({ imageId: _i, ...e }) => e),

      // ── Identification de plantes (20 dernières, sans imageId) ─────────────
      identificationHistory: getIdentificationHistory().slice(0, 20).map(({ imageId: _i, ...e }) => e),

      // ── Rendements ─────────────────────────────────────────────────────────
      yields:      rawLS(YIELDS_KEY)   || {},
      yieldsBilan: rawLS(YIELDS_BILAN) || {},

      // ── Intrants (compost + traitements) ──────────────────────────────────
      compost:    loadCompostData(),
      treatments: loadTreatments(),

      // ── Données de consommation IA ─────────────────────────────────────────
      consumption: getAllSavedConsumption(),

      // ── Profil complet IA ──────────────────────────────────────────────────
      profile: getAllSavedProfiles(),
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
      let bundle;
      try {
        bundle = JSON.parse(ev.target.result);
        if (typeof bundle !== 'object') throw new Error('format invalide');
      } catch (err) {
        alert(`❌ Fichier invalide.\n${err.message}\nUtilisez un fichier exporté depuis Jardinator.`);
        e.target.value = '';
        return;
      }

      const counts   = [];
      const skipped  = [];
      const warnings = [];

      // Retourne true si l'erreur vient d'un quota localStorage dépassé
      function isQuota(err) {
        return err.name === 'QuotaExceededError' || err.code === 22
          || (err.message || '').toLowerCase().includes('quota');
      }

      // ── Rétrocompatibilité v2/v3 (images seules ou avec advice/history) ──
      const images  = bundle._jardinator ? bundle.images  : bundle;
      const advice  = bundle._jardinator ? (bundle.advice  || {}) : {};
      const history = bundle._jardinator ? (bundle.history || {}) : {};

      // ── Images ────────────────────────────────────────────────────────────
      try {
        let imgCount = 0;
        for (const [plantId, url] of Object.entries(images || {})) {
          saveImage(plantId, url);
          if (url !== null) imgCount++;
        }
        if (imgCount) counts.push(`${imgCount} image(s)`);
      } catch (err) {
        if (isQuota(err)) warnings.push('images — quota dépassé, partiellement ignoré');
        else throw err;
      }

      // ── Conseils IA ───────────────────────────────────────────────────────
      try {
        let advCount = 0, advSkip = 0;
        for (const [plantId, text] of Object.entries(advice || {})) {
          if (!text) continue;
          if (protectExisting && getSavedAdvice(plantId)) { advSkip++; continue; }
          saveAdvice(plantId, text); advCount++;
        }
        if (advCount) counts.push(`${advCount} conseil(s) IA`);
        if (advSkip)  skipped.push(`${advSkip} conseil(s) conservé(s)`);
      } catch (err) {
        if (isQuota(err)) warnings.push('conseils IA — quota dépassé, partiellement ignoré');
        else throw err;
      }

      // ── Historique culture ────────────────────────────────────────────────
      try {
        let histCount = 0, histSkip = 0;
        for (const [plantName, text] of Object.entries(history || {})) {
          if (!text) continue;
          if (protectExisting && getSavedHistory(plantName)) { histSkip++; continue; }
          saveHistory(plantName, text); histCount++;
        }
        if (histCount) counts.push(`${histCount} historique(s) culture`);
        if (histSkip)  skipped.push(`${histSkip} historique(s) conservé(s)`);
      } catch (err) {
        if (isQuota(err)) warnings.push('historique culture — quota dépassé, partiellement ignoré');
        else throw err;
      }

      // ── Fiches plantes personnalisées (v4) ────────────────────────────────
      try {
        if (Array.isArray(bundle.customPlants) && bundle.customPlants.length > 0) {
          for (const plant of bundle.customPlants) saveCustomPlant(plant);
          counts.push(`${bundle.customPlants.length} fiche(s) personnalisée(s)`);
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('fiches perso — quota dépassé, ignoré');
        else throw err;
      }

      // ── Plan potager (v4) ─────────────────────────────────────────────────
      try {
        if (Array.isArray(bundle.gardenBeds) && bundle.gardenBeds.length > 0) {
          saveGardenBeds(bundle.gardenBeds);
          counts.push(`${bundle.gardenBeds.length} planche(s) de potager`);
        }
        if (bundle.cropHistory && typeof bundle.cropHistory === 'object') {
          saveCropHistory(bundle.cropHistory);
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('plan potager — quota dépassé, ignoré');
        else throw err;
      }

      // ── Favoris (v4) ──────────────────────────────────────────────────────
      try {
        if (Array.isArray(bundle.favorites) && bundle.favorites.length > 0) {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(bundle.favorites));
          counts.push(`${bundle.favorites.length} favori(s)`);
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('favoris — quota dépassé, ignoré');
        else throw err;
      }

      // ── Historique analyses IA jardin (v4) ────────────────────────────────
      try {
        if (Array.isArray(bundle.gardenAiHistory) && bundle.gardenAiHistory.length > 0) {
          localStorage.setItem(GARDEN_AI_KEY, JSON.stringify(bundle.gardenAiHistory));
          counts.push(`${bundle.gardenAiHistory.length} analyse(s) IA jardin`);
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('analyses IA jardin — quota dépassé, ignoré');
        else throw err;
      }

      // ── Diagnostic (v4) ───────────────────────────────────────────────────
      try {
        if (Array.isArray(bundle.diagnosticHistory) && bundle.diagnosticHistory.length > 0) {
          localStorage.setItem(DIAG_KEY, JSON.stringify(bundle.diagnosticHistory));
          counts.push(`${bundle.diagnosticHistory.length} diagnostic(s)`);
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('diagnostics — quota dépassé, ignoré (trop volumineux)');
        else throw err;
      }

      // ── Identification (v4) ───────────────────────────────────────────────
      try {
        if (Array.isArray(bundle.identificationHistory) && bundle.identificationHistory.length > 0) {
          localStorage.setItem(ID_KEY, JSON.stringify(bundle.identificationHistory));
          counts.push(`${bundle.identificationHistory.length} identification(s)`);
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('identifications — quota dépassé, ignoré');
        else throw err;
      }

      // ── Rendements (v4) ───────────────────────────────────────────────────
      try {
        if (bundle.yields && typeof bundle.yields === 'object' && Object.keys(bundle.yields).length > 0) {
          localStorage.setItem(YIELDS_KEY, JSON.stringify(bundle.yields));
          counts.push(`rendements ${Object.keys(bundle.yields).join('/')}`);
        }
        if (bundle.yieldsBilan && typeof bundle.yieldsBilan === 'object' && Object.keys(bundle.yieldsBilan).length > 0) {
          localStorage.setItem(YIELDS_BILAN, JSON.stringify(bundle.yieldsBilan));
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('rendements — quota dépassé, ignoré');
        else throw err;
      }

      // ── Intrants (v4) ─────────────────────────────────────────────────────
      try {
        if (bundle.compost && typeof bundle.compost === 'object') saveCompostData(bundle.compost);
        if (Array.isArray(bundle.treatments) && bundle.treatments.length > 0) {
          for (const t of bundle.treatments) saveTreatmentEntry(t);
          counts.push(`${bundle.treatments.length} traitement(s) bio`);
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('intrants — quota dépassé, ignoré');
        else throw err;
      }

      // ── Données de consommation IA ────────────────────────────────────────
      try {
        if (bundle.consumption && typeof bundle.consumption === 'object') {
          let conCount = 0, conSkip = 0;
          for (const [plantId, jsonStr] of Object.entries(bundle.consumption)) {
            if (!jsonStr) continue;
            if (protectExisting && getSavedConsumption(plantId)) { conSkip++; continue; }
            saveConsumption(plantId, jsonStr); conCount++;
          }
          if (conCount) counts.push(`${conCount} analyse(s) de consommation`);
          if (conSkip)  skipped.push(`${conSkip} consommation(s) conservée(s)`);
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('consommation — quota dépassé, partiellement ignoré');
        else throw err;
      }

      // ── Profil complet IA ─────────────────────────────────────────────────
      try {
        if (bundle.profile && typeof bundle.profile === 'object') {
          let proCount = 0, proSkip = 0;
          for (const [plantId, jsonStr] of Object.entries(bundle.profile)) {
            if (!jsonStr) continue;
            if (protectExisting && getSavedProfile(plantId)) { proSkip++; continue; }
            saveProfile(plantId, jsonStr); proCount++;
          }
          if (proCount) counts.push(`${proCount} profil(s) complets`);
          if (proSkip)  skipped.push(`${proSkip} profil(s) conservé(s)`);
        }
      } catch (err) {
        if (isQuota(err)) warnings.push('profils — quota dépassé, partiellement ignoré');
        else throw err;
      }

      invalidatePlantsCache();
      init();

      const msg = counts.length > 0
        ? `✅ Importé avec succès :\n• ${counts.join('\n• ')}`
        : '✅ Fichier importé (aucune donnée nouvelle trouvée).';
      const skipMsg = skipped.length > 0
        ? `\n\n🔒 Conservés (existants non écrasés) :\n• ${skipped.join('\n• ')}`
        : '';
      const warnMsg = warnings.length > 0
        ? `\n\n⚠️ Quota mémoire mobile dépassé — ignorés :\n• ${warnings.join('\n• ')}`
        : '';
      alert(msg + skipMsg + warnMsg);
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
      <label
        className="import-protect-label"
        title={protectExisting
          ? 'Les fiches déjà renseignées ne seront pas écrasées'
          : 'Les fiches existantes seront remplacées par celles du fichier importé'}
      >
        <input
          type="checkbox"
          checked={protectExisting}
          onChange={e => setProtectExisting(e.target.checked)}
        />
        🔒
      </label>
      <button
        className="import-btn"
        onClick={() => fileRef.current?.click()}
        title={protectExisting
          ? 'Importer (vos données existantes seront conservées)'
          : 'Importer (écrase les données existantes)'}
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
