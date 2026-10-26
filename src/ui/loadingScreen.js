/**
 * Cozy Animated Loading Screen
 */
export function initLoadingScreen() {
  const loadingEl = document.getElementById('app-loading-screen');
  if (!loadingEl) return { hide: () => {}, updateProgress: () => {} };

  return {
    updateProgress: (percent, statusText = '') => {
      const bar = document.getElementById('loading-bar-fill');
      const text = document.getElementById('loading-status-text');
      if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      if (text && statusText) text.textContent = statusText;
    },
    hide: () => {
      loadingEl.style.opacity = '0';
      loadingEl.style.pointerEvents = 'none';
      setTimeout(() => {
        loadingEl.remove();
      }, 500);
    }
  };
}
