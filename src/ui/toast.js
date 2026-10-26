/**
 * Sleek Toast Notification System
 */

export function showToast(message, type = 'info', durationMs = 3500) {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `
    <span style="font-weight: 700; opacity: 0.9;">${icon}</span>
    <span style="flex: 1;">${message}</span>
  `;

  root.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, durationMs);
}
