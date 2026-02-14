/**
 * Initialize authentication UI on page load
 * - Shows login/register links by default
 * - Shows user dropdown if logged in
 * - Handles logout functionality
 * - Manages page navigation
 */
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  const authLinks = document.getElementById('authLinks');
  const userDropdown = document.getElementById('userDropdown');
  const usernameDisplay = document.getElementById('username');
  const logoutBtn = document.getElementById('logoutBtn');
  const registerForm = document.getElementById('registerForm');
  const verifyEmailBtn = document.getElementById('verifyEmailBtn');
  const verifyEmailMessage = document.getElementById('verifyEmailMessage');
  const loginForm = document.getElementById('loginForm');
  const routeToSection = {
    '/': 'home',
    '/home': 'home',
    '/login': 'login',
    '/register': 'register',
    '/verify-email': 'verify-email',
    '/profile': 'profile',
    '/my-requests': 'my-requests',
    '/employees': 'employees',
    '/departments': 'departments',
    '/requests': 'requests'
  };
  const protectedRoutes = new Set(['/profile', '/my-requests', '/employees', '/departments', '/requests']);
  const adminRoutes = new Set(['/my-requests', '/employees', '/departments', '/requests']);

  function normalizeHash(rawHash = window.location.hash) {
    const hash = (rawHash || '').trim();
    const withoutPrefix = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!withoutPrefix || withoutPrefix === '/') return '/';
    return withoutPrefix.startsWith('/') ? withoutPrefix : `/${withoutPrefix}`;
  }

  function navigateTo(hash) {
    const route = normalizeHash(hash);
    window.location.hash = `#${route}`;
  }

  function setAuthState(isAuth, user = null) {
    document.body.classList.remove('not-authenticated', 'authenticated', 'is-admin');
    if (!isAuth || !user) {
      currentUser = null;
      document.body.classList.add('not-authenticated');
      usernameDisplay.textContent = 'User';
      localStorage.removeItem('auth_token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
      localStorage.removeItem('authToken');
      return;
    }

    currentUser = {
      ...user,
      email: (user.email || '').toLowerCase(),
      role: user.role || 'User'
    };
    const displayName = currentUser.firstName || currentUser.name || currentUser.email || 'User';
    const fullName = currentUser.name || [currentUser.firstName || '', currentUser.lastName || ''].filter(Boolean).join(' ');
    localStorage.setItem('auth_token', currentUser.email);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', displayName);
    localStorage.setItem('firstName', currentUser.firstName || displayName);
    localStorage.setItem('lastName', currentUser.lastName || '');
    localStorage.setItem('email', currentUser.email);
    localStorage.setItem('role', currentUser.role);
    localStorage.setItem('authToken', currentUser.email);
    if (fullName) localStorage.setItem('fullName', fullName);

    document.body.classList.add('authenticated');
    if (currentUser.role === 'Admin') document.body.classList.add('is-admin');
    usernameDisplay.textContent = displayName;
  }

  function initializeAuthState() {
    const tokenEmail = (localStorage.getItem('auth_token') || '').toLowerCase();
    if (!tokenEmail) {
      setAuthState(false);
      return;
    }
    const account = getAccounts().find((a) => (a.email || '').toLowerCase() === tokenEmail && a.verified === true);
    if (!account) {
      setAuthState(false);
      return;
    }
    setAuthState(true, account);
  }

  function showPage(pageId) {
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => page.classList.add('d-none'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.remove('d-none');
    } else {
      const home = document.getElementById('home');
      if (home) home.classList.remove('d-none');
    }
  }

  function handleRouting() {
    const route = normalizeHash();
    const isLoggedIn = !!currentUser;
    const role = currentUser?.role || 'User';

    if (protectedRoutes.has(route) && !isLoggedIn) {
      navigateTo('#/login');
      return;
    }
    if (adminRoutes.has(route) && role !== 'Admin') {
      navigateTo('#/profile');
      return;
    }

    const pageId = routeToSection[route] || 'home';
    showPage(pageId);
    if (pageId === 'profile') {
      fillProfileBox();
      if (profileView) profileView.classList.remove('d-none');
      if (profileEdit) profileEdit.classList.add('d-none');
    }
    if (pageId === 'my-requests') renderMyRequests();
    if (pageId === 'employees') { renderEmployees(); renderDepartments(); }
    if (pageId === 'departments') renderDepartments();
    if (pageId === 'requests') renderAccounts();
    if (pageId === 'login') {
      const storedEmail = localStorage.getItem('unverified_email') || localStorage.getItem('email');
      const loginEmailInput = document.getElementById('loginEmail');
      if (storedEmail && loginEmailInput && !loginEmailInput.value) {
        loginEmailInput.value = storedEmail;
      }
    }
    if (pageId === 'verify-email') {
      const pendingEmail = localStorage.getItem('unverified_email');
      if (verifyEmailMessage) {
        verifyEmailMessage.innerHTML = pendingEmail
          ? `<strong>Verification sent to ${escapeHtml(pendingEmail)}</strong>`
          : '<strong>No pending email verification.</strong>';
      }
      if (verifyEmailBtn) verifyEmailBtn.disabled = !pendingEmail;
    }
  }

  // Register form submission
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (password.length < 6) {
      window.alert('Password must be at least 6 characters.');
      return;
    }
    const accounts = getAccounts();
    const exists = accounts.some((a) => (a.email || '').toLowerCase() === email);
    if (exists) {
      window.alert('Email already exists.');
      return;
    }
    accounts.push({
      id: nextId(accounts),
      firstName,
      lastName,
      name: [firstName, lastName].filter(Boolean).join(' '),
      email,
      password,
      role: 'User',
      verified: false
    });
    saveAccounts(accounts);
    localStorage.setItem('unverified_email', email);
    registerForm.reset();
    navigateTo('#/verify-email');
  });

  // Simulate email verification
  verifyEmailBtn.addEventListener('click', () => {
    const pendingEmail = (localStorage.getItem('unverified_email') || '').toLowerCase();
    if (!pendingEmail) {
      window.alert('No pending email to verify.');
      return;
    }
    const accounts = getAccounts();
    const accountIndex = accounts.findIndex((a) => (a.email || '').toLowerCase() === pendingEmail);
    if (accountIndex < 0) {
      window.alert('Account not found for verification.');
      return;
    }
    accounts[accountIndex].verified = true;
    saveAccounts(accounts);
    localStorage.removeItem('unverified_email');
    navigateTo('#/login');
  });

  // Login form submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const accounts = getAccounts();
    const account = accounts.find(
      (a) => (a.email || '').toLowerCase() === email && a.password === password && a.verified === true
    );
    if (!account) {
      window.alert('Invalid email/password or account not verified.');
      return;
    }
    localStorage.setItem('auth_token', email);
    setAuthState(true, account);
    loginForm.reset();
    navigateTo('#/profile');
  });

  // Edit Profile: toggle view / edit, save, cancel
  const profileView = document.getElementById('profileView');
  const profileEdit = document.getElementById('profileEdit');
  const profileEditForm = document.getElementById('profileEditForm');
  const profileEditCancelBtn = document.getElementById('profileEditCancelBtn');

  document.getElementById('editProfileBtn').addEventListener('click', () => {
    profileView.classList.add('d-none');
    profileEdit.classList.remove('d-none');
    document.getElementById('profileEditFirstName').value = localStorage.getItem('firstName') || '';
    document.getElementById('profileEditLastName').value = localStorage.getItem('lastName') || '';
    document.getElementById('profileEditEmail').value = localStorage.getItem('email') || '';
  });

  profileEditCancelBtn.addEventListener('click', () => {
    profileEdit.classList.add('d-none');
    profileView.classList.remove('d-none');
  });

  profileEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = document.getElementById('profileEditFirstName').value;
    const lastName = document.getElementById('profileEditLastName').value;
    const email = document.getElementById('profileEditEmail').value;
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
    localStorage.setItem('email', email);
    localStorage.setItem('username', firstName || localStorage.getItem('username'));
    profileEdit.classList.add('d-none');
    profileView.classList.remove('d-none');
    fillProfileBox();
    if (currentUser) {
      currentUser.firstName = firstName;
      currentUser.lastName = lastName;
      currentUser.email = email.toLowerCase();
      currentUser.name = [firstName, lastName].filter(Boolean).join(' ');
      setAuthState(true, currentUser);
    }
  });

  // Logout functionality
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthState(false);
    navigateTo('#/');
  });

  // Listen to hash changes
  window.addEventListener('hashchange', handleRouting);

  // --- CRUD: localStorage helpers ---
  function getStorage(key, def = []) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  }
  function setStorage(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }
  function nextId(arr) {
    const ids = arr.map(x => x.id).filter(Boolean);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  // --- My Requests CRUD ---
  function getMyRequests() {
    const user = localStorage.getItem('email') || localStorage.getItem('username') || '';
    return getStorage('requests', []).filter(r => r.userId === user);
  }
  function renderMyRequests() {
    const list = document.getElementById('myRequestsList');
    const emptyBlock = document.getElementById('myRequestsEmpty');
    const addBtn = document.getElementById('addRequestBtn');
    const requests = getMyRequests();

    if (requests.length === 0) {
      list.innerHTML = '';
      list.classList.add('d-none');
      emptyBlock.classList.remove('d-none');
      if (addBtn) addBtn.classList.add('d-none');
    } else {
      emptyBlock.classList.add('d-none');
      list.classList.remove('d-none');
      if (addBtn) addBtn.classList.remove('d-none');
      list.innerHTML = requests.map(r => {
        const type = r.type || 'Equipment';
        const items = r.items || [];
        const summary = items.map((it, i) => `${it.name || 'Item ' + (i + 1)}: ${it.quantity}`).join(', ') || '—';
        return `
          <div class="card mb-2">
            <div class="card-body d-flex justify-content-between align-items-start">
              <div>
                <h6 class="mb-1">${escapeHtml(type)}</h6>
                <p class="text-muted small mb-0">${escapeHtml(summary)}</p>
              </div>
              <div>
                <button type="button" class="btn btn-sm btn-outline-primary me-1" data-request-edit="${r.id}">Edit</button>
                <button type="button" class="btn btn-sm btn-outline-danger" data-request-delete="${r.id}">Delete</button>
              </div>
            </div>
          </div>`;
      }).join('');
      list.querySelectorAll('[data-request-edit]').forEach(btn => btn.addEventListener('click', () => openRequestForm(btn.dataset.requestEdit)));
      list.querySelectorAll('[data-request-delete]').forEach(btn => btn.addEventListener('click', () => deleteRequest(btn.dataset.requestDelete)));
    }
  }
  function openRequestForm(id) {
    const card = document.getElementById('requestFormCard');
    document.getElementById('requestFormTitle').textContent = id ? 'Edit request' : 'New request';
    document.getElementById('requestId').value = id || '';
    const typeInput = document.getElementById('requestType');
    const qtyInputs = document.querySelectorAll('.request-qty');
    const nameInputs = document.querySelectorAll('.request-item-name');
    qtyInputs.forEach((inp) => { inp.value = 0; });
    nameInputs.forEach((inp) => { inp.value = ''; });
    if (id) {
      const requests = getStorage('requests', []);
      const r = requests.find(x => String(x.id) === String(id));
      if (r) {
        typeInput.value = r.type || 'Equipment';
        (r.items || []).forEach((it, i) => {
          if (qtyInputs[i]) qtyInputs[i].value = it.quantity ?? 0;
          if (nameInputs[i]) nameInputs[i].value = it.name || '';
        });
      }
    } else {
      typeInput.value = 'Equipment';
    }
    card.classList.remove('d-none');
  }
  function closeRequestForm() {
    document.getElementById('requestFormCard').classList.add('d-none');
  }
  function deleteRequest(id) {
    const requests = getStorage('requests', []).filter(r => String(r.id) !== String(id));
    setStorage('requests', requests);
    renderMyRequests();
  }
  document.getElementById('addRequestBtn').addEventListener('click', () => openRequestForm(''));
  document.getElementById('createRequestBtn').addEventListener('click', () => openRequestForm(''));
  document.getElementById('requestFormCancelBtn').addEventListener('click', closeRequestForm);
  document.querySelectorAll('[data-request-qty-plus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = btn.dataset.requestQtyPlus;
      const inp = document.querySelector(`.request-qty[data-request-qty="${i}"]`);
      if (inp) inp.value = Math.max(0, parseInt(inp.value, 10) + 1);
    });
  });
  document.querySelectorAll('[data-request-qty-minus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = btn.dataset.requestQtyMinus;
      const inp = document.querySelector(`.request-qty[data-request-qty="${i}"]`);
      if (inp) inp.value = Math.max(0, parseInt(inp.value, 10) - 1);
    });
  });
  document.getElementById('requestForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const requests = getStorage('requests', []);
    const id = document.getElementById('requestId').value;
    const userId = localStorage.getItem('email') || localStorage.getItem('username') || '';
    const type = document.getElementById('requestType').value.trim() || 'Equipment';
    const qtyInputsArr = document.querySelectorAll('.request-qty');
    const nameInputsArr = document.querySelectorAll('.request-item-name');
    const items = Array.from(qtyInputsArr)
      .map((inp, i) => ({
        name: (nameInputsArr[i] && nameInputsArr[i].value.trim()) || '',
        quantity: parseInt(inp.value, 10) || 0
      }))
      .filter((it) => it.name !== '');
    if (id) {
      const idx = requests.findIndex(r => String(r.id) === id);
      if (idx >= 0) {
        requests[idx].type = type;
        requests[idx].items = items;
      }
    } else {
      requests.push({ id: nextId(requests), userId, type, items, createdAt: new Date().toISOString() });
    }
    setStorage('requests', requests);
    closeRequestForm();
    renderMyRequests();
  });

  // Convert stored date (mm/dd/yy or yyyy-mm-dd) to yyyy-mm-dd for <input type="date">
  function toDateInputValue(val) {
    if (!val) return '';
    const s = String(val).trim();
    const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (mdy) {
      const y = mdy[3].length === 2 ? '20' + mdy[3] : mdy[3];
      const month = mdy[1].padStart(2, '0');
      const day = mdy[2].padStart(2, '0');
      return `${y}-${month}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return '';
  }

  // --- Employees CRUD ---
  function getEmployees() {
    return getStorage('employees', []);
  }
  function renderEmployees() {
    const tbody = document.getElementById('employeesTableBody');
    const emptyAlert = document.getElementById('employeesEmptyAlert');
    const formCard = document.getElementById('employeeFormCard');
    const employees = getEmployees();

    if (employees.length === 0) {
      tbody.innerHTML = '';
      emptyAlert.classList.remove('d-none');
    } else {
      emptyAlert.classList.add('d-none');
      tbody.innerHTML = employees.map(e => `
        <tr>
          <td>${escapeHtml(e.employeeId || e.id)}</td>
          <td>${escapeHtml(e.name || e.email || '—')}</td>
          <td>${escapeHtml(e.position || '—')}</td>
          <td>${escapeHtml(e.department || '—')}</td>
          <td>
            <button type="button" class="btn btn-sm btn-outline-primary me-1" data-employee-edit="${e.id}">Edit</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-employee-delete="${e.id}">Delete</button>
          </td>
        </tr>`).join('');
      tbody.querySelectorAll('[data-employee-edit]').forEach(btn => btn.addEventListener('click', () => openEmployeeForm(btn.dataset.employeeEdit)));
      tbody.querySelectorAll('[data-employee-delete]').forEach(btn => btn.addEventListener('click', () => deleteEmployee(btn.dataset.employeeDelete)));
    }
  }
  function openEmployeeForm(id) {
    const card = document.getElementById('employeeFormCard');
    document.getElementById('employeeFormTitle').textContent = id ? 'Edit Employee' : 'Add Employee';
    document.getElementById('employeeInternalId').value = id || '';
    const deptSelect = document.getElementById('employeeDepartment');
    const departments = getDepartments();
    deptSelect.innerHTML = '<option value="">— Select department —</option>' +
      departments.map(d => `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`).join('');
    if (id) {
      const e = getEmployees().find(x => String(x.id) === String(id));
      if (e) {
        document.getElementById('employeeIdInput').value = e.employeeId || '';
        document.getElementById('employeeEmail').value = e.email || '';
        document.getElementById('employeePosition').value = e.position || '';
        deptSelect.value = e.department || '';
        document.getElementById('employeeHireDate').value = toDateInputValue(e.hireDate) || '';
      }
    } else {
      document.getElementById('employeeForm').reset();
      document.getElementById('employeeInternalId').value = '';
      deptSelect.innerHTML = '<option value="">— Select department —</option>' +
        departments.map(d => `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`).join('');
    }
    card.classList.remove('d-none');
  }
  function deleteEmployee(id) {
    setStorage('employees', getEmployees().filter(e => String(e.id) !== String(id)));
    renderEmployees();
  }
  document.getElementById('addEmployeeBtn').addEventListener('click', () => openEmployeeForm(''));
  document.getElementById('employeeFormCancelBtn').addEventListener('click', () => document.getElementById('employeeFormCard').classList.add('d-none'));
  document.getElementById('employeeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const employees = getEmployees();
    const internalId = document.getElementById('employeeInternalId').value;
    const employeeId = document.getElementById('employeeIdInput').value.trim();
    const email = document.getElementById('employeeEmail').value.trim();
    const position = document.getElementById('employeePosition').value.trim();
    const department = document.getElementById('employeeDepartment').value;
    const hireDate = document.getElementById('employeeHireDate').value.trim();
    if (internalId) {
      const i = employees.findIndex(r => String(r.id) === internalId);
      if (i >= 0) {
        employees[i].employeeId = employeeId;
        employees[i].email = email;
        employees[i].name = employees[i].name || email.split('@')[0];
        employees[i].position = position;
        employees[i].department = department;
        employees[i].hireDate = hireDate;
      }
    } else {
      employees.push({
        id: nextId(employees),
        employeeId,
        email,
        name: email.split('@')[0],
        position,
        department,
        hireDate
      });
    }
    setStorage('employees', employees);
    document.getElementById('employeeFormCard').classList.add('d-none');
    renderEmployees();
  });

  // --- Departments CRUD ---
  function getDepartments() {
    return getStorage('departments', []);
  }
  function renderDepartments() {
    const tbody = document.getElementById('departmentsTableBody');
    const emptyAlert = document.getElementById('departmentsEmptyAlert');
    const departments = getDepartments();

    if (departments.length === 0) {
      tbody.innerHTML = '';
      emptyAlert.classList.remove('d-none');
    } else {
      emptyAlert.classList.add('d-none');
      tbody.innerHTML = departments.map(d => `
        <tr>
          <td>${escapeHtml(d.name || '—')}</td>
          <td>${escapeHtml(d.description || '—')}</td>
          <td>
            <button type="button" class="btn btn-sm btn-outline-primary me-1" data-department-edit="${d.id}">Edit</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-department-delete="${d.id}">Delete</button>
          </td>
        </tr>`).join('');
      tbody.querySelectorAll('[data-department-edit]').forEach(btn => btn.addEventListener('click', () => openDepartmentForm(btn.dataset.departmentEdit)));
      tbody.querySelectorAll('[data-department-delete]').forEach(btn => btn.addEventListener('click', () => deleteDepartment(btn.dataset.departmentDelete)));
    }
  }
  function openDepartmentForm(id) {
    const card = document.getElementById('departmentFormCard');
    document.getElementById('departmentFormTitle').textContent = id ? 'Edit Department' : 'Add Department';
    document.getElementById('departmentId').value = id || '';
    if (id) {
      const d = getDepartments().find(x => String(x.id) === String(id));
      if (d) {
        document.getElementById('departmentName').value = d.name || '';
        document.getElementById('departmentDescription').value = d.description || '';
      }
    } else {
      document.getElementById('departmentForm').reset();
      document.getElementById('departmentId').value = '';
    }
    card.classList.remove('d-none');
  }
  function deleteDepartment(id) {
    setStorage('departments', getDepartments().filter(d => String(d.id) !== String(id)));
    renderDepartments();
  }
  document.getElementById('addDepartmentBtn').addEventListener('click', () => openDepartmentForm(''));
  document.getElementById('departmentFormCancelBtn').addEventListener('click', () => document.getElementById('departmentFormCard').classList.add('d-none'));
  document.getElementById('departmentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const departments = getDepartments();
    const id = document.getElementById('departmentId').value;
    const name = document.getElementById('departmentName').value.trim();
    const description = document.getElementById('departmentDescription').value.trim();
    if (id) {
      const i = departments.findIndex(d => String(d.id) === id);
      if (i >= 0) {
        departments[i].name = name;
        departments[i].description = description;
      }
    } else {
      departments.push({ id: nextId(departments), name, description });
    }
    setStorage('departments', departments);
    document.getElementById('departmentFormCard').classList.add('d-none');
    renderDepartments();
  });

  // --- Accounts (Admin) ---
  function getAccounts() {
    if (!window.db) window.db = {};
    if (!Array.isArray(window.db.accounts)) {
      window.db.accounts = getStorage('accounts', []);
    }
    return window.db.accounts;
  }
  function saveAccounts(accounts) {
    if (!window.db) window.db = {};
    window.db.accounts = accounts;
    setStorage('accounts', accounts);
  }
  function renderAccounts() {
    const tbody = document.getElementById('accountsTableBody');
    const emptyAlert = document.getElementById('accountsEmptyAlert');
    const accounts = getAccounts();

    if (accounts.length === 0) {
      tbody.innerHTML = '';
      emptyAlert.classList.remove('d-none');
    } else {
      emptyAlert.classList.add('d-none');
      tbody.innerHTML = accounts.map(a => `
        <tr>
          <td>${escapeHtml(a.name || '—')}</td>
          <td>${escapeHtml(a.email || '—')}</td>
          <td>${escapeHtml(a.role || 'User')}</td>
          <td><input type="checkbox" class="form-check-input" disabled ${a.verified ? 'checked' : ''} /></td>
          <td>
            <button type="button" class="btn btn-sm btn-outline-primary me-1" data-account-edit="${a.id}">Edit</button>
            <button type="button" class="btn btn-sm btn-outline-secondary me-1" data-account-reset="${a.id}">Reset Password</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-account-delete="${a.id}">Delete</button>
          </td>
        </tr>`).join('');
      tbody.querySelectorAll('[data-account-edit]').forEach(btn => btn.addEventListener('click', () => openAccountForm(btn.dataset.accountEdit)));
      tbody.querySelectorAll('[data-account-reset]').forEach(btn => btn.addEventListener('click', () => resetAccountPassword(btn.dataset.accountReset)));
      tbody.querySelectorAll('[data-account-delete]').forEach(btn => btn.addEventListener('click', () => deleteAccount(btn.dataset.accountDelete)));
    }
  }
  function openAccountForm(id) {
    const card = document.getElementById('accountFormCard');
    document.getElementById('accountFormTitle').textContent = id ? 'Edit Account' : 'Add Account';
    document.getElementById('accountId').value = id || '';
    if (id) {
      const a = getAccounts().find(x => String(x.id) === String(id));
      if (a) {
        document.getElementById('accountName').value = a.name || '';
        document.getElementById('accountEmail').value = a.email || '';
        document.getElementById('accountRole').value = a.role || 'User';
        document.getElementById('accountVerified').checked = !!a.verified;
      }
    } else {
      document.getElementById('accountForm').reset();
      document.getElementById('accountId').value = '';
      document.getElementById('accountVerified').checked = false;
    }
    card.classList.remove('d-none');
  }
  function deleteAccount(id) {
    saveAccounts(getAccounts().filter(a => String(a.id) !== String(id)));
    renderAccounts();
  }
  function resetAccountPassword(id) {
    const accounts = getAccounts();
    const a = accounts.find(x => String(x.id) === String(id));
    if (!a) return;
    const newPassword = window.prompt('Enter new password for ' + (a.email || a.name));
    if (newPassword == null) return;
    a.password = newPassword;
    saveAccounts(accounts);
    renderAccounts();
  }
  document.getElementById('addAccountBtn').addEventListener('click', () => openAccountForm(''));
  document.getElementById('accountFormCancelBtn').addEventListener('click', () => document.getElementById('accountFormCard').classList.add('d-none'));
  document.getElementById('accountForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const accounts = getAccounts();
    const id = document.getElementById('accountId').value;
    const name = document.getElementById('accountName').value.trim();
    const email = document.getElementById('accountEmail').value.trim();
    const password = document.getElementById('accountPassword').value;
    const role = document.getElementById('accountRole').value;
    const verified = document.getElementById('accountVerified').checked;
    if (id) {
      const i = accounts.findIndex(a => String(a.id) === id);
      if (i >= 0) {
        accounts[i].name = name;
        accounts[i].email = email;
        accounts[i].role = role;
        accounts[i].verified = verified;
        if (password !== '') accounts[i].password = password;
      }
    } else {
      accounts.push({ id: nextId(accounts), name, email, password: password || '', role, verified });
    }
    saveAccounts(accounts);
    document.getElementById('accountFormCard').classList.add('d-none');
    renderAccounts();
  });

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // Render CRUD lists when navigating to those pages
  window.addEventListener('hashchange', () => {
    const route = normalizeHash();
    if (route === '/my-requests') renderMyRequests();
    if (route === '/employees') { renderEmployees(); renderDepartments(); }
    if (route === '/departments') renderDepartments();
    if (route === '/requests') renderAccounts();
  });

  function fillProfileBox() {
    const firstName = localStorage.getItem('firstName') || '';
    const lastName = localStorage.getItem('lastName') || '';
    const email = localStorage.getItem('email') || '—';
    const role = localStorage.getItem('role') || 'User';
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || localStorage.getItem('username') || '—';
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const roleEl = document.getElementById('profileRole');
    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = email;
    if (roleEl) roleEl.textContent = role;
  }

  // Initial UI setup
  initializeAuthState();
  if (!window.location.hash) navigateTo('#/');
  handleRouting();
  const route = normalizeHash();
  if (route === '/profile') fillProfileBox();
  if (route === '/my-requests') renderMyRequests();
  if (route === '/employees') renderEmployees();
  if (route === '/departments') renderDepartments();
  if (route === '/requests') renderAccounts();
});
