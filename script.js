/**
 * Minimal Luxury Coming Soon
 * Whisper-soft parallax & cinematic lighting interaction
 */

(function () {
  'use strict';

  const docEl = document.documentElement;
  const stage = document.getElementById('stage');
  const fabricContainer = document.getElementById('fabricContainer');
  const comingSoonText = document.getElementById('comingSoonText');

  // Check user preference for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // State for smooth interpolated interaction
  let mouseX = 0.5;
  let mouseY = 0.5;
  let targetX = 0.5;
  let targetY = 0.5;
  let isTicking = false;

  // Max displacement in percentage (kept very subtle to avoid distraction)
  const MAX_PARALLAX_X = 1.0; // max 1% shift
  const MAX_PARALLAX_Y = 0.8; // max 0.8% shift

  /**
   * Update mouse / pointer coordinates
   */
  function onPointerMove(e) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width > 0 && height > 0) {
      targetX = e.clientX / width;
      targetY = e.clientY / height;
      requestTick();
    }
  }

  /**
   * Handle subtle device orientation on mobile devices (gyroscope)
   */
  function onDeviceOrientation(e) {
    if (e.gamma !== null && e.beta !== null) {
      // Gamma: left/right [-90, 90], Beta: front/back [-180, 180]
      const clampedGamma = Math.max(-30, Math.min(30, e.gamma));
      const clampedBeta = Math.max(10, Math.min(70, e.beta));

      targetX = (clampedGamma + 30) / 60;
      targetY = (clampedBeta - 10) / 60;
      requestTick();
    }
  }

  function requestTick() {
    if (!isTicking) {
      requestAnimationFrame(updateFrame);
      isTicking = true;
    }
  }

  /**
   * Smooth damping animation loop
   */
  function updateFrame() {
    // Linear interpolation factor (smooth fluid dampening)
    const lerpFactor = 0.045;
    mouseX += (targetX - mouseX) * lerpFactor;
    mouseY += (targetY - mouseY) * lerpFactor;

    // Update dynamic cinematic light position via CSS custom properties
    const lightXPercent = (mouseX * 100).toFixed(2);
    const lightYPercent = (mouseY * 100).toFixed(2);
    docEl.style.setProperty('--light-x', `${lightXPercent}%`);
    docEl.style.setProperty('--light-y', `${lightYPercent}%`);

    // Calculate micro parallax offset
    const offsetX = ((mouseX - 0.5) * MAX_PARALLAX_X * 2).toFixed(3);
    const offsetY = ((mouseY - 0.5) * MAX_PARALLAX_Y * 2).toFixed(3);

    if (fabricContainer) {
      fabricContainer.style.setProperty(
        '--mouse-offset',
        `translate3d(${offsetX}%, ${offsetY}%, 0)`
      );
    }

    // Continue loop if still settling
    const diff = Math.abs(targetX - mouseX) + Math.abs(targetY - mouseY);
    if (diff > 0.0005) {
      requestAnimationFrame(updateFrame);
    } else {
      isTicking = false;
    }
  }

  // Event Listeners with passive performance optimization
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  
  if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
  }

  // Preload & check font rendering
  if ('fonts' in document) {
    document.fonts.ready.then(function () {
      if (comingSoonText) {
        comingSoonText.style.visibility = 'visible';
      }
    });
  }
})();
