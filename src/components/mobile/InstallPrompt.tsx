import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

/**
 * PWA Install Banner
 * Shows a "Add to Home Screen" prompt for Android/Chrome users.
 * iOS users see a manual instruction since iOS doesn't support beforeinstallprompt.
 */
export function PWAInstallBanner() {
  const { canInstall, promptInstall, isStandalone } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Check if dismissed within last 7 days
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setDismissed(true);
        return;
      }
    }

    // Detect iOS Safari (doesn't support beforeinstallprompt)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari && !isStandalone) {
      setShowIOSHint(true);
    }
  }, [isStandalone]);

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setDismissed(true);
    setShowIOSHint(false);
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setDismissed(true);
  };

  // Don't show if: already installed, dismissed, or nothing to show
  if (isStandalone || dismissed || (!canInstall && !showIOSHint)) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:w-96"
      role="complementary"
      aria-label="Install app banner"
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #8B0000 0%, #b91c1c 100%)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 20px 60px rgba(139, 0, 0, 0.35), 0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#fff',
        }}
      >
        {/* Icon */}
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '10px',
            flexShrink: 0,
          }}
        >
          <Smartphone size={24} color="#fff" />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', lineHeight: 1.3 }}>
            Install MPS Connect
          </p>
          {showIOSHint ? (
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>
              Tap the <strong>Share</strong> button below, then <strong>"Add to Home Screen"</strong> for the full app experience.
            </p>
          ) : (
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>
              Install for faster access, offline support, and a native app experience.
            </p>
          )}

          {!showIOSHint && (
            <button
              id="pwa-install-btn"
              onClick={handleInstall}
              style={{
                marginTop: '10px',
                background: '#fff',
                color: '#8B0000',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 16px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Download size={14} />
              Install App
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          id="pwa-install-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            color: '#fff',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
