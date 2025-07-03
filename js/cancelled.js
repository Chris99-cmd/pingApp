const fs = require('fs');
const path = require('path');

const cancelledPath = path.join(__dirname, './data/cancelledSessions.json');
const cancelledListEl = document.getElementById('cancelledList');
const dateFilterEl = document.getElementById('cancelledDateFilter');
const clearFilterBtn = document.getElementById('clearFilterBtn');

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-PH', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit'
  });
} 

function renderCancelledSessions(filterDate = null) {
  cancelledListEl.innerHTML = '';

  if (!fs.existsSync(cancelledPath)) {
    cancelledListEl.innerHTML = '<p>No cancelled sessions found.</p>';
    return;
  }

  let cancelled = JSON.parse(fs.readFileSync(cancelledPath));

  if (cancelled.length === 0) {
    cancelledListEl.innerHTML = '<p>No cancelled sessions yet.</p>';
    return;
  }

  const filtered = filterDate
    ? cancelled.filter(s => new Date(s.cancelledAt).toDateString() === new Date(filterDate).toDateString())
    : cancelled;

  if (filtered.length === 0) {
    cancelledListEl.innerHTML = '<p>No sessions found for selected date.</p>';
    return;
  }

  const header = document.createElement('div');
  header.className = 'session-header';
 header.innerHTML = `
  <div>Date</div>
  <div>Time</div>
  <div>J.O #</div>
  <div>Owner</div>
  <div>Pet</div>
  <div>Barcode</div>
  <div>Package</div>
  <div>Price</div>
  <div>Reason</div>
  <div>Cancelled At</div>
  <div>🗑</div>
`;

  cancelledListEl.appendChild(header);

  filtered.forEach((session, index) => {
    const actualIndex = cancelled.findIndex(s => s.jobOrder === session.jobOrder);
    const row = document.createElement('div');
    row.className = 'session-row';
   row.innerHTML = `
  <div>${formatDate(session.createdAt)}</div>
  <div>${formatTime(session.createdAt)}</div>
  <div>${session.jobOrder}</div>
  <div>${session.owner}</div>
  <div>${session.pet}</div>
  <div>${session.barcode || '—'}</div>
  <div>${session.package}</div>
  <div>₱${session.total}</div>
  <div>${session.cancelReason || '—'}</div>
  <div>${formatTime(session.cancelledAt)}</div>
  <div><button class="delete-btn" data-index="${actualIndex}">Remove</button></div>
`;

    cancelledListEl.appendChild(row);
  });

  // Attach delete button listeners
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const index = parseInt(e.target.dataset.index);
    let cancelledData = JSON.parse(fs.readFileSync(cancelledPath));

    if (index >= 0 && index < cancelledData.length) {
      const confirmDelete = confirm('❌ Delete this cancelled session?');
      if (!confirmDelete) return;

      const sessionToDelete = cancelledData[index];
      const jobOrderToDelete = sessionToDelete.jobOrder;
      const clientId = sessionToDelete.clientId;
      const barcode = sessionToDelete.barcode;

      // ✅ Delete from cancelledSessions.json
      cancelledData.splice(index, 1);
      fs.writeFileSync(cancelledPath, JSON.stringify(cancelledData, null, 2));

      // ✅ Delete from sessionSummaries.json
      const summariesPath = path.join(__dirname, './data/sessionSummaries.json');
      if (fs.existsSync(summariesPath)) {
        let summaries = JSON.parse(fs.readFileSync(summariesPath));
        summaries = summaries.filter(s =>
          s.jobOrder !== jobOrderToDelete || s.status !== 'cancelled'
        );
        fs.writeFileSync(summariesPath, JSON.stringify(summaries, null, 2));
      }

      // ✅ Delete from clients.json > sessions[] and cleanup
      const clientsPath = path.join(__dirname, './data/clients.json');
      if (fs.existsSync(clientsPath)) {
        let clients = JSON.parse(fs.readFileSync(clientsPath));
        const client = clients.find(c => c.id === clientId);
        if (client) {
          client.pets = client.pets.filter(pet => {
            if (pet.barcode !== barcode) return true;

            pet.sessions = pet.sessions.filter(sess =>
              !(sess.jobOrder === jobOrderToDelete && sess.status === 'cancelled')
            );

            // Remove pet if no sessions remain
            return pet.sessions.length > 0;
          });

          // Remove client if no pets remain
          if (client.pets.length === 0) {
            clients = clients.filter(c => c.id !== clientId);
          }

          fs.writeFileSync(clientsPath, JSON.stringify(clients, null, 2));
        }
      }

      const filterDate = dateFilterEl?.value || null;
      renderCancelledSessions(filterDate); // 🔁 refresh
    }
  });
});


}

function getManilaTodayISO() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const [{ value: year }, , { value: month }, , { value: day }] = formatter.formatToParts(new Date());
  return `${year}-${month}-${day}`; // → 'YYYY-MM-DD' format
}


window.addEventListener('DOMContentLoaded', () => {
  const today = getManilaTodayISO();
  if (dateFilterEl) {
    dateFilterEl.value = today;
  }
  renderCancelledSessions(today);
});

// ❌ Clear filter
if (clearFilterBtn) {
  clearFilterBtn.addEventListener('click', () => {
    dateFilterEl.value = '';
    renderCancelledSessions();
  });
}
