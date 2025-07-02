const fs = require('fs');
const path = require('path');

const sessionListEl = document.getElementById('sessionList');
const summariesPath = path.join(__dirname, './data/sessionSummaries.json');
const clientsPath = path.join(__dirname, './data/clients.json');

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-PH', {
    month: '2-digit',
    day: '2-digit',
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}


function openCancelModal(onSubmit) {
  const modal = document.getElementById('cancelModal');
  const textarea = document.getElementById('cancelReason');
  const submitBtn = document.getElementById('cancelSubmit');
  const closeBtn = document.getElementById('cancelClose');

  textarea.value = '';
  modal.style.display = 'block';

  const cleanup = () => {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', submitHandler);
    closeBtn.removeEventListener('click', cleanup);
  };

  const submitHandler = () => {
    const reason = textarea.value.trim();
    if (!reason) {
      alert("⛔ Cancellation requires a reason.");
      return;
    }
    cleanup();
    onSubmit(reason);
  };

  submitBtn.addEventListener('click', submitHandler);
  closeBtn.addEventListener('click', cleanup);
}


function renderSessions() {
  if (!fs.existsSync(summariesPath)) {
    sessionListEl.innerHTML = '<p>No sessions found.</p>';
    return;
  }

  const summaries = JSON.parse(fs.readFileSync(summariesPath));
  const pendingSessions = summaries.filter(s => s.status === 'pending');

  if (pendingSessions.length === 0) {
    sessionListEl.innerHTML = '<p>No ongoing (pending) sessions right now.</p>';
    return;
  }

  // Add table headers
  const header = document.createElement('div');
  header.className = 'session-header';
 header.innerHTML = `
  <div>Date</div>
  <div>Time</div>
  <div>J.O #</div>
  <div>Owner</div>
  <div>Pet</div>
  <div>Breed</div>
  <div>Size</div>
  <div>Package</div>
  <div>Express</div>
  <div>Matting</div>
  <div>Tangling</div>
  <div>Shedding</div>
  <div>Price</div>
  <div>Payment</div>
  <div>Action</div>
`;

  sessionListEl.appendChild(header);

  pendingSessions.forEach((session, index) => {
    const row = document.createElement('div');
    row.className = 'session-row';

    const select = document.createElement('select');
    select.className = 'payment-select';
    ['pending', 'cash', 'gcash', 'promo'].forEach(optionVal => {
      const option = document.createElement('option');
      option.value = optionVal;
      option.textContent = optionVal.charAt(0).toUpperCase() + optionVal.slice(1);
      if (optionVal === 'pending') option.selected = true;
      select.appendChild(option);
    });

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-button';
    saveBtn.textContent = 'Save';
// Payment Save Button
saveBtn.addEventListener('click', () => {
  const selected = select.value;

  if (selected === 'pending') {
    alert("❌ Please choose a valid payment method before submitting.");
    return;
  }

  if (!confirm("✅ Submit this session?")) return;

  const now = new Date();

  // 🔄 Update sessionSummaries
  const summaryToUpdate = summaries.find(s => s.jobOrder === session.jobOrder);
  if (summaryToUpdate) {
    summaryToUpdate.payment = selected;
    summaryToUpdate.releasedTime = now.toISOString();
    summaryToUpdate.status = 'done';
    console.log(`✅ Updated summary for jobOrder: ${session.jobOrder}`);
  } else {
    console.warn(`⚠️ Session summary not found for jobOrder: ${session.jobOrder}`);
  }

  // 🔄 Update clients.json
  const clients = JSON.parse(fs.readFileSync(clientsPath));
  const client = clients.find(c => c.owner === session.owner);
  if (client) {
    const pet = client.pets.find(p => p.barcode === session.barcode || p.barcode === session.petBarcode);
    if (pet && Array.isArray(pet.sessions)) {
      const petSession = pet.sessions.find(s => String(s.jobOrder) === String(session.jobOrder));
      if (petSession) {
        petSession.payment = selected;
        petSession.timeReleased = now.toISOString();

        // 🔁 Recalculate totalSpent
        pet.totalSpent = pet.sessions.reduce((sum, s) => sum + (s.price || 0), 0);

        console.log(`✅ Updated client pet session and totalSpent`);
      } else {
        console.warn(`⚠️ Matching session not found in pet sessions.`);
      }
    }
  }

  // 💾 Save updated files
  fs.writeFileSync(summariesPath, JSON.stringify(summaries, null, 2));
  fs.writeFileSync(clientsPath, JSON.stringify(clients, null, 2));
  console.log("✅ All files saved successfully");

  row.remove();
});

const cancelBtn = document.createElement('button');
cancelBtn.className = 'cancel-button';
cancelBtn.textContent = 'Cancel';

cancelBtn.addEventListener('click', () => {
  openCancelModal((reason) => {
    if (!confirm("⚠️ Are you sure you want to cancel this grooming session?")) return;

    // Mark session as cancelled and attach cancellation info
    session.status = 'cancelled';
    session.cancelledAt = new Date().toISOString();
    session.cancelReason = reason;

    // Update sessionSummaries.json
    const summaries = JSON.parse(fs.readFileSync(summariesPath));
    const summary = summaries.find(s => String(s.jobOrder) === String(session.jobOrder) && s.barcode === session.barcode);
    if (summary) {
      summary.status = 'cancelled';
      summary.cancelledAt = session.cancelledAt;
      summary.cancelReason = session.cancelReason;
    }
    fs.writeFileSync(summariesPath, JSON.stringify(summaries, null, 2));

    // Update clients.json (mark status in pet.sessions)
    const clients = JSON.parse(fs.readFileSync(clientsPath));
    const client = clients.find(c => c.owner === session.owner);
    if (client) {
      const pet = client.pets.find(p => p.barcode === session.barcode || p.barcode === session.petBarcode);
      if (pet && Array.isArray(pet.sessions)) {
        const petSession = pet.sessions.find(s => String(s.jobOrder) === String(session.jobOrder));
        if (petSession) {
          petSession.status = 'cancelled';
          petSession.cancelledAt = session.cancelledAt;
          petSession.cancelReason = session.cancelReason;
        }
      }
    }
    fs.writeFileSync(clientsPath, JSON.stringify(clients, null, 2));

    row.remove(); // remove from current UI (optional)
    console.log(`🗑️ Session ${session.jobOrder} marked as cancelled.`);
  });
});



let expressDisplay = 'None';
if (Array.isArray(session.express)) {
  expressDisplay = session.express.join(', ');
} else if (typeof session.express === 'string') {
  expressDisplay = session.express;
}

const fields = [
  formatDate(session.createdAt),
  formatTime(session.createdAt),
  session.jobOrder,
  session.owner,
  session.pet,
  session.breed,
  session.size,
  session.pkg || session.package || "None",
  expressDisplay,
  session.matting || "None",
  session.tangling || "None",
  session.shedding || "None",
  `₱${session.total}`
];


fields.forEach(val => {
  const col = document.createElement('div');
  col.textContent = val;
  row.appendChild(col);
});

// 📥 Append payment <select>
const paymentCol = document.createElement('div');
paymentCol.appendChild(select);
row.appendChild(paymentCol);

  const editBtn = document.createElement('button');
editBtn.className = 'edit-button';
editBtn.textContent = 'Edit';

editBtn.addEventListener('click', () => {
  localStorage.setItem('editJobOrder', session.jobOrder);
  window.location.href = 'onGoingEdit.html';
});
// 🎯 Append Save + Cancel buttons stacked vertically
const actionCol = document.createElement('div');
actionCol.style.display = 'flex';
actionCol.style.flexDirection = 'column';
actionCol.style.gap = '4px'; // spacing between Save & Cancel
actionCol.appendChild(saveBtn);
actionCol.appendChild(cancelBtn);
actionCol.appendChild(editBtn);
row.appendChild(actionCol);

// 🚀 Add full row to the session list
sessionListEl.appendChild(row);

  });
}

renderSessions();
