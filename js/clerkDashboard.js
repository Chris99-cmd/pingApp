//const { use } = require('react');//

window.addEventListener('DOMContentLoaded', () => {
  const fs = require('fs');
  const path = require('path');
  loadTopBar();
  const { app } = require('@electron/remote');
const userDataPath = app.getPath('userData');
  const clientsPath = path.join(userDataPath, 'clients.json');
  const summaryPath = path.join(userDataPath, 'sessionSummaries.json');
  const groomersPath = path.join(userDataPath, 'groomers.json');
  const jobOrderPath = path.join(userDataPath, 'jobOrderCounter.json');

  const sizesPath = path.join(userDataPath, 'sizes.json');
  const packagesPath = path.join(userDataPath, 'packages.json');
  const expressPath = path.join(userDataPath, 'express.json');
  const mattingPath = path.join(userDataPath, 'matting.json');
  const tanglingPath = path.join(userDataPath, 'tangling.json');
  const sheddingPath = path.join(userDataPath, 'shedding.json');
  const pricesPath = path.join(userDataPath, 'prices.json');

  let pricingData = { packages: {}, express: {}, extras: {} };
  try {
  pricingData.packages = JSON.parse(fs.readFileSync(pricesPath));
  pricingData.express = JSON.parse(fs.readFileSync(expressPath)).reduce((acc, item) => {
    acc[item.name] = item.price;
    return acc;
  }, {});

  ['matting', 'tangling', 'shedding'].forEach(type => {
    pricingData.extras[type] = {};
    const filePath = path.join(userDataPath, `${type}.json`); 
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath));
      data.forEach(item => {
        pricingData.extras[type][item.label] = item.price;
      });
    }
  });
  } catch (err) {
    alert('Failed to load pricing data');
    console.error(err);
  }

  const petSections = document.getElementById('petSections');
  const totalDisplay = document.getElementById('dashboardTotal');

  function getGroomerOptions() {
    if (!fs.existsSync(groomersPath)) return [];
    return JSON.parse(fs.readFileSync(groomersPath));
  }

  function getNextJobOrderNumber() {
    let counter = 1000;
    if (fs.existsSync(jobOrderPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(jobOrderPath));
        counter = data.lastJobOrder || 1000;
      } catch (_) {}
    }
    counter++;
    fs.writeFileSync(jobOrderPath, JSON.stringify({ lastJobOrder: counter }, null, 2));
    return counter;
  }

  function updateTotalDisplay() {
    const petDivs = document.querySelectorAll('.pet-section');
    let grandTotal = 0;
    petDivs.forEach(div => {
      const size = div.querySelector('.pet-size').value;
      const pkg = div.querySelector('.pet-package').value;
      const matting = div.querySelector('.matting').value;
      const tangling = div.querySelector('.tangling').value;
      const shedding = div.querySelector('.shedding').value;
      const expressSelected = [...div.querySelectorAll('.express-checkbox:checked')].map(cb => cb.value);

      let price = 0;
     if (pkg !== 'None' && pricingData.packages?.[pkg]?.[size] != null) {
  price += pricingData.packages[pkg][size];
}

      price += pricingData.extras.matting[matting] || 0;
      price += pricingData.extras.tangling[tangling] || 0;
      price += pricingData.extras.shedding[shedding] || 0;

      expressSelected.forEach(item => {
        price += pricingData.express[item] || 0;
      });

      grandTotal += price;
      const totalLabel = div.querySelector('.pet-total');
      if (totalLabel) totalLabel.textContent = `Pet Total: ₱${price.toFixed(2)}`;
    });
    totalDisplay.textContent = grandTotal.toFixed(2);
  }

  function getOptions(filePath, labelKey = 'label') {
  try {
    const data = JSON.parse(fs.readFileSync(filePath));
    if (Array.isArray(data) && typeof data[0] === 'string') {
      return data; 
    }
    return data.map(d => d[labelKey]);
  } catch (_) {
    return [];
  }
}


  function addPetSection() {
    const groomers = getGroomerOptions();
    const jobOrder = getNextJobOrderNumber();
    const sizes = getOptions(sizesPath);
    const packages = getOptions(packagesPath); 
    const express = Object.keys(pricingData.express);
    const severityLevels = getOptions(mattingPath);

    const section = document.createElement('div');
    section.className = 'pet-section';
    section.setAttribute('data-joborder', jobOrder);
    section.innerHTML = `
      <label>Pet Name: <input type="text" class="pet-name" required></label><br>
      <label>Breed: <input type="text" class="pet-breed" required></label><br>
      <label>Age (months): <input type="number" class="pet-age" min="0"></label><br>
      <label>Gender:
        <select class="pet-gender">
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </label><br>
      <label>Weight (kg): <input type="number" class="pet-weight" step="0.1" min="0"></label><br>
      <label><strong>Job Order No.:</strong> ${jobOrder}</label><br>
      <label>Analogy:
        <select class="pet-analogy">
          <option value="Canine">Canine</option>
          <option value="Feline">Feline</option>
        </select>
      </label><br>
      <label>Size:
        <select class="pet-size">
          ${sizes.map(s => `<option>${s}</option>`).join('')}
        </select>
      </label><br>
     <label>Package Availed:
  <select class="pet-package">
    <option>None</option>
    ${packages.map(p => `<option>${p}</option>`).join('')}
  </select>
</label><br>
      <fieldset class="express-group">
        <legend>Express Services:</legend>
        <div class="express-checkboxes">
          ${express.map(opt => `
            <label><input type="checkbox" class="express-checkbox" value="${opt}"> ${opt}</label>
          `).join('')}
        </div>
      </fieldset>
      <label>Matting:
        <select class="matting">
          <option>None</option>
          ${severityLevels.map(l => `<option>${l}</option>`).join('')}
        </select>
      </label>
      <label>Tangling:
        <select class="tangling">
          <option>None</option>
          ${severityLevels.map(l => `<option>${l}</option>`).join('')}
        </select>
      </label>
      <label>Shedding:
        <select class="shedding">
          <option>None</option>
          ${severityLevels.map(l => `<option>${l}</option>`).join('')}
        </select>
      </label><br>
      <fieldset><legend>Vaccination Details:</legend>
        <label>AntiParvo Vaccine: <select class="vac-parvo"><option>Yes</option><option>No</option></select></label><br>
        <label>Rabies Vaccine: <select class="vac-rabies"><option>Yes</option><option>No</option></select></label><br>
        <label>Tick & Flea Medication: <select class="vac-tickflea"><option>Yes</option><option>No</option></select></label><br>
        <label>Deworming: <select class="vac-deworming"><option>Yes</option><option>No</option></select></label><br>
      </fieldset>
      <label>Health Condition: <input type="text" class="pet-health"></label><br>
      <label>Assigned Groomer:
        <select class="groomer">
          <option value="">Select Groomer</option>
          ${groomers.map(g => `<option value="${g.firstName} ${g.lastName}">${g.firstName} ${g.lastName}</option>`).join('')}
        </select>
      </label><br>
      <label>Pre-Grooming Remarks: <input type="text" class="pre-remarks"></label><br>
      <label>Post-Grooming Remarks: <input type="text" class="post-remarks" placeholder="(Handwritten)"></label><br>
<div class="qr-container" style="margin-top:10px;"></div>
<button type="button" class="gen-qr">Generate QR Code</button>
<button type="button" class="print-qr">🖨 Print QR</button>
      <button type="button" class="remove-btn">❌ Remove Pet</button>
    `;
   petSections.appendChild(section);

   section.querySelector('.gen-qr').addEventListener('click', e => {
  generateQRCode(e.target);
  updateTotalDisplay();
});

   section.querySelector('.print-qr').addEventListener('click', e => printQRCode(e.target));
    section.querySelector('.remove-btn').addEventListener('click', e => {
      e.target.closest('.pet-section').remove();
      updateTotalDisplay();
    });

    section.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', updateTotalDisplay);
    });

    updateTotalDisplay();
  }

function generateQRCode(button) {
  const section = button.closest('.pet-section');
  const qrContainer = section.querySelector('.qr-container');

  const qrCodeText = Math.floor(100000 + Math.random() * 900000).toString();

  qrContainer.innerHTML = ''; // Clear previous QR if any

  new QRCode(qrContainer, {
    text: qrCodeText,
    width: 128,
    height: 128,
    correctLevel: QRCode.CorrectLevel.H
  });

  qrContainer.setAttribute('data-code', qrCodeText);
}

function printQRCode(button) {
  const qr = button.closest('.pet-section').querySelector('.qr-container');
  const newWin = window.open('', '', 'width=300,height=300');
  newWin.document.write(`<html><head><title>Print QR</title></head><body>${qr.innerHTML}</body></html>`);
  newWin.print();
}

  const loadClientBtn = document.getElementById('loadClientBtn');

  const form = document.getElementById('clientForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const confirmed = confirm('Are you sure you want to save this client and session?');
  if (!confirmed) return;
    const owner = document.getElementById('ownerName').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const address = document.getElementById('address').value.trim();
    const petDivs = document.querySelectorAll('.pet-section');

    if (!owner || !contact || !address || contact.length !== 11 || !/^[0-9]+$/.test(contact)) {
      return alert('Please fill out owner name, contact (11 digits), and address properly.');
    }

    let total = 0;
    for (const div of petDivs) {
      const requiredFields = ['.pet-name', '.pet-breed', '.groomer'];
      for (const selector of requiredFields) {
        if (!div.querySelector(selector).value.trim()) {
          return alert('Please fill out all pet details including groomer.');
        }
      }
    if (!div.querySelector('.qr-container').getAttribute('data-code')) {
        return alert('Please generate barcode for each pet before submitting.');
      }
    }

    const pets = [...petDivs].map(div => {
function combineDateWithCurrentTime(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const now = new Date();
  return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
}

const rawDate = document.getElementById('registrationDate')?.value;
const sessionDate = rawDate ? combineDateWithCurrentTime(rawDate) : new Date();
const createdAt = sessionDate.toLocaleString('en-PH', { timeZone: 'Asia/Manila', hour12: true });

      const name = div.querySelector('.pet-name').value;
      const size = div.querySelector('.pet-size').value;
      const pkg = div.querySelector('.pet-package').value;
      const expressSelected = [...div.querySelectorAll('.express-checkbox:checked')].map(cb => cb.value);
      const matting = div.querySelector('.matting').value;
      const tangling = div.querySelector('.tangling').value;
      const shedding = div.querySelector('.shedding').value;
      const groomer = div.querySelector('.groomer').value;
      const pre = div.querySelector('.pre-remarks').value;
      const post = "";
      const breed = div.querySelector('.pet-breed').value;
      const analogy = div.querySelector('.pet-analogy').value;
      const health = div.querySelector('.pet-health').value;
      const age = Number(div.querySelector('.pet-age')?.value || 0);
      const weight = Number(div.querySelector('.pet-weight')?.value || 0);
      const gender = div.querySelector('.pet-gender')?.value;
      const vaccinations = {
        parvo: div.querySelector('.vac-parvo').value,
        rabies: div.querySelector('.vac-rabies').value,
        tickflea: div.querySelector('.vac-tickflea').value,
        deworming: div.querySelector('.vac-deworming').value
      };
      const jobOrder = Number(div.getAttribute('data-joborder'));
     const petBarcode = div.querySelector('.qr-container').getAttribute('data-code');


      let price = 0;
      if (pkg !== 'None') {
  price += pricingData.packages[pkg]?.[size] || 0;
  price += (pricingData.extras.matting[matting] || 0);
  price += (pricingData.extras.tangling[tangling] || 0);
  price += (pricingData.extras.shedding[shedding] || 0);
}
expressSelected.forEach(service => {
  price += pricingData.express[service] || 0;
});

      return {
        name, size, pkg, expressSelected, matting, tangling, shedding, groomer, pre, post,
        breed, analogy, health, vaccinations,
        barcode: petBarcode,
        createdAt,
        age, weight, gender,
        jobOrder,
        sessions: [{
          date: sessionDate.toISOString(),
          createdAt,
          pkg,
          express: expressSelected,
          matting,
          tangling,
          shedding,
          price,
          groomer,
          age,
          weight,
          size,
           jobOrder
        }],
        totalSpent: price
      };
    });

let clients = fs.existsSync(clientsPath) ? JSON.parse(fs.readFileSync(clientsPath)) : [];
const clientId = `cli-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
let existingClient = clients.find(c => c.owner === owner && c.contact === contact);

if (existingClient) {
  // Append new pets to existing client
  existingClient.pets = existingClient.pets.concat(pets);
} else {
  // New client registration
  clients.push({ id: clientId, owner, contact, address, pets });
}

// ✅ Add this right after the if/else block:
const finalClientId = existingClient ? existingClient.id : clientId;

fs.writeFileSync(clientsPath, JSON.stringify(clients, null, 2));


    let summaries = fs.existsSync(summaryPath) ? JSON.parse(fs.readFileSync(summaryPath)) : [];
   pets.forEach(p => {
  const session = p.sessions[p.sessions.length - 1];
  summaries.push({
  jobOrder: p.jobOrder,
  owner,
  contact,
  clientId, finalClientId, 
  pet: p.name,
  breed: p.breed,
  analogy: p.analogy,
  gender: p.gender,
  age: p.age,
  weight: p.weight,
  barcode: p.barcode,
  size: p.size,
  package: p.pkg,
  express: p.expressSelected.join(', '),
  matting: p.matting,
  tangling: p.tangling,
  shedding: p.shedding,
  groomer: p.groomer,
  total: session.price,
  date: session.createdAt,
  status: 'pending', // ✅ Add this line
  createdAt: new Date().toISOString(), // ✅ Also ensure this exists for your formatDate/Time
});

});

    fs.writeFileSync(summaryPath, JSON.stringify(summaries, null, 2));

    updateTotalDisplay();
    alert(`Client and session saved!`);
    location.reload();
  });

document.getElementById('printSummaryBtn')?.addEventListener('click', () => {
  const owner = document.getElementById('ownerName').value.trim();
  const contact = document.getElementById('contact').value.trim();
  const address = document.getElementById('address').value.trim();
  const dateTime = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', hour12: true });

  const pets = [...document.querySelectorAll('.pet-section')].map((div, i) => ({
    jobOrder: div.getAttribute('data-joborder'),
    name: div.querySelector('.pet-name')?.value,
    breed: div.querySelector('.pet-breed')?.value,
    age: div.querySelector('.pet-age')?.value,
    gender: div.querySelector('.pet-gender')?.value,
    weight: div.querySelector('.pet-weight')?.value,
    analogy: div.querySelector('.pet-analogy')?.value,
    size: div.querySelector('.pet-size')?.value,
    pkg: div.querySelector('.pet-package')?.value,
    groomer: div.querySelector('.groomer')?.value,
    pre: div.querySelector('.pre-remarks')?.value,
    post: div.querySelector('.post-remarks')?.value,
    matting: div.querySelector('.matting')?.value,
    tangling: div.querySelector('.tangling')?.value,
    shedding: div.querySelector('.shedding')?.value,
    barcode: div.querySelector('.qr-container')?.getAttribute('data-code'),
    vaccinations: {
      parvo: div.querySelector('.vac-parvo')?.value,
      rabies: div.querySelector('.vac-rabies')?.value,
      tickflea: div.querySelector('.vac-tickflea')?.value,
      deworming: div.querySelector('.vac-deworming')?.value
    }
  }));

  const htmlContent = `
  <html>
    <head>
      <title>Client Registration Summary</title>
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          margin: 40px;
          color: #000;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          margin-bottom: 20px;
          padding-bottom: 10px;
        }
        .header img {
          height: 60px;
          vertical-align: middle;
          margin-right: 12px;
        }
        .header h1 {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          display: inline-block;
          vertical-align: middle;
        }
        .title {
          text-align: center;
          margin-top: 10px;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 25px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-weight: bold;
          border-bottom: 1px solid #000;
          margin-bottom: 10px;
          padding-bottom: 5px;
          font-size: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        .remarks {
          min-height: 60px;
          border: 1px solid #000;
          padding: 10px;
          margin-bottom: 20px;
        }
        .barcode {
          text-align: center;
          margin-top: 20px;
        }
        .signature-group {
          display: flex;
          justify-content: space-around;
          margin-top: 40px;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 180px;
          text-align: center;
          font-size: 14px;
          padding-top: 4px;
        }
        .page-break {
          page-break-after: always;
        }
        @media print {
          body { margin: 0; }
        }
          @page {
  size: A4;
  margin: 20mm;
}

      </style>
    </head>
    <body>
      <div class="header">
        <img src="assets/bnttlogo_3.png" class="logo">
        <h1>BONTOT PET GROOMING</h1>
      </div>

      <div class="title">Client Registration Summary</div>

      <div class="section">
        <p><strong>Date & Time:</strong> ${dateTime}</p>
        <p><strong>Owner:</strong> ${owner}</p>
        <p><strong>Contact:</strong> ${contact}</p>
        <p><strong>Address:</strong> ${address}</p>
      </div>

      ${pets.map((p, i) => `
        <div class="section">
          <div class="section-title">Pet #${i + 1}: ${p.name}</div>
          <table>
            <tr><th>Job Order No.</th><td>${p.jobOrder}</td></tr>
            <tr><th>Breed</th><td>${p.breed}</td></tr>
            <tr><th>Age</th><td>${p.age}</td></tr>
            <tr><th>Gender</th><td>${p.gender}</td></tr>
            <tr><th>Weight</th><td>${p.weight} kg</td></tr>
            <tr><th>Analogy</th><td>${p.analogy}</td></tr>
            <tr><th>Size</th><td>${p.size}</td></tr>
            <tr><th>Package</th><td>${p.pkg}</td></tr>
            <tr><th>Groomer</th><td>${p.groomer}</td></tr>
            <tr><th>Matting</th><td>${p.matting}</td></tr>
            <tr><th>Tangling</th><td>${p.tangling}</td></tr>
            <tr><th>Shedding</th><td>${p.shedding}</td></tr>
            <tr>
              <th>Vaccinations</th>
              <td>
                <ul>
                  <li>Parvo: ${p.vaccinations.parvo}</li>
                  <li>Rabies: ${p.vaccinations.rabies}</li>
                  <li>Tick & Flea: ${p.vaccinations.tickflea}</li>
                  <li>Deworming: ${p.vaccinations.deworming}</li>
                </ul>
              </td>
            </tr>
          </table>

          <div class="section-title">Pre-Grooming Remarks</div>
          <div class="remarks">${p.pre || ''}</div>

          <div class="section-title">Post-Grooming Remarks</div>
          <div class="remarks">${p.post || ''}</div>

          <div class="barcode"><img src="${document.querySelectorAll('.qr-container')[i]?.querySelector('img')?.src || ''}" width="128" height="128"/></div>


          <div class="signature-group">
            <div class="signature-line">Groomed By</div>
            <div class="signature-line">Assisted By</div>
            <div class="signature-line">Owner Signature</div>
          </div>
        </div>

        <div class="page-break"></div>
      `).join('')}
    </body>
    <script>
      window.onload = () => {
        ${pets.map((_, i) => `
          JsBarcode("#barcode-${i}", "${pets[i].barcode}", {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true
          });`).join('')}
        window.print();
      };
    </script>
  </html>
  `;

  const printWindow = window.open('', '', 'width=900,height=650');
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
});

  addPetBtn?.addEventListener('click', addPetSection);
});