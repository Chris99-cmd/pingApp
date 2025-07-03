const fs = require('fs');
    const path = require('path');
    const summaryPath = path.join(__dirname, './data/sessionSummaries.json');
    const groomersPath = path.join(__dirname, './data/groomers.json');
    const clerksPath = path.join(__dirname, './data/clerks.json');
    const packagesPath = path.join(__dirname, './data/packages.json');

    const totalSessionsEl = document.getElementById('totalSessions');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const groomerFilter = document.getElementById('groomerFilter');
    const dateFilter = document.getElementById('dateFilter');

    let allSessions = [];

    function toggleDropdown() {
      const menu = document.getElementById('dropdownMenu');
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }

    function logout() {
      window.location = 'login.html';
    }

    function loadDashboard() {
      if (fs.existsSync(summaryPath)) {
        allSessions = JSON.parse(fs.readFileSync(summaryPath));
        populateFilters(allSessions);
        applyFilters();
      }
     loadGroomers();
  loadClerks(); 
    }

function populateFilters(data) {
  // Clear existing options first (except the "All" option)
  groomerFilter.innerHTML = '<option value="all">All</option>';
  dateFilter.innerHTML = '<option value="all">All</option>';

  const groomers = [...new Set(data.map(s => s.groomer))];
  const months = [...new Set(data.map(s => {
    const date = new Date(s.date || s.createdAt);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // "2025-06"
  }))];

  groomers.forEach(g => {
    const option = document.createElement('option');
    option.value = g;
    option.textContent = g;
    groomerFilter.appendChild(option);
  });

  months.sort().forEach(m => {
    const option = document.createElement('option');
    option.value = m;
    const label = new Date(`${m}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // e.g. "June 2025"
    option.textContent = label;
    dateFilter.appendChild(option);
  });

  groomerFilter.addEventListener('change', applyFilters);
  dateFilter.addEventListener('change', applyFilters);
}



    function applyFilters() {
  let filtered = allSessions;

  const selectedGroomer = groomerFilter.value;
  const selectedMonth = dateFilter.value;

  if (selectedGroomer !== 'all') {
    filtered = filtered.filter(s => s.groomer === selectedGroomer);
  }

  if (selectedMonth !== 'all') {
    filtered = filtered.filter(s => {
      const d = new Date(s.date || s.createdAt);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return m === selectedMonth;
    });
  }

  updateSummary(filtered);
  drawLineChart(filtered); // <- This uses your updated daily logic
  drawGooglePie(filtered); // <- Keep this too!
}

    function updateSummary(data) {
      let total = 0;
      data.forEach(d => total += d.total || 0);
      totalSessionsEl.textContent = data.length;
      totalRevenueEl.textContent = total.toFixed(2);
    }

function drawLineChart(data) {
  const now = new Date();
  const selectedMonth = dateFilter.value !== 'all'
    ? new Date(dateFilter.value)
    : new Date(now.getFullYear(), now.getMonth());

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  // Generate all dates of selected month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const labels = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Jun 1"
  });

  // Initialize zero counts for each day
  const dailyTotals = {};
  labels.forEach(label => dailyTotals[label] = 0);

  // Sum totals per day
  data.forEach(entry => {
    const entryDate = new Date(entry.date || entry.createdAt);
    if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
      const label = entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyTotals[label] = (dailyTotals[label] || 0) + (entry.total || 0);
    }
  });

  const chartLabels = Object.keys(dailyTotals);
  const chartData = Object.values(dailyTotals);

  if (window.barChart) window.barChart.destroy();


const canvas = document.getElementById('salesChart');
canvas.width = labels.length * 50;
canvas.height = 500; // or 60 for wider spacing

 window.barChart = new Chart(document.getElementById('salesChart'), {
  type: 'line',
  data: {
    labels,
    datasets: [{
      label: 'Sessions by Day',
      data: chartData,
      borderColor: '#ffa726',
      backgroundColor: 'rgba(255, 167, 38, 0.2)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#ffa726',
      pointRadius: 4
    }]
  },
 options: {
  responsive: false,  // Let canvas width dictate layout
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 30,
      bottom: 20,
      left: 20,
      right: 20
    }
  },
  scales: {
    x: {
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        minRotation: 0,
        align: 'start'
      },
      grid: {
        drawOnChartArea: true
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        drawOnChartArea: true
      }
    }
  }
}

});

  const dayContainer = document.getElementById('dayList');
  if (dayContainer) {
    const dayNumbers = chartLabels.map(l => l.split(' ')[1]);
    dayContainer.innerHTML = `<strong>Days:</strong><br>` + dayNumbers.join('  ');
  }
}



google.charts.load('current', { packages: ['corechart'] });

google.charts.setOnLoadCallback(() => {
  window.googleChartsReady = true; // Flag that it's safe to call drawGooglePie
  loadDashboard(); // this will call applyFilters, which will now be safe
});

function drawGooglePie(data = allSessions) {
  if (!window.googleChartsReady || typeof google === 'undefined' || !google.visualization) {
    console.warn("Google Charts not yet ready.");
    return;
  }

  if (!fs.existsSync(packagesPath)) return;

  const availablePackages = JSON.parse(fs.readFileSync(packagesPath));
  const packageCounts = {};

  availablePackages.forEach(pkg => {
    packageCounts[pkg] = 0;
  });

  data.forEach(session => {
    const pkg = session.package;
    if (packageCounts.hasOwnProperty(pkg)) {
      packageCounts[pkg]++;
    }
  });

  const pieData = [['Package', 'Avails']];
  for (let pkg in packageCounts) {
    pieData.push([pkg, packageCounts[pkg]]);
  }

  console.log('📊 Pie Chart Data:', pieData);

  const dataTable = google.visualization.arrayToDataTable(pieData);

  const options = {
    title: 'Package Usage',
    is3D: true,
    backgroundColor: '#1f1f1f',
    legend: { textStyle: { color: '#fff' } },
    titleTextStyle: { color: '#fff' },
    chartArea: { width: '90%', height: '80%' }
  };

  const chart = new google.visualization.PieChart(document.getElementById('googlePieChart'));
  chart.draw(dataTable, options);
}


    function exportCSV() {
      const headers = ['Date', 'Owner', 'Pet Name', 'Package', 'Total', 'Groomer'];
      let rows = [headers.join(',')];

      const filtered = allSessions.filter(session => {
        return (groomerFilter.value === 'all' || session.groomer === groomerFilter.value) &&
               (dateFilter.value === 'all' || session.date === dateFilter.value);
      });

      filtered.forEach(s => {
        s.pets.forEach(pet => {
          rows.push([s.date, s.owner, pet.name, pet.package, s.total, s.groomer].join(','));
        });
      });

      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'grooming_sessions_report.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    function loadGroomers() {
  const groomerList = document.getElementById('groomerList');
  groomerList.innerHTML = '';
  if (!fs.existsSync(groomersPath)) return;
  const groomers = JSON.parse(fs.readFileSync(groomersPath));
  groomers.forEach((groomer, index) => {
    const li = document.createElement('li');
    li.textContent = `${groomer.firstName} ${groomer.lastName}`;
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.onclick = () => {
      const confirmed = confirm(`❗ Are you sure you want to delete ${groomer.firstName} ${groomer.lastName}?`);
      if (!confirmed) return;
      groomers.splice(index, 1);
      fs.writeFileSync(groomersPath, JSON.stringify(groomers, null, 2));
      loadGroomers();
    };
    li.appendChild(delBtn);
    groomerList.appendChild(li);
  });
}

    function addGroomer() {
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      if (!firstName || !lastName) return alert('Please enter both first and last names.');
      let groomers = fs.existsSync(groomersPath) ? JSON.parse(fs.readFileSync(groomersPath)) : [];
      groomers.push({ firstName, lastName });
      fs.writeFileSync(groomersPath, JSON.stringify(groomers, null, 2));
      document.getElementById('firstName').value = '';
      document.getElementById('lastName').value = '';
      loadGroomers();
    }

    function loadClerks() {
  const clerkList = document.getElementById('clerkList');
  clerkList.innerHTML = '';
  if (!fs.existsSync(clerksPath)) return;
  const clerks = JSON.parse(fs.readFileSync(clerksPath));
  clerks.forEach((clerk, index) => {
    const li = document.createElement('li');
    li.textContent = `${clerk.firstName} ${clerk.lastName}`;
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.onclick = () => {
      const confirmed = confirm(`❗ Are you sure you want to delete ${clerk.firstName} ${clerk.lastName}?`);
      if (!confirmed) return;
      clerks.splice(index, 1);
      fs.writeFileSync(clerksPath, JSON.stringify(clerks, null, 2));
      loadClerks();
    };
    li.appendChild(delBtn);
    clerkList.appendChild(li);
  });
}


function addClerk() {
  const firstName = document.getElementById('clerkFirstName').value.trim();
  const lastName = document.getElementById('clerkLastName').value.trim();
  if (!firstName || !lastName) return alert('Please enter both first and last names.');
  let clerks = fs.existsSync(clerksPath) ? JSON.parse(fs.readFileSync(clerksPath)) : [];
  clerks.push({ firstName, lastName });
  fs.writeFileSync(clerksPath, JSON.stringify(clerks, null, 2));
  document.getElementById('clerkFirstName').value = '';
  document.getElementById('clerkLastName').value = '';
  loadClerks();
}


    loadDashboard();

