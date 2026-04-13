import { create } from 'zustand';
import { filterPlants, getAllPlants } from '../services/vegetableService';
import { getAllCached, saveImage, deleteImage, migrateOldCache } from '../services/imageService';
import { getAllSavedAdvice, saveAdvice, deleteSavedAdvice } from '../services/aiService';

const useStore = create((set, get) => ({
  // Navigation
  activeTab: 'all',
  setTab: (tab) => { set({ activeTab: tab }); get()._recompute(); },

  // Filters
  search: '', groupe: '', family: '',
  setSearch: (search) => { set({ search }); get()._recompute(); },
  setGroupe: (groupe) => { set({ groupe }); get()._recompute(); },
  setFamily: (family) => { set({ family }); get()._recompute(); },

  // Filtered plants list
  plants: [],
  _recompute: () => {
    const { activeTab, search, groupe, family } = get();
    set({ plants: filterPlants({ search, groupe, family, tab: activeTab }) });
  },

  // Detail modal
  selectedPlant: null,
  openDetail: (plant) => set({ selectedPlant: plant }),
  closeDetail: () => set({ selectedPlant: null }),

  // Meteo widget
  meteoOpen: false,
  toggleMeteo: () => set(s => ({ meteoOpen: !s.meteoOpen })),

  // Calendar month
  calendarMonth: new Date().getMonth() + 1,
  setCalendarMonth: (m) => set({ calendarMonth: m }),

  // User image overrides: { [plantId]: url | null }
  //   url    → user picked this image (overrides default)
  //   null   → user explicitly deleted the image (hides even the default)
  //   absent → no override, use plant.defaultImageUrl
  imageOverrides: {},

  // Resolve the effective image URL for a plant
  // Priority: user override > plant_images.json default > null (no image)
  getImageUrl: (plant) => {
    const overrides = get().imageOverrides;
    if (plant.id in overrides) {
      return overrides[plant.id]; // could be null (deleted) or a url
    }
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
    // Remove the override entirely so the default image shows again
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

  // Saved AI advice: { [plantId]: text }
  savedAdvice: {},
  storeAdvice: (plantId, text) => {
    saveAdvice(plantId, text);
    set(s => ({ savedAdvice: { ...s.savedAdvice, [plantId]: text } }));
  },
  removeAdvice: (plantId) => {
    deleteSavedAdvice(plantId);
    set(s => { const a = { ...s.savedAdvice }; delete a[plantId]; return { savedAdvice: a }; });
  },

  // Init
  init: () => {
    migrateOldCache();
    getAllPlants();
    get()._recompute();
    set({ imageOverrides: getAllCached(), savedAdvice: getAllSavedAdvice() });
  },
}));

export default useStore;
