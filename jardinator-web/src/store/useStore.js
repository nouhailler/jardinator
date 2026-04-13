import { create } from 'zustand';
import { filterPlants, getAllPlants } from '../services/vegetableService';
import { getAllCached, saveImage, deleteImage, migrateOldCache } from '../services/imageService';
import { getAllSavedAdvice, saveAdvice, deleteSavedAdvice } from '../services/aiService';
import {
  loadGardenBeds, saveGardenBeds, createBed,
  loadCropHistory, saveCropHistory, addCropRecord, removeCropRecord,
} from '../services/gardenService';

const useStore = create((set, get) => ({
  // ─── Navigation ────────────────────────────────────────────────────────────
  activeTab: 'all',
  setTab: (tab) => { set({ activeTab: tab }); get()._recompute(); },

  // ─── Filters ───────────────────────────────────────────────────────────────
  search: '', groupe: '', family: '', climateZone: '',
  setSearch: (search) => { set({ search }); get()._recompute(); },
  setGroupe: (groupe) => { set({ groupe }); get()._recompute(); },
  setFamily: (family) => { set({ family }); get()._recompute(); },
  setClimateZone: (climateZone) => { set({ climateZone }); get()._recompute(); },

  // ─── Filtered plants ───────────────────────────────────────────────────────
  plants: [],
  _recompute: () => {
    const { activeTab, search, groupe, family, climateZone } = get();
    set({ plants: filterPlants({ search, groupe, family, tab: activeTab, climateZone }) });
  },

  // ─── Detail modal ──────────────────────────────────────────────────────────
  selectedPlant: null,
  openDetail: (plant) => set({ selectedPlant: plant }),
  closeDetail: () => set({ selectedPlant: null }),

  // ─── Meteo widget ──────────────────────────────────────────────────────────
  meteoOpen: false,
  toggleMeteo: () => set(s => ({ meteoOpen: !s.meteoOpen })),

  // ─── Weather ───────────────────────────────────────────────────────────────
  weather: null,
  weatherLoading: false,
  weatherError: null,
  setWeather: (weather) => set({ weather, weatherLoading: false, weatherError: null }),
  setWeatherLoading: (weatherLoading) => set({ weatherLoading }),
  setWeatherError: (weatherError) => set({ weatherError, weatherLoading: false }),

  // ─── Calendar month ────────────────────────────────────────────────────────
  calendarMonth: new Date().getMonth() + 1,
  setCalendarMonth: (m) => set({ calendarMonth: m }),

  // ─── User image overrides ──────────────────────────────────────────────────
  imageOverrides: {},
  getImageUrl: (plant) => {
    const overrides = get().imageOverrides;
    if (plant.id in overrides) return overrides[plant.id];
    return plant.defaultImageUrl || null;
  },
  setImage: (plantId, url) => {
    saveImage(plantId, url);
    set(s => ({ imageOverrides: { ...s.imageOverrides, [plantId]: url } }));
  },
  removeImage: (plantId) => {
    deleteImage(plantId);
    set(s => ({ imageOverrides: { ...s.imageOverrides, [plantId]: null } }));
  },
  restoreDefault: (plantId) => {
    try {
      const store = JSON.parse(localStorage.getItem('jardinator_images_v2') || '{}');
      delete store[plantId];
      localStorage.setItem('jardinator_images_v2', JSON.stringify(store));
    } catch {}
    set(s => {
      const overrides = { ...s.imageOverrides };
      delete overrides[plantId];
      return { imageOverrides: overrides };
    });
  },

  // ─── Saved AI advice ───────────────────────────────────────────────────────
  savedAdvice: {},
  storeAdvice: (plantId, text) => {
    saveAdvice(plantId, text);
    set(s => ({ savedAdvice: { ...s.savedAdvice, [plantId]: text } }));
  },
  removeAdvice: (plantId) => {
    deleteSavedAdvice(plantId);
    set(s => { const a = { ...s.savedAdvice }; delete a[plantId]; return { savedAdvice: a }; });
  },

  // ─── Garden Planner ────────────────────────────────────────────────────────
  gardenBeds: [],
  activeGardenBedId: null,

  setActiveGardenBed: (id) => set({ activeGardenBedId: id }),

  addGardenBed: (name, rows = 4, cols = 6, cellSizeM = 0.5) => {
    const bed = createBed(name, rows, cols, cellSizeM);
    const beds = [...get().gardenBeds, bed];
    saveGardenBeds(beds);
    set({ gardenBeds: beds, activeGardenBedId: bed.id });
    return bed;
  },

  removeGardenBed: (bedId) => {
    const beds = get().gardenBeds.filter(b => b.id !== bedId);
    saveGardenBeds(beds);
    const activeId = get().activeGardenBedId === bedId
      ? (beds[0]?.id || null)
      : get().activeGardenBedId;
    set({ gardenBeds: beds, activeGardenBedId: activeId });
  },

  updateGardenBed: (bedId, changes) => {
    const beds = get().gardenBeds.map(b => b.id === bedId ? { ...b, ...changes } : b);
    saveGardenBeds(beds);
    set({ gardenBeds: beds });
  },

  setPlantInCell: (bedId, row, col, plantId) => {
    const cellKey = `${row}-${col}`;
    const beds = get().gardenBeds.map(b => {
      if (b.id !== bedId) return b;
      const cells = { ...b.cells, [cellKey]: { plantId, plantedDate: new Date().toISOString().slice(0, 10), notes: '' } };
      return { ...b, cells };
    });
    saveGardenBeds(beds);
    set({ gardenBeds: beds });
  },

  removePlantFromCell: (bedId, row, col) => {
    const cellKey = `${row}-${col}`;
    const beds = get().gardenBeds.map(b => {
      if (b.id !== bedId) return b;
      const cells = { ...b.cells };
      delete cells[cellKey];
      return { ...b, cells };
    });
    saveGardenBeds(beds);
    set({ gardenBeds: beds });
  },

  updateCellNotes: (bedId, row, col, notes) => {
    const cellKey = `${row}-${col}`;
    const beds = get().gardenBeds.map(b => {
      if (b.id !== bedId) return b;
      const cell = b.cells[cellKey];
      if (!cell) return b;
      return { ...b, cells: { ...b.cells, [cellKey]: { ...cell, notes } } };
    });
    saveGardenBeds(beds);
    set({ gardenBeds: beds });
  },

  // ─── Crop History ──────────────────────────────────────────────────────────
  cropHistory: {},

  addCropRecord: (bedId, cellKey, plantId, notes = '', year = new Date().getFullYear()) => {
    const newHistory = addCropRecord(get().cropHistory, bedId, cellKey, plantId, notes, year);
    saveCropHistory(newHistory);
    set({ cropHistory: newHistory });
  },

  removeCropRecord: (bedId, cellKey, year) => {
    const newHistory = removeCropRecord(get().cropHistory, bedId, cellKey, year);
    saveCropHistory(newHistory);
    set({ cropHistory: newHistory });
  },

  // ─── Init ──────────────────────────────────────────────────────────────────
  init: () => {
    migrateOldCache();
    getAllPlants();
    get()._recompute();
    const gardenBeds = loadGardenBeds();
    set({
      imageOverrides: getAllCached(),
      savedAdvice: getAllSavedAdvice(),
      gardenBeds,
      activeGardenBedId: gardenBeds[0]?.id || null,
      cropHistory: loadCropHistory(),
    });
  },
}));

export default useStore;
