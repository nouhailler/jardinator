import { useState, useEffect, useRef } from 'react';

export default function HelpTip({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  return (
    <span className="help-tip" ref={ref}>
      <button
        className="help-tip-btn"
        onClick={() => setOpen(v => !v)}
        title="Aide"
        type="button"
      >
        ?
      </button>
      {open && (
        <span className="help-tip-tooltip">{text}</span>
      )}
    </span>
  );
}
