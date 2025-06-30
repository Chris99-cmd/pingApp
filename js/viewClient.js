const fs = require('fs');
const path = require('path');
const { dialog } = require('@electron/remote');
const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const ExcelJS = require("exceljs");
const clientsPath = path.join(__dirname, './data/clients.json');
const groomersPath = path.join(__dirname, './data/groomers.json');
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

  allClients.forEach(client => {
    client.pets.forEach(pet => {
      pet.sessions?.forEach(session => {
        const sessionDate = new Date(session.date);
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
          <td>${session.jobOrder || '-'}</td> <!-- NEW -->
          <td>${client.owner}</td>
          <td>${client.contact}</td>
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
          <td><span class="view-icon" data-owner="${client.owner}" data-contact="${client.contact}" data-barcode="${pet.barcode}" data-date="${session.date}">🔍</span></td>
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
  const express = session.express?.length ? session.express.join(', ') : 'None';

  modalFields.innerHTML = `
    <label>Name: <input type="text" value="${pet.name}" disabled></label>
    <label>Breed: <input type="text" value="${pet.breed}" disabled></label>
    <label>Analogy: <input type="text" value="${pet.analogy}" disabled></label>
    <label>Gender: <input type="text" value="${pet.gender || '-'}" disabled></label>
    <label>Age: <input type="text" value="${session.age || '-'}" disabled></label>
    <label>Weight: <input type="text" value="${session.weight || '-'}" disabled></label>
    <label>Job Order #: <input type="text" value="${session.jobOrder || '-'}" disabled></label>
    <label>Barcode: <input type="text" value="${pet.barcode}" disabled></label>
    <label>Size: <input type="text" value="${session.size}" disabled></label>
    <label>Package: <input type="text" value="${session.pkg}" disabled></label>
    <label>Express: <input type="text" value="${express}" disabled></label>
    <label>Matting: <input type="text" value="${session.matting || '-'}" disabled></label>
    <label>Tangling: <input type="text" value="${session.tangling || '-'}" disabled></label>
    <label>Shedding: <input type="text" value="${session.shedding || '-'}" disabled></label>
    <label>Groomer: <input type="text" value="${session.groomer}" disabled></label>
    <label>Total: <input type="text" value="₱${session.price}" disabled></label>
  `;
  modal.style.display = 'flex';
  currentSessionRef = { client, pet, session };
}

editBtn.onclick = () => {
  modalFields.querySelectorAll('input:not(#modalTotal):not(#modalExpress)').forEach(i => i.disabled = false);
  saveBtn.style.display = 'inline-block';
  editBtn.style.display = 'none';
};

saveBtn.onclick = () => {
  showConfirmation('Are you sure you want to save these changes?', () => {
    const inputs = modalFields.querySelectorAll('input');
    const updated = {
      name: inputs[0].value,
      breed: inputs[1].value,
      analogy: inputs[2].value,
      gender: inputs[3].value,
      age: inputs[4].value,
      weight: inputs[5].value,
      barcode: inputs[6].value,
      size: inputs[7].value,
      matting: inputs[10].value,
      tangling: inputs[11].value,
      shedding: inputs[12].value,
      groomer: inputs[13].value
    };

    Object.assign(currentSessionRef.pet, updated);
    currentSessionRef.session.groomer = updated.groomer;

    fs.writeFileSync(clientsPath, JSON.stringify(allClients, null, 2));

    applyFilters();
    modal.style.display = 'none';
  });
};

deleteBtn.onclick = () => {
  showConfirmation('Are you sure you want to delete this session?', () => {
    const index = currentSessionRef.pet.sessions.indexOf(currentSessionRef.session);
    if (index !== -1) {
      currentSessionRef.pet.sessions.splice(index, 1);
      fs.writeFileSync(clientsPath, JSON.stringify(allClients, null, 2));
      applyFilters();
    }
    modal.style.display = 'none';
  });
};

closeBtn.onclick = () => {
  modal.style.display = 'none';
  editBtn.style.display = 'inline-block';
  saveBtn.style.display = 'none';
};

document.getElementById('applyFilter').onclick = applyFilters;
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
    const { owner, contact, barcode, date } = e.target.dataset;
    const client = allClients.find(c => c.owner === owner && c.contact === contact);
    const pet = client?.pets.find(p => p.barcode === barcode);
    const session = pet?.sessions.find(s => s.date === date);
    if (client && pet && session) showModal(client, pet, session);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  loadGroomers();
  loadClients();
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
      input.value = '';
      modal.style.display = 'flex';
      input.focus();
    });

    confirmBtn.addEventListener('click', () => {
      if (input.value === adminPassword) {
        window.location.href = 'adminDashboard.html';
      } else {
        alert("❌ Incorrect password. Access denied.");
        modal.style.display = 'none';
      }
    });

    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
});

