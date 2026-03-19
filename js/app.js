/**
 * ============================================================
 * app.js - Módulo Global
 * Dark/Light mode, Sidebar colapsável, Máscaras, API, Toast
 * ============================================================
 */

// ============================================================
// CONFIGURAÇÃO DA API
// ============================================================
const API_BASE_URL = 'https://wanderhalleylee-orcamento-wd.hf.space';

// ============================================================
// Configurações Padrão da Empresa (usadas no localStorage)
// ============================================================
const CONFIG_DEFAULTS = {
    logo_base64: '',
    nome: 'WD MÁQUINAS',
    cnpj: '29.595.239/0001-33',
    endereco: 'Avenida Dom Pedro I, 733 - Franca .SP',
    bairro_cep: 'Jardim Doutor Antonio Petraglia, CEP - 14.409-170',
    telefone: '(16) 99196-6519',
    email: 'wdmaquinas@outlook.com',
    site_instagram: '',
    condicoes_padrao: 'Dividimos em Até 10x Sem Juros no Cartão de Crédito ou 10% de Desconto no Boleto ou Pix à Vista',
    validade_dias: 30
};

/**
 * Retorna configurações da empresa (localStorage ou padrão).
 * @returns {Object}
 */
function getConfig() {
    try {
        const saved = localStorage.getItem('wd_config');
        if (saved) {
            return { ...CONFIG_DEFAULTS, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn('Erro ao ler config:', e);
    }
    return { ...CONFIG_DEFAULTS };
}

/**
 * Salva configurações da empresa no localStorage.
 * @param {Object} config
 */
function saveConfig(config) {
    try {
        localStorage.setItem('wd_config', JSON.stringify(config));
    } catch (e) {
        console.warn('Erro ao salvar config:', e);
    }
}

// ============================================================
// DARK / LIGHT MODE
// ============================================================

/**
 * Inicializa o tema (dark como padrão).
 */
function initTheme() {
    const saved = localStorage.getItem('wd_theme');
    // Dark é padrão: só muda pra light se salvo explicitamente
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('wd_theme', 'dark');
    }
    updateThemeIcon();
}

/**
 * Alterna entre dark e light mode.
 */
function toggleTheme() {
    const current = localStorage.getItem('wd_theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';

    if (next === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    localStorage.setItem('wd_theme', next);
    updateThemeIcon();
}

/**
 * Atualiza o ícone do botão de tema (sol/lua).
 */
function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    const isDark = (localStorage.getItem('wd_theme') || 'dark') === 'dark';

    if (isDark) {
        // Mostra ícone de sol (para mudar pra light)
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
        btn.title = 'Modo Claro';
    } else {
        // Mostra ícone de lua (para mudar pra dark)
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        btn.title = 'Modo Escuro';
    }
}

// ============================================================
// SIDEBAR COLAPSÁVEL
// ============================================================

/**
 * Inicializa a sidebar (colapsável no desktop, overlay no mobile).
 */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('sidebarOverlay');
    const collapseBtn = document.getElementById('sidebarCollapse');

    if (!sidebar) return;

    // Restaurar estado salvo (desktop)
    const savedState = localStorage.getItem('wd_sidebar');
    if (savedState === 'collapsed' && window.innerWidth > 768) {
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
    }

    // Botão de collapse (desktop - chevron na sidebar)
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            document.body.classList.toggle('sidebar-collapsed', isCollapsed);
            localStorage.setItem('wd_sidebar', isCollapsed ? 'collapsed' : 'expanded');
        });
    }

    // Botão hamburger (mobile)
    if (toggle) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
        });
    }

    // Overlay click fecha sidebar no mobile
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// ============================================================
// Funções de API (fetch wrapper)
// ============================================================

async function apiGet(endpoint) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('[API GET]', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            mode: 'cors'
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Erro HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`GET ${endpoint} falhou:`, error);
        throw error;
    }
}

async function apiPost(endpoint, data) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('[API POST]', url);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            mode: 'cors',
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Erro HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`POST ${endpoint} falhou:`, error);
        throw error;
    }
}

async function apiPut(endpoint, data) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('[API PUT]', url);
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            mode: 'cors',
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Erro HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`PUT ${endpoint} falhou:`, error);
        throw error;
    }
}

async function apiDelete(endpoint) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log('[API DELETE]', url);
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            mode: 'cors'
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Erro HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`DELETE ${endpoint} falhou:`, error);
        throw error;
    }
}

// ============================================================
// Formatação (Moeda, Data, Texto)
// ============================================================

function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    } catch { return dateStr; }
}

/**
 * Formata data para nome de arquivo DD-MM-YYYY
 */
function formatDateFile(dateStr) {
    if (!dateStr) {
        const d = new Date();
        return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
    }
    try {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dateStr;
    } catch { return dateStr; }
}

function getToday() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

function getDatePlusDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// ============================================================
// MÁSCARAS DE FORMATAÇÃO (Melhoria 8)
// ============================================================

/**
 * Remove tudo que não é dígito.
 * @param {string} value
 * @returns {string}
 */
function onlyDigits(value) {
    return (value || '').replace(/\D/g, '');
}

/**
 * Formata telefone: (00) 00000-0000 ou (00) 0000-0000
 * @param {string} value - Valor com ou sem formatação
 * @returns {string} Valor formatado
 */
function formatPhone(value) {
    const d = onlyDigits(value);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
}

/**
 * Formata CEP: 00000-000
 * @param {string} value
 * @returns {string}
 */
function formatCEP(value) {
    const d = onlyDigits(value);
    if (d.length <= 5) return d;
    return `${d.slice(0,5)}-${d.slice(5,8)}`;
}

/**
 * Formata CPF: 000.000.000-00
 * @param {string} value
 * @returns {string}
 */
function formatCPF(value) {
    const d = onlyDigits(value);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 * @param {string} value
 * @returns {string}
 */
function formatCNPJ(value) {
    const d = onlyDigits(value);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
}

/**
 * Detecta CPF ou CNPJ e formata automaticamente.
 * @param {string} value
 * @returns {string}
 */
function formatCPFCNPJ(value) {
    const d = onlyDigits(value);
    if (d.length <= 11) return formatCPF(value);
    return formatCNPJ(value);
}

/**
 * Aplica máscara em tempo real a um input.
 * @param {HTMLElement} input - Elemento input
 * @param {string} tipo - 'phone', 'cep', 'cpf', 'cnpj', 'cpfcnpj'
 */
function maskInput(input, tipo) {
    if (!input) return;

    const formatters = {
        phone: formatPhone,
        cep: formatCEP,
        cpf: formatCPF,
        cnpj: formatCNPJ,
        cpfcnpj: formatCPFCNPJ
    };

    const maxLengths = {
        phone: 15,
        cep: 9,
        cpf: 14,
        cnpj: 18,
        cpfcnpj: 18
    };

    const formatter = formatters[tipo];
    if (!formatter) return;

    input.addEventListener('input', function(e) {
        const cursorPos = this.selectionStart;
        const oldLen = this.value.length;
        this.value = formatter(this.value);
        const newLen = this.value.length;
        const diff = newLen - oldLen;
        // Tentar manter posição do cursor razoável
        this.setSelectionRange(cursorPos + diff, cursorPos + diff);
    });

    // Limitar tamanho
    if (maxLengths[tipo]) {
        input.setAttribute('maxlength', maxLengths[tipo]);
    }
}

/**
 * Retorna valor limpo (apenas dígitos) de um input com máscara.
 * Útil para enviar ao backend sem formatação.
 * @param {string} value
 * @returns {string}
 */
function unmask(value) {
    return onlyDigits(value);
}

/**
 * Aplica formatação de exibição para telefone (para tabelas/preview).
 * Recebe valor limpo (só dígitos) e retorna formatado.
 * @param {string} raw - Valor sem formatação
 * @returns {string}
 */
function displayPhone(raw) {
    if (!raw) return '-';
    return formatPhone(raw);
}

/**
 * Aplica formatação de exibição para CEP.
 * @param {string} raw
 * @returns {string}
 */
function displayCEP(raw) {
    if (!raw) return '-';
    return formatCEP(raw);
}

/**
 * Aplica formatação de exibição para CPF/CNPJ.
 * @param {string} raw
 * @returns {string}
 */
function displayCPFCNPJ(raw) {
    if (!raw) return '-';
    return formatCPFCNPJ(raw);
}

// ============================================================
// Toast (Notificações)
// ============================================================

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        ${icons[type] || icons.info}
        <span>${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// ============================================================
// Debounce
// ============================================================

function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// ============================================================
// Helper: Gera sidebar HTML reutilizável
// Evita repetir sidebar em cada HTML
// ============================================================

/**
 * Retorna o HTML da sidebar com o link ativo marcado.
 * @param {string} activePage - Nome da página ativa
 * @returns {string} HTML
 */
function getSidebarHTML(activePage) {
    const links = [
        { href: 'index.html', id: 'dashboard', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', label: 'Dashboard' },
        { href: 'orcamentos.html', id: 'orcamentos', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', label: 'Orçamentos' },
        { href: 'clientes.html', id: 'clientes', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', label: 'Clientes' },
        { href: 'produtos.html', id: 'produtos', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>', label: 'Produtos' },
        { href: 'configuracoes.html', id: 'configuracoes', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', label: 'Configurações' }
    ];

    return links.map(l => {
        const isActive = l.id === activePage ? ' active' : '';
        return `<a href="${l.href}" class="sidebar-link${isActive}" title="${l.label}">
            ${l.icon}
            <span class="sidebar-link-text">${l.label}</span>
        </a>`;
    }).join('\n');
}

// ============================================================
// Helper: Gera a estrutura base do header com tema toggle
// ============================================================

/**
 * Retorna HTML padrão do header-right com botão de tema.
 * @param {string} extraHTML - Botões extras (ex: Novo Orçamento)
 * @returns {string}
 */
function getHeaderRightHTML(extraHTML = '') {
    return `${extraHTML}
        <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="Alternar Tema">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>
        </button>`;
}

// ============================================================
// Helper: Lê imagem como Base64
// ============================================================

/**
 * Lê um arquivo de imagem e retorna como Base64 string.
 * @param {File} file - Arquivo do input
 * @param {number} maxSizeMB - Tamanho máximo em MB
 * @returns {Promise<string>} Base64 data URL
 */
function readImageAsBase64(file, maxSizeMB = 2) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Nenhum arquivo selecionado'));
            return;
        }

        // Validar tipo
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            reject(new Error('Formato inválido. Use JPG, PNG ou WEBP.'));
            return;
        }

        // Validar tamanho
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            reject(new Error(`Imagem muito grande. Máximo: ${maxSizeMB}MB`));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

// ============================================================
// Inicialização global - executada em TODAS as páginas
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    // Atualiza ícone do tema após DOM carregado
    updateThemeIcon();
});
