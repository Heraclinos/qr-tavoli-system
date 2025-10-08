// Configuration
const CONFIG = {
    apiBaseUrl: 'https://qr-tavoli-backend.onrender.com/api',
    sessionKey: 'qr-tavoli-session',
    sessionDuration: 24 * 60 * 60 * 1000, // 24 ore
    fallbackMode: true // Enable fallback to mock data if API fails
};

// Mock Data
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
        {"username": "admin", "password": "admin123", "role": "admin", "name": "Admin Sistema"},
        {"username": "manager", "password": "manager123", "role": "cashier", "name": "Giulia Bianchi"}
    ]
};

// Global State
let currentTable = null;
let currentSession = null;
let operationsHistory = [];

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    tableView: document.getElementById('tableView'),
    cashierView: document.getElementById('cashierView'),
    loginModal: document.getElementById('loginModal'),
    closeModal: document.getElementById('closeModal'),
    loginForm: document.getElementById('loginForm'),
    
    // Table view elements
    currentTableName: document.getElementById('currentTableName'),
    tablePosition: document.getElementById('tablePosition'),
    tablePoints: document.getElementById('tablePoints'),
    newTableName: document.getElementById('newTableName'),
    changeNameBtn: document.getElementById('changeNameBtn'),
    leaderboard: document.getElementById('leaderboard'),
    
    // Cashier view elements
    cashierName: document.getElementById('cashierName'),
    cashierTableName: document.getElementById('cashierTableName'),
    cashierTablePoints: document.getElementById('cashierTablePoints'),
    customPoints: document.getElementById('customPoints'),
    addCustomPoints: document.getElementById('addCustomPoints'),
    operationsHistory: document.getElementById('operationsHistory'),
    
    // Form elements
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    
    // Toast container
    toastContainer: document.getElementById('toastContainer')
};

// Utility Functions
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function showLoading() {
    elements.loading.style.display = 'flex';
}

// Session Management
function saveSession(sessionData) {
    const session = {
        ...sessionData,
        loginTime: Date.now(),
        expires: Date.now() + CONFIG.sessionDuration
    };
    localStorage.setItem(CONFIG.sessionKey, JSON.stringify(session));
    currentSession = session;
}

function getSession() {
    try {
        const sessionData = localStorage.getItem(CONFIG.sessionKey);
        if (!sessionData) return null;
        
        const session = JSON.parse(sessionData);
        
        // Check if session is expired
        if (session.expires < Date.now()) {
            localStorage.removeItem(CONFIG.sessionKey);
            return null;
        }
        
        return session;
    } catch (error) {
        localStorage.removeItem(CONFIG.sessionKey);
        return null;
    }
}

function clearSession() {
    localStorage.removeItem(CONFIG.sessionKey);
    currentSession = null;
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const url = `${CONFIG.apiBaseUrl}${endpoint}`;
        
        // Add auth header if session exists
        if (currentSession?.token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${currentSession.token}`
            };
        }

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.warn('API call failed, using fallback:', error);
        
        if (!CONFIG.fallbackMode) {
            throw error;
        }
        
        // Fallback to mock data
        return handleMockApiCall(endpoint, options);
    }
}

function handleMockApiCall(endpoint, options) {
    // Mock login
    if (endpoint === '/auth/login' && options.method === 'POST') {
        const { username, password } = JSON.parse(options.body);
        const user = MOCK_DATA.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            return {
                success: true,
                token: `mock-token-${Date.now()}`,
                user: { 
                    username: user.username, 
                    role: user.role, 
                    name: user.name 
                }
            };
        } else {
            throw new Error('Invalid credentials');
        }
    }
    
    // Mock get tables
    if (endpoint === '/tables/leaderboard') {
        return { 
            success: true, 
            tables: [...MOCK_DATA.tables].sort((a, b) => b.points - a.points)
        };
    }
    
    // Mock get specific table
    if (endpoint.startsWith('/tables/qr/')) {
        const qrCode = endpoint.split('/').pop();
        const table = MOCK_DATA.tables.find(t => t.qrCode === qrCode);
        if (table) {
            return { success: true, table };
        } else {
            throw new Error('Table not found');
        }
    }
    
    // Mock add points
    if (endpoint === '/points/add' && options.method === 'POST') {
        const { tableId, points } = JSON.parse(options.body);
        const table = MOCK_DATA.tables.find(t => t.id === tableId);
        if (table) {
            table.points += points;
            operationsHistory.unshift({
                id: Date.now(),
                tableId,
                points,
                timestamp: Date.now(),
                cashier: currentSession?.user?.name || 'Cassiere'
            });
            return { success: true, newPoints: table.points };
        }
    }
    
    // Mock update table name
    if (endpoint.startsWith('/tables/') && endpoint.endsWith('/name') && options.method === 'PUT') {
        const tableId = parseInt(endpoint.split('/')[2]);
        const { name } = JSON.parse(options.body);
        const table = MOCK_DATA.tables.find(t => t.id === tableId);
        if (table) {
            table.name = name;
            return { success: true, table };
        }
    }
    
    throw new Error('Mock endpoint not implemented');
}

// UI Functions - Fixed view switching
function showTableView() {
    // Ensure proper hiding/showing with immediate effect
    elements.cashierView.classList.add('hidden');
    elements.tableView.classList.remove('hidden');
    elements.loginBtn.classList.remove('hidden');
    elements.logoutBtn.classList.add('hidden');
    
    // Force reflow to ensure immediate visual update
    elements.tableView.offsetHeight;
}

function showCashierView() {
    // Ensure proper hiding/showing with immediate effect
    elements.tableView.classList.add('hidden');
    elements.cashierView.classList.remove('hidden');
    elements.loginBtn.classList.add('hidden');
    elements.logoutBtn.classList.remove('hidden');
    
    // Force reflow to ensure immediate visual update
    elements.cashierView.offsetHeight;
}

function updateTableInfo(table) {
    if (!table) return;
    
    currentTable = table;
    
    // Update table view
    elements.currentTableName.textContent = table.name;
    elements.tablePoints.textContent = `${table.points} punti`;
    elements.newTableName.value = '';
    elements.newTableName.placeholder = table.name;
    
    // Update cashier view
    elements.cashierTableName.textContent = table.name;
    elements.cashierTablePoints.textContent = `${table.points} punti`;
}

function updateLeaderboard(tables) {
    if (!tables || !Array.isArray(tables)) return;
    
    // Sort tables by points (descending)
    const sortedTables = [...tables].sort((a, b) => b.points - a.points);
    
    elements.leaderboard.innerHTML = '';
    
    sortedTables.forEach((table, index) => {
        const position = index + 1;
        const isCurrentTable = currentTable && table.id === currentTable.id;
        
        const item = document.createElement('div');
        item.className = `leaderboard-item ${isCurrentTable ? 'current-table' : ''}`;
        
        item.innerHTML = `
            <div class="leaderboard-rank">
                <span class="rank-number ${position <= 3 ? 'top-3' : ''}">${position}</span>
                <div class="table-info">
                    <h4>${table.name}</h4>
                    <span class="points">${table.points} punti</span>
                </div>
            </div>
        `;
        
        elements.leaderboard.appendChild(item);
    });
    
    // Update current table position
    const currentPosition = sortedTables.findIndex(t => currentTable && t.id === currentTable.id) + 1;
    if (currentPosition > 0) {
        elements.tablePosition.textContent = `#${currentPosition}`;
    }
}

function updateOperationsHistory() {
    if (!operationsHistory.length) {
        elements.operationsHistory.innerHTML = `
            <div class="operation-item">
                <div class="operation-info">
                    <span>Nessuna operazione recente</span>
                </div>
            </div>
        `;
        return;
    }
    
    elements.operationsHistory.innerHTML = '';
    
    operationsHistory.slice(0, 10).forEach(operation => {
        const item = document.createElement('div');
        item.className = 'operation-item';
        
        item.innerHTML = `
            <div class="operation-info">
                <span class="operation-points">+${operation.points} punti</span>
                <span class="operation-time">${formatTime(operation.timestamp)}</span>
            </div>
            <span>${operation.cashier}</span>
        `;
        
        elements.operationsHistory.appendChild(item);
    });
}

// Main App Logic
async function loadTableData(qrCode) {
    try {
        const response = await apiCall(`/tables/qr/${qrCode}`);
        if (response.success && response.table) {
            updateTableInfo(response.table);
            return response.table;
        }
    } catch (error) {
        showToast('Errore nel caricamento dati tavolo', 'error');
        console.error('Error loading table:', error);
    }
    return null;
}

async function loadLeaderboard() {
    try {
        const response = await apiCall('/tables/leaderboard');
        if (response.success && response.tables) {
            updateLeaderboard(response.tables);
        }
    } catch (error) {
        showToast('Errore nel caricamento classifica', 'error');
        console.error('Error loading leaderboard:', error);
    }
}

async function handleLogin(username, password) {
    try {
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.success && response.token) {
            saveSession({
                token: response.token,
                user: response.user
            });
            
            // Close modal immediately
            elements.loginModal.classList.add('hidden');
            
            // Clear form
            elements.username.value = '';
            elements.password.value = '';
            
            // Update cashier name
            elements.cashierName.textContent = response.user.name;
            
            // Show success message
            showToast(`Benvenuto, ${response.user.name}!`, 'success');
            
            // Switch to cashier view immediately if we have a table
            if (currentTable) {
                showCashierView();
                updateOperationsHistory();
            }
            
            return true;
        }
    } catch (error) {
        showToast('Credenziali non valide', 'error');
        console.error('Login error:', error);
    }
    return false;
}

async function handleAddPoints(points) {
    if (!currentTable || !currentSession) return;
    
    try {
        const response = await apiCall('/points/add', {
            method: 'POST',
            body: JSON.stringify({
                tableId: currentTable.id,
                points: parseInt(points)
            })
        });
        
        if (response.success) {
            currentTable.points = response.newPoints;
            elements.cashierTablePoints.textContent = `${response.newPoints} punti`;
            
            showToast(`Aggiunti ${points} punti!`, 'success');
            updateOperationsHistory();
            
            // Reload leaderboard to reflect changes
            await loadLeaderboard();
        }
    } catch (error) {
        showToast('Errore nell\'aggiunta punti', 'error');
        console.error('Add points error:', error);
    }
}

async function handleChangeTableName(newName) {
    if (!currentTable || !newName.trim()) return;
    
    try {
        const response = await apiCall(`/tables/${currentTable.id}/name`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName.trim() })
        });
        
        if (response.success && response.table) {
            updateTableInfo(response.table);
            showToast('Nome tavolo aggiornato!', 'success');
            
            // Reload leaderboard to reflect changes
            await loadLeaderboard();
        }
    } catch (error) {
        showToast('Errore nell\'aggiornamento nome', 'error');  
        console.error('Change name error:', error);
    }
}

// Smart Routing Logic
async function initializeApp() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tableCode = urlParams.get('table');
    
    // Check existing session
    currentSession = getSession();
    
    // Load initial data
    if (tableCode) {
        const table = await loadTableData(tableCode);
        if (table) {
            // Smart routing logic
            if (currentSession && currentSession.user.role === 'cashier') {
                // User is already logged in as cashier - go directly to dashboard
                elements.cashierName.textContent = currentSession.user.name;
                showCashierView();
                updateOperationsHistory();
                showToast(`Bentornato, ${currentSession.user.name}!`, 'info');
            } else {
                // Show normal table view with login option
                showTableView();
            }
        }
    } else {
        // No table specified - show normal view or redirect to example
        showTableView();
        // Simulate scanning a table for demo purposes
        const demoTable = MOCK_DATA.tables[0];
        updateTableInfo(demoTable);
        showToast('Demo: simulazione scansione Tavolo 1', 'info');
    }
    
    // Always load leaderboard
    await loadLeaderboard();
    
    hideLoading();
}

// Event Listeners
function setupEventListeners() {
    // Login modal
    elements.loginBtn.addEventListener('click', () => {
        elements.loginModal.classList.remove('hidden');
        elements.username.focus();
    });
    
    elements.closeModal.addEventListener('click', () => {
        elements.loginModal.classList.add('hidden');
    });
    
    elements.loginModal.addEventListener('click', (e) => {
        if (e.target === elements.loginModal || e.target.classList.contains('modal-backdrop')) {
            elements.loginModal.classList.add('hidden');
        }
    });
    
    // Login form
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = elements.username.value.trim();
        const password = elements.password.value.trim();
        
        if (username && password) {
            await handleLogin(username, password);
        }
    });
    
    // Logout
    elements.logoutBtn.addEventListener('click', () => {
        clearSession();
        showTableView();
        showToast('Disconnesso con successo', 'info');
    });
    
    // Change table name
    elements.changeNameBtn.addEventListener('click', async () => {
        const newName = elements.newTableName.value.trim();
        if (newName) {
            await handleChangeTableName(newName);
        }
    });
    
    // Point buttons
    document.querySelectorAll('.point-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const points = btn.dataset.points;
            await handleAddPoints(points);
        });
    });
    
    // Custom points
    elements.addCustomPoints.addEventListener('click', async () => {
        const points = parseInt(elements.customPoints.value);
        if (points && points > 0) {
            await handleAddPoints(points);
            elements.customPoints.value = '';
        }
    });
    
    // Custom points enter key
    elements.customPoints.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            elements.addCustomPoints.click();
        }
    });
    
    // Table name enter key
    elements.newTableName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.changeNameBtn.click();
        }
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeApp();
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    initializeApp();
});
