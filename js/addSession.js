const fs = require('fs');
const path = require('path');
const jobOrderPath = path.join(__dirname, './data/jobOrderCounter.json');
const topBarHtml = fs.readFileSync(path.join(__dirname, 'topBar.html'), 'utf-8');
document.getElementById('topBarContainer').innerHTML = topBarHtml;

const clientsPath = path.join(__dirname, './data/clients.json');
const summaryPath = path.join(__dirname, './data/sessionSummaries.json');
const groomersPath = path.join(__dirname, './data/groomers.json');
const pricesPath = path.join(__dirname, './data/prices.json');
const expressPath = path.join(__dirname, './data/express.json');
const mattingPath = path.join(__dirname, './data/matting.json');
const tanglingPath = path.join(__dirname, './data/tangling.json');
const sheddingPath = path.join(__dirname, './data/shedding.json');
const sizesPath = path.join(__dirname, './data/sizes.json');
const packagesPath = path.join(__dirname, './data/packages.json');

let pricingData = { packages: {}, express: {}, extras: {} };

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

try {
  pricingData.packages = JSON.parse(fs.readFileSync(pricesPath));

  const expressList = JSON.parse(fs.readFileSync(expressPath));
  pricingData.express = {};
  const expressContainer = document.querySelector('.express-group');
  expressList.forEach(item => {
    pricingData.express[item.name] = item.price;
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" class="sessionExpress" value="${item.name}"> ${item.name}`;
    expressContainer.appendChild(label);
  });

  ['matting', 'tangling', 'shedding'].forEach(type => {
    pricingData.extras[type] = {};
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, `./data/${type}.json`)));
    const select = document.getElementById(`session${capitalize(type)}`);
    select.innerHTML = '';
    data.forEach(item => {
      pricingData.extras[type][item.label] = item.price;
      const opt = document.createElement('option');
      opt.value = item.label;
      opt.textContent = item.label;
      select.appendChild(opt);
    });
  });
} catch (err) {
  alert('❌ Failed to load pricing data');
  console.error(err);
}

function getOptions(filePath, labelKey = 'label') {
  try {
    const data = JSON.parse(fs.readFileSync(filePath));
    if (Array.isArray(data) && typeof data[0] === 'string') return data;
    return data.map(d => d[labelKey]);
  } catch {
    return [];
  }
}

const sizes = getOptions(sizesPath, 'label');
const packages = getOptions(packagesPath);

function getNextJobOrderNumber() {
  let counter = 1055;
  if (fs.existsSync(jobOrderPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jobOrderPath));
      counter = data.lastJobOrder || 1055;
    } catch (e) {
      console.error('Failed to read job order file:', e);
    }
  }
  counter++;
  fs.writeFileSync(jobOrderPath, JSON.stringify({ lastJobOrder: counter }, null, 2));
  return counter;
}

function getPhilippineTimestamp() {
  return new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
}


window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('sessionForm');
  const toggleFormBtn = document.getElementById('toggleFormBtn');
  const groomerSelect = document.getElementById('sessionGroomer');
  const totalDisplay = document.getElementById('sessionTotal');
  
  const manilaDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // "YYYY-MM-DD"
document.getElementById('sessionDate').value = manilaDate;



  // Populate size and package dropdowns
document.getElementById('sessionSize').innerHTML =
  sizes.map(s => `<option value="${s}">${s}</option>`).join('');

document.getElementById('sessionPackage').innerHTML =
  '<option value="None">None</option>' +
  packages.map(p => `<option value="${p}">${p}</option>`).join('');

// Inject "None" + dynamic options for matting, tangling, shedding
const mattingOptions = ['None', ...getOptions(mattingPath)];
const tanglingOptions = ['None', ...getOptions(tanglingPath)];
const sheddingOptions = ['None', ...getOptions(sheddingPath)];

document.getElementById('sessionMatting').innerHTML =
  mattingOptions.map(o => `<option value="${o}">${o}</option>`).join('');

document.getElementById('sessionTangling').innerHTML =
  tanglingOptions.map(o => `<option value="${o}">${o}</option>`).join('');

document.getElementById('sessionShedding').innerHTML =
  sheddingOptions.map(o => `<option value="${o}">${o}</option>`).join('');


  const ageInput = document.createElement('input');
  ageInput.type = 'number';
  ageInput.id = 'sessionAge';
  ageInput.placeholder = 'Age (months)'; 
  ageInput.required = true;

  const weightInput = document.createElement('input');
  weightInput.type = 'number';
  weightInput.step = '0.01';
  weightInput.id = 'sessionWeight';
  weightInput.placeholder = 'Weight (kg)';
  weightInput.required = true;

  const groomerField = document.getElementById('sessionGroomer').parentElement;
  groomerField.insertAdjacentHTML('beforebegin', `
    <label>Age (months): <input type="number" id="sessionAge" placeholder="Age (months):" required></label>
    <label>Weight (kg): <input type="number" id="sessionWeight" step="0.1" placeholder="Pet Weight" required></label>
  `);

  function loadGroomers() {
    if (!fs.existsSync(groomersPath)) return;
    const groomers = JSON.parse(fs.readFileSync(groomersPath));
    groomers.forEach(g => {
      const option = document.createElement('option');
      option.value = `${g.firstName} ${g.lastName}`;
      option.textContent = `${g.firstName} ${g.lastName}`;
      groomerSelect.appendChild(option);
    });
  }

 const historyList = document.getElementById('sessionHistoryList');

function updateSessionHistory() {
  historyList.innerHTML = '';
  if (currentPet.sessions && currentPet.sessions.length > 0) {
   currentPet.sessions
  .filter(s => s.status !== 'cancelled') // ✅ exclude cancelled ones
  .forEach((s, i) => {
    const rawTime = s.createdAt || s.date;
const displayTime = rawTime
  ? new Date(rawTime).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
  : '-';

    const li = document.createElement('li');
    li.innerHTML = `
        <strong>Session ${i + 1}</strong>: ${displayTime} — 
        ${s.pkg} — ₱${s.price} — Groomer: ${s.groomer || 'N/A'}
      `;
      historyList.appendChild(li);
    });
  } else {
    historyList.innerHTML = `<li>No session history available.</li>`;
  }
}


  function loadClientData() {
    const clientData = localStorage.getItem('selectedClient');
    const petBarcode = localStorage.getItem('selectedPetBarcode');

    if (!clientData || !petBarcode) {
      alert('❌ Missing client or pet data!');
      return;
    }

    currentClient = JSON.parse(clientData);
    currentPet = currentClient.pets.find(p => p.barcode === petBarcode);
    if (!currentPet) {
      alert('⚠️ Pet not found in client data.');
      return;
    }

    currentPet.sessions = currentPet.sessions || [];

    document.getElementById('ownerInfo').innerHTML = `
      <h3>Owner Info</h3>
      <p><strong>Name:</strong> ${currentClient.owner}</p>
      <p><strong>Contact:</strong> ${currentClient.contact}</p>
      <p><strong>Address:</strong> ${currentClient.address}</p>
    `;

    document.getElementById('petInfo').innerHTML = `
      <h3>Pet Info</h3>
      <p><strong>Name:</strong> ${currentPet.name}</p>
      <p><strong>Breed:</strong> ${currentPet.breed}</p>
      <p><strong>Analogy:</strong> ${currentPet.analogy}</p>
      <p><strong>Gender:</strong> ${currentPet.gender || 'Unknown'}</p>
    `;

    document.getElementById('sessionAge').value = currentPet.age || '';
    document.getElementById('sessionWeight').value = currentPet.weight || '';

    updateSessionHistory();
  }

  function calculateAndDisplayTotal() {
    const size = document.getElementById('sessionSize').value;
    const pkg = document.getElementById('sessionPackage').value;
    const matting = document.getElementById('sessionMatting').value;
    const tangling = document.getElementById('sessionTangling').value;
    const shedding = document.getElementById('sessionShedding').value;
    const expressSelected = [...document.querySelectorAll('.sessionExpress:checked')].map(cb => cb.value);

    let price = 0;
    if (pkg !== 'None' && pricingData.packages[pkg] && pricingData.packages[pkg][size]) {
      price += pricingData.packages[pkg][size];
    }
    price += pricingData.extras.matting[matting] || 0;
    price += pricingData.extras.tangling[tangling] || 0;
    price += pricingData.extras.shedding[shedding] || 0;
    expressSelected.forEach(service => price += pricingData.express[service] || 0);

    totalDisplay.textContent = price;
  }
  form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const confirmed = confirm('Are you sure you want to save this session?');
  if (!confirmed) return;
    const createdAt = new Date().toLocaleString('en-PH', {
  timeZone: 'Asia/Manila',
  hour12: true,
});
    const date = document.getElementById('sessionDate').value;
    const size = document.getElementById('sessionSize').value;
    const pkg = document.getElementById('sessionPackage').value;
    const matting = document.getElementById('sessionMatting').value;
    const tangling = document.getElementById('sessionTangling').value;
    const shedding = document.getElementById('sessionShedding').value;
    const groomer = groomerSelect.value;
    const health = document.getElementById('sessionHealth').value;
    const pre = document.getElementById('sessionPreRemarks').value;
    const post = document.getElementById('sessionPostRemarks').value;
    const expressSelected = [...document.querySelectorAll('.sessionExpress:checked')].map(cb => cb.value);
    const age = parseInt(document.getElementById('sessionAge').value);
    const weight = parseFloat(document.getElementById('sessionWeight').value);
const jobOrderNumber = getNextJobOrderNumber();

    const vaccinations = {
      parvo: document.querySelector('input[name="parvo"]:checked')?.value === 'yes',
      rabies: document.querySelector('input[name="rabies"]:checked')?.value === 'yes',
      tickflea: document.querySelector('input[name="tickflea"]:checked')?.value === 'yes',
      deworming: document.querySelector('input[name="deworming"]:checked')?.value === 'yes'
    };

    if (!date || !size || !pkg || !matting || !tangling || !shedding || !groomer || isNaN(age) || isNaN(weight)) {
      alert('❌ Please fill out this form completely.');
      return;
    }

    let price = 0;
   if (pkg !== 'None' && pricingData.packages[pkg] && pricingData.packages[pkg][size]) {
  price += pricingData.packages[pkg][size];
}
price += pricingData.extras.matting[matting] || 0;
price += pricingData.extras.tangling[tangling] || 0;
price += pricingData.extras.shedding[shedding] || 0;
expressSelected.forEach(service => {
  price += pricingData.express[service] || 0;
});

   const newSession = {
  date,
  pkg,
  price,
  groomer,
  express: expressSelected,
  redeemed: false,
  createdAt: getPhilippineTimestamp(),
    jobOrder: jobOrderNumber,

 
  // Session-specific snapshot fields:
  age,
  weight,
  size,
  health,
  matting,
  tangling,
  shedding,
  pre,
  post,
  vaccinations,

  
};

    currentPet.sessions.push(newSession);
    currentPet.totalSpent = (currentPet.totalSpent || 0) + price;

   

    // Update pet age and weight
    currentPet.age = age;
    currentPet.weight = weight;
    currentPet.health = health;
    currentPet.vaccinations = vaccinations;
    currentPet.post = post;
    currentPet.pre = pre;

    // Write to file
    const allClients = JSON.parse(fs.readFileSync(clientsPath));
    for (let client of allClients) {
      if (client.owner === currentClient.owner && client.contact === currentClient.contact) {
        for (let pet of client.pets) {
          if (pet.barcode === currentPet.barcode) {
            Object.assign(pet, currentPet);
          }
        }
      }
    }
    fs.writeFileSync(clientsPath, JSON.stringify(allClients, null, 2));

    // Add to summaries
    let summaries = fs.existsSync(summaryPath) ? JSON.parse(fs.readFileSync(summaryPath)) : [];
 summaries.push({
  date,
  owner: currentClient.owner,
  pet: currentPet.name,
  breed: currentPet.breed,
  size: size,
  package: pkg,
  express: expressSelected,
  matting,
  tangling,
  shedding,
  total: price,
  groomer,
  jobOrder: jobOrderNumber,
  createdAt: new Date().toISOString(),
  status: 'pending',
  barcode: currentPet.barcode
});

    fs.writeFileSync(summaryPath, JSON.stringify(summaries, null, 2));

    alert('✅ Session saved!');
    window.location = 'clerkDashboard.html';
  });


  
  toggleFormBtn.addEventListener('click', () => {
    const container = document.getElementById('sessionFormContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  });

  document.querySelectorAll('.sessionExpress').forEach(cb => {
    cb.addEventListener('change', calculateAndDisplayTotal);
  });

  ['sessionSize', 'sessionPackage', 'sessionMatting', 'sessionTangling', 'sessionShedding'].forEach(id => {
    document.getElementById(id).addEventListener('change', calculateAndDisplayTotal);
  });

  loadGroomers();
  loadClientData();
  calculateAndDisplayTotal();
});

document.getElementById('printSessionBtn').addEventListener('click', () => {
  if (!currentClient || !currentPet) {
    alert("⚠️ Load a client and pet first.");
    return;
  }

  const jobOrderNumber = getNextJobOrderNumber();

  const session = {
    jobOrder: jobOrderNumber,
    createdAt: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    size: document.getElementById('sessionSize').value,
    pkg: document.getElementById('sessionPackage').value,
    matting: document.getElementById('sessionMatting').value,
    tangling: document.getElementById('sessionTangling').value,
    shedding: document.getElementById('sessionShedding').value,
    groomer: document.getElementById('sessionGroomer').value,
    pre: document.getElementById('sessionPreRemarks').value,
    post: document.getElementById('sessionPostRemarks').value,
    express: [...document.querySelectorAll('.sessionExpress:checked')].map(cb => cb.value),
    age: document.getElementById('sessionAge').value,
    weight: document.getElementById('sessionWeight').value,
    health: document.getElementById('sessionHealth').value,
    vaccinations: {
      parvo: document.querySelector('input[name="parvo"]:checked')?.value === 'yes',
      rabies: document.querySelector('input[name="rabies"]:checked')?.value === 'yes',
      tickflea: document.querySelector('input[name="tickflea"]:checked')?.value === 'yes',
      deworming: document.querySelector('input[name="deworming"]:checked')?.value === 'yes'
    }
  };

  const logoPath = 'assets/bnttlogo_3.png';
  const expressServices = session.express.length
    ? session.express.map(s => `<li>${s}</li>`).join('')
    : '<li>None</li>';

  const vaccinations = `
    <li>Parvo: ${session.vaccinations.parvo ? '✅' : '❌'}</li>
    <li>Rabies: ${session.vaccinations.rabies ? '✅' : '❌'}</li>
    <li>Tick & Flea: ${session.vaccinations.tickflea ? '✅' : '❌'}</li>
    <li>Deworming: ${session.vaccinations.deworming ? '✅' : '❌'}</li>
  `;

  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>Session Summary</title>
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
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            border-bottom: 1px solid #000;
            margin-bottom: 8px;
            padding-bottom: 4px;
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
            margin-top: 30px;
          }
           .signature-line {
          border-top: 1px solid #000;
          width: 180px;
          text-align: center;
          font-size: 14px;
          padding-top: 4px;
        }
          .signature-row {
            display: flex;
          justify-content: space-around;
          margin-top: 40px;
          }
          @media print {
            body {
              margin: 0;
            }
          }
            @page {
  size: A4;
  margin: 20mm;
}

        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoPath}" class="logo">
          <h1>BONTOT PET GROOMING</h1>
        </div>

        <div class="title">Session Summary</div>
        <p style="text-align:center;"><strong>Job Order No.:</strong> ${jobOrderNumber}</p>

        <div class="section">
          <p><strong>Date & Time:</strong> ${session.createdAt}</p>
          <p><strong>Owner:</strong> ${currentClient.owner}</p>
          <p><strong>Contact:</strong> ${currentClient.contact}</p>
          <p><strong>Address:</strong> ${currentClient.address}</p>
        </div>

        <div class="section">
          <div class="section-title">Pet Information</div>
          <table>
            <tr><th>Name</th><td>${currentPet.name}</td></tr>
            <tr><th>Breed</th><td>${currentPet.breed}</td></tr>
            <tr><th>Gender</th><td>${currentPet.gender}</td></tr>
            <tr><th>Age</th><td>${session.age} months</td></tr>
            <tr><th>Weight</th><td>${session.weight} kg</td></tr>
            <tr><th>Size</th><td>${session.size}</td></tr>
            <tr><th>Analogy</th><td>${currentPet.analogy}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Grooming Details</div>
          <table>
            <tr><th>Package</th><td>${session.pkg}</td></tr>
            <tr><th>Groomer</th><td>${session.groomer}</td></tr>
            <tr><th>Matting</th><td>${session.matting}</td></tr>
            <tr><th>Tangling</th><td>${session.tangling}</td></tr>
            <tr><th>Shedding</th><td>${session.shedding}</td></tr>
            <tr><th>Express Services</th><td><ul>${expressServices}</ul></td></tr>
            <tr><th>Health</th><td>${session.health}</td></tr>
            <tr><th>Vaccinations</th><td><ul>${vaccinations}</ul></td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Pre-Grooming Remarks</div>
          <div class="remarks">${session.pre || ''}</div>

          <div class="section-title">Post-Grooming Remarks</div>
          <div class="remarks">${session.post || ''}</div>
        </div>

        <div class="barcode">
          <svg id="printBarcode"></svg>
        </div>

        <div class="signature-row">
          <div class="signature-line">Groomed By</div>
          <div class="signature-line">Assisted By</div>
          <div class="signature-line">Owner Signature</div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/jsbarcode"></script>
        <script>
          JsBarcode("#printBarcode", "${currentPet.barcode}", {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true
          });
          window.print();
        </script>
      </body>
    </html>
  `);
});
