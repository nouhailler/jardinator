import { useState, useEffect, useRef } from 'react';
import { searchWikimediaImages } from '../services/imageService';

export default function ImagePicker({ plant, onSelect, onClose }) {
  const [query, setQuery] = useState(plant.name);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [tab, setTab] = useState('wikipedia'); // wikipedia | custom
  const debounceRef = useRef(null);

  const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(plant.name + ' légume jardin')}`;

  function doSearch(q) {
    if (!q.trim()) return;
    setLoading(true);
    setResults([]);
    searchWikimediaImages(q, 18).then(r => {
      setResults(r);
      setLoading(false);
    });
  }

  useEffect(() => {
    doSearch(plant.name);
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 500);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customUrl.trim()) onSelect(customUrl.trim());
  };

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-panel" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <span className="picker-title">🖼 Choisir une image — {plant.name}</span>
          <button className="picker-close" onClick={onClose}>✕</button>
        </div>

        <div className="picker-tabs">
          <button
            className={`picker-tab ${tab === 'wikipedia' ? 'active' : ''}`}
            onClick={() => setTab('wikipedia')}
          >
            📷 Wikimedia Commons
          </button>
          <button
            className={`picker-tab ${tab === 'custom' ? 'active' : ''}`}
            onClick={() => setTab('custom')}
          >
            🔗 URL personnalisée
          </button>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="picker-tab google-link"
          >
            🔍 Google Images ↗
          </a>
        </div>

        {tab === 'wikipedia' && (
          <div className="picker-body">
            <div className="picker-search-row">
              <input
                className="picker-search"
                value={query}
                onChange={handleQueryChange}
                placeholder="Rechercher sur Wikimedia Commons..."
              />
              <button className="picker-search-btn" onClick={() => doSearch(query)}>
                Chercher
              </button>
            </div>

            <div className="picker-suggestions">
              {[plant.name, plant.nameLatin, plant.nameLatin?.split(/\s+var\.|\s+subsp\./)[0]?.trim()]
                .filter((v, i, a) => v && a.indexOf(v) === i)
                .map(s => (
                  <button key={s} className="suggestion-chip" onClick={() => { setQuery(s); doSearch(s); }}>
                    {s}
                  </button>
                ))}
            </div>

            {loading && <div className="picker-loading">⏳ Recherche en cours…</div>}

            {!loading && results.length === 0 && query && (
              <div className="picker-empty">Aucun résultat pour « {query} »</div>
            )}

            <div className="picker-grid">
              {results.map((img, i) => (
                <button
                  key={i}
                  className="picker-img-btn"
                  onClick={() => onSelect(img.fullUrl)}
                  title={img.title}
                >
                  <img src={img.thumbUrl} alt={img.title} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'custom' && (
          <div className="picker-body">
            <p className="picker-hint">
              Trouvez une image sur <a href={googleUrl} target="_blank" rel="noopener noreferrer">Google Images ↗</a>,
              faites un clic droit → <em>Copier l'adresse de l'image</em>, puis collez-la ci-dessous.
            </p>
            <form className="custom-url-form" onSubmit={handleCustomSubmit}>
              <input
                className="custom-url-input"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="https://…"
                type="url"
              />
              <button className="custom-url-btn" type="submit" disabled={!customUrl.trim()}>
                Utiliser cette image
              </button>
            </form>
            {customUrl && (
              <div className="custom-url-preview">
                <img
                  src={customUrl}
                  alt="Aperçu"
                  onError={e => { e.currentTarget.style.opacity = '0.3'; }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
