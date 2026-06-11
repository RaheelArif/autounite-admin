'use client';

import { useEffect, useState } from 'react';
import { getAdminBackground } from '@/config/adminBackgrounds';

/**
 * Full-viewport Admin OS background with preload + fade-in.
 * Desktop/mobile swap at md breakpoint; mobile uses desktop when no mobile asset.
 */
export default function AdminPageLayout({
  children,
  className = '',
  overlayOpacity = 0.12,
  backgroundPosition = 'center',
}) {
  const { desktop, mobile } = getAdminBackground();
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    if (!desktop) {
      setBgLoaded(true);
      return;
    }
    const urls = new Set([desktop, mobile].filter(Boolean));
    let loaded = 0;
    const check = () => {
      loaded += 1;
      if (loaded >= urls.size) setBgLoaded(true);
    };
    urls.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = check;
      img.onerror = check;
    });
  }, [desktop, mobile]);

  const bgStyle = {
    backgroundSize: 'cover',
    backgroundPosition,
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  };

  return (
    <div
      className={`au-admin-scene min-h-screen flex flex-col relative ${className}`}
      data-au-admin-bg-loaded={bgLoaded ? 'true' : undefined}
      style={{ backgroundColor: '#080a12' }}
    >
      {desktop ? (
        <>
          <div
            className="au-admin-scene__bg hidden md:block fixed inset-0 z-0 transition-opacity duration-1000 ease-in-out"
            style={{
              ...bgStyle,
              backgroundImage: `url('${desktop}')`,
              opacity: bgLoaded ? 1 : 0,
            }}
            aria-hidden
          />
          <div
            className="au-admin-scene__bg block md:hidden fixed inset-0 z-0 transition-opacity duration-1000 ease-in-out"
            style={{
              ...bgStyle,
              backgroundImage: `url('${mobile || desktop}')`,
              opacity: bgLoaded ? 1 : 0,
            }}
            aria-hidden
          />
        </>
      ) : null}

      {overlayOpacity > 0 ? (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundColor: '#080a12',
            opacity: bgLoaded ? overlayOpacity : 0,
          }}
          aria-hidden
        />
      ) : null}

      <div className="relative z-10 flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}
