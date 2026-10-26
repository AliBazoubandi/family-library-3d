import { strings } from '../strings.js';
import { login } from '../api/client.js';
import { appState } from '../state.js';
import { showToast } from './toast.js';

export function renderLogin() {
  const container = document.getElementById('ui-overlay');
  if (!container) return;

  const authWrapper = document.createElement('div');
  authWrapper.id = 'auth-overlay';
  authWrapper.className = 'auth-wrapper';

  authWrapper.innerHTML = `
    <div class="auth-card">
      <div class="auth-logo">📚</div>
      <h2 class="auth-title">${strings.auth.loginTitle}</h2>
      <p class="auth-subtitle">${strings.auth.loginSubtitle}</p>

      <form id="login-form" class="auth-form">
        <div id="login-error" class="form-error"></div>

        <div class="form-group">
          <label class="form-label" for="login-email">${strings.auth.emailLabel}</label>
          <input 
            type="email" 
            id="login-email" 
            class="form-input" 
            placeholder="owner@library.local" 
            required 
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="login-password">${strings.auth.passwordLabel}</label>
          <input 
            type="password" 
            id="login-password" 
            class="form-input" 
            placeholder="••••••••••••" 
            required 
            autocomplete="current-password"
          />
        </div>

        <button type="submit" id="login-submit" class="btn btn-primary" style="margin-top: 8px; width: 100%;">
          ${strings.auth.submitButton}
        </button>
      </form>

      <div class="auth-demo-hint" style="margin-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 14px;">
        <span class="auth-demo-text" style="display: block; margin-bottom: 8px;">Switch Main Character (1-Click Login):</span>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" id="demo-ali-btn" class="btn btn-secondary" style="font-size: 0.8rem; padding: 6px 12px; border-color: #6366f1;">
            👨‍💻 Ali
          </button>
          <button type="button" id="demo-sara-btn" class="btn btn-secondary" style="font-size: 0.8rem; padding: 6px 12px; border-color: #059669;">
            👩 Sara
          </button>
          <button type="button" id="demo-reza-btn" class="btn btn-secondary" style="font-size: 0.8rem; padding: 6px 12px; border-color: #dc2626;">
            👨‍💼 Reza
          </button>
        </div>
      </div>
    </div>
  `;

  container.appendChild(authWrapper);

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  const doDemoLogin = (email) => {
    emailInput.value = email;
    passwordInput.value = 'Password123456!';
    form.requestSubmit();
  };

  document.getElementById('demo-ali-btn')?.addEventListener('click', () => doDemoLogin('owner@library.local'));
  document.getElementById('demo-sara-btn')?.addEventListener('click', () => doDemoLogin('sara@library.local'));
  document.getElementById('demo-reza-btn')?.addEventListener('click', () => doDemoLogin('reza@library.local'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.className = 'form-error';
    errorBox.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = strings.auth.loggingIn;

    try {
      const user = await login(emailInput.value, passwordInput.value);
      showToast(`Welcome back, ${user.name || 'Reader'}!`, 'success');
      authWrapper.remove();
      appState.setUser(user);
      window.dispatchEvent(new CustomEvent('reload-data'));
    } catch (err) {
      console.error("Login failure:", err);
      errorBox.textContent = strings.auth.invalidCredentials;
      errorBox.className = 'form-error visible';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = strings.auth.submitButton;
    }
  });
}
