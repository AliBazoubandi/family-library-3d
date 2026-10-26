import { strings, t } from '../strings.js';
import { appState } from '../state.js';
import { logout } from '../api/client.js';
import { openBookModal } from './bookForm.js';
import { showToast } from './toast.js';

function getGenderPronoun(user) {
  if (user?.gender === 'f') return 'her';
  return 'his';
}

function getAvatarEmoji(user) {
  if (user?.avatar_emoji) return user.avatar_emoji;
  const name = (user?.name || '').toLowerCase();
  if (user?.gender === 'f') return '👩';
  if (name.includes('ali')) return '👨‍💻';
  if (name.includes('reza')) return '👨‍💼';
  return user?.gender === 'm' ? '👨' : '🧑';
}

export function renderNavBar() {
  const container = document.getElementById('top-nav-container');
  if (!container) return;

  const user = appState.user;
  if (!user) {
    container.innerHTML = '';
    return;
  }

  const isListView = appState.currentView === 'list';
  const familyUsers = (appState.familyUsers && appState.familyUsers.length > 0)
    ? appState.familyUsers
    : [user];
  const currentHouseUser = appState.currentHouseUser || user;

  const familyMembersHtml = familyUsers.map(member => {
    const isCurrentHouse = (member.id === currentHouseUser.id);
    const emoji = getAvatarEmoji(member);
    const pronoun = getGenderPronoun(member);
    const memberColor = member.house_color || '#4f46e5';

    return `
      <div class="family-member-wrapper" data-member-id="${member.id}">
        <button type="button" 
          class="family-avatar-btn ${isCurrentHouse ? 'active-visiting' : ''}" 
          style="--member-color: ${memberColor};"
          data-btn-member-id="${member.id}"
          title="${isCurrentHouse ? `Currently inside ${member.name}'s house` : `Click to view ${member.name}`}">
          <span class="family-avatar-ring">
            ${emoji}
          </span>
          <span class="family-avatar-name">${member.name}</span>
          ${isCurrentHouse ? '<span class="family-badge-here">🏠 Here</span>' : '<span class="family-badge-car">🚗</span>'}
        </button>

        <!-- Dropdown / Popover Flyout -->
        <div class="family-popover-card" id="popover-${member.id}" style="display: none;">
          <div class="family-popover-header">
            <div class="family-popover-avatar" style="background-color: ${memberColor};">
              ${emoji}
            </div>
            <div>
              <div class="family-popover-name">${member.name}'s House</div>
              <div class="family-popover-status">
                ${isCurrentHouse ? '📍 You are inside this house' : '🏡 Neighborhood Residence'}
              </div>
            </div>
          </div>

          <div class="family-popover-info">
            <span>House Color:</span>
            <span class="family-popover-color-dot" style="background-color: ${memberColor};"></span>
          </div>

          <div class="family-popover-actions">
            ${isCurrentHouse 
              ? (appState.currentScene === 'INSIDE' 
                  ? `<button type="button" class="btn btn-secondary" disabled>Currently Inside House</button>`
                  : `<button type="button" class="btn btn-primary enter-house-btn" data-enter-member-id="${member.id}">
                       🚪 Enter ${member.name}'s House
                     </button>`
                )
              : `<button type="button" class="btn btn-primary go-to-house-btn" data-go-member-id="${member.id}">
                   🚗 Drive to ${pronoun} house
                 </button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  const isOwner = (currentHouseUser?.id === user?.id);

  container.innerHTML = `
    <nav class="top-nav">
      <div class="brand-container">
        <div class="brand-icon">📚</div>
        <div>
          <div class="brand-title">${strings.app.title}</div>
          <div class="brand-sub">${isOwner ? `Your Library Collection` : `Visiting ${currentHouseUser.name}'s Library`}</div>
        </div>
      </div>

      <div class="nav-actions">
        <!-- Family Members Strip (Top Right) -->
        <div class="family-strip">
          <span class="family-strip-label">Neighbors:</span>
          ${familyMembersHtml}
        </div>

        <!-- Add Book Button (Owner only) / Visitor Mode Badge -->
        ${isOwner ? `
          <button type="button" id="nav-add-book-btn" class="btn btn-primary">
            + Add Book
          </button>
        ` : `
          <div class="visitor-mode-pill" title="Visiting ${currentHouseUser.name}'s library in read-only mode">
            👁️ Visiting ${currentHouseUser.name}
          </div>
        `}

        <!-- View Switcher: 3D Scene <-> 2D List View -->
        <button type="button" id="nav-toggle-view-btn" class="btn btn-secondary">
          ${isListView ? `🎮 ${strings.nav.toggle3DView}` : `📋 ${strings.nav.toggleListView}`}
        </button>

        <!-- User profile badge -->
        <div class="user-pill" title="Logged in as ${user.name}">
          <div class="user-avatar" style="background-color: ${user.house_color || '#4f46e5'};">
            ${getAvatarEmoji(user)}
          </div>
          <span class="user-name">${user.name || 'Owner'}</span>
        </div>

        <!-- Sign Out Button -->
        <button type="button" id="nav-logout-btn" class="btn btn-ghost" title="${strings.nav.logout}">
          🚪
        </button>
      </div>
    </nav>
  `;

  // Function to close all open popovers
  const closeAllPopovers = () => {
    document.querySelectorAll('.family-popover-card').forEach(card => {
      card.style.display = 'none';
    });
  };

  // Wire family avatar toggle buttons
  document.querySelectorAll('[data-btn-member-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const memberId = btn.getAttribute('data-btn-member-id');
      const popover = document.getElementById(`popover-${memberId}`);
      if (!popover) return;

      const isVisible = popover.style.display === 'flex';
      closeAllPopovers();
      if (!isVisible) {
        popover.style.display = 'flex';
      }
    });
  });

  // Wire "Drive to his/her house" buttons
  document.querySelectorAll('[data-go-member-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPopovers();
      const memberId = btn.getAttribute('data-go-member-id');
      const targetMember = familyUsers.find(m => m.id === memberId);
      if (!targetMember) return;

      // Switch to 3D scene if in list view
      if (appState.currentView === 'list') {
        appState.setView('3d');
      }

      showToast(`Driving to ${targetMember.name}'s house! 🚗`, 'info');

      if (window.__driveToUser) {
        window.__driveToUser(targetMember);
      }
    });
  });

  // Wire "Enter house" buttons
  document.querySelectorAll('[data-enter-member-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPopovers();
      const memberId = btn.getAttribute('data-enter-member-id');
      const targetMember = familyUsers.find(m => m.id === memberId);
      if (!targetMember) return;

      if (appState.currentView === 'list') {
        appState.setView('3d');
      }

      showToast(`Entering ${targetMember.name}'s library! 🚪`, 'info');

      if (window.__enterHouse) {
        window.__enterHouse(targetMember);
      }
    });
  });

  // Wire Add Book
  document.getElementById('nav-add-book-btn')?.addEventListener('click', () => {
    openBookModal();
  });

  // Wire Toggle View
  document.getElementById('nav-toggle-view-btn')?.addEventListener('click', () => {
    appState.setView(isListView ? '3d' : 'list');
  });

  // Wire Logout
  document.getElementById('nav-logout-btn')?.addEventListener('click', () => {
    if (confirm("Are you sure you want to sign out?")) {
      logout();
      appState.setUser(null);
    }
  });

  // Close popovers when clicking outside
  document.removeEventListener('click', window.__familyNavClickOutsideHandler);
  window.__familyNavClickOutsideHandler = (e) => {
    if (!e.target.closest('.family-member-wrapper')) {
      closeAllPopovers();
    }
  };
  document.addEventListener('click', window.__familyNavClickOutsideHandler);
}
