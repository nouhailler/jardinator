import { useRef } from 'react';
import useStore from '../store/useStore';
import { getAllCached, saveImage } from '../services/imageService';
import { getAllSavedAdvice, saveAdvice } from '../services/aiService';
import { getAllSavedHistory, saveHistory } from '../services/historyService';

export default function ExportImport() {
  const fileRef = useRef(null);
  const { imageOverrides, savedAdvice, savedHistory, init } = useStore();

  const handleExport = () => {
    const images = getAllCached();
    const advice = getAllSavedAdvice();
    const history = getAllSavedHistory();

    const imgCount = Object.values(images).filter(v => v !== null).length;
    const advCount = Object.keys(advice).length;
    const histCount = Object.keys(history).length;

    const bundle = {
      _jardinator: true,
      _version: 3,
      _date: new Date().toISOString(),
      images,
      advice,
      history,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jardinator-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const bundle = JSON.parse(ev.target.result);
        if (typeof bundle !== 'object') throw new Error();

        let imgCount = 0;
        let advCount = 0;

        // Support both v2 bundle format and legacy (images-only) format
        const images = bundle._jardinator ? bundle.images : bundle;
        const advice = bundle._jardinator ? (bundle.advice || {}) : {};
        const history = bundle._jardinator ? (bundle.history || {}) : {};

        let histCount = 0;

        for (const [plantId, url] of Object.entries(images || {})) {
          saveImage(plantId, url);
          if (url !== null) imgCount++;
        }
        for (const [plantId, text] of Object.entries(advice || {})) {
          if (text) { saveAdvice(plantId, text); advCount++; }
        }
        for (const [plantName, text] of Object.entries(history || {})) {
          if (text) { saveHistory(plantName, text); histCount++; }
        }

        init();

        const parts = [];
        if (imgCount > 0) parts.push(`${imgCount} image(s)`);
        if (advCount > 0) parts.push(`${advCount} conseil(s) IA`);
        if (histCount > 0) parts.push(`${histCount} historique(s)`);
        alert(`✅ Importé : ${parts.join(' et ')}.`);
      } catch {
        alert('❌ Fichier invalide. Utilisez un fichier exporté depuis Jardinator.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const imgCount = Object.values(imageOverrides).filter(v => v !== null).length;
  const advCount = Object.keys(savedAdvice).length;
  const histCount = Object.keys(savedHistory).length;
  const total = imgCount + advCount + histCount;

  return (
    <div className="export-import">
      <button
        className="export-btn"
        onClick={handleExport}
        title={`Exporter : ${imgCount} image(s) + ${advCount} conseil(s) IA + ${histCount} historique(s)`}
      >
        💾 Exporter ({total})
      </button>
      <button
        className="import-btn"
        onClick={() => fileRef.current?.click()}
        title="Importer images et conseils IA"
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
