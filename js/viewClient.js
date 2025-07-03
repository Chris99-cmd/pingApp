const fs = require('fs');
const path = require('path');
const { dialog } = require('@electron/remote');
const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const ExcelJS = require("exceljs");
const clientsPath = path.join(__dirname, './data/clients.json');
const groomersPath = path.join(__dirname, './data/groomers.json');
const packagesPath = path.join(__dirname, './data/packages.json');
const sizesPath = path.join(__dirname, './data/sizes.json');
const sessionSummariesPath = path.join(__dirname, './data/sessionSummaries.json');
const expressPath = path.join(__dirname, './data/express.json');
const mattingPath = path.join(__dirname, './data/matting.json');
const sheddingPath = path.join(__dirname, './data/shedding.json');
const tanglingPath = path.join(__dirname, './data/tangling.json');
const pricesPath = path.join(__dirname, './data/prices.json');
const usersPath = path.join(__dirname, './data/users.json');

function validateAdminPassword(inputPassword) {
  if (!fs.existsSync(usersPath)) return false;
  const users = JSON.parse(fs.readFileSync(usersPath));
  const adminUser = users.find(u => u.role === 'admin');
  return adminUser && inputPassword === adminUser.password;
}


function requestAdminAccess(onSuccess) {
  const modal = document.getElementById('adminPromptModal');
  const input = document.getElementById('adminPasswordInput');
  const confirmBtn = document.getElementById('confirmAdminBtn');
  const cancelBtn = document.getElementById('cancelAdminBtn');

  if (!modal || !input || !confirmBtn || !cancelBtn) {
    alert("Admin prompt modal not found in DOM.");
    return;
  }

  isDashboardRedirect = false; // This is for modal view, not dashboard
  window._onAdminConfirm = onSuccess;

  input.value = '';
  modal.style.display = 'flex';
  input.focus();

  const confirmHandler = () => {
    if (validateAdminPassword(input.value)) {
      modal.style.display = 'none';
      confirmBtn.removeEventListener('click', confirmHandler);
      cancelBtn.removeEventListener('click', cancelHandler);
      onSuccess();
    } else {
      alert("❌ Incorrect admin password.");
    }
  };

  const cancelHandler = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', confirmHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  };

  confirmBtn.addEventListener('click', confirmHandler);
  cancelBtn.addEventListener('click', cancelHandler);
}


function requireAdminPassword(callback) {
  const input = prompt("🔐 Enter admin password:");
  if (input === null) return; // Cancel clicked

  if (validateAdminPassword(input)) {
    callback(); // ✅ proceed
  } else {
    alert("❌ Incorrect admin password.");
  }
}

function calculateModalTotal() {
  const size = document.getElementById('modalSize')?.value;
  const pkg = document.getElementById('modalPkg')?.value;

  const express = Array.from(document.getElementById('modalExpress')?.selectedOptions || []).map(o => o.value);
  const matting = document.getElementById('modalMatting')?.value;
  const tangling = document.getElementById('modalTangling')?.value;
  const shedding = document.getElementById('modalShedding')?.value;

  const prices = JSON.parse(fs.readFileSync(path.join(__dirname, './data/prices.json')));
  const mattingOptions = JSON.parse(fs.readFileSync(mattingPath));
  const tanglingOptions = JSON.parse(fs.readFileSync(tanglingPath));
  const sheddingOptions = JSON.parse(fs.readFileSync(sheddingPath));
  const expressOptions = JSON.parse(fs.readFileSync(expressPath));

  let total = 0;

  // 🧾 Package+Size combo price
  if (prices[size] && prices[size][pkg]) {
    total += prices[size][pkg];
  }

  // 🧾 Express
  express.forEach(service => {
    const match = expressOptions.find(e => e.name === service);
    if (match) total += match.price;
  });

  // 🧾 Matting
  const mat = mattingOptions.find(m => m.label === matting);
  if (mat) total += mat.price;

  // 🧾 Tangling
  const tan = tanglingOptions.find(t => t.label === tangling);
  if (tan) total += tan.price;

  // 🧾 Shedding
  const shed = sheddingOptions.find(s => s.label === shedding);
  if (shed) total += shed.price;

  
  const totalField = document.getElementById('modalTotal');
  if (totalField) totalField.value = `₱${total}`;

  return total;
}

function loadPackages() {
  const pkgSelect = document.getElementById('filterPackage');
  if (!fs.existsSync(packagesPath)) return;
  const packages = JSON.parse(fs.readFileSync(packagesPath));
  packages.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    pkgSelect.appendChild(opt);
  });
}


function loadSizes() {
  const sizeSelect = document.getElementById('filterSize');
  if (!fs.existsSync(sizesPath)) return;
  const sizes = JSON.parse(fs.readFileSync(sizesPath));
  sizes.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.label;
    opt.textContent = s.label;
    sizeSelect.appendChild(opt);
  });
}


const topBarHtml = fs.readFileSync(path.join(__dirname, 'topBar.html'), 'utf-8');
document.getElementById('topBarContainer').innerHTML = topBarHtml;
const tableBody = document.getElementById('sessionTableBody');
const groomerFilter = document.getElementById('filterGroomer');
const analogyFilter = document.getElementById('filterAnalogy');
const packageFilter = document.getElementById('filterPackage');
const sizeFilter = document.getElementById('filterSize');
const dateFromFilter = document.getElementById('filterDateFrom');
const dateToFilter = document.getElementById('filterDateTo');

let allClients = [];

function showConfirmation(message, onConfirm) {
  const confirmed = confirm(message);
  if (confirmed) onConfirm();
}


function loadGroomers() {
  if (!fs.existsSync(groomersPath)) return;
  const groomers = JSON.parse(fs.readFileSync(groomersPath));
  groomers.forEach(g => {
    const opt = document.createElement('option');
    opt.value = `${g.firstName} ${g.lastName}`;
    opt.textContent = `${g.firstName} ${g.lastName}`;
    groomerFilter.appendChild(opt);
  });
}

function loadClients() {
  if (fs.existsSync(clientsPath)) {
    allClients = JSON.parse(fs.readFileSync(clientsPath));
  }

  if (!fs.existsSync(sessionSummariesPath)) return;
  const summaries = JSON.parse(fs.readFileSync(sessionSummariesPath));


  for (const summary of summaries) {
    const { jobOrder, payment, releasedTime } = summary;
    for (const client of allClients) {
      for (const pet of client.pets) {
        const session = pet.sessions?.find(s => String(s.jobOrder) === String(jobOrder));
        if (session) {
          if (payment) session.payment = payment;
          if (releasedTime) session.timeReleased = releasedTime;
        }
      }
    }
  }
}


function formatReadableTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}


function applyFilters() {
  const groomerVal = groomerFilter.value;
  const analogyVal = analogyFilter.value;
  const packageVal = packageFilter.value;
  const sizeVal = sizeFilter.value;
  const dateFrom = dateFromFilter.value ? new Date(dateFromFilter.value) : null;
  const dateTo = dateToFilter.value ? new Date(dateToFilter.value) : null;

  tableBody.innerHTML = '';

  let sessionCount = 0;
  let totalAmount = 0;

 
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isFilterEmpty = !groomerVal && !analogyVal && !packageVal && !sizeVal && !dateFrom && !dateTo;

  allClients.forEach(client => {
    client.pets.forEach(pet => {
      pet.sessions?.forEach(session => {
        
if (session.status === 'cancelled') return;

        const sessionDate = new Date(session.date);
        const compareDate = new Date(sessionDate);
        compareDate.setHours(0, 0, 0, 0); 

        if (isFilterEmpty && compareDate.getTime() !== today.getTime()) return;

      
        if (
          (groomerVal && session.groomer !== groomerVal) ||
          (analogyVal && pet.analogy !== analogyVal) ||
          (packageVal && session.pkg !== packageVal) ||
          (sizeVal && session.size !== sizeVal) ||
          (dateFrom && sessionDate < dateFrom) ||
          (dateTo && sessionDate > dateTo)
        ) return;

        const express = session.express?.length ? session.express.join(', ') : 'None';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${sessionDate.toLocaleDateString()}</td>
          <td>${session.createdAt ? new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
          <td>${session.jobOrder || '-'}</td>
          <td>${client.owner}</td>
          <td>${client.contact}</td>
          <td class="client-id">${client.id || '-'}</td>
          <td>${pet.name}</td>
          <td>${pet.breed}</td>
          <td>${pet.analogy}</td>
          <td>${pet.gender || '-'}</td>
          <td>${session.age || '-'}</td>
          <td>${session.weight || '-'}</td>
          <td>${pet.barcode}</td>
          <td>${session.size}</td>
          <td>${session.pkg}</td>
          <td>${express}</td>
          <td>${session.matting || '-'}</td>
          <td>${session.tangling || '-'}</td>
          <td>${session.shedding || '-'}</td>
          <td>${session.groomer || 'N/A'}</td>
          <td>₱${session.price}</td>
          <td>${session.timeReleased ? formatReadableTime(session.timeReleased) : '-'}</td>
          <td>${session.payment || 'pending'}</td>
          <td><span class="view-icon"
  data-owner="${client.owner}" 
  data-contact="${client.contact}" 
  data-clientid="${client.id}" 
  data-barcode="${pet.barcode}" 
  data-joborder="${session.jobOrder}">🔍</span></td>

        `;

        tableBody.appendChild(row);

        sessionCount++;
        totalAmount += session.price;
      });
    });
  });

  document.getElementById('totalSessions').textContent = sessionCount;
  document.getElementById('totalAmount').textContent = `₱${totalAmount}`;
}

const modal = document.getElementById('detailsModal');
const modalFields = document.getElementById('modalFields');
const closeBtn = document.getElementById('closeBtn');
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');

let currentSessionRef = null;

function showModal(client, pet, session) {
  const expressList = session.express || [];

  modalFields.innerHTML = `
  <label>Client Name: <input id="modalClientName" type="text" value="${client.owner}" disabled></label>
<label>Contact #: <input id="modalClientContact" type="text" value="${client.contact}" disabled></label>
    <label>Name: <input id="modalName" type="text" value="${pet.name}"></label>
    <label>Breed: <input id="modalBreed" type="text" value="${pet.breed}"></label>
    <label>Analogy: 
      <select id="modalAnalogy">
        <option ${pet.analogy === 'Canine' ? 'selected' : ''}>Canine</option>
        <option ${pet.analogy === 'Feline' ? 'selected' : ''}>Feline</option>
      </select>
    </label>
    <label>Gender:
      <select id="modalGender">
        <option ${pet.gender === 'Male' ? 'selected' : ''}>Male</option>
        <option ${pet.gender === 'Female' ? 'selected' : ''}>Female</option>
      </select>
    </label>
    <label>Age: <input id="modalAge" type="text" value="${session.age || ''}"></label>
    <label>Weight: <input id="modalWeight" type="text" value="${session.weight || ''}"></label>
    
    <label>Size: <select id="modalSize"></select></label>
    <label>Package: <select id="modalPkg"></select></label>
    <label>Express: <select id="modalExpress" multiple></select></label>
    <label>Matting: <select id="modalMatting"></select></label>
    <label>Tangling: <select id="modalTangling"></select></label>
    <label>Shedding: <select id="modalShedding"></select></label>
    <label>Groomer: <select id="modalGroomer"></select></label>
    <label>Payment:
      <select id="modalPayment">
        <option ${session.payment === 'cash' ? 'selected' : ''}>cash</option>
        <option ${session.payment === 'gcash' ? 'selected' : ''}>gcash</option>
        <option ${session.payment === 'promo' ? 'selected' : ''}>promo</option>
      </select>
    </label>
    <label>Total: <input id="modalTotal" type="text" value="₱${session.price}" disabled></label>
  `;


  const loadSelectOptions = (id, values, selectedValue, isMulti = false) => {
    const select = document.getElementById(id);

      const allowNone = ['modalPkg', 'modalMatting', 'modalTangling', 'modalShedding', 'modalExpress'];
  if (allowNone.includes(id)) values = ['None', ...values];

    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      if (isMulti && expressList.includes(v)) opt.selected = true;
      else if (v === selectedValue) opt.selected = true;
      select.appendChild(opt);
    });
  };

  loadSelectOptions('modalSize', loadJsonArray(sizesPath, 'label'), session.size);
  loadSelectOptions('modalPkg', loadJsonArray(packagesPath), session.pkg);
  loadSelectOptions('modalExpress', loadJsonArray(expressPath, 'name'), session.express, true);
  loadSelectOptions('modalMatting', loadJsonArray(mattingPath, 'label'), session.matting);
  loadSelectOptions('modalTangling', loadJsonArray(tanglingPath, 'label'), session.tangling);
  loadSelectOptions('modalShedding', loadJsonArray(sheddingPath, 'label'), session.shedding);
  loadSelectOptions('modalGroomer', loadGroomerList(), session.groomer);


  ['modalSize', 'modalPkg', 'modalMatting', 'modalTangling', 'modalShedding', 'modalExpress'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', calculateModalTotal);
  });

  calculateModalTotal(); // initialize
  modal.style.display = 'flex';
  currentSessionRef = { client, pet, session };
}


function loadJsonArray(filePath, key = null) {
  if (!fs.existsSync(filePath)) return [];
  const data = JSON.parse(fs.readFileSync(filePath));
  return key ? data.map(d => d[key]) : data;
}

function loadGroomerList() {
  if (!fs.existsSync(groomersPath)) return [];
  const data = JSON.parse(fs.readFileSync(groomersPath));
  return data.map(g => `${g.firstName} ${g.lastName}`);
}

editBtn.onclick = () => {
  ['modalClientName', 'modalClientContact', 'modalName', 'modalBreed', 'modalAge', 'modalWeight'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });
  saveBtn.style.display = 'inline-block';
  editBtn.style.display = 'none';
};


saveBtn.onclick = () => {
  showConfirmation('Are you sure you want to save these changes?', () => {
    const updated = {
      name: document.getElementById('modalName').value,
      breed: document.getElementById('modalBreed').value,
      analogy: document.getElementById('modalAnalogy').value,
      gender: document.getElementById('modalGender').value,
      age: document.getElementById('modalAge').value,
      weight: document.getElementById('modalWeight').value,
      size: document.getElementById('modalSize').value,
      pkg: document.getElementById('modalPkg').value,
      express: Array.from(document.getElementById('modalExpress').selectedOptions).map(o => o.value),
      matting: document.getElementById('modalMatting').value,
      tangling: document.getElementById('modalTangling').value,
      shedding: document.getElementById('modalShedding').value,
      groomer: document.getElementById('modalGroomer').value,
      payment: document.getElementById('modalPayment').value
    };

    const { client, pet, session } = currentSessionRef;

    pet.name = updated.name;
    pet.breed = updated.breed;
    client.owner = document.getElementById('modalClientName').value;
client.contact = document.getElementById('modalClientContact').value;
    pet.analogy = updated.analogy;
    pet.gender = updated.gender;

     const newPrice = calculateModalTotal();
    session.price = newPrice;

    Object.assign(session, {
      age: updated.age,
      weight: updated.weight,
      size: updated.size,
      pkg: updated.pkg,
      express: updated.express,
      matting: updated.matting,
      tangling: updated.tangling,
      shedding: updated.shedding,
      groomer: updated.groomer,
      payment: updated.payment
    });

    fs.writeFileSync(clientsPath, JSON.stringify(allClients, null, 2));

    const summaries = JSON.parse(fs.readFileSync(sessionSummariesPath));
    const summary = summaries.find(s => String(s.jobOrder) === String(session.jobOrder) && s.barcode === pet.barcode);
    if (summary) {
      summary.groomer = session.groomer;
      summary.payment = session.payment;
      fs.writeFileSync(sessionSummariesPath, JSON.stringify(summaries, null, 2));
    }

    applyFilters();
    modal.style.display = 'none';
    saveBtn.style.display = 'none';
    editBtn.style.display = 'inline-block';

   
  });
};

deleteBtn.onclick = () => {
  showConfirmation('Are you sure you want to delete this session?', () => {
    const { client, pet, session } = currentSessionRef;

    // 🗑 Remove the session from pet.sessions
    pet.sessions = pet.sessions.filter(s => String(s.jobOrder) !== String(session.jobOrder));

    // 🗑 Remove the pet if it has no sessions left
    if (pet.sessions.length === 0) {
      client.pets = client.pets.filter(p => p.barcode !== pet.barcode);
    }

    // 🗑 Remove the client entirely if they have no pets left
    if (client.pets.length === 0) {
      const clientIndex = allClients.findIndex(c => c.id === client.id);
      if (clientIndex !== -1) {
        allClients.splice(clientIndex, 1);
      }
    }

const sessionSummaryPath = path.join(__dirname, './data/sessionSummaries.json');
let sessionSummaries = [];

if (fs.existsSync(sessionSummaryPath)) {
  sessionSummaries = JSON.parse(fs.readFileSync(sessionSummaryPath));
}

sessionSummaries = sessionSummaries.filter(s =>
  String(s.jobOrder) !== String(session.jobOrder)
);

// Always write it — even if the file was missing
fs.writeFileSync(sessionSummaryPath, JSON.stringify(sessionSummaries, null, 2));
    fs.writeFileSync(clientsPath, JSON.stringify(allClients, null, 2));

    applyFilters();
    modal.style.display = 'none';
  });
};

closeBtn.onclick = () => {
  modal.style.display = 'none';
  editBtn.style.display = 'inline-block';
  saveBtn.style.display = 'none';
};

document.getElementById('applyFilter').onclick = () => {
  loadClients();  // 🔁 reload updated data
  applyFilters();
};


document.getElementById('resetFilter').onclick = () => {
  groomerFilter.value = '';
  analogyFilter.value = '';
  packageFilter.value = '';
  sizeFilter.value = '';
  dateFromFilter.value = '';
  dateToFilter.value = '';
  applyFilters();
};

tableBody.addEventListener('click', (e) => {
  if (e.target.classList.contains('view-icon')) {
    const { owner, contact, barcode, joborder } = e.target.dataset;
    const client = allClients.find(c => c.owner === owner && c.contact === contact);
    const pet = client?.pets.find(p => p.barcode === barcode);
    const session = pet?.sessions.find(s => String(s.jobOrder) === String(joborder));

   if (client && pet && session) {
  requestAdminAccess(() => showModal(client, pet, session));
}

  }
});


window.addEventListener('DOMContentLoaded', () => {
  loadGroomers();
  loadClients();
  loadPackages(); 
  loadSizes(); 
  applyFilters();

  
});

document.getElementById('clientSearchInput')?.addEventListener('input', function () {
  const query = this.value.toLowerCase().trim();
  const rows = document.querySelectorAll('#sessionTableBody tr');

  rows.forEach(row => {
    const rowText = row.textContent.toLowerCase();
    row.style.display = rowText.includes(query) ? '' : 'none';
  });
});


document.getElementById("exportBtn").addEventListener("click", async () => {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['PDF', 'Excel', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    title: 'Export',
    message: 'Choose format to export:'
  });

  if (response === 2) return; // Cancel clicked

  // Get visible rows only
  const rows = Array.from(document.querySelectorAll("#sessionTableBody tr"))
  .filter(row => row.style.display !== "none")
  .map(row => {
    const cells = row.querySelectorAll("td");
    return Array.from(cells).slice(0, 19).map(cell => cell.innerText); // all 19 data columns
  });


  const headers = [[
  "Date",
  "Time Created",
  "J.O.",
  "Owner",
  "Contact",
  "Pet",
  "Breed",
  "Analogy",
  "Gender",
  "Age",
  "Weight",
  "Barcode",
  "Size",
  "Package",
  "Express",
  "Matting",
  "Tangling",
  "Shedding",
  "Groomer",
  "Price"
]];


if (response === 0) {
  // 📄 PDF Export (Trimmed & Corrected Columns)
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(12);
  doc.text("Client Session Summary", 14, 15);

  const trimmedHeaders = [["Date", "Time", "J.O.", "Owner", "Contact", "Pet", "Breed", "Size", "Package", "Groomer", "Price"]];

  const trimmedRows = Array.from(document.querySelectorAll("#sessionTableBody tr"))
  .filter(row => row.style.display !== "none")
  .map(row => {
    const cells = row.querySelectorAll("td");
    return [
      cells[0]?.innerText,  // Date
      cells[1]?.innerText,  // Time
      cells[2]?.innerText,  // J.O.
      cells[3]?.innerText,  // Owner
      cells[4]?.innerText,  // Contact
      cells[5]?.innerText,  // Pet
      cells[7]?.innerText,  // Breed
      cells[12]?.innerText, // Size
      cells[13]?.innerText, // Package
      cells[18]?.innerText, // Groomer
      `₱${parseFloat(cells[19]?.innerText.replace(/[^\d.]/g, '') || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    ];
  });

  let totalSessions = trimmedRows.length;
  let totalAmount = trimmedRows.reduce((sum, row) => {
    const price = parseFloat(row[10]?.replace(/[₱,]/g, '')) || 0;
    return sum + price;
  }, 0);

  doc.autoTable({
    head: trimmedHeaders,
    body: trimmedRows,
    startY: 25,
    styles: { fontSize: 9 },
    theme: 'striped',
    headStyles: { fillColor: [22, 160, 133] },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      doc.setFontSize(10);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);
    }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total Sessions: ${totalSessions}`, 14, finalY);
  doc.text(`Total Amount: ₱${totalAmount.toLocaleString()}`, 14, finalY + 10);

  const pdfData = doc.output("blob");
  const pdfBuffer = Buffer.from(await pdfData.arrayBuffer());

  const pdfPath = dialog.showSaveDialogSync({
    title: "Save PDF",
    defaultPath: "client_sessions.pdf",
    filters: [{ name: "PDF Files", extensions: ["pdf"] }]
  });

  if (pdfPath) {
    require("fs").writeFileSync(pdfPath, pdfBuffer);
    alert("✅ PDF saved!");
  }
}
 else if (response === 1) {
  // 📊 Excel Export
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Client Sessions");

  const headers = [
    "Date", "Time", "J.O.", "Owner", "Contact", "Pet", "Breed", "Analogy", "Gender",
    "Age", "Weight", "Barcode", "Size", "Package", "Express", "Matting",
    "Tangling", "Shedding", "Groomer", "Price"
  ];
  sheet.addRow(headers);

  let totalAmount = 0;

  const rows = Array.from(document.querySelectorAll("#sessionTableBody tr"))
    .filter(row => row.style.display !== "none")
    .map(row => {
      const cells = row.querySelectorAll("td");

      const price = parseFloat(cells[19]?.innerText.replace(/[₱,]/g, '')) || 0;
      totalAmount += price;

      return [
        cells[0]?.innerText,  // Date
        cells[1]?.innerText,  // Time
        cells[2]?.innerText,  // J.O.
        cells[3]?.innerText,  // Owner
        cells[4]?.innerText,  // Contact
        cells[5]?.innerText,  // Pet
        cells[6]?.innerText,  // Breed
        cells[7]?.innerText,  // Analogy
        cells[8]?.innerText,  // Gender
        cells[9]?.innerText,  // Age
        cells[10]?.innerText, // Weight
        cells[11]?.innerText, // Barcode
        cells[12]?.innerText, // Size
        cells[13]?.innerText, // Package
        cells[14]?.innerText, // Express
        cells[15]?.innerText, // Matting
        cells[16]?.innerText, // Tangling
        cells[17]?.innerText, // Shedding
        cells[18]?.innerText, // Groomer
        parseFloat(cells[19]?.innerText.replace(/[^\d.]/g, '') || '0').toFixed(2)
      ];
    });

  rows.forEach(r => sheet.addRow(r));

  // Add summary rows
  sheet.addRow([]);
  sheet.addRow(["Total Sessions", rows.length]);
  sheet.addRow(["Total Amount", `₱${totalAmount.toFixed(2)}`]);

  // Auto-size all columns
  sheet.columns.forEach(column => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: true }, cell => {
      const cellValue = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, cellValue.length + 2);
    });
    column.width = maxLength;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const excelPath = dialog.showSaveDialogSync({
    title: "Save Excel",
    defaultPath: "client_sessions.xlsx",
    filters: [{ name: "Excel Files", extensions: ["xlsx"] }]
  });

  if (excelPath) {
    require("fs").writeFileSync(excelPath, Buffer.from(buffer));
    alert("✅ Excel saved!");
  }
}

});


window.addEventListener('DOMContentLoaded', () => {
  const adminPassword = "password"; // Change this if needed

  const backBtn = document.getElementById('backToDashboardBtn');
  const modal = document.getElementById('adminPromptModal');
  const input = document.getElementById('adminPasswordInput');
  const confirmBtn = document.getElementById('confirmAdminBtn');
  const cancelBtn = document.getElementById('cancelAdminBtn');

if (backBtn && modal && input && confirmBtn && cancelBtn) {
  backBtn.addEventListener('click', () => {
    isDashboardRedirect = true; // This is for redirect
    window._onAdminConfirm = null;

    input.value = '';
    modal.style.display = 'flex';
    input.focus();
  });


   confirmBtn.addEventListener('click', () => {
  const password = document.getElementById('adminPasswordInput').value;

  if (validateAdminPassword(password)) {
    modal.style.display = 'none';

    if (isDashboardRedirect) {
      window.location.href = 'adminDashboard.html';
    } else if (typeof window._onAdminConfirm === 'function') {
      window._onAdminConfirm();
      window._onAdminConfirm = null; // reset after use
    }
  } else {
    alert("❌ Incorrect password. Access denied.");
    modal.style.display = 'none';
  }
});


    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
  applyFilters(); 
});

});

