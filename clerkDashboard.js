window.addEventListener('DOMContentLoaded', () => {
  const fs = require('fs');
  const path = require('path');
  const { loadTopBar } = require('./topBar.js');
  loadTopBar();

  const clientsPath = path.join(__dirname, 'clients.json');
  const summaryPath = path.join(__dirname, 'sessionSummaries.json');
  const groomersPath = path.join(__dirname, 'groomers.json');
  const jobOrderPath = path.join(__dirname, 'jobOrderCounter.json');

  const pricing = {
    Basic: { Small: 290, Medium: 390, Large: 490, XL: 590, XXL: 690 },
    Deluxe: { Small: 490, Medium: 590, Large: 690, XL: 790, XXL: 890 },
    Premium: { Small: 690, Medium: 790, Large: 890, XL: 990, XXL: 1090 },
    ExpressItems: 100,
    Extras: {
      None: 0,
      Mild: 200,
      Moderate: 350,
      Severe: 550,
      Extreme: 700
    }
  };

  const expressOptions = [
    'Bath and Blow Dry',
    'Claw Trimming',
    'Ear Cleaning',
    'Genital Trimming',
    'Paw Pad Trimming',
    'Teeth Cleaning'
  ];

  const petSections = document.getElementById('petSections');
  const addPetBtn = document.getElementById('addPetBtn');
  const loadClientBtn = document.getElementById('loadClientBtn');
  const searchBarcodeInput = document.getElementById('searchBarcodeInput');
  const goToClientListBtn = document.getElementById('goToClientListBtn');
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
    if (pkg !== 'None') {
      price += pricing[pkg][size] || 0;
      price += pricing.Extras[matting] + pricing.Extras[tangling] + pricing.Extras[shedding];
    }
    price += expressSelected.length * pricing.ExpressItems;
    grandTotal += price;

    const totalLabel = div.querySelector('.pet-total');
    if (totalLabel) totalLabel.textContent = `Pet Total: ₱${price.toFixed(2)}`;
  });

  totalDisplay.textContent = grandTotal.toFixed(2);
}


  function addPetSection() {
    const groomers = getGroomerOptions();
    const jobOrder = getNextJobOrderNumber();
    const section = document.createElement('div');
    section.className = 'pet-section';
    section.setAttribute('data-joborder', jobOrder);
    section.innerHTML =`
      <label>Pet Name: <input type="text" class="pet-name" required></label><br>
      <label>Breed: <input type="text" class="pet-breed" required></label><br>
      <label>Age: <input type="number" class="pet-age" min="0"></label><br>
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
          <option>Small</option><option>Medium</option><option>Large</option><option>XL</option><option>XXL</option>
        </select>
      </label><br>
      <label>Package Availed:
        <select class="pet-package">
          <option>None</option><option>Basic</option><option>Deluxe</option><option>Premium</option>
        </select>
      </label><br>
     <fieldset class="express-group">
  <legend>Express Services:</legend>
  <div class="express-checkboxes">
    ${expressOptions.map(opt => `
      <label>
        <input type="checkbox" class="express-checkbox" value="${opt}"> ${opt}
      </label>
    `).join('')}
  </div>
</fieldset>
      <label>Matting:
        <select class="matting"><option>None</option><option>Mild</option><option>Moderate</option><option>Severe</option><option>Extreme</option></select>
      </label>
      <label>Tangling:
        <select class="tangling"><option>None</option><option>Mild</option><option>Moderate</option><option>Severe</option><option>Extreme</option></select>
      </label>
      <label>Shedding:
        <select class="shedding"><option>None</option><option>Mild</option><option>Moderate</option><option>Severe</option><option>Extreme</option></select>
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
      <svg class="barcode"></svg><br>
      <span class="pet-total" style="font-weight:bold">Pet Total: ₱0</span><br>
      <button type="button" class="gen-barcode">Generate Barcode</button>
      <button type="button" class="print-barcode">🖨 Print Barcode</button>
      <button type="button" class="remove-btn">❌ Remove Pet</button>
    `;
   petSections.appendChild(section);

    section.querySelector('.gen-barcode').addEventListener('click', e => {
      generateBarcode(e.target);
      updateTotalDisplay();
    });
    section.querySelector('.print-barcode').addEventListener('click', e => printBarcode(e.target));
    section.querySelector('.remove-btn').addEventListener('click', e => {
      e.target.closest('.pet-section').remove();
      updateTotalDisplay();
    });

    section.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', updateTotalDisplay);
    });

    updateTotalDisplay();
  }

  function generateBarcode(button) {
    const section = button.closest('.pet-section');
    const barcode = Math.floor(100000 + Math.random() * 900000).toString();
    const svg = section.querySelector('.barcode');
    if (typeof JsBarcode === 'function') {
      JsBarcode(svg, barcode, { format: "CODE128", width: 2, height: 50 });
      svg.setAttribute('data-code', barcode);
    } else {
      alert('❌ JsBarcode not loaded.');
    }
  }

  function printBarcode(button) {
    const svg = button.closest('.pet-section').querySelector('.barcode');
    const newWin = window.open('', '', 'width=300,height=150');
    newWin.document.write(`<html><head><title>Print Barcode</title></head><body>${svg.outerHTML}</body></html>`);
    newWin.print();
  }

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
      if (!div.querySelector('.barcode').getAttribute('data-code')) {
        return alert('Please generate barcode for each pet before submitting.');
      }
    }

    const pets = [...petDivs].map(div => {
      const createdAt = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', hour12: true });
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
      const petBarcode = div.querySelector('.barcode').getAttribute('data-code');

      let price = 0;
      if (pkg !== 'None') {
        price += pricing[pkg][size] || 0;
        price += pricing.Extras[matting] + pricing.Extras[tangling] + pricing.Extras[shedding];
      }
      price += expressSelected.length * pricing.ExpressItems;
      total += price;

      return {
        name, size, pkg, expressSelected, matting, tangling, shedding, groomer, pre, post,
        breed, analogy, health, vaccinations,
        barcode: petBarcode,
        createdAt,
        age, weight, gender,
        jobOrder,
        sessions: [{
          date: new Date().toISOString(),
          createdAt,
          pkg,
          express: expressSelected,
          matting,
          tangling,
          shedding,
          price,
          groomer,
          redeemed: false,
          age,
          weight,
          size,
           jobOrder
        }],
        totalSpent: price
      };
    });

    let clients = fs.existsSync(clientsPath) ? JSON.parse(fs.readFileSync(clientsPath)) : [];
    let existingClient = clients.find(c => c.owner === owner && c.contact === contact);
    if (existingClient) {
      pets.forEach(newPet => {
        const match = existingClient.pets.find(p => p.barcode === newPet.barcode);
        if (match) {
          match.sessions.push(...newPet.sessions);
          match.totalSpent += newPet.totalSpent;
          if (match.sessions.length === 7 && !match.redeemedFree) {
            alert(`🎉 ${match.name} is now eligible for 1 FREE grooming!`);
            match.redeemedFree = true;
          }
        } else {
          existingClient.pets.push(newPet);
        }
      });
    } else {
      clients.push({ owner, contact, address, pets });
    }
    fs.writeFileSync(clientsPath, JSON.stringify(clients, null, 2));

    let summaries = fs.existsSync(summaryPath) ? JSON.parse(fs.readFileSync(summaryPath)) : [];
   pets.forEach(p => {
  const session = p.sessions[p.sessions.length - 1];
  summaries.push({
    jobOrder: p.jobOrder,
    owner,
    contact,
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
    date: session.createdAt
  });
});

    fs.writeFileSync(summaryPath, JSON.stringify(summaries, null, 2));

    updateTotalDisplay();
    alert(`Client and session saved!\nTotal: ₱${total}`);
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
    barcode: div.querySelector('.barcode')?.getAttribute('data-code'),
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

          <div class="barcode"><svg id="barcode-${i}"></svg></div>

          <div class="signature-group">
            <div class="signature-line">Groomed By</div>
            <div class="signature-line">Assisted By</div>
            <div class="signature-line">Owner Signature</div>
          </div>
        </div>

        <div class="page-break"></div>
      `).join('')}
    </body>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode"></script>
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




  loadClientBtn?.addEventListener('click', () => {
    const searchBarcode = searchBarcodeInput.value.trim();
    if (!searchBarcode) return alert('Please scan or type a pet barcode!');

    const clients = fs.existsSync(clientsPath) ? JSON.parse(fs.readFileSync(clientsPath)) : [];
    let foundClient = null;
    let foundPet = null;

    for (const client of clients) {
      for (const pet of client.pets) {
        if (pet.barcode === searchBarcode) {
          foundClient = client;
          foundPet = pet;
          break;
        }
      }
      if (foundClient) break;
    }

    if (!foundClient || !foundPet) return alert(`No pet found for barcode: ${searchBarcode}`);

    localStorage.setItem('selectedClient', JSON.stringify(foundClient));
    localStorage.setItem('selectedPetBarcode', foundPet.barcode);
    window.location.href = 'addSession.html';
  });

  goToClientListBtn?.addEventListener('click', () => {
    window.location = 'viewClients.html';
  });

  addPetBtn?.addEventListener('click', addPetSection);
});
