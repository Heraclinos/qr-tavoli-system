// Configuration
const API_CONFIG = {
  BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://qr-tavoli-backend.onrender.com/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// Mock data for fallback
const MOCK_DATA = {
  tables: [
    {"id": 1, "name": "Tavolo 1", "points": 85, "qrCode": "TABLE_1"},
    {"id": 2, "name": "Tavolo VIP", "points": 92, "qrCode": "TABLE_2"},
    {"id": 3, "name": "Tavolo 3", "points": 34, "qrCode": "TABLE_3"},
    {"id": 4, "name": "Tavolo Famiglia", "points": 67, "qrCode": "TABLE_4"},
    {"id": 5, "name": "Tavolo 5", "points": 23, "qrCode": "TABLE_5"},
    {"id": 6, "name": "Tavolo Terrazza", "points": 78, "qrCode": "TABLE_6"},
    {"id": 7, "name": "Tavolo 7", "points": 45, "qrCode": "TABLE_7"},
    {"id": 8, "name": "Tavolo Romantico", "points": 56, "qrCode": "TABLE_8"},
    {"id": 9, "name": "Tavolo 9", "points": 89, "qrCode": "TABLE_9"},
    {"id": 10, "name": "Tavolo Giardino", "points": 41, "qrCode": "TABLE_10"}
  ],
  users: [
    {"username": "cassiere1", "password": "cassiere123", "role": "cashier", "name": "Mario Rossi"},
    {"username": "admin", "password": "admin123", "role": "admin", "name": "Admin Sistema"}
  ],
  transactions: []
};

// Application State
const AppState = {
  currentUser: null,
  selectedTable: null,
  myTable: null,
  transactions: [],
  isOnline: navigator.onLine,
  useMockData: false
};

// Utility Functions
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  }).format(date);
}

// API Functions
async function apiCall(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AppState.currentUser?.token ? `Bearer ${AppState.currentUser.token}` : '',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('API Error:', error);
    
    // Fallback to mock data if API fails
    if (!AppState.useMockData && !AppState.isOnline) {
      AppState.useMockData = true;
      showToast('Modalità offline attivata', 'warning');
      updateOfflineIndicator();
    }
    
    throw error;
  }
}

async function retryApiCall(endpoint, options = {}, attempts = API_CONFIG.RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await apiCall(endpoint, options);
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

// Mock API Functions
function mockLogin(username, password) {
  const user = MOCK_DATA.users.find(u => u.username === username && u.password === password);
  if (user) {
    return {
      success: true,
      user: { ...user, token: 'mock-token-' + generateId() }
    };
  }
  return { success: false, message: 'Credenziali non valide' };
}

function mockGetTable(qrCode) {
  const table = MOCK_DATA.tables.find(t => t.qrCode === qrCode);
  return table || null;
}

function mockGetLeaderboard() {
  return [...MOCK_DATA.tables].sort((a, b) => b.points - a.points);
}

function mockAddPoints(tableId, points) {
  const table = MOCK_DATA.tables.find(t => t.id === tableId);
  if (table) {
    table.points += points;
    const transaction = {
      id: generateId(),
      tableId,
      tableName: table.name,
      points,
      timestamp: new Date(),
      cashier: AppState.currentUser?.name || 'Mock Cashier'
    };
    MOCK_DATA.transactions.unshift(transaction);
    AppState.transactions.unshift(transaction);
    return { success: true, table, transaction };
  }
  return { success: false, message: 'Tavolo non trovato' };
}

function mockUpdateTableName(tableId, newName) {
  const table = MOCK_DATA.tables.find(t => t.id === tableId);
  if (table) {
    table.name = newName;
    return { success: true, table };
  }
  return { success: false, message: 'Tavolo non trovato' };
}

// Screen Management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

// Loading States
function setButtonLoading(buttonId, loading = true) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.classList.toggle('loading', loading);
    button.disabled = loading;
  }
}

// Toast Notifications
function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
  };

  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-message">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <p class="toast-description">${message}</p>
      </div>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  `;

  container.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 5000);
}

// Modal Functions
function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const messageEl = document.getElementById('confirm-modal-message');
  const actionBtn = document.getElementById('confirm-modal-action');

  titleEl.textContent = title;
  messageEl.textContent = message;
  
  actionBtn.onclick = () => {
    closeConfirmModal();
    onConfirm();
  };

  modal.classList.remove('hidden');
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.add('hidden');
}

// Offline Management
function updateOfflineIndicator() {
  const indicator = document.getElementById('offline-indicator');
  indicator.classList.toggle('hidden', AppState.isOnline && !AppState.useMockData);
}

// Authentication
async function login(username, password) {
  setButtonLoading('login-btn', true);
  
  try {
    let result;
    
    if (AppState.useMockData || !AppState.isOnline) {
      result = mockLogin(username, password);
    } else {
      try {
        const response = await retryApiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
        result = { success: true, user: response.user };
      } catch (error) {
        // Fallback to mock
        AppState.useMockData = true;
        result = mockLogin(username, password);
      }
    }

    if (result.success) {
      AppState.currentUser = result.user;
      document.getElementById('cashier-name').textContent = `Benvenuto, ${result.user.name}`;
      showScreen('cashier-dashboard');
      showToast('Accesso effettuato con successo!', 'success');
      loadRecentTransactions();
    } else {
      showToast(result.message || 'Errore durante l\'accesso', 'error');
    }
  } catch (error) {
    showToast('Errore di connessione. Riprova più tardi.', 'error');
  } finally {
    setButtonLoading('login-btn', false);
  }
}

function logout() {
  showConfirmModal(
    'Conferma Logout',
    'Sei sicuro di voler uscire?',
    () => {
      AppState.currentUser = null;
      AppState.selectedTable = null;
      AppState.myTable = null;
      showScreen('role-selection');
      showToast('Logout effettuato', 'info');
    }
  );
}

// Table Management
async function findTable(qrCode) {
  setButtonLoading('scan-btn', true);
  
  try {
    let table;
    
    if (AppState.useMockData || !AppState.isOnline) {
      table = mockGetTable(qrCode);
    } else {
      try {
        const response = await retryApiCall(`/tables/qr/${qrCode}`);
        table = response.table;
      } catch (error) {
        AppState.useMockData = true;
        table = mockGetTable(qrCode);
      }
    }

    if (table) {
      AppState.selectedTable = table;
      displayTableDetails(table);
      showToast(`Tavolo "${table.name}" trovato!`, 'success');
    } else {
      showToast('Codice QR non valido', 'error');
      hideTableDetails();
    }
  } catch (error) {
    showToast('Errore durante la ricerca del tavolo', 'error');
    hideTableDetails();
  } finally {
    setButtonLoading('scan-btn', false);
  }
}

function displayTableDetails(table) {
  document.getElementById('selected-table-name').textContent = table.name;
  document.getElementById('selected-table-points').textContent = table.points;
  document.getElementById('table-details').classList.remove('hidden');
  document.getElementById('points-assignment').classList.remove('hidden');
}

function hideTableDetails() {
  document.getElementById('table-details').classList.add('hidden');
  document.getElementById('points-assignment').classList.add('hidden');
  AppState.selectedTable = null;
}

async function addPoints(tableId, points) {
  setButtonLoading('assign-points-btn', true);
  
  try {
    let result;
    
    if (AppState.useMockData || !AppState.isOnline) {
      result = mockAddPoints(tableId, points);
    } else {
      try {
        const response = await retryApiCall('/points/add', {
          method: 'POST',
          body: JSON.stringify({ tableId, points })
        });
        result = { success: true, table: response.table, transaction: response.transaction };
      } catch (error) {
        AppState.useMockData = true;
        result = mockAddPoints(tableId, points);
      }
    }

    if (result.success) {
      AppState.selectedTable = result.table;
      displayTableDetails(result.table);
      document.getElementById('custom-points').value = '';
      document.querySelectorAll('.points-preset').forEach(btn => btn.classList.remove('active'));
      showToast(`${points} punti aggiunti a "${result.table.name}"!`, 'success');
      loadRecentTransactions();
    } else {
      showToast(result.message || 'Errore durante l\'assegnazione punti', 'error');
    }
  } catch (error) {
    showToast('Errore durante l\'assegnazione punti', 'error');
  } finally {
    setButtonLoading('assign-points-btn', false);
  }
}

async function loadRecentTransactions() {
  try {
    let transactions;
    
    if (AppState.useMockData || !AppState.isOnline) {
      transactions = MOCK_DATA.transactions.slice(0, 5);
    } else {
      try {
        const response = await retryApiCall('/points/transactions?limit=5');
        transactions = response.transactions;
      } catch (error) {
        transactions = MOCK_DATA.transactions.slice(0, 5);
      }
    }

    displayTransactions(transactions);
  } catch (error) {
    console.error('Error loading transactions:', error);
  }
}

function displayTransactions(transactions) {
  const container = document.getElementById('recent-transactions');
  
  if (transactions.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nessuna transazione recente</p></div>';
    return;
  }

  container.innerHTML = transactions.map(t => `
    <div class="transaction-item">
      <div class="transaction-details">
        <div class="transaction-table">${t.tableName}</div>
        <div class="transaction-time">${formatDate(new Date(t.timestamp))}</div>
      </div>
      <div class="transaction-points">+${t.points}</div>
    </div>
  `).join('');
}

// Customer Functions
async function identifyMyTable(qrCode) {
  try {
    let table;
    
    if (AppState.useMockData || !AppState.isOnline) {
      table = mockGetTable(qrCode);
    } else {
      try {
        const response = await retryApiCall(`/tables/qr/${qrCode}`);
        table = response.table;
      } catch (error) {
        AppState.useMockData = true;
        table = mockGetTable(qrCode);
      }
    }

    if (table) {
      AppState.myTable = table;
      displayMyTableInfo(table);
      showToast(`Il tuo tavolo è "${table.name}"!`, 'success');
      refreshLeaderboard();
    } else {
      showToast('Codice QR non valido', 'error');
    }
  } catch (error) {
    showToast('Errore durante l\'identificazione del tavolo', 'error');
  }
}

function displayMyTableInfo(table) {
  const container = document.getElementById('my-table-info');
  const leaderboard = AppState.useMockData ? mockGetLeaderboard() : [];
  const position = leaderboard.findIndex(t => t.id === table.id) + 1;
  
  document.getElementById('my-table-name').textContent = table.name;
  document.getElementById('my-table-position').textContent = `#${position}`;
  document.getElementById('my-table-points').textContent = table.points;
  document.getElementById('new-table-name').value = table.name;
  
  container.classList.remove('hidden');
}

async function updateTableName(tableId, newName) {
  if (!newName.trim()) {
    showToast('Il nome del tavolo non può essere vuoto', 'error');
    return;
  }

  try {
    let result;
    
    if (AppState.useMockData || !AppState.isOnline) {
      result = mockUpdateTableName(tableId, newName.trim());
    } else {
      try {
        const response = await retryApiCall(`/tables/${tableId}/name`, {
          method: 'PUT',
          body: JSON.stringify({ name: newName.trim() })
        });
        result = { success: true, table: response.table };
      } catch (error) {
        AppState.useMockData = true;
        result = mockUpdateTableName(tableId, newName.trim());
      }
    }

    if (result.success) {
      AppState.myTable = result.table;
      displayMyTableInfo(result.table);
      showToast('Nome tavolo aggiornato!', 'success');
      refreshLeaderboard();
    } else {
      showToast(result.message || 'Errore durante l\'aggiornamento', 'error');
    }
  } catch (error) {
    showToast('Errore durante l\'aggiornamento del nome', 'error');
  }
}

async function loadLeaderboard() {
  try {
    let tables;
    
    if (AppState.useMockData || !AppState.isOnline) {
      tables = mockGetLeaderboard();
    } else {
      try {
        const response = await retryApiCall('/tables/leaderboard');
        tables = response.tables;
      } catch (error) {
        AppState.useMockData = true;
        tables = mockGetLeaderboard();
      }
    }

    displayLeaderboard(tables);
  } catch (error) {
    showToast('Errore durante il caricamento della classifica', 'error');
    displayLeaderboard([]);
  }
}

function displayLeaderboard(tables) {
  const container = document.getElementById('leaderboard');
  const medals = ['🥇', '🥈', '🥉'];
  
  if (tables.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Nessun tavolo trovato</p></div>';
    return;
  }

  container.innerHTML = tables.map((table, index) => {
    const position = index + 1;
    const isMyTable = AppState.myTable && AppState.myTable.id === table.id;
    const medal = position <= 3 ? medals[position - 1] : '';
    
    return `
      <div class="leaderboard-item ${isMyTable ? 'highlighted' : ''}">
        <div class="position ${medal ? 'medal' : ''}">${medal || position}</div>
        <div class="table-info-leaderboard">
          <div class="table-name-leaderboard">${table.name}</div>
          <div class="table-points-leaderboard">Punti: ${table.points}</div>
        </div>
        <div class="points-badge">${table.points}</div>
      </div>
    `;
  }).join('');
}

async function refreshLeaderboard() {
  const container = document.getElementById('leaderboard');
  container.innerHTML = `
    <div class="loading-skeleton">
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
    </div>
  `;
  await loadLeaderboard();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize app
  setTimeout(() => {
    showScreen('role-selection');
  }, 2000);

  // Network status
  window.addEventListener('online', () => {
    AppState.isOnline = true;
    updateOfflineIndicator();
    showToast('Connessione ripristinata', 'success');
  });

  window.addEventListener('offline', () => {
    AppState.isOnline = false;
    AppState.useMockData = true;
    updateOfflineIndicator();
    showToast('Connessione persa - Modalità offline', 'warning');
  });

  // Role selection
  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', function() {
      const role = this.dataset.role;
      if (role === 'cashier') {
        showScreen('cashier-login');
      } else if (role === 'customer') {
        showScreen('customer-dashboard');
        loadLeaderboard();
      }
    });
  });

  // Login form
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    login(formData.get('username'), formData.get('password'));
  });

  // QR scan form (cashier)
  document.getElementById('qr-scan-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const qrCode = formData.get('qrCode').trim();
    if (qrCode) {
      findTable(qrCode);
    }
  });

  // Customer QR form
  document.getElementById('customer-qr-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const qrCode = formData.get('qrCode').trim();
    if (qrCode) {
      identifyMyTable(qrCode);
    }
  });

  // Points presets
  document.querySelectorAll('.points-preset').forEach(button => {
    button.addEventListener('click', function() {
      const points = parseInt(this.dataset.points);
      document.getElementById('custom-points').value = points;
      
      document.querySelectorAll('.points-preset').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Points form
  document.getElementById('points-form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!AppState.selectedTable) {
      showToast('Seleziona prima un tavolo', 'error');
      return;
    }

    const formData = new FormData(this);
    const points = parseInt(formData.get('points'));
    
    if (!points || points <= 0) {
      showToast('Inserisci un numero di punti valido', 'error');
      return;
    }

    if (points > 1000) {
      showToast('Massimo 1000 punti per volta', 'error');
      return;
    }

    showConfirmModal(
      'Conferma Assegnazione',
      `Assegnare ${points} punti a "${AppState.selectedTable.name}"?`,
      () => addPoints(AppState.selectedTable.id, points)
    );
  });

  // Name change form
  document.getElementById('name-change-form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!AppState.myTable) {
      showToast('Identifica prima il tuo tavolo', 'error');
      return;
    }

    const formData = new FormData(this);
    const newName = formData.get('newName').trim();
    
    if (newName && newName !== AppState.myTable.name) {
      updateTableName(AppState.myTable.id, newName);
    }
  });

  // Modal backdrop click
  document.querySelector('.modal-backdrop').addEventListener('click', closeConfirmModal);

  // Initial offline check
  updateOfflineIndicator();
});

// Global functions for HTML onclick handlers
window.showScreen = showScreen;
window.logout = logout;
window.refreshLeaderboard = refreshLeaderboard;
window.closeConfirmModal = closeConfirmModal;
