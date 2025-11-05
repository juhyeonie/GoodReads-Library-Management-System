// auth.js — handles session auth, logout, and cache protection

function isAuthenticated() {
  return sessionStorage.getItem('is_logged_in') === 'true' && !!sessionStorage.getItem('user_plan');
}

function requireAuth() {
  if (!isAuthenticated()) {
    location.replace('Startpage.html');
  } else {
    // Replace history entry so "back" from homepage doesn’t land on SignIn
    history.replaceState(null, '', window.location.href);
  }
}

function logoutAll() {
  try {
    sessionStorage.removeItem('is_logged_in');
    sessionStorage.removeItem('user_plan');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('is_plan_expired');
    sessionStorage.removeItem('original_plan');
    // Clear other related localStorage keys if needed
    // localStorage.removeItem('user_plan');
    // localStorage.removeItem('is_logged_in');

    // Redirect using replace to prevent back navigation
    location.replace('Startpage.html');
  } catch (err) {
    console.error('Logout failed:', err);
    location.replace('Startpage.html');
  }
}

function attachLogoutButtons() {
  document.querySelectorAll('a.logout, button.logout').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      logoutAll();
    });
  });
}

// 🧩 Prevent showing stale (cached) pages after logout or via back navigation
function preventCacheAndForceReload() {
  // If page is loaded from cache, force a reload
  window.addEventListener('pageshow', function (event) {
    if (event.persisted || (performance && performance.navigation && performance.navigation.type === 2)) {
      console.log('🔄 Page loaded from cache — forcing reload.');
      window.location.reload();
    }
  });

  // Optional: add headers to prevent caching (for Live Server this still helps)
  const meta1 = document.createElement('meta');
  meta1.httpEquiv = 'Cache-Control';
  meta1.content = 'no-cache, no-store, must-revalidate';
  const meta2 = document.createElement('meta');
  meta2.httpEquiv = 'Pragma';
  meta2.content = 'no-cache';
  const meta3 = document.createElement('meta');
  meta3.httpEquiv = 'Expires';
  meta3.content = '0';
  document.head.appendChild(meta1);
  document.head.appendChild(meta2);
  document.head.appendChild(meta3);
}

function securePopStateHandler() {
  window.addEventListener('popstate', function () {
    if (!isAuthenticated()) {
      location.replace('Startpage.html');
    }
  });
}

function callOnProtectedPage() {
  preventCacheAndForceReload();
  requireAuth();
  attachLogoutButtons();
  securePopStateHandler();
  history.replaceState(null, '', window.location.href);
}
