import { useEffect, useState } from 'react';

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner]       = useState(false);
  const [showIOSGuide, setShowIOSGuide]   = useState(false);
  const [dismissed, setDismissed]         = useState(
    () => localStorage.getItem('pwa_install_dismissed') === '1'
  );

  useEffect(() => {
    if (isInStandaloneMode() || dismissed) return;

    if (isIOS) {
      setShowBanner(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
  };

  const dismiss = () => {
    localStorage.setItem('pwa_install_dismissed', '1');
    setDismissed(true);
    setShowBanner(false);
    setShowIOSGuide(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="pwa-banner">
        <span className="pwa-banner-icon">🌱</span>
        <div className="pwa-banner-text">
          <strong>Installer Jardinator</strong>
          <span>Accès rapide depuis l'écran d'accueil, fonctionne hors-ligne</span>
        </div>
        <div className="pwa-banner-actions">
          {isIOS ? (
            <button className="pwa-btn-install" onClick={() => setShowIOSGuide(true)}>
              Comment faire ?
            </button>
          ) : (
            <button className="pwa-btn-install" onClick={handleInstall}>
              Installer
            </button>
          )}
          <button className="pwa-btn-dismiss" onClick={dismiss} aria-label="Fermer">✕</button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="pwa-ios-overlay" onClick={() => setShowIOSGuide(false)}>
          <div className="pwa-ios-guide" onClick={e => e.stopPropagation()}>
            <h3>Installer sur iPhone / iPad</h3>
            <ol>
              <li>Appuyez sur <strong>Partager</strong> <span className="ios-icon">⎙</span> en bas de Safari</li>
              <li>Faites défiler et choisissez <strong>Sur l'écran d'accueil</strong></li>
              <li>Confirmez avec <strong>Ajouter</strong></li>
            </ol>
            <p className="pwa-ios-note">L'app s'ouvrira en plein écran, sans barre de navigation Safari.</p>
            <button className="pwa-btn-install" onClick={() => { setShowIOSGuide(false); dismiss(); }}>
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
