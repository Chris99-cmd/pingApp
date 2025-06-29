const fs = require('fs');
const path = require('path');

const sessionPath = path.join(__dirname, './data/sessionSummaries.json');
const groomerFilter = document.getElementById('groomerFilter');
const dateFilter = document.getElementById('dateFilter');
const sessionTableBody = document.getElementById('sessionTableBody');

let allSessions = [];

window.onload = () => {
  if (fs.existsSync(sessionPath)) {
    allSessions = JSON.parse(fs.readFileSync(sessionPath));
    populateFilters(allSessions);
    renderTable(allSessions);
  }

  groomerFilter.addEventListener('change', applyFilters);
  dateFilter.addEventListener('change', applyFilters);
};

function populateFilters(data) {
  const groomers = [...new Set(data.map(s => s.groomer))];
  const dates = [...new Set(data.map(s => s.date))];

  groomers.forEach(g => {
    const option = document.createElement('option');
    option.value = g;
    option.textContent = g;
    groomerFilter.appendChild(option);
  });

  dates.forEach(d => {
    const option = document.createElement('option');
    option.value = d;
    option.textContent = d;
    dateFilter.appendChild(option);
  });
}

function applyFilters() {
  const selectedGroomer = groomerFilter.value;
  const selectedDate = dateFilter.value;

  let filtered = allSessions;

  if (selectedGroomer !== 'all') {
    filtered = filtered.filter(s => s.groomer === selectedGroomer);
  }
  if (selectedDate !== 'all') {
    filtered = filtered.filter(s => s.date === selectedDate);
  }

  renderTable(filtered);
}

function renderTable(data) {
  sessionTableBody.innerHTML = '';

  data.forEach(session => {
    const petNames = session.pets.map(p => p.name).join(', ');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${session.date}</td>
      <td>${session.owner}</td>
      <td>${petNames}</td>
      <td>${session.pets.map(p => p.package).join(', ')}</td>
      <td>₱${session.total.toFixed(2)}</td>
      <td>${session.groomer}</td>
    `;

    sessionTableBody.appendChild(row);
  });
}
