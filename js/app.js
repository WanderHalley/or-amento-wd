/**
 * app.js — Módulo global do frontend
 * WD Máquinas — Sistema de Orçamentos (SPA por Abas)
 *
 * Provê:
 *   - API_BASE_URL e wrappers fetch
 *   - Formatação: moeda, data, telefone, CEP, CPF, CNPJ, CPF/CNPJ
 *   - Máscaras de input
 *   - unmaskValue (e alias unmask)
 *   - readFileAsBase64 (e alias readImageAsBase64)
 *   - Toast notifications
 *   - Sidebar toggle
 *   - Theme dark/light toggle
 *   - getConfig / saveConfig (localStorage)
 *   - debounce, escapeHtml, getToday, getDatePlusDays, formatFileName
 *   - 🧭 SISTEMA DE NAVEGAÇÃO ENTRE ABAS
 */

// ═══════════════════════════════════════════
// ⚙️ API BASE URL
// ═══════════════════════════════════════════
const API_BASE_URL = 'https://wanderhalleylee-orcamento-wd.hf.space';

// ═══════════════════════════════════════════
// ⚙️ CONFIGURAÇÕES PADRÃO DA EMPRESA
// ═══════════════════════════════════════════
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

// ═══════════════════════════════════════════
// ⚙️ API WRAPPERS
// ═══════════════════════════════════════════
async function apiGet(path) {
    const url = API_BASE_URL + path;
    console.log('[API GET]', url);
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) { const e = await response.text().catch(() => response.statusText); throw new Error(`GET ${path} failed (${response.status}): ${e}`); }
    return await response.json();
}

async function apiPost(path, body) {
    const url = API_BASE_URL + path;
    console.log('[API POST]', url, body);
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) { const e = await response.text().catch(() => response.statusText); throw new Error(`POST ${path} failed (${response.status}): ${e}`); }
    return await response.json();
}

async function apiPut(path, body) {
    const url = API_BASE_URL + path;
    console.log('[API PUT]', url, body);
    const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) { const e = await response.text().catch(() => response.statusText); throw new Error(`PUT ${path} failed (${response.status}): ${e}`); }
    return await response.json();
}

async function apiDelete(path) {
    const url = API_BASE_URL + path;
    console.log('[API DELETE]', url);
    const response = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) { const e = await response.text().catch(() => response.statusText); throw new Error(`DELETE ${path} failed (${response.status}): ${e}`); }
    return await response.json();
}

// ═══════════════════════════════════════════
// ⚙️ FORMATAÇÃO
// ═══════════════════════════════════════════
function formatCurrency(value) {
    return (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('T')[0].split('-');
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
    if (dateStr) { const p = dateStr.split('T')[0].split('-'); if (p.length === 3) dateFormatted = `${p[2]}-${p[1]}-${p[0]}`; }
    if (!dateFormatted) { const n = new Date(); dateFormatted = `${String(n.getDate()).padStart(2,'0')}-${String(n.getMonth()+1).padStart(2,'0')}-${n.getFullYear()}`; }
    return `${cleanName} - ${dateFormatted}`;
}

// ═══════════════════════════════════════════
// ⚙️ MÁSCARAS DE FORMATAÇÃO
// ═══════════════════════════════════════════
function formatPhone(value) {
    if (!value) return '';
    const d = String(value).replace(/\D/g, '');
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6,10)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
}

function formatCEP(value) {
    if (!value) return '';
    const d = String(value).replace(/\D/g, '');
    if (d.length <= 5) return d;
    return `${d.slice(0,5)}-${d.slice(5,8)}`;
}

function formatCPF(value) {
    if (!value) return '';
    const d = String(value).replace(/\D/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
}

function formatCNPJ(value) {
    if (!value) return '';
    const d = String(value).replace(/\D/g, '');
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
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
        const pos = this.selectionStart;
        const oldLen = this.value.length;
        this.value = formatFn(this.value);
        const newPos = pos + (this.value.length - oldLen);
        this.setSelectionRange(newPos, newPos);
    });
}

// ═══════════════════════════════════════════
// ⚙️ LEITURA DE ARQUIVO COMO BASE64
// ═══════════════════════════════════════════
function readFileAsBase64(file, maxBytes, allowedTypes) {
    return new Promise((resolve, reject) => {
        if (!file) { reject(new Error('Nenhum arquivo selecionado')); return; }
        if (maxBytes && file.size > maxBytes) { reject(new Error(`Arquivo muito grande. Máximo: ${(maxBytes/(1024*1024)).toFixed(1)} MB`)); return; }
        if (allowedTypes && Array.isArray(allowedTypes) && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) { reject(new Error(`Tipo não permitido: ${file.type}. Aceitos: ${allowedTypes.join(', ')}`)); return; }
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

function readImageAsBase64(file, maxSizeMB) {
    return readFileAsBase64(file, (maxSizeMB || 2) * 1024 * 1024, ['image/jpeg','image/png','image/webp']);
}

window.readFileAsBase64 = readFileAsBase64;
window.readImageAsBase64 = readImageAsBase64;

// ═══════════════════════════════════════════
// ⚙️ TOAST NOTIFICATIONS
// ═══════════════════════════════════════════
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) { console.warn('[Toast] Container não encontrado:', message); return; }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]||icons.info}</span><span class="toast-message">${escapeHtml(message)}</span><button class="toast-close" onclick="this.parentElement.remove()">&times;</button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => { toast.classList.remove('toast-show'); toast.classList.add('toast-hide'); setTimeout(() => { if (toast.parentElement) toast.remove(); }, 300); }, duration);
}

// ═══════════════════════════════════════════
// ⚙️ DEBOUNCE
// ═══════════════════════════════════════════
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); };
}

// ═══════════════════════════════════════════
// ⚙️ HELPER: extrair array da resposta da API
// ═══════════════════════════════════════════
function extrairArray(data, chave) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (chave && data[chave] && Array.isArray(data[chave])) return data[chave];
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
}

// ═══════════════════════════════════════════
// 🎨 THEME (Dark / Light)
// ═══════════════════════════════════════════
function initTheme() {
    const saved = localStorage.getItem('wd_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('wd_theme', next);
    updateThemeIcon();
    console.log('[Theme] Alternado para:', next);
}

function updateThemeIcon() {
    const iconEl = document.getElementById('themeIcon');
    if (iconEl) iconEl.textContent = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? '🌙' : '☀️';
}

// ═══════════════════════════════════════════
// 📂 SIDEBAR
// ═══════════════════════════════════════════
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
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
    }

    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => sidebar.classList.remove('mobile-open'));
    }

    // Fechar sidebar mobile ao clicar em link
    sidebar.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
        });
    });
}

// ═══════════════════════════════════════════
// 🧭 SISTEMA DE NAVEGAÇÃO ENTRE ABAS
// ═══════════════════════════════════════════

/**
 * Configuração por aba: título do header e botão de ação
 */
const ABA_CONFIG = {
    dashboard:     { titulo: 'Dashboard',     btnTexto: '+ Novo Orçamento', btnAction: () => { navegarAba('orcamentos'); setTimeout(mostrarFormulario, 100); } },
    orcamentos:    { titulo: 'Orçamentos',    btnTexto: '+ Novo Orçamento', btnAction: () => mostrarFormulario() },
    clientes:      { titulo: 'Clientes',      btnTexto: '+ Novo Cliente',   btnAction: () => abrirModalCliente() },
    produtos:      { titulo: 'Produtos',      btnTexto: '+ Novo Produto',   btnAction: () => abrirModalProduto() },
    configuracoes: { titulo: 'Configurações',  btnTexto: '',                  btnAction: null },
};

/** Aba ativa atual */
let abaAtual = 'dashboard';

/**
 * Navega para uma aba específica
 * @param {string} nomeAba — dashboard | orcamentos | clientes | produtos | configuracoes
 */
function navegarAba(nomeAba) {
    // Esconder todas as abas
    document.querySelectorAll('.aba-content').forEach(aba => aba.classList.remove('aba-ativa'));

    // Mostrar a aba selecionada
    const secao = document.getElementById('aba-' + nomeAba);
    if (secao) secao.classList.add('aba-ativa');

    // Atualizar sidebar link ativo
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    const linkAtivo = document.querySelector(`.sidebar-link[data-aba="${nomeAba}"]`);
    if (linkAtivo) linkAtivo.classList.add('active');

    // Atualizar header
    const config = ABA_CONFIG[nomeAba] || {};
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) headerTitle.textContent = config.titulo || nomeAba;

    // Atualizar botão de ação do header
    const btnAction = document.getElementById('btnHeaderAction');
    if (btnAction) {
        if (config.btnTexto) {
            btnAction.textContent = config.btnTexto;
            btnAction.style.display = '';
            btnAction.onclick = (e) => { e.preventDefault(); config.btnAction(); };
            // Remover href para não navegar
            btnAction.removeAttribute('href');
            btnAction.setAttribute('href', '#');
        } else {
            btnAction.style.display = 'none';
        }
    }

    // Salvar aba atual
    abaAtual = nomeAba;
    history.replaceState(null, '', `#${nomeAba}`);

    // Chamar init da aba se existir
    if (typeof window['init_' + nomeAba] === 'function') {
        window['init_' + nomeAba]();
    }

    console.log('[Nav] Aba:', nomeAba);
}

/**
 * Inicializa os listeners de navegação da sidebar
 */
function initNavegacao() {
    document.querySelectorAll('.sidebar-link[data-aba]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const aba = link.dataset.aba;
            if (aba) navegarAba(aba);
        });
    });
}

// ═══════════════════════════════════════════
// 🚀 INICIALIZAÇÃO GLOBAL
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] Inicializando SPA...');
    console.log('[App] API_BASE_URL:', API_BASE_URL);

    // Tema
    initTheme();

    // Sidebar
    initSidebar();

    // Theme toggle button
    const themeBtn = document.getElementById('themeToggle') || document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Navegação por abas
    initNavegacao();

    // Determinar aba inicial: hash da URL ou parâmetro ?novo=1
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');
    const abasValidas = Object.keys(ABA_CONFIG);

    if (hash && abasValidas.includes(hash)) {
        navegarAba(hash);
    } else if (params.get('novo') === '1') {
        navegarAba('orcamentos');
        setTimeout(mostrarFormulario, 200);
    } else {
        navegarAba('dashboard');
    }

    console.log('[App] SPA inicializado com sucesso');
});
