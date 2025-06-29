const fs = require('fs');
    const path = require('path');
    const summaryPath = path.join(__dirname, './data/sessionSummaries.json');
    const groomersPath = path.join(__dirname, './data/groomers.json');
    const clerksPath = path.join(__dirname, './data/clerks.json');
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
      const groomers = [...new Set(data.map(s => s.groomer))];
      const dates = [...new Set(data.map(s => s.date))];

      groomers.forEach(g => {
        const option = document.createElement('option');
        option.value = g;
        option.textContent = g;
        groomerFilter.appendChild(option);
      });

      dates.forEach(d => {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d;
        dateFilter.appendChild(option);
      });

      groomerFilter.addEventListener('change', applyFilters);
      dateFilter.addEventListener('change', applyFilters);
    }

    function applyFilters() {
      let filtered = allSessions;

      const selectedGroomer = groomerFilter.value;
      const selectedDate = dateFilter.value;

      if (selectedGroomer !== 'all') {
        filtered = filtered.filter(s => s.groomer === selectedGroomer);
      }

      if (selectedDate !== 'all') {
        filtered = filtered.filter(s => s.date === selectedDate);
      }

      updateSummary(filtered);
      drawLineChart(filtered);
    }

    function updateSummary(data) {
      let total = 0;
      data.forEach(d => total += d.total || 0);
      totalSessionsEl.textContent = data.length;
      totalRevenueEl.textContent = total.toFixed(2);
    }

function drawLineChart(data) {
  const totalsByDay = {};

  data.forEach(entry => {
    const rawDate = entry.date;
    const dateObj = new Date(rawDate);

    if (!isNaN(dateObj)) {
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Jun 27"
      totalsByDay[label] = (totalsByDay[label] || 0) + entry.total;
    }
  });

  const labels = Object.keys(totalsByDay);
  const chartData = Object.values(totalsByDay);

  if (window.barChart) window.barChart.destroy();

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
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Below the chart – show just the day numbers
  const dayContainer = document.getElementById('dayList');
  if (dayContainer) {
    const dayNumbers = labels.map(l => l.split(' ')[1]); // get day from "Jun 27"
    dayContainer.innerHTML = `<strong>Days:</strong><br>` + dayNumbers.join('  ');
  }
}


google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(drawGooglePie);

function drawGooglePie() {
  const data = google.visualization.arrayToDataTable([
    ['Package', 'Avails'],
    ['Basic', 10],
    ['Premium', 16],
    ['Deluxe', 5]
  ]);

  const options = {
    title: 'Package Usage',
    is3D: true,
    backgroundColor: '#1f1f1f',
    legend: { textStyle: { color: '#fff' } },
    titleTextStyle: { color: '#fff' },
    chartArea: { width: '90%', height: '80%' }
  };

  const chart = new google.visualization.PieChart(document.getElementById('googlePieChart'));
  chart.draw(data, options);
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

