const fs = require('fs');
const path = require('path');

const jobOrder = localStorage.getItem('editJobOrder');
const summariesPath = path.join(__dirname, './data/sessionSummaries.json');
const clientsPath = path.join(__dirname, './data/clients.json');

const dropdownSources = {
  size: 'sizes.json',
  pkg: 'packages.json',
  express: 'express.json',
  matting: 'matting.json',
  tangling: 'tangling.json',
  shedding: 'shedding.json',
};

const form = document.getElementById('editForm');
function createDropdown(label, name, selectedValue, multiple = false) {
  const div = document.createElement('div');
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  const select = document.createElement('select');
  select.name = name;
  if (multiple) select.multiple = true;

  const jsonPath = path.join(__dirname, `./data/${dropdownSources[name]}`);
  const options = JSON.parse(fs.readFileSync(jsonPath));

  // Only add "None" for matting, tangling, and shedding
  const noneAllowed = ['express','matting', 'tangling', 'shedding'];
  if (noneAllowed.includes(name)) options.unshift("None");

  options.forEach(opt => {
    const option = document.createElement('option');

    let value, text;

    if (typeof opt === 'object') {
      value = opt.name || opt.label || JSON.stringify(opt);
      text = opt.name || opt.label || JSON.stringify(opt);
    } else {
      value = opt;
      text = opt;
    }

    option.value = value;
    option.textContent = text;

    // ✅ Handle multi-select correctly, including for previously chosen items
    if (multiple && Array.isArray(selectedValue) && selectedValue.includes(value)) {
      option.selected = true;
    } else if (!multiple && selectedValue === value) {
      option.selected = true;
    }

    select.appendChild(option);
  });

  div.appendChild(labelEl);
  div.appendChild(select);
  form.appendChild(div);

  select.addEventListener('change', updateDisplayedPrice);
}

function calculateTotal(session) {
  const pricesData = JSON.parse(fs.readFileSync(path.join(__dirname, './data/prices.json')));
  const mattingOptions = JSON.parse(fs.readFileSync(path.join(__dirname, './data/matting.json')));
  const tanglingOptions = JSON.parse(fs.readFileSync(path.join(__dirname, './data/tangling.json')));
  const sheddingOptions = JSON.parse(fs.readFileSync(path.join(__dirname, './data/shedding.json')));
  const expressOptions = JSON.parse(fs.readFileSync(path.join(__dirname, './data/express.json')));

  let total = 0;

  if (session.pkg && session.size && pricesData[session.pkg] && pricesData[session.pkg][session.size]) {
    total += pricesData[session.pkg][session.size];
  }

  const mattingMatch = mattingOptions.find(opt => opt.label === session.matting);
  if (mattingMatch) total += mattingMatch.price || 0;

  const tanglingMatch = tanglingOptions.find(opt => opt.label === session.tangling);
  if (tanglingMatch) total += tanglingMatch.price || 0;

  const sheddingMatch = sheddingOptions.find(opt => opt.label === session.shedding);
  if (sheddingMatch) total += sheddingMatch.price || 0;

  if (Array.isArray(session.express)) {
    session.express.forEach(serviceName => {
      const match = expressOptions.find(opt => opt.name === serviceName);
      if (match) total += match.price || 0;
    });
  }

  return total;
}

function updateDisplayedPrice() {
  const formData = new FormData(form);
  const session = {
    size: formData.get('size'),
    pkg: formData.get('pkg'),
    express: Array.from(form.querySelector('[name="express"]').selectedOptions).map(o => o.value),
    matting: formData.get('matting'),
    tangling: formData.get('tangling'),
    shedding: formData.get('shedding')
  };
  const price = calculateTotal(session);
  document.getElementById('priceDisplay').textContent = `₱${price}`;
}

function loadSessionData() {
  const summaries = JSON.parse(fs.readFileSync(summariesPath));
  const session = summaries.find(s => String(s.jobOrder) === String(jobOrder));
  if (!session) {
    alert("❌ Session not found!");
    return;
  }
  
  createDropdown('Size', 'size', session.size);
  createDropdown('Package', 'pkg', session.pkg);
  createDropdown('Express', 'express', session.express || [], true);
  createDropdown('Matting', 'matting', session.matting);
  createDropdown('Tangling', 'tangling', session.tangling);
  createDropdown('Shedding', 'shedding', session.shedding);

  const priceDisplay = document.createElement('div');
  priceDisplay.innerHTML = `<label><strong>Total Price:</strong> <span id="priceDisplay">₱${calculateTotal(session)}</span></label>`;
  form.appendChild(priceDisplay);
}

document.getElementById('saveChanges').addEventListener('click', () => {
  const summaries = JSON.parse(fs.readFileSync(summariesPath));
  const session = summaries.find(s => String(s.jobOrder) === String(jobOrder));
  const formData = new FormData(form);

  session.size = formData.get('size');
  session.pkg = formData.get('pkg');
  session.express = Array.from(form.querySelector('[name="express"]').selectedOptions).map(o => o.value);
  session.matting = formData.get('matting');
  session.tangling = formData.get('tangling');
  session.shedding = formData.get('shedding');

  const updatedTotal = calculateTotal(session);
session.price = updatedTotal;
session.total = updatedTotal;


  fs.writeFileSync(summariesPath, JSON.stringify(summaries, null, 2));

  const clients = JSON.parse(fs.readFileSync(clientsPath));
  for (const client of clients) {
    for (const pet of client.pets) {
      const petSession = pet.sessions?.find(s => String(s.jobOrder) === String(jobOrder));
      if (petSession) {
        Object.assign(petSession, session);
        break;
      }
    }
  }

  fs.writeFileSync(clientsPath, JSON.stringify(clients, null, 2));
  alert("✅ Session updated!");
  window.location.href = 'onGoing.html';
});

window.addEventListener('DOMContentLoaded', loadSessionData);
