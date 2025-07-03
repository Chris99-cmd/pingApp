const fs = require('fs');
const path = require('path');
const { app } = require('@electron/remote');
const userDataPath = app.getPath('userData');
const packagesPath = path.join(userDataPath, 'packages.json');
const sizesPath = path.join(userDataPath, 'sizes.json');
const expressPath = path.join(userDataPath, 'express.json');
const pricesPath = path.join(userDataPath, 'prices.json');
const mattingPath = path.join(userDataPath, 'matting.json');
const tanglingPath = path.join(userDataPath, 'tangling.json');
const sheddingPath = path.join(userDataPath, 'shedding.json');

const packageListEl = document.getElementById('packageList');
const sizeListEl = document.getElementById('sizeList');
const expressListEl = document.getElementById('expressList');
const mattingListEl = document.getElementById('mattingList');
const tanglingListEl = document.getElementById('tanglingList');
const sheddingListEl = document.getElementById('sheddingList');
const priceTableEl = document.getElementById('priceTable');

// Modal Elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');

let packages = [], sizes = [], express = [], prices = {};
let matting = [], tangling = [], shedding = [];
let currentSaveHandler = null;

function loadData() {
  packages = fs.existsSync(packagesPath) ? JSON.parse(fs.readFileSync(packagesPath)) : [];
  sizes = fs.existsSync(sizesPath) ? JSON.parse(fs.readFileSync(sizesPath)) : [];
  express = fs.existsSync(expressPath) ? JSON.parse(fs.readFileSync(expressPath)) : [];
  prices = fs.existsSync(pricesPath) ? JSON.parse(fs.readFileSync(pricesPath)) : {};
  matting = fs.existsSync(mattingPath) ? JSON.parse(fs.readFileSync(mattingPath)) : [];
  tangling = fs.existsSync(tanglingPath) ? JSON.parse(fs.readFileSync(tanglingPath)) : [];
  shedding = fs.existsSync(sheddingPath) ? JSON.parse(fs.readFileSync(sheddingPath)) : [];

  renderPackages();
  renderSizes();
  renderExpress();
  renderSeverity(mattingListEl, matting, 'matting');
  renderSeverity(tanglingListEl, tangling, 'tangling');
  renderSeverity(sheddingListEl, shedding, 'shedding');
  renderPriceTable();
}

function renderPackages() {
  packageListEl.innerHTML = '';
  packages.forEach((pkg, index) => {
    const div = document.createElement('div');
    div.className = 'package-box';
    div.innerHTML = `
      <span>${pkg}</span>
      <button onclick="editPackage(${index})">✏️ Edit</button>
      <button onclick="deletePackage(${index})">🗑️ Delete</button>
    `;
    packageListEl.appendChild(div);
  });
}

function renderSizes() {
  sizeListEl.innerHTML = '';
  sizes.forEach((size, index) => {
    const div = document.createElement('div');
    div.className = 'size-box';
    div.innerHTML = `
      <span>${size.label}</span>
      <button onclick="editSize(${index})">✏️ Edit</button>
      <button onclick="deleteSize(${index})">🗑️ Delete</button>
    `;
    sizeListEl.appendChild(div);
  });
}

function renderExpress() {
  expressListEl.innerHTML = '';
  express.forEach((ex, index) => {
    const div = document.createElement('div');
    div.className = 'express-box';
    div.innerHTML = `
      <span>${ex.name} - ₱${ex.price}</span>
      <button onclick="editExpress(${index})">✏️ Edit</button>
      <button onclick="deleteExpress(${index})">🗑️ Delete</button>
    `;
    expressListEl.appendChild(div);
  });
}

function renderSeverity(container, data, key) {
  container.innerHTML = '';
  data.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'severity-box';
    div.innerHTML = `
      <span>${item.label} - ₱${item.price}</span>
      <button onclick="editSeverity('${key}', ${index})">✏️ Edit</button>
      <button onclick="deleteSeverity('${key}', ${index})">🗑️ Delete</button>
    `;
    container.appendChild(div);
  });
}

function renderPriceTable() {
  let html = '<thead><tr><th>Package / Size</th>';
  sizes.forEach(size => html += `<th>${size.label}</th>`);
  html += '</tr></thead><tbody>';

packages.forEach(pkg => {
  html += `<tr><td>${pkg}</td>`;
  sizes.forEach(size => {
    let value = prices[pkg]?.[size.label];
    if (value === undefined || isNaN(value)) {
      value = 0;
      if (!prices[pkg]) prices[pkg] = {};
      prices[pkg][size.label] = 0; // initialize it!
    }
    html += `<td><input type="number" value="${value}" onchange="updatePrice('${pkg}', '${size.label}', this.value)"></td>`;
  });
  html += '</tr>';
});


  html += '</tbody>';
  priceTableEl.innerHTML = html;
}

function updatePrice(pkg, size, value) {
  if (!prices[pkg]) prices[pkg] = {};
  prices[pkg][size] = parseFloat(value);
}

document.getElementById('savePricesBtn')?.addEventListener('click', () => {
  if (!confirm('Are you sure you want to save all prices?')) return;
  try {
    // Clean up: remove any old flat-style keys like "basic_Small 0-5kg"
Object.keys(prices).forEach(key => {
  if (key.includes('_')) delete prices[key];
});

// Now re-generate the new structured pricing based on packages and sizes
const newPrices = {};

// Deep clone valid entries
packages.forEach(pkg => {
  if (prices[pkg]) {
    newPrices[pkg] = {};
    sizes.forEach(size => {
      if (prices[pkg][size.label] !== undefined) {
        newPrices[pkg][size.label] = prices[pkg][size.label];
      }
    });
  }
});

fs.writeFileSync(pricesPath, JSON.stringify(newPrices, null, 2));

    const statusEl = document.getElementById('saveStatus');
    if (statusEl) {
      statusEl.textContent = '✅ Prices saved!';
      setTimeout(() => statusEl.textContent = '', 2000);
    }
  } catch (err) {
    alert('❌ Failed to save prices. Check console.');
    console.error(err);
  }
});

// Modal Functions
function openModal(title, initialValue, onSave) {
  modalTitle.textContent = title;
  modalInput.value = initialValue;
  modal.style.display = 'flex';

  currentSaveHandler = () => {
    modal.style.display = 'none';
    onSave(modalInput.value.trim());
  };

  modalCancel.onclick = () => {
    modal.style.display = 'none';
  };
}

modalSave.onclick = () => {
  if (currentSaveHandler) currentSaveHandler();
};

function addPackage() {
  openModal('Add Package', '', (value) => {
    if (value) {
      packages.push(value);
      fs.writeFileSync(packagesPath, JSON.stringify(packages, null, 2));
loadData();

    }
  });
}

function editPackage(index) {
  openModal('Edit Package', packages[index], (value) => {
    if (value) {
      packages[index] = value;
      fs.writeFileSync(packagesPath, JSON.stringify(packages, null, 2));
loadData();

    }
  });
}

function deletePackage(index) {
  const pkg = packages[index]; // <-- define pkg
  if (!confirm('Delete this Package?')) return;

  packages.splice(index, 1);
  fs.writeFileSync(packagesPath, JSON.stringify(packages, null, 2));

  // Clean up related prices
  delete prices[pkg];

  fs.writeFileSync(pricesPath, JSON.stringify(prices, null, 2));
loadData();

}

function addSize() {
  openModal('Add Size (e.g. Small 0-5kg)', '', (value) => {
    if (value) {
      sizes.push({ label: value });
      fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2));
   loadData();

    }
  });
}

function editSize(index) {
  openModal('Edit Size Label', sizes[index].label, (value) => {
    if (value) {
      sizes[index].label = value;
      fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2));
loadData();

    }
  });
}

function deleteSize(index) {
  const sizeLabel = sizes[index].label; // <-- define size label
  if (!confirm('Delete this size?')) return;

  sizes.splice(index, 1);
  fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2));

  // Clean up related prices
  Object.keys(prices).forEach(pkg => {
    if (prices[pkg][sizeLabel]) {
      delete prices[pkg][sizeLabel];
    }
  });

  fs.writeFileSync(pricesPath, JSON.stringify(prices, null, 2));
loadData();

}

function addExpress() {
  openModal('Express Name and Price (e.g. Anal Sac,100)', '', (value) => {
    const [name, price] = value.split(',');
    if (name && !isNaN(price)) {
      express.push({ name: name.trim(), price: parseFloat(price) });
      fs.writeFileSync(expressPath, JSON.stringify(express, null, 2));
      renderExpress();
    } else {
      alert("Invalid format. Use: Name,Price");
    }
  });
}

function editExpress(index) {
  const ex = express[index];
  openModal('Edit Express (e.g. Nail Trim,120)', `${ex.name},${ex.price}`, (value) => {
    const [name, price] = value.split(',');
    if (name && !isNaN(price)) {
      express[index] = { name: name.trim(), price: parseFloat(price) };
      fs.writeFileSync(expressPath, JSON.stringify(express, null, 2));
      renderExpress();
    } else {
      alert("Invalid format. Use: Name,Price");
    }
  });
}

function deleteExpress(index) {
  if (!confirm('Delete this express service?')) return;
  express.splice(index, 1);
  fs.writeFileSync(expressPath, JSON.stringify(express, null, 2));
  renderExpress();
}

function addSeverity(key, path, list, render) {
  openModal(`Add ${key} (e.g. Mild,200)`, '', (value) => {
    const [label, price] = value.split(',');
    if (label && !isNaN(price)) {
      list.push({ label: label.trim(), price: parseFloat(price) });
      fs.writeFileSync(path, JSON.stringify(list, null, 2));
      render();
    } else {
      alert("Invalid format. Use: Label,Price");
    }
  });
}

function editSeverity(key, index) {
  let path, list, render;
  if (key === 'matting') {
    path = mattingPath; list = matting; render = () => renderSeverity(mattingListEl, matting, 'matting');
  } else if (key === 'tangling') {
    path = tanglingPath; list = tangling; render = () => renderSeverity(tanglingListEl, tangling, 'tangling');
  } else if (key === 'shedding') {
    path = sheddingPath; list = shedding; render = () => renderSeverity(sheddingListEl, shedding, 'shedding');
  }
  openModal(`Edit ${key}`, `${list[index].label},${list[index].price}`, (value) => {
    const [label, price] = value.split(',');
    if (label && !isNaN(price)) {
      list[index] = { label: label.trim(), price: parseFloat(price) };
      fs.writeFileSync(path, JSON.stringify(list, null, 2));
      render();
    } else {
      alert("Invalid format. Use: Label,Price");
    }
  });
}

function deleteSeverity(type, index) {
  let path, list, render;
  if (type === 'matting') {
    path = mattingPath;
    list = matting;
    render = () => renderSeverity(mattingListEl, matting, 'matting');
  } else if (type === 'tangling') {
    path = tanglingPath;
    list = tangling;
    render = () => renderSeverity(tanglingListEl, tangling, 'tangling');
  } else if (type === 'shedding') {
    path = sheddingPath;
    list = shedding;
    render = () => renderSeverity(sheddingListEl, shedding, 'shedding');
  }

  if (!confirm(`Delete this ${type} severity?`)) return;

  list.splice(index, 1);
  fs.writeFileSync(path, JSON.stringify(list, null, 2));
  render();
}

loadData();

window.addPackage = addPackage;
window.addSize = addSize;
window.addExpress = addExpress;
window.editPackage = editPackage;
window.editSize = editSize;
window.editExpress = editExpress;
window.updatePrice = updatePrice;
window.addSeverity = addSeverity;
window.editSeverity = editSeverity;
window.deletePackage = deletePackage;
window.deleteSize = deleteSize;
window.deleteExpress = deleteExpress;
window.deleteSeverity = deleteSeverity;

document.getElementById('backBtn')?.addEventListener('click', () => {
  window.location.href = 'adminDashboard.html';
});
