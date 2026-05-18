/**
 * app.js — Módulo global do frontend (SPA)
 * WD Máquinas — Sistema de Orçamentos
 *
 * Provê: API wrappers, formatação, máscaras, toast, sidebar, tema,
 *        localStorage config, debounce, escapeHtml, e
 *        NAVEGAÇÃO ENTRE ABAS (SPA).
 */

// =============================================
// API BASE URL
// =============================================
const API_BASE_URL = 'https://wanderhalleylee-orcamento-wd.hf.space';

// =============================================
// CONFIGURAÇÕES PADRÃO DA EMPRESA (localStorage)
// =============================================
const DEFAULT_CONFIG = {
    logo: '',
    nomeEmpresa: 'WD Máquinas',
    cnpj: '29595239000133',
    endereco: 'Avenida Dom Pedro I, 733 - Franca/SP',
    telefone: '16991966519',
    email: 'wdmaquinas@outlook.com',
    site: '',
    condicoesPadrao: 'Dividimos em Até 10x Sem Juros no Cartão de Crédito ou 10% de Desconto no Boleto ou Pix à Vista',
    validadeDias: 30,
    prazoEntregaPadrao: 'Em Até 5 Dias Úteis',
    observacoesPadrao: '',
};

function getConfig() {
    try {
        const saved = localStorage.getItem('wd_config');
        if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) { console.warn('[Config] Erro ao ler localStorage:', e); }
    return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
    try {
        localStorage.setItem('wd_config', JSON.stringify(config));
        console.log('[Config] Salvo com sucesso');
    } catch (e) { console.error('[Config] Erro ao salvar:', e); }
}

// =============================================
// API WRAPPERS
// =============================================
async function apiGet(path) {
    const url = API_BASE_URL + path;
    console.log('[API GET]', url);
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`GET ${path} failed (${response.status}): ${errorText}`);
    }
    return await response.json();
}

async function apiPost(path, body) {
    const url = API_BASE_URL + path;
    console.log('[API POST]', url, body);
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`POST ${path} failed (${response.status}): ${errorText}`);
    }
    return await response.json();
}

async function apiPut(path, body) {
    const url = API_BASE_URL + path;
    console.log('[API PUT]', url, body);
    const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`PUT ${path} failed (${response.status}): ${errorText}`);
    }
    return await response.json();
}

async function apiDelete(path) {
    const url = API_BASE_URL + path;
    console.log('[API DELETE]', url);
    const response = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`DELETE ${path} failed (${response.status}): ${errorText}`);
    }
    return await response.json();
}

// =============================================
// FORMATAÇÃO
// =============================================
function formatCurrency(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const datePart = dateStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

function getToday() { return new Date().toISOString().split('T')[0]; }

function getDatePlusDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + (days || 0));
    return d.toISOString().split('T')[0];
}

function capitalizeFirst(str) { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1); }

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function formatFileName(name, dateStr) {
    const cleanName = (name || 'Orcamento').replace(/[^a-zA-Z0-9À-ú\s\-#]/g, '').trim();
    let dateFormatted = '';
    if (dateStr) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) dateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (!dateFormatted) {
        const now = new Date();
        dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    }
    return `${cleanName} - ${dateFormatted}`;
}

// =============================================
// MÁSCARAS
// =============================================
function formatPhone(value) {
    if (!value) return '';
    const d = String(value).replace(/\D/g, '');
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6, 10)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function formatCEP(value) {
    if (!value) return '';
    const d = String(value).replace(/\D/g, '');
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
}

function formatCPF(value) {
    if (!value) return '';
    const d = String(value).replace(/\D/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function formatCNPJ(value) {
    if (!value) return '';
    const d = String(value).replace(/\D/g, '');
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

function formatCPFCNPJ(value) {
    if (!value) return '';
    const d = String(value).replace(/\D/g, '');
    return d.length <= 11 ? formatCPF(d) : formatCNPJ(d);
}

function unmaskValue(value) { if (!value) return ''; return String(value).replace(/\D/g, ''); }
window.unmask = unmaskValue;
window.unmaskValue = unmaskValue;

function maskInput(input, formatFn) {
    if (!input || !formatFn) return;
    input.addEventListener('input', function () {
        const cursorPos = this.selectionStart;
        const oldLength = this.value.length;
        this.value = formatFn(this.value);
        const newLength = this.value.length;
        const newPos = cursorPos + (newLength - oldLength);
        this.setSelectionRange(newPos, newPos);
    });
}

// =============================================
// LEITURA DE ARQUIVO COMO BASE64
// =============================================
function readFileAsBase64(file, maxBytes, allowedTypes) {
    return new Promise((resolve, reject) => {
        if (!file) { reject(new Error('Nenhum arquivo selecionado')); return; }
        if (maxBytes && file.size > maxBytes) {
            const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
            reject(new Error(`Arquivo muito grande. Máximo: ${maxMB} MB`)); return;
        }
        if (allowedTypes && Array.isArray(allowedTypes) && allowedTypes.length > 0) {
            if (!allowedTypes.includes(file.type)) {
                reject(new Error(`Tipo não permitido: ${file.type}. Aceitos: ${allowedTypes.join(', ')}`)); return;
            }
        }
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

function readImageAsBase64(file, maxSizeMB) {
    const maxBytes = (maxSizeMB || 2) * 1024 * 1024;
    return readFileAsBase64(file, maxBytes, ['image/jpeg', 'image/png', 'image/webp']);
}

window.readFileAsBase64 = readFileAsBase64;
window.readImageAsBase64 = readImageAsBase64;

// =============================================
// TOAST
// =============================================
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) { console.warn('[Toast] Container não encontrado:', message); return; }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 300);
    }, duration);
}

// =============================================
// DEBOUNCE
// =============================================
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// =============================================
// THEME
// =============================================
function initTheme() {
    const saved = localStorage.getItem('wd_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('wd_theme', next);
    console.log('[Theme] Alternado para:', next);
}

function updateThemeIcon() { /* SVG no HTML já é adequado para ambos */ }

// =============================================
// SIDEBAR
// =============================================
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const collapsed = localStorage.getItem('wd_sidebar_collapsed') === 'true';
    if (collapsed) sidebar.classList.add('collapsed');

    const collapseBtn = document.getElementById('sidebarCollapse') || document.getElementById('sidebarCollapseBtn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('wd_sidebar_collapsed', sidebar.classList.contains('collapsed'));
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            const overlay = document.getElementById('sidebarOverlay');
            if (overlay) overlay.classList.toggle('active', sidebar.classList.contains('mobile-open'));
        });
    }

    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        });
    }
}

// =============================================
// HELPER: extrair array da resposta da API
// =============================================
function extrairArray(data, chave) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (chave && data[chave] && Array.isArray(data[chave])) return data[chave];
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
}

// =============================================
// 🗂️ SISTEMA DE NAVEGAÇÃO POR ABAS (SPA)
// =============================================

/**
 * Configuração de cada aba: título do header, botão de ação, e função init
 */
const ABA_CONFIG = {
    dashboard: {
        titulo: 'Dashboard',
        botaoHtml: '<a href="#aba-orcamentos" class="btn btn-primary btn-sm" data-aba="orcamentos">+ Novo Orçamento</a>',
        init: 'init_dashboard'
    },
    orcamentos: {
        titulo: 'Orçamentos',
        botaoHtml: '<button class="btn btn-primary btn-sm" onclick="mostrarFormulario()" id="btnNovoOrcamento">+ Novo Orçamento</button>',
        init: 'init_orcamentos'
    },
    clientes: {
        titulo: 'Clientes',
        botaoHtml: '<button class="btn btn-primary btn-sm" onclick="abrirModalCliente()">+ Novo Cliente</button>',
        init: 'init_clientes'
    },
    produtos: {
        titulo: 'Produtos',
        botaoHtml: '<button class="btn btn-primary btn-sm" onclick="abrirModalProduto()">+ Novo Produto</button>',
        init: 'init_produtos'
    },
    configuracoes: {
        titulo: 'Configurações',
        botaoHtml: '',
        init: 'init_configuracoes'
    }
};

let abaAtual = 'dashboard';

/**
 * Navega para uma aba específica
 */
function navegarAba(nomeAba) {
    const config = ABA_CONFIG[nomeAba];
    if (!config) {
        console.warn('[Nav] Aba desconhecida:', nomeAba);
        return;
    }

    // Desativar aba atual
    document.querySelectorAll('.aba-content').forEach(el => el.classList.remove('aba-ativa'));
    document.querySelectorAll('.sidebar-link[data-aba]').forEach(el => el.classList.remove('active'));

    // Ativar nova aba
    const secao = document.getElementById('aba-' + nomeAba);
    if (secao) secao.classList.add('aba-ativa');

    const link = document.querySelector(`.sidebar-link[data-aba="${nomeAba}"]`);
    if (link) link.classList.add('active');

    // Atualizar header
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) headerTitle.textContent = config.titulo;

    const btnAction = document.getElementById('btnHeaderAction');
    if (btnAction) btnAction.innerHTML = config.botaoHtml;

    // Atualizar hash
    abaAtual = nomeAba;
    if (window.location.hash !== '#aba-' + nomeAba) {
        history.pushState(null, '', '#aba-' + nomeAba);
    }

    // Fechar sidebar mobile
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('mobile-open');
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    // Chamar init da aba
    if (config.init && typeof window[config.init] === 'function') {
        console.log('[Nav] Inicializando aba:', nomeAba);
        window[config.init]();
    }

    console.log('[Nav] Navegou para:', nomeAba);
}

/**
 * Inicializa a navegação por abas
 */
function initNavegacao() {
    // Cliques nos links do sidebar
    document.querySelectorAll('.sidebar-link[data-aba]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const aba = link.getAttribute('data-aba');
            if (aba) navegarAba(aba);
        });
    });

    // Cliques em links com data-aba dentro do conteúdo (ex: "Ver todos" no dashboard)
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-aba]');
        if (link && !link.classList.contains('sidebar-link')) {
            e.preventDefault();
            const aba = link.getAttribute('data-aba');
            if (aba) navegarAba(aba);
        }
    });

    // Navegação por hash (browser back/forward)
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#aba-', '');
        if (hash && ABA_CONFIG[hash] && hash !== abaAtual) {
            navegarAba(hash);
        }
    });

    // Determinar aba inicial
    const hash = window.location.hash.replace('#aba-', '');
    const abaInicial = (hash && ABA_CONFIG[hash]) ? hash : 'dashboard';
    navegarAba(abaInicial);
}

// =============================================
// INICIALIZAÇÃO GLOBAL
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] Inicializando SPA...');
    console.log('[App] API_BASE_URL:', API_BASE_URL);

    initTheme();
    initSidebar();

    const themeBtn = document.getElementById('themeToggle') || document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Iniciar sistema de abas
    initNavegacao();

    console.log('[App] SPA inicializado com sucesso');
});
