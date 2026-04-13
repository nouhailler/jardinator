import { useRef } from 'react';
import useStore from '../store/useStore';
import { getAllCached, saveImage } from '../services/imageService';
import { getAllSavedAdvice, saveAdvice } from '../services/aiService';

export default function ExportImport() {
  const fileRef = useRef(null);
  const { imageOverrides, savedAdvice, init } = useStore();

  const handleExport = () => {
    const images = getAllCached();
    const advice = getAllSavedAdvice();

    const imgCount = Object.values(images).filter(v => v !== null).length;
    const advCount = Object.keys(advice).length;

    const bundle = {
      _jardinator: true,
      _version: 2,
      _date: new Date().toISOString(),
      images,
      advice,
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

        for (const [plantId, url] of Object.entries(images || {})) {
          saveImage(plantId, url);
          if (url !== null) imgCount++;
        }
        for (const [plantId, text] of Object.entries(advice || {})) {
          if (text) { saveAdvice(plantId, text); advCount++; }
        }

        init();

        const parts = [];
        if (imgCount > 0) parts.push(`${imgCount} image(s)`);
        if (advCount > 0) parts.push(`${advCount} conseil(s) IA`);
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
  const total = imgCount + advCount;

  return (
    <div className="export-import">
      <button
        className="export-btn"
        onClick={handleExport}
        title={`Exporter : ${imgCount} image(s) + ${advCount} conseil(s) IA`}
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
