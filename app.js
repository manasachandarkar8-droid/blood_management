/* ===========================
   BloodLink – app.js
   Blood Management System
=========================== */

// ===== STATE =====
const state = {
  donors: [],
  banks: [],
  stock: [],
  donations: [],
  requests: [],
  patients: [],
  activity: []
};

// ===== NAVIGATION =====
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const pageTitle = document.getElementById('page-title');

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const sectionId = item.dataset.section;
    switchSection(sectionId);
    // Close sidebar on mobile
    if (window.innerWidth < 900) closeSidebar();
  });
});

function switchSection(sectionId) {
  navItems.forEach(n => n.classList.remove('active'));
  sections.forEach(s => s.classList.remove('active'));

  const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
  const activeSection = document.getElementById(`section-${sectionId}`);

  if (activeNav) activeNav.classList.add('active');
  if (activeSection) activeSection.classList.add('active');

  const titleMap = {
    dashboard: 'Dashboard',
    donors: 'Donors',
    bloodbanks: 'Blood Banks',
    bloodstock: 'Blood Stock',
    donations: 'Donations',
    requests: 'Blood Requests',
    patients: 'Patients'
  };
  pageTitle.textContent = titleMap[sectionId] || sectionId;

  if (sectionId === 'dashboard') updateDashboard();
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

// ===== MODAL =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}
// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});
// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
  }
});

// ===== TOAST =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `${icons[type]} ${message}`;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 3200);
}

// ===== ACTIVITY LOG =====
function logActivity(message) {
  state.activity.unshift({ message, time: new Date() });
  if (state.activity.length > 10) state.activity.pop();
}

// ===== COUNTER ANIMATION =====
function animateCounter(el, target) {
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 40);
}

// ===== DASHBOARD UPDATE =====
function updateDashboard() {
  animateCounter(document.getElementById('s-donors'), state.donors.length);
  animateCounter(document.getElementById('s-banks'), state.banks.length);
  animateCounter(document.getElementById('s-patients'), state.patients.length);
  animateCounter(document.getElementById('s-requests'), state.requests.length);
  animateCounter(document.getElementById('s-donations'), state.donations.length);
  const totalStock = state.stock.reduce((a, s) => a + Number(s.qty), 0);
  animateCounter(document.getElementById('s-stock'), totalStock);

  renderBloodChart();
  renderActivity();
  renderCritical();
}

function renderBloodChart() {
  const groups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const chart = document.getElementById('blood-chart');
  chart.innerHTML = '';

  // Count by blood group from donors
  const counts = {};
  groups.forEach(g => counts[g] = 0);
  state.donors.forEach(d => { if (counts[d.bg] !== undefined) counts[d.bg]++; });
  state.stock.forEach(s => { if (counts[s.bg] !== undefined) counts[s.bg] += Number(s.qty); });

  const max = Math.max(...Object.values(counts), 1);
  groups.forEach(g => {
    const pct = Math.round((counts[g] / max) * 100);
    const row = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <div class="chart-label">${g}</div>
      <div class="chart-bar-wrap"><div class="chart-bar" style="width:0%" data-pct="${pct}"></div></div>
      <div class="chart-val">${counts[g]}</div>
    `;
    chart.appendChild(row);
  });

  // Animate bars
  requestAnimationFrame(() => {
    chart.querySelectorAll('.chart-bar').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  });
}

function renderActivity() {
  const list = document.getElementById('activity-list');
  if (state.activity.length === 0) {
    list.innerHTML = '<li class="empty-state"><i class="fa-solid fa-inbox"></i> No recent activity</li>';
    return;
  }
  list.innerHTML = state.activity.slice(0, 6).map(a => `
    <li class="activity-item">
      <div class="activity-dot"></div>
      <div>${a.message} <br><small style="font-size:0.75rem">${formatTime(a.time)}</small></div>
    </li>
  `).join('');
}

function renderCritical() {
  const list = document.getElementById('critical-list');
  const criticals = state.requests.filter(r => r.priority === 'Critical' && r.status === 'Pending');
  if (criticals.length === 0) {
    list.innerHTML = '<li class="empty-state"><i class="fa-solid fa-check-circle"></i> No critical requests</li>';
    return;
  }
  list.innerHTML = criticals.map(r => `
    <li class="critical-item">
      <div>
        <div style="font-weight:600;color:var(--text);font-size:0.85rem">${r.id}</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">Patient ${r.patient} • ${r.bg} • ${r.qty} units</div>
      </div>
      <span class="crit-badge">CRITICAL</span>
    </li>
  `).join('');
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
}

// ===========================
//        DONORS
// ===========================
function saveDonor(e) {
  e.preventDefault();
  const editId = document.getElementById('donor-edit-id').value;
  const donor = {
    id: document.getElementById('d-id').value.trim(),
    name: document.getElementById('d-name').value.trim(),
    age: document.getElementById('d-age').value,
    gender: document.getElementById('d-gender').value,
    bg: document.getElementById('d-bg').value,
    lastDonation: document.getElementById('d-last').value || 'N/A',
    eligibility: document.getElementById('d-eligibility').value
  };

  if (editId !== '') {
    const idx = state.donors.findIndex(d => d._idx == editId);
    if (idx !== -1) {
      donor._idx = state.donors[idx]._idx;
      state.donors[idx] = donor;
      logActivity(`Donor <span>${donor.name}</span> updated`);
      showToast('Donor updated successfully!');
    }
  } else {
    // Check duplicate ID
    if (state.donors.find(d => d.id === donor.id)) {
      showToast('Donor ID already exists!', 'error'); return;
    }
    donor._idx = Date.now();
    state.donors.push(donor);
    logActivity(`New donor <span>${donor.name}</span> registered`);
    showToast('Donor added successfully! 🩸');
  }

  closeModal('donor-modal');
  renderDonors();
  updateDashboard();
  resetDonorForm();
}

function renderDonors() {
  const tbody = document.getElementById('donors-tbody');
  if (state.donors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="no-data"><i class="fa-solid fa-droplet"></i> No donors yet. Add your first donor!</td></tr>';
    return;
  }
  tbody.innerHTML = state.donors.map(d => `
    <tr>
      <td>${d.id}</td>
      <td><strong style="color:var(--text)">${d.name}</strong></td>
      <td>${d.age}</td>
      <td>${d.gender}</td>
      <td><span class="bg-badge">${d.bg}</span></td>
      <td>${d.lastDonation}</td>
      <td>${d.eligibility}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-icon-edit" onclick="editDonor('${d._idx}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-del" onclick="confirmDelete('donor','${d._idx}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editDonor(idx) {
  const d = state.donors.find(x => x._idx == idx);
  if (!d) return;
  document.getElementById('donor-modal-title').textContent = 'Edit Donor';
  document.getElementById('donor-edit-id').value = idx;
  document.getElementById('d-id').value = d.id;
  document.getElementById('d-name').value = d.name;
  document.getElementById('d-age').value = d.age;
  document.getElementById('d-gender').value = d.gender;
  document.getElementById('d-bg').value = d.bg;
  document.getElementById('d-last').value = d.lastDonation === 'N/A' ? '' : d.lastDonation;
  document.getElementById('d-eligibility').value = d.eligibility;
  openModal('donor-modal');
}

function resetDonorForm() {
  document.getElementById('donor-modal-title').textContent = 'Add Donor';
  document.getElementById('donor-edit-id').value = '';
  ['d-id','d-name','d-age','d-last','d-eligibility'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('d-gender').value = '';
  document.getElementById('d-bg').value = '';
}

// ===========================
//        BLOOD BANKS
// ===========================
function saveBank(e) {
  e.preventDefault();
  const editId = document.getElementById('bank-edit-id').value;
  const bank = {
    id: document.getElementById('b-id').value.trim(),
    name: document.getElementById('b-name').value.trim(),
    location: document.getElementById('b-location').value.trim(),
    contact: document.getElementById('b-contact').value.trim()
  };

  if (editId !== '') {
    const idx = state.banks.findIndex(b => b._idx == editId);
    if (idx !== -1) {
      bank._idx = state.banks[idx]._idx;
      state.banks[idx] = bank;
      logActivity(`Blood bank <span>${bank.name}</span> updated`);
      showToast('Blood bank updated!');
    }
  } else {
    if (state.banks.find(b => b.id === bank.id)) {
      showToast('Bank ID already exists!', 'error'); return;
    }
    bank._idx = Date.now();
    state.banks.push(bank);
    logActivity(`New blood bank <span>${bank.name}</span> registered`);
    showToast('Blood bank added successfully! 🏥');
  }

  closeModal('bank-modal');
  renderBanks();
  updateDashboard();
  resetBankForm();
}

function renderBanks() {
  const tbody = document.getElementById('banks-tbody');
  if (state.banks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-data"><i class="fa-solid fa-building-columns"></i> No blood banks registered yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.banks.map(b => `
    <tr>
      <td>${b.id}</td>
      <td><strong style="color:var(--text)">${b.name}</strong></td>
      <td><i class="fa-solid fa-location-dot" style="color:var(--red);margin-right:4px"></i>${b.location}</td>
      <td><i class="fa-solid fa-phone" style="color:var(--info);margin-right:4px"></i>${b.contact}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-icon-edit" onclick="editBank('${b._idx}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-del" onclick="confirmDelete('bank','${b._idx}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editBank(idx) {
  const b = state.banks.find(x => x._idx == idx);
  if (!b) return;
  document.getElementById('bank-modal-title').textContent = 'Edit Blood Bank';
  document.getElementById('bank-edit-id').value = idx;
  document.getElementById('b-id').value = b.id;
  document.getElementById('b-name').value = b.name;
  document.getElementById('b-location').value = b.location;
  document.getElementById('b-contact').value = b.contact;
  openModal('bank-modal');
}

function resetBankForm() {
  document.getElementById('bank-modal-title').textContent = 'Add Blood Bank';
  document.getElementById('bank-edit-id').value = '';
  ['b-id','b-name','b-location','b-contact'].forEach(id => document.getElementById(id).value = '');
}

// ===========================
//        BLOOD STOCK
// ===========================
function saveStock(e) {
  e.preventDefault();
  const editId = document.getElementById('stock-edit-id').value;
  const stock = {
    id: document.getElementById('s-id').value.trim(),
    bankId: document.getElementById('s-bank').value.trim(),
    bg: document.getElementById('s-bg').value,
    qty: document.getElementById('s-qty').value,
    expiry: document.getElementById('s-expiry').value,
    last: document.getElementById('s-last').value
  };

  if (editId !== '') {
    const idx = state.stock.findIndex(s => s._idx == editId);
    if (idx !== -1) {
      stock._idx = state.stock[idx]._idx;
      state.stock[idx] = stock;
      logActivity(`Stock <span>${stock.id}</span> updated`);
      showToast('Stock updated!');
    }
  } else {
    if (state.stock.find(s => s.id === stock.id)) {
      showToast('Stock ID already exists!', 'error'); return;
    }
    stock._idx = Date.now();
    state.stock.push(stock);
    logActivity(`Blood stock <span>${stock.id}</span> added (${stock.bg}, ${stock.qty} units)`);
    showToast('Stock record added! 🧪');
  }

  closeModal('stock-modal');
  renderStock();
  updateDashboard();
  resetStockForm();
}

function renderStock() {
  const tbody = document.getElementById('stock-tbody');
  if (state.stock.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="fa-solid fa-vials"></i> No stock records yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.stock.map(s => {
    const expDate = new Date(s.expiry);
    const today = new Date();
    const nearExpiry = (expDate - today) < 7 * 24 * 3600 * 1000;
    return `
    <tr>
      <td>${s.id}</td>
      <td>${s.bankId}</td>
      <td><span class="bg-badge">${s.bg}</span></td>
      <td><strong style="color:var(--text)">${s.qty}</strong> units</td>
      <td style="color:${nearExpiry ? 'var(--warning)' : 'inherit'}">${s.expiry}${nearExpiry ? ' ⚠️' : ''}</td>
      <td>${s.last}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-icon-edit" onclick="editStock('${s._idx}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-del" onclick="confirmDelete('stock','${s._idx}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `}).join('');
}

function editStock(idx) {
  const s = state.stock.find(x => x._idx == idx);
  if (!s) return;
  document.getElementById('stock-modal-title').textContent = 'Edit Stock';
  document.getElementById('stock-edit-id').value = idx;
  document.getElementById('s-id').value = s.id;
  document.getElementById('s-bank').value = s.bankId;
  document.getElementById('s-bg').value = s.bg;
  document.getElementById('s-qty').value = s.qty;
  document.getElementById('s-expiry').value = s.expiry;
  document.getElementById('s-last').value = s.last;
  openModal('stock-modal');
}

function resetStockForm() {
  document.getElementById('stock-modal-title').textContent = 'Add Blood Stock';
  document.getElementById('stock-edit-id').value = '';
  ['s-id','s-bank','s-qty','s-expiry','s-last'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('s-bg').value = '';
}

// ===========================
//        DONATIONS
// ===========================
function saveDonation(e) {
  e.preventDefault();
  const editId = document.getElementById('donation-edit-id').value;
  const donation = {
    id: document.getElementById('dn-id').value.trim(),
    donorId: document.getElementById('dn-donor').value.trim(),
    bankId: document.getElementById('dn-bank').value.trim(),
    qty: document.getElementById('dn-qty').value,
    date: document.getElementById('dn-date').value
  };

  if (editId !== '') {
    const idx = state.donations.findIndex(d => d._idx == editId);
    if (idx !== -1) {
      donation._idx = state.donations[idx]._idx;
      state.donations[idx] = donation;
      logActivity(`Donation <span>${donation.id}</span> updated`);
      showToast('Donation updated!');
    }
  } else {
    if (state.donations.find(d => d.id === donation.id)) {
      showToast('Donation ID already exists!', 'error'); return;
    }
    donation._idx = Date.now();
    state.donations.push(donation);
    logActivity(`Donation <span>${donation.id}</span> by donor ${donation.donorId} recorded`);
    showToast('Donation recorded! ❤️');
  }

  closeModal('donation-modal');
  renderDonations();
  updateDashboard();
  resetDonationForm();
}

function renderDonations() {
  const tbody = document.getElementById('donations-tbody');
  if (state.donations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data"><i class="fa-solid fa-heart-pulse"></i> No donations recorded yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.donations.map(d => `
    <tr>
      <td>${d.id}</td>
      <td>${d.donorId}</td>
      <td>${d.bankId}</td>
      <td>${d.date}</td>
      <td><strong style="color:var(--text)">${d.qty}</strong> units</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-icon-edit" onclick="editDonation('${d._idx}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-del" onclick="confirmDelete('donation','${d._idx}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editDonation(idx) {
  const d = state.donations.find(x => x._idx == idx);
  if (!d) return;
  document.getElementById('donation-modal-title').textContent = 'Edit Donation';
  document.getElementById('donation-edit-id').value = idx;
  document.getElementById('dn-id').value = d.id;
  document.getElementById('dn-donor').value = d.donorId;
  document.getElementById('dn-bank').value = d.bankId;
  document.getElementById('dn-qty').value = d.qty;
  document.getElementById('dn-date').value = d.date;
  openModal('donation-modal');
}

function resetDonationForm() {
  document.getElementById('donation-modal-title').textContent = 'Record Donation';
  document.getElementById('donation-edit-id').value = '';
  ['dn-id','dn-donor','dn-bank','dn-qty','dn-date'].forEach(id => document.getElementById(id).value = '');
}

// ===========================
//        REQUESTS
// ===========================
function saveRequest(e) {
  e.preventDefault();
  const editId = document.getElementById('request-edit-id').value;
  const req = {
    id: document.getElementById('r-id').value.trim(),
    patient: document.getElementById('r-patient').value.trim(),
    bg: document.getElementById('r-bg').value,
    qty: document.getElementById('r-qty').value,
    bankId: document.getElementById('r-bank').value.trim(),
    priority: document.getElementById('r-priority').value,
    status: document.getElementById('r-status').value,
    date: document.getElementById('r-date').value
  };

  if (editId !== '') {
    const idx = state.requests.findIndex(r => r._idx == editId);
    if (idx !== -1) {
      req._idx = state.requests[idx]._idx;
      state.requests[idx] = req;
      logActivity(`Request <span>${req.id}</span> updated to ${req.status}`);
      showToast('Request updated!');
    }
  } else {
    if (state.requests.find(r => r.id === req.id)) {
      showToast('Request ID already exists!', 'error'); return;
    }
    req._idx = Date.now();
    state.requests.push(req);
    logActivity(`Blood request <span>${req.id}</span> for patient ${req.patient} created`);
    showToast(req.priority === 'Critical' ? '🚨 Critical request added!' : 'Request added!');
  }

  closeModal('request-modal');
  renderRequests();
  updateDashboard();
  resetRequestForm();
}

function renderRequests() {
  const tbody = document.getElementById('requests-tbody');
  if (state.requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="no-data"><i class="fa-solid fa-clipboard-list"></i> No requests yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.requests.map(r => {
    const statusClass = {
      'Pending': 'status-pending',
      'Approved': 'status-approved',
      'Fulfilled': 'status-fulfilled',
      'Rejected': 'status-rejected'
    }[r.status] || 'status-pending';

    const priorityClass = {
      'Critical': 'priority-critical',
      'High': 'priority-high',
      'Medium': 'priority-medium',
      'Low': 'priority-low'
    }[r.priority] || 'priority-medium';

    return `
    <tr>
      <td>${r.id}</td>
      <td>${r.patient}</td>
      <td><span class="bg-badge">${r.bg}</span></td>
      <td>${r.qty} units</td>
      <td>${r.bankId}</td>
      <td><span class="priority-badge ${priorityClass}">${r.priority}</span></td>
      <td><span class="status-badge ${statusClass}">${r.status}</span></td>
      <td>${r.date}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-icon-edit" onclick="editRequest('${r._idx}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-del" onclick="confirmDelete('request','${r._idx}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `}).join('');
}

function editRequest(idx) {
  const r = state.requests.find(x => x._idx == idx);
  if (!r) return;
  document.getElementById('request-modal-title').textContent = 'Edit Request';
  document.getElementById('request-edit-id').value = idx;
  document.getElementById('r-id').value = r.id;
  document.getElementById('r-patient').value = r.patient;
  document.getElementById('r-bg').value = r.bg;
  document.getElementById('r-qty').value = r.qty;
  document.getElementById('r-bank').value = r.bankId;
  document.getElementById('r-priority').value = r.priority;
  document.getElementById('r-status').value = r.status;
  document.getElementById('r-date').value = r.date;
  openModal('request-modal');
}

function resetRequestForm() {
  document.getElementById('request-modal-title').textContent = 'New Blood Request';
  document.getElementById('request-edit-id').value = '';
  ['r-id','r-patient','r-qty','r-bank','r-date'].forEach(id => document.getElementById(id).value = '');
  ['r-bg','r-priority','r-status'].forEach(id => document.getElementById(id).value = '');
}

// ===========================
//        PATIENTS
// ===========================
function savePatient(e) {
  e.preventDefault();
  const editId = document.getElementById('patient-edit-id').value;
  const patient = {
    id: document.getElementById('p-id').value.trim(),
    name: document.getElementById('p-name').value.trim(),
    age: document.getElementById('p-age').value,
    gender: document.getElementById('p-gender').value,
    bg: document.getElementById('p-bg').value,
    disease: document.getElementById('p-disease').value.trim()
  };

  if (editId !== '') {
    const idx = state.patients.findIndex(p => p._idx == editId);
    if (idx !== -1) {
      patient._idx = state.patients[idx]._idx;
      state.patients[idx] = patient;
      logActivity(`Patient <span>${patient.name}</span> updated`);
      showToast('Patient updated!');
    }
  } else {
    if (state.patients.find(p => p.id === patient.id)) {
      showToast('Patient ID already exists!', 'error'); return;
    }
    patient._idx = Date.now();
    state.patients.push(patient);
    logActivity(`Patient <span>${patient.name}</span> registered`);
    showToast('Patient added! 🏥');
  }

  closeModal('patient-modal');
  renderPatients();
  updateDashboard();
  resetPatientForm();
}

function renderPatients() {
  const tbody = document.getElementById('patients-tbody');
  if (state.patients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="fa-solid fa-user-injured"></i> No patients registered yet.</td></tr>';
    return;
  }
  tbody.innerHTML = state.patients.map(p => `
    <tr>
      <td>${p.id}</td>
      <td><strong style="color:var(--text)">${p.name}</strong></td>
      <td>${p.age}</td>
      <td>${p.gender}</td>
      <td><span class="bg-badge">${p.bg}</span></td>
      <td>${p.disease}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-icon-edit" onclick="editPatient('${p._idx}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon btn-icon-del" onclick="confirmDelete('patient','${p._idx}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editPatient(idx) {
  const p = state.patients.find(x => x._idx == idx);
  if (!p) return;
  document.getElementById('patient-modal-title').textContent = 'Edit Patient';
  document.getElementById('patient-edit-id').value = idx;
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-age').value = p.age;
  document.getElementById('p-gender').value = p.gender;
  document.getElementById('p-bg').value = p.bg;
  document.getElementById('p-disease').value = p.disease;
  openModal('patient-modal');
}

function resetPatientForm() {
  document.getElementById('patient-modal-title').textContent = 'Add Patient';
  document.getElementById('patient-edit-id').value = '';
  ['p-id','p-name','p-age','p-disease'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('p-gender').value = '';
  document.getElementById('p-bg').value = '';
}

// ===========================
//        DELETE
// ===========================
let deleteTarget = null;

function confirmDelete(type, idx) {
  deleteTarget = { type, idx };
  openModal('delete-modal');
}

document.getElementById('confirm-delete-btn').addEventListener('click', () => {
  if (!deleteTarget) return;
  const { type, idx } = deleteTarget;
  const map = {
    donor: { arr: 'donors', render: renderDonors, label: 'Donor' },
    bank: { arr: 'banks', render: renderBanks, label: 'Bank' },
    stock: { arr: 'stock', render: renderStock, label: 'Stock' },
    donation: { arr: 'donations', render: renderDonations, label: 'Donation' },
    request: { arr: 'requests', render: renderRequests, label: 'Request' },
    patient: { arr: 'patients', render: renderPatients, label: 'Patient' }
  };
  const m = map[type];
  if (!m) return;
  const i = state[m.arr].findIndex(x => x._idx == idx);
  if (i !== -1) {
    const rec = state[m.arr][i];
    state[m.arr].splice(i, 1);
    logActivity(`${m.label} deleted`);
    showToast(`${m.label} deleted.`, 'info');
    m.render();
    updateDashboard();
  }
  deleteTarget = null;
  closeModal('delete-modal');
});

// ===========================
//        FILTER/SEARCH
// ===========================
function filterTable(tableId, query) {
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);
  const q = query.toLowerCase();
  rows.forEach(row => {
    if (row.querySelector('.no-data')) return;
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function filterByBG(tableId, selectId, colIndex) {
  const val = document.getElementById(selectId).value;
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);
  rows.forEach(row => {
    if (row.querySelector('.no-data')) return;
    const cell = row.cells[colIndex];
    if (!val || (cell && cell.textContent.trim() === val)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function filterByStatus(tableId, selectId, colIndex) {
  const val = document.getElementById(selectId).value;
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);
  rows.forEach(row => {
    if (row.querySelector('.no-data')) return;
    const cell = row.cells[colIndex];
    if (!val || (cell && cell.textContent.trim().toLowerCase().includes(val.toLowerCase()))) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Global search
document.getElementById('global-search').addEventListener('input', function() {
  const q = this.value.toLowerCase();
  if (!q) return;
  // Search donors
  const donors = state.donors.filter(d => JSON.stringify(d).toLowerCase().includes(q));
  const patients = state.patients.filter(p => JSON.stringify(p).toLowerCase().includes(q));
  if (donors.length && !patients.length) { switchSection('donors'); filterTable('donors-table', q); }
  else if (patients.length && !donors.length) { switchSection('patients'); filterTable('patients-table', q); }
});

// ===========================
//   SEED DEMO DATA
// ===========================
function seedDemoData() {
  state.donors = [
    { _idx: 1, id: 'D001', name: 'Priya Sharma', age: 25, gender: 'Female', bg: 'A+', lastDonation: '2024-10-12', eligibility: '2025-01-12' },
    { _idx: 2, id: 'D002', name: 'Rahul Mehta', age: 30, gender: 'Male', bg: 'O+', lastDonation: '2024-08-01', eligibility: '2024-11-01' },
    { _idx: 3, id: 'D003', name: 'Ananya Roy', age: 22, gender: 'Female', bg: 'B-', lastDonation: 'N/A', eligibility: '2025-04-01' }
  ];
  state.banks = [
    { _idx: 4, id: 'BB001', name: 'City Central Blood Bank', location: 'MG Road, Bengaluru', contact: '+91 80 2345 6789' },
    { _idx: 5, id: 'BB002', name: 'Apollo Blood Centre', location: 'Jubilee Hills, Hyderabad', contact: '+91 40 6789 0123' }
  ];
  state.stock = [
    { _idx: 6, id: 'ST001', bankId: 'BB001', bg: 'A+', qty: 45, expiry: '2025-06-01', last: '2025-04-01' },
    { _idx: 7, id: 'ST002', bankId: 'BB001', bg: 'O+', qty: 80, expiry: '2025-05-15', last: '2025-04-05' },
    { _idx: 8, id: 'ST003', bankId: 'BB002', bg: 'B-', qty: 12, expiry: '2025-04-26', last: '2025-04-10' }
  ];
  state.donations = [
    { _idx: 9, id: 'DON001', donorId: 'D001', bankId: 'BB001', qty: 1, date: '2024-10-12' },
    { _idx: 10, id: 'DON002', donorId: 'D002', bankId: 'BB002', qty: 1, date: '2024-08-01' }
  ];
  state.requests = [
    { _idx: 11, id: 'REQ001', patient: 'P001', bg: 'A+', qty: 2, bankId: 'BB001', priority: 'Critical', status: 'Pending', date: '2025-04-20' },
    { _idx: 12, id: 'REQ002', patient: 'P002', bg: 'O+', qty: 1, bankId: 'BB002', priority: 'High', status: 'Approved', date: '2025-04-18' }
  ];
  state.patients = [
    { _idx: 13, id: 'P001', name: 'Kavya Nair', age: 40, gender: 'Female', bg: 'A+', disease: 'Acute Anemia' },
    { _idx: 14, id: 'P002', name: 'Vikram Singh', age: 55, gender: 'Male', bg: 'O+', disease: 'Thalassemia' }
  ];
  state.activity = [
    { message: 'Blood request <span>REQ001</span> marked Critical', time: new Date() },
    { message: 'New donor <span>Ananya Roy</span> registered', time: new Date(Date.now() - 300000) },
    { message: 'Stock <span>ST003</span> nearing expiry', time: new Date(Date.now() - 600000) }
  ];
  renderDonors(); renderBanks(); renderStock(); renderDonations(); renderRequests(); renderPatients();
  updateDashboard();
}

// ===========================
//   INIT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  seedDemoData();
  // Add ripple effect to buttons
  document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.style.cssText = `position:absolute;width:5px;height:5px;background:rgba(255,255,255,0.4);border-radius:50%;transform:scale(0);animation:ripple 0.5s ease;left:${e.offsetX}px;top:${e.offsetY}px;pointer-events:none`;
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
});

// Ripple CSS inject
const s = document.createElement('style');
s.textContent = '@keyframes ripple{to{transform:scale(40);opacity:0}}';
document.head.appendChild(s);
