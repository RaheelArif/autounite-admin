'use client';

import { useRef, useLayoutEffect, useCallback, useState } from 'react';
import { getAdminBackground } from '@/config/adminBackgrounds';

const GLASS_BLUR_PX = 10;
const blurBleedPx = GLASS_BLUR_PX + 10;

/**
 * Admin login card — frosted glass with scene-aligned blur (same pattern as AuthOsGlassCard).
 */
export default function AdminAuthGlassCard({ children, className = '' }) {
  const shellRef = useRef(null);
  const [glassBgStyle, setGlassBgStyle] = useState(null);
  const { desktop, mobile } = getAdminBackground();

  const syncCardGlassBg = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !desktop) return;

    const scene = shell.closest('.au-admin-scene');
    if (!scene) return;

    const sceneRect = scene.getBoundingClientRect();
    const cardRect = shell.getBoundingClientRect();
    const offsetLeft = cardRect.left - sceneRect.left;
    const offsetTop = cardRect.top - sceneRect.top;

    const useMobileBg =
      typeof window !== 'undefined' && window.innerWidth < 768 && Boolean(mobile);
    const sceneBg = useMobileBg ? mobile : desktop;

    setGlassBgStyle({
      backgroundImage: `url('${sceneBg}')`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      left: -offsetLeft - blurBleedPx,
      top: -offsetTop - blurBleedPx,
      width: sceneRect.width + blurBleedPx * 2,
      height: sceneRect.height + blurBleedPx * 2,
      filter: `blur(${GLASS_BLUR_PX}px)`,
      WebkitFilter: `blur(${GLASS_BLUR_PX}px)`,
    });
  }, [desktop, mobile]);

  useLayoutEffect(() => {
    syncCardGlassBg();

    window.addEventListener('resize', syncCardGlassBg);
    window.addEventListener('scroll', syncCardGlassBg, true);

    const shell = shellRef.current;
    const scene = shell?.closest('.au-admin-scene');
    const main = shell?.closest('.au-admin-auth-main');

    const ro = new ResizeObserver(syncCardGlassBg);
    if (shell) ro.observe(shell);
    if (scene) ro.observe(scene);

    main?.addEventListener('scroll', syncCardGlassBg, { passive: true });

    return () => {
      window.removeEventListener('resize', syncCardGlassBg);
      window.removeEventListener('scroll', syncCardGlassBg, true);
      main?.removeEventListener('scroll', syncCardGlassBg);
      ro.disconnect();
    };
  }, [syncCardGlassBg]);

  return (
    <div ref={shellRef} className={`au-admin-auth-card ${className}`.trim()}>
      <div className="au-admin-auth-card__glass pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {glassBgStyle ? (
          <div className="au-admin-auth-card__glass-bg" style={glassBgStyle} />
        ) : null}
        <div className="au-admin-auth-card__glass-tint" />
      </div>
      <div className="au-admin-auth-card__content">{children}</div>
    </div>
  );
}
