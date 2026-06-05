// bundleService.js — construction et application du bundle export/import
// Partagé entre ExportImport.jsx et la sync Google Drive

import { getAllCached, saveImage }                                    from './imageService';
import { getAllSavedAdvice, saveAdvice, getSavedAdvice }              from './aiService';
import { getAllSavedHistory, saveHistory, getSavedHistory }           from './historyService';
import { loadCustomPlants, saveCustomPlant }                          from './customPlantsService';
import { invalidatePlantsCache }                                      from './vegetableService';
import { loadGardenBeds, saveGardenBeds, loadCropHistory, saveCropHistory } from './gardenService';
import { loadFavorites }                                              from './favoritesService';
import { getDiagnosticHistory }                                       from './diagnosticService';
import { getIdentificationHistory }                                   from './identificationService';
import { loadGardenHistory }                                          from './gardenHistoryService';
import { loadCompostData, saveCompostData, loadTreatments, saveTreatmentEntry } from './inputsService';
import { getAllSavedConsumption, saveConsumption, getSavedConsumption } from './consumptionService';
import { getAllSavedProfiles, saveProfile, getSavedProfile }          from './profileService';

const YIELDS_KEY    = 'jardinator_yields';
const YIELDS_BILAN  = 'jardinator_yields_bilan';
const FAVORITES_KEY = 'jardinator_favorites';
const DIAG_KEY      = 'jardinator_diagnostic_history';
const ID_KEY        = 'jardinator_identification_history';
const GARDEN_AI_KEY = 'jardinator_garden_ai_history';

function rawLS(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }

// ── Construction du bundle ────────────────────────────────────────────────────

export function buildBundle() {
  return {
    _jardinator: true,
    _version:    4,
    _date:       new Date().toISOString(),
    customPlants:          loadCustomPlants(),
    gardenBeds:            loadGardenBeds(),
    cropHistory:           loadCropHistory(),
    favorites:             [...loadFavorites()],
    images:                getAllCached(),
    advice:                getAllSavedAdvice(),
    history:               getAllSavedHistory(),
    gardenAiHistory:       loadGardenHistory().slice(0, 20),
    diagnosticHistory:     getDiagnosticHistory().slice(0, 20).map(({ imageId: _i, ...e }) => e),
    identificationHistory: getIdentificationHistory().slice(0, 20).map(({ imageId: _i, ...e }) => e),
    yields:      rawLS(YIELDS_KEY)   || {},
    yieldsBilan: rawLS(YIELDS_BILAN) || {},
    compost:     loadCompostData(),
    treatments:  loadTreatments(),
    consumption: getAllSavedConsumption(),
    profile:     getAllSavedProfiles(),
  };
}

// ── Application du bundle ─────────────────────────────────────────────────────

function isQuota(err) {
  return err.name === 'QuotaExceededError' || err.code === 22
    || (err.message || '').toLowerCase().includes('quota');
}

export function applyBundle(bundle, { protectExisting = true } = {}) {
  if (typeof bundle !== 'object' || !bundle) throw new Error('format invalide');

  const counts = [], skipped = [], warnings = [];

  const images  = bundle._jardinator ? bundle.images  : bundle;
  const advice  = bundle._jardinator ? (bundle.advice  || {}) : {};
  const history = bundle._jardinator ? (bundle.history || {}) : {};

  try {
    let n = 0;
    for (const [id, url] of Object.entries(images || {})) { saveImage(id, url); if (url !== null) n++; }
    if (n) counts.push(`${n} image(s)`);
  } catch (e) { if (isQuota(e)) warnings.push('images — quota dépassé'); else throw e; }

  try {
    let n = 0, s = 0;
    for (const [id, text] of Object.entries(advice || {})) {
      if (!text) continue;
      if (protectExisting && getSavedAdvice(id)) { s++; continue; }
      saveAdvice(id, text); n++;
    }
    if (n) counts.push(`${n} conseil(s) IA`);
    if (s) skipped.push(`${s} conseil(s) conservé(s)`);
  } catch (e) { if (isQuota(e)) warnings.push('conseils IA — quota dépassé'); else throw e; }

  try {
    let n = 0, s = 0;
    for (const [name, text] of Object.entries(history || {})) {
      if (!text) continue;
      if (protectExisting && getSavedHistory(name)) { s++; continue; }
      saveHistory(name, text); n++;
    }
    if (n) counts.push(`${n} historique(s) culture`);
    if (s) skipped.push(`${s} historique(s) conservé(s)`);
  } catch (e) { if (isQuota(e)) warnings.push('historique culture — quota dépassé'); else throw e; }

  try {
    if (Array.isArray(bundle.customPlants) && bundle.customPlants.length) {
      for (const p of bundle.customPlants) saveCustomPlant(p);
      counts.push(`${bundle.customPlants.length} fiche(s) personnalisée(s)`);
    }
  } catch (e) { if (isQuota(e)) warnings.push('fiches perso — quota dépassé'); else throw e; }

  try {
    if (Array.isArray(bundle.gardenBeds) && bundle.gardenBeds.length) {
      saveGardenBeds(bundle.gardenBeds);
      counts.push(`${bundle.gardenBeds.length} planche(s) de potager`);
    }
    if (bundle.cropHistory && typeof bundle.cropHistory === 'object') saveCropHistory(bundle.cropHistory);
  } catch (e) { if (isQuota(e)) warnings.push('plan potager — quota dépassé'); else throw e; }

  try {
    if (Array.isArray(bundle.favorites) && bundle.favorites.length) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(bundle.favorites));
      counts.push(`${bundle.favorites.length} favori(s)`);
    }
  } catch (e) { if (isQuota(e)) warnings.push('favoris — quota dépassé'); else throw e; }

  try {
    if (Array.isArray(bundle.gardenAiHistory) && bundle.gardenAiHistory.length) {
      localStorage.setItem(GARDEN_AI_KEY, JSON.stringify(bundle.gardenAiHistory));
      counts.push(`${bundle.gardenAiHistory.length} analyse(s) IA jardin`);
    }
  } catch (e) { if (isQuota(e)) warnings.push('analyses jardin — quota dépassé'); else throw e; }

  try {
    if (Array.isArray(bundle.diagnosticHistory) && bundle.diagnosticHistory.length) {
      localStorage.setItem(DIAG_KEY, JSON.stringify(bundle.diagnosticHistory));
      counts.push(`${bundle.diagnosticHistory.length} diagnostic(s)`);
    }
  } catch (e) { if (isQuota(e)) warnings.push('diagnostics — quota dépassé'); else throw e; }

  try {
    if (Array.isArray(bundle.identificationHistory) && bundle.identificationHistory.length) {
      localStorage.setItem(ID_KEY, JSON.stringify(bundle.identificationHistory));
      counts.push(`${bundle.identificationHistory.length} identification(s)`);
    }
  } catch (e) { if (isQuota(e)) warnings.push('identifications — quota dépassé'); else throw e; }

  try {
    if (bundle.yields && Object.keys(bundle.yields).length) {
      localStorage.setItem(YIELDS_KEY, JSON.stringify(bundle.yields));
      counts.push(`rendements ${Object.keys(bundle.yields).join('/')}`);
    }
    if (bundle.yieldsBilan && Object.keys(bundle.yieldsBilan).length) {
      localStorage.setItem(YIELDS_BILAN, JSON.stringify(bundle.yieldsBilan));
    }
  } catch (e) { if (isQuota(e)) warnings.push('rendements — quota dépassé'); else throw e; }

  try {
    if (bundle.compost) saveCompostData(bundle.compost);
    if (Array.isArray(bundle.treatments) && bundle.treatments.length) {
      for (const t of bundle.treatments) saveTreatmentEntry(t);
      counts.push(`${bundle.treatments.length} traitement(s) bio`);
    }
  } catch (e) { if (isQuota(e)) warnings.push('intrants — quota dépassé'); else throw e; }

  try {
    if (bundle.consumption) {
      let n = 0, s = 0;
      for (const [id, str] of Object.entries(bundle.consumption)) {
        if (!str) continue;
        if (protectExisting && getSavedConsumption(id)) { s++; continue; }
        saveConsumption(id, str); n++;
      }
      if (n) counts.push(`${n} analyse(s) de consommation`);
      if (s) skipped.push(`${s} consommation(s) conservée(s)`);
    }
  } catch (e) { if (isQuota(e)) warnings.push('consommation — quota dépassé'); else throw e; }

  try {
    if (bundle.profile) {
      let n = 0, s = 0;
      for (const [id, str] of Object.entries(bundle.profile)) {
        if (!str) continue;
        if (protectExisting && getSavedProfile(id)) { s++; continue; }
        saveProfile(id, str); n++;
      }
      if (n) counts.push(`${n} profil(s) complets`);
      if (s) skipped.push(`${s} profil(s) conservé(s)`);
    }
  } catch (e) { if (isQuota(e)) warnings.push('profils — quota dépassé'); else throw e; }

  invalidatePlantsCache();
  return { counts, skipped, warnings };
}
