import { useRef, useState } from 'react';
import useStore from '../store/useStore';
import { buildBundle, applyBundle } from '../services/bundleService';

export default function ExportImport() {
  const fileRef = useRef(null);
  const [protectExisting, setProtectExisting] = useState(true);
  const { imageOverrides, savedAdvice, savedHistory, customPlants, gardenBeds, favorites, init } = useStore();

  const handleExport = () => {
    const bundle = buildBundle();

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
      } catch (err) {
        alert(`❌ Fichier invalide.\n${err.message}\nUtilisez un fichier exporté depuis Jardinator.`);
        e.target.value = '';
        return;
      }

      let result;
      try {
        result = applyBundle(bundle, { protectExisting });
      } catch (err) {
        alert(`❌ Erreur lors de l'import.\n${err.message}`);
        e.target.value = '';
        return;
      }

      init();
      const { counts, skipped, warnings } = result;
      const msg     = counts.length  > 0 ? `✅ Importé :\n• ${counts.join('\n• ')}`   : '✅ Aucune donnée nouvelle.';
      const skipMsg = skipped.length > 0 ? `\n\n🔒 Conservés :\n• ${skipped.join('\n• ')}` : '';
      const warnMsg = warnings.length > 0 ? `\n\n⚠️ Quota mémoire mobile dépassé — ignorés :\n• ${warnings.join('\n• ')}` : '';
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
