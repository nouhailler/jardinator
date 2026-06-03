import { useEffect, useRef, useState, useCallback } from 'react';
import useStore from '../store/useStore';

const isMobile = () => window.innerWidth <= 640;

const PHASES = [
  {
    tab: 'all',
    getTarget: () => document.querySelector('.card-grid'),
    caption: '🌿 208 plantes du potager — légumes, herbes, fruits, aromatiques',
    duration: 3000,
  },
  {
    tab: 'all',
    getTarget: () => document.querySelector('.filter-dropdown-trigger'),
    caption: '🔍 Recherche et filtres : saison, famille botanique, zone climatique',
    duration: 2800,
  },
  {
    tab: 'all',
    getTarget: () => {
      const cards = document.querySelectorAll('.vcard');
      return cards[Math.min(3, cards.length - 1)] || null;
    },
    caption: '📋 Fiche détaillée : culture, associations, calendrier de semis',
    duration: 2500,
    endAction: () => {
      const { plants, openDetail } = useStore.getState();
      const plant = plants[Math.min(3, plants.length - 1)] || plants[0];
      if (plant) openDetail(plant);
    },
  },
  {
    tab: 'all',
    getTarget: () => document.querySelector('.modal-content'),
    caption: '✨ Conseils IA, profil nutritionnel, export PDF, historique de culture…',
    duration: 3200,
    endAction: () => useStore.getState().closeDetail(),
  },
  {
    tab: 'calendar',
    getTarget: () => document.querySelector('main'),
    caption: '📆 Calendrier des semis et récoltes — mois par mois',
    duration: 3000,
  },
  {
    tab: 'potager',
    getTarget: () => document.querySelector('main'),
    caption: '🪴 Plan du potager drag-and-drop — planches, historique cultural',
    duration: 3000,
  },
  {
    tab: 'diagnostic',
    getTarget: () => document.querySelector('main'),
    caption: '🔬 Diagnostic phytosanitaire IA — identifiez maladies et ravageurs',
    duration: 2800,
  },
  {
    tab: 'identification',
    getTarget: () => document.querySelector('main'),
    caption: '🌿 Identification de plantes inconnues par photo',
    duration: 2800,
  },
  {
    tab: 'chat',
    getTarget: () => document.querySelector('main'),
    caption: '💬 Chat IA — votre assistant jardinier disponible en permanence',
    duration: 2800,
  },
  {
    tab: 'yields',
    getTarget: () => document.querySelector('main'),
    caption: '🌾 Rendements — suivez vos récoltes saison après saison',
    duration: 2500,
  },
  {
    tab: 'all',
    getTarget: () => document.querySelector('.header-brand'),
    caption: '🌱 Jardinator — votre assistant potager intelligent · gratuit · open source',
    duration: 2800,
  },
];

function getCenter(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export default function DemoMode({ onStop }) {
  const mobile = useRef(isMobile()).current;
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [xy, setXY] = useState({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.35 });
  const [caption, setCaption] = useState('');
  const [captionOn, setCaptionOn] = useState(false);
  const [tapping, setTapping] = useState(false);

  const triggerTap = useCallback(() => {
    setTapping(true);
    setTimeout(() => setTapping(false), 480);
  }, []);

  useEffect(() => {
    const ids = [];
    let currentIdx = 0;

    function addT(fn, ms) {
      const id = setTimeout(fn, ms);
      ids.push(id);
    }

    function runPhase(rawIdx) {
      const idx = rawIdx % PHASES.length;
      currentIdx = idx;
      setPhaseIdx(idx);

      const phase = PHASES[idx];
      useStore.getState().setTab(phase.tab);

      addT(() => {
        const pos = getCenter(phase.getTarget());
        if (pos) setXY(pos);
        setCaption(phase.caption);
        setCaptionOn(true);
        if (mobile) triggerTap();
      }, 350);

      addT(() => setCaptionOn(false), phase.duration + 350);

      addT(() => { if (phase.endAction) phase.endAction(); }, phase.duration + 680);

      addT(() => runPhase(currentIdx + 1), phase.duration + 1150);
    }

    runPhase(0);

    return () => {
      ids.forEach(clearTimeout);
      useStore.getState().closeDetail();
    };
  }, [mobile, triggerTap]);

  return (
    <div className="demo-overlay">
      {!mobile && <div className="demo-label">◉ DÉMO</div>}

      <button className="demo-stop" onClick={onStop}>
        {mobile ? '✕' : '✕ Quitter la démo'}
      </button>

      <div className={`demo-caption${captionOn ? ' on' : ''}`}>
        {caption}
      </div>

      <div className="demo-dots">
        {PHASES.map((_, i) => (
          <span key={i} className={`demo-dot${i === phaseIdx ? ' active' : ''}`} />
        ))}
      </div>

      <div
        className={`demo-cursor${mobile ? ' demo-touch' : ''}`}
        style={{ transform: `translate(${xy.x}px, ${xy.y}px)` }}
      >
        <div className={`demo-cursor-wrap${tapping ? ' demo-tapping' : ''}`}>
          <div className="demo-cursor-ring" />
          <div className="demo-cursor-ring demo-cursor-ring2" />
          <div className="demo-cursor-dot" />
        </div>
      </div>
    </div>
  );
}
