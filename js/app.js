/**
 * ============================================================
 * app.js — Módulo Global
 * Config, API, Theme, Sidebar, Toast, Formatadores, Máscaras
 * ============================================================
 */

/* ============================================================
   1. CONFIGURAÇÃO DA API
   ============================================================ */
const API_BASE_URL = 'https://wanderhalleylee-orcamento-wd.hf.space';

function getConfig() {
    try {
        const raw = localStorage.getItem('wd_config');
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveConfig(config) {
    try {
        localStorage.setItem('wd_config', JSON.stringify(config));
    } catch {
        /* silencioso */
    }
}

/* ============================================================
   2. TEMA — Dark padrão, Light alternativo
   ============================================================ */
function initTheme() {
    const saved = localStorage.getItem('wd_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('wd_theme', next);
    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'light') {
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        btn.title = 'Mudar para tema escuro';
    } else {
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
        btn.title = 'Mudar para tema claro';
    }
}

/* ============================================================
   3. SIDEBAR — Recolhível com chevron, mobile overlay
   ============================================================ */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const collapse = document.getElementById('sidebarCollapse');
    const menuToggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('sidebarOverlay');
    const themeBtn = document.getElementById('themeToggle');

    /* Chevron desktop — colapsa/expande */
    if (collapse && sidebar) {
        const savedState = localStorage.getItem('wd_sidebar_collapsed');
        if (savedState === 'true' && window.innerWidth > 768) {
            sidebar.classList.add('collapsed');
        }

        collapse.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('wd_sidebar_collapsed', sidebar.classList.contains('collapsed'));
        });
    }

    /* Hamburger mobile — abre sidebar como overlay */
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
        });
    }

    /* Overlay click — fecha sidebar mobile */
    if (overlay && sidebar) {
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    /* Theme toggle */
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
}

/**
 * Gera o HTML do sidebar com a página ativa destacada.
 * @param {string} activePage - Nome do arquivo (ex: 'index.html')
 * @returns {string} HTML do sidebar
 */
function generateSidebar(activePage) {
    const pages = [
        {
            href: 'index.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
            label: 'Dashboard'
        },
        {
            href: 'orcamentos.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
            label: 'Orçamentos'
        },
        {
            href: 'clientes.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
            label: 'Clientes'
        },
        {
            href: 'produtos.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
            label: 'Produtos'
        },
        {
            href: 'configuracoes.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
            label: 'Configurações'
        }
    ];

    let links = '';
    pages.forEach(function (p) {
        const isActive = p.href === activePage ? ' active' : '';
        links += '<a href="' + p.href + '" class="sidebar-link' + isActive + '" title="' + p.label + '">' +
            p.icon +
            '<span class="sidebar-link-text">' + p.label + '</span>' +
            '</a>';
    });

    return '<div class="sidebar-header">' +
        '<div class="sidebar-logo">' +
        '<div class="sidebar-logo-icon">WD</div>' +
        '<div class="sidebar-logo-text">' +
        '<h1>WD Máquinas</h1>' +
        '<span>Sistema de Orçamentos</span>' +
        '</div>' +
        '</div>' +
        '<button class="sidebar-toggle" id="sidebarCollapse" aria-label="Recolher menu">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>' +
        '</button>' +
        '</div>' +
        '<nav class="sidebar-nav">' +
        '<div class="sidebar-nav-label">Menu</div>' +
        links +
        '</nav>';
}

/**
 * Gera o HTML do header principal.
 * @param {string} title - Título da página
 * @returns {string} HTML do header
 */
function generateHeader(title) {
    return '<div class="header-left">' +
        '<button class="menu-toggle" id="menuToggle" aria-label="Abrir menu">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>' +
        '</svg>' +
        '</button>' +
        '<h2>' + escapeHtml(title) + '</h2>' +
        '</div>' +
        '<div class="header-right">' +
        '<button class="theme-toggle" id="themeToggle" title="Alternar tema">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>' +
        '</svg>' +
        '</button>' +
        '</div>';
}

/* ============================================================
   4. API — Fetch wrappers com CORS, try/catch, JSON padronizado
   ============================================================ */
async function apiGet(endpoint) {
    try {
        const url = API_BASE_URL + endpoint;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            mode: 'cors'
        });
        if (!response.ok) {
            const errData = await response.json().catch(function () { return {}; });
            throw new Error(errData.error || errData.detail || 'Erro HTTP ' + response.status);
        }
        return await response.json();
    } catch (error) {
        console.error('[API GET] ' + endpoint, error);
        throw error;
    }
}

async function apiPost(endpoint, data) {
    try {
        const url = API_BASE_URL + endpoint;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            mode: 'cors',
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errData = await response.json().catch(function () { return {}; });
            throw new Error(errData.error || errData.detail || 'Erro HTTP ' + response.status);
        }
        return await response.json();
    } catch (error) {
        console.error('[API POST] ' + endpoint, error);
        throw error;
    }
}

async function apiPut(endpoint, data) {
    try {
        const url = API_BASE_URL + endpoint;
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            mode: 'cors',
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errData = await response.json().catch(function () { return {}; });
            throw new Error(errData.error || errData.detail || 'Erro HTTP ' + response.status);
        }
        return await response.json();
    } catch (error) {
        console.error('[API PUT] ' + endpoint, error);
        throw error;
    }
}

async function apiDelete(endpoint) {
    try {
        const url = API_BASE_URL + endpoint;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            mode: 'cors'
        });
        if (!response.ok) {
            const errData = await response.json().catch(function () { return {}; });
            throw new Error(errData.error || errData.detail || 'Erro HTTP ' + response.status);
        }
        return await response.json();
    } catch (error) {
        console.error('[API DELETE] ' + endpoint, error);
        throw error;
    }
}

/* ============================================================
   5. FORMATADORES
   ============================================================ */

/**
 * Formata valor numérico para R$ X.XXX,XX
 * @param {number|string} value
 * @returns {string}
 */
function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(Number(value))) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

/**
 * Formata data ISO para DD/MM/YYYY
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
        return dateStr;
    } catch {
        return dateStr;
    }
}

/**
 * Formata data para input type="date" (YYYY-MM-DD)
 * @param {string} dateStr
 * @returns {string}
 */
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
}

/**
 * Formata telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * @param {string} value
 * @returns {string}
 */
function formatPhone(value) {
    if (!value) return '';
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 2) return '(' + nums;
    if (nums.length <= 6) return '(' + nums.substring(0, 2) + ') ' + nums.substring(2);
    if (nums.length <= 10) return '(' + nums.substring(0, 2) + ') ' + nums.substring(2, 6) + '-' + nums.substring(6);
    return '(' + nums.substring(0, 2) + ') ' + nums.substring(2, 7) + '-' + nums.substring(7, 11);
}

/**
 * Formata CEP: XXXXX-XXX
 * @param {string} value
 * @returns {string}
 */
function formatCEP(value) {
    if (!value) return '';
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 5) return nums;
    return nums.substring(0, 5) + '-' + nums.substring(5, 8);
}

/**
 * Formata CPF: XXX.XXX.XXX-XX
 * @param {string} value
 * @returns {string}
 */
function formatCPF(value) {
    if (!value) return '';
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return nums.substring(0, 3) + '.' + nums.substring(3);
    if (nums.length <= 9) return nums.substring(0, 3) + '.' + nums.substring(3, 6) + '.' + nums.substring(6);
    return nums.substring(0, 3) + '.' + nums.substring(3, 6) + '.' + nums.substring(6, 9) + '-' + nums.substring(9, 11);
}

/**
 * Formata CNPJ: XX.XXX.XXX/XXXX-XX
 * @param {string} value
 * @returns {string}
 */
function formatCNPJ(value) {
    if (!value) return '';
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 2) return nums;
    if (nums.length <= 5) return nums.substring(0, 2) + '.' + nums.substring(2);
    if (nums.length <= 8) return nums.substring(0, 2) + '.' + nums.substring(2, 5) + '.' + nums.substring(5);
    if (nums.length <= 12) return nums.substring(0, 2) + '.' + nums.substring(2, 5) + '.' + nums.substring(5, 8) + '/' + nums.substring(8);
    return nums.substring(0, 2) + '.' + nums.substring(2, 5) + '.' + nums.substring(5, 8) + '/' + nums.substring(8, 12) + '-' + nums.substring(12, 14);
}

/**
 * Formata CPF ou CNPJ automaticamente por tamanho
 * @param {string} value
 * @returns {string}
 */
function formatCPFCNPJ(value) {
    if (!value) return '';
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 11) return formatCPF(value);
    return formatCNPJ(value);
}

/**
 * Formata data para nome de arquivo (YYYY-MM-DD)
 * @returns {string}
 */
function formatFileDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

/* ============================================================
   6. MÁSCARAS — Aplica em tempo real no input
   ============================================================ */

/**
 * Aplica máscara em tempo real a um elemento input.
 * @param {HTMLElement} element - O input
 * @param {string} tipo - phone, cep, cpf, cnpj, cpfcnpj, currency
 */
function maskInput(element, tipo) {
    if (!element) return;

    element.addEventListener('input', function () {
        const cursorPos = element.selectionStart;
        const oldLen = element.value.length;
        let val = element.value;

        switch (tipo) {
            case 'phone':
                element.value = formatPhone(val);
                break;
            case 'cep':
                element.value = formatCEP(val);
                break;
            case 'cpf':
                element.value = formatCPF(val);
                break;
            case 'cnpj':
                element.value = formatCNPJ(val);
                break;
            case 'cpfcnpj':
                element.value = formatCPFCNPJ(val);
                break;
            case 'currency':
                val = val.replace(/\D/g, '');
                if (val === '') {
                    element.value = '';
                    return;
                }
                const numVal = parseInt(val, 10) / 100;
                element.value = numVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                break;
        }

        const newLen = element.value.length;
        const diff = newLen - oldLen;
        const newPos = cursorPos + diff;
        if (newPos >= 0 && newPos <= newLen) {
            element.setSelectionRange(newPos, newPos);
        }
    });
}

/* ============================================================
   7. LIMPEZA — Remove formatação para salvar no banco
   ============================================================ */

/**
 * Remove toda formatação, retorna só números.
 * @param {string} value
 * @returns {string}
 */
function unmask(value) {
    if (!value) return '';
    return String(value).replace(/\D/g, '');
}

/**
 * Converte "1.234,56" para 1234.56 (número)
 * @param {string} value
 * @returns {number}
 */
function parseCurrency(value) {
    if (!value) return 0;
    const cleaned = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

/* ============================================================
   8. TOAST — Notificações
   ============================================================ */

/**
 * Exibe notificação toast.
 * @param {string} message
 * @param {string} type - success, error, warning, info
 * @param {number} duration - ms (padrão 4000)
 */
function showToast(message, type, duration) {
    if (!type) type = 'info';
    if (!duration) duration = 4000;

    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = (icons[type] || icons.info) +
        '<span>' + escapeHtml(message) + '</span>' +
        '<button class="toast-close" aria-label="Fechar">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>';

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            toast.remove();
        });
    }

    container.appendChild(toast);

    setTimeout(function () {
        if (toast.parentElement) {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(function () {
                toast.remove();
            }, 300);
        }
    }, duration);
}

/* ============================================================
   9. UTILS
   ============================================================ */

/**
 * Debounce — atrasa execução de função.
 * @param {Function} func
 * @param {number} wait - ms
 * @returns {Function}
 */
function debounce(func, wait) {
    if (!wait) wait = 300;
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Escapa HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

/**
 * Lê imagem como base64.
 * @param {File} file
 * @param {number} maxSizeMB - Tamanho máximo em MB
 * @returns {Promise<string>} base64
 */
function readImageAsBase64(file, maxSizeMB) {
    if (!maxSizeMB) maxSizeMB = 2;
    return new Promise(function (resolve, reject) {
        if (!file) {
            reject(new Error('Nenhum arquivo selecionado'));
            return;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            reject(new Error('Arquivo excede ' + maxSizeMB + ' MB'));
            return;
        }
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (validTypes.indexOf(file.type) === -1) {
            reject(new Error('Formato inválido. Use JPG, PNG ou WEBP'));
            return;
        }
        const reader = new FileReader();
        reader.onload = function () {
            resolve(reader.result);
        };
        reader.onerror = function () {
            reject(new Error('Erro ao ler arquivo'));
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Retorna data de hoje no formato YYYY-MM-DD.
 * @returns {string}
 */
function getToday() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

/**
 * Retorna data daqui a N dias no formato YYYY-MM-DD.
 * @param {number} days
 * @returns {string}
 */
function getDatePlusDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

/**
 * Capitaliza a primeira letra de uma string.
 * @param {string} str
 * @returns {string}
 */
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
