const fs = require('fs');
const path = require('path');

function loadTopBar() {
  const topBarContainer = document.getElementById('topBarContainer');
  const topBarPath = path.join(__dirname, 'topBar.html');

  fs.readFile(topBarPath, 'utf8', (err, data) => {
    if (!err && topBarContainer) {
      topBarContainer.innerHTML = data;
      initTopBarEvents();
    } else {
      console.error('❌ Failed to load top bar:', err);
    }
  });
}

function initTopBarEvents() {
  document.getElementById('dropdownToggle')?.addEventListener('click', () => {
    document.getElementById('userDropdown')?.classList.toggle('show');
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
  });

  const name = localStorage.getItem('userName') || 'User';
  document.getElementById('userName').textContent = name;
}

module.exports = { loadTopBar };
