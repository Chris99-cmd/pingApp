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
      <div>${session.package}</div>
      <div>₱${session.total}</div>
      <div>${session.reason}</div>
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
        if (confirmDelete) {
          cancelledData.splice(index, 1);
          fs.writeFileSync(cancelledPath, JSON.stringify(cancelledData, null, 2));
          const filterDate = dateFilterEl?.value || null;
          renderCancelledSessions(filterDate); // 🔁 auto reload
        }
      }
    });
  });
}

// 🔄 Load today's cancelled by default
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  if (dateFilterEl) {
    dateFilterEl.value = today;
  }
  renderCancelledSessions(today);
});

// 📆 Filter by date
if (dateFilterEl) {
  dateFilterEl.addEventListener('change', e => {
    const selectedDate = e.target.value;
    renderCancelledSessions(selectedDate);
  });
}

// ❌ Clear filter
if (clearFilterBtn) {
  clearFilterBtn.addEventListener('click', () => {
    dateFilterEl.value = '';
    renderCancelledSessions();
  });
}
