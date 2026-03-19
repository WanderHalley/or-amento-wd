/**
 * app.js — Módulo global do frontend
 * WD Máquinas — Sistema de Orçamentos
 *
 * Este arquivo provê:
 *   - API_BASE_URL e wrappers fetch (apiGet, apiPost, apiPut, apiDelete)
 *   - Formatação: moeda, data, telefone, CEP, CPF, CNPJ, CPF/CNPJ
 *   - Máscaras de input
 *   - unmaskValue (e alias unmask)
 *   - readFileAsBase64 (e alias readImageAsBase64)
 *   - Toast notifications
 *   - Sidebar toggle (busca sidebarCollapse OU sidebarCollapseBtn)
 *   - Theme dark/light toggle (busca themeToggle OU themeToggleBtn)
 *   - getConfig / saveConfig (localStorage)
 *   - debounce, escapeHtml, getToday, getDatePlusDays, formatFileName
 */

// =============================================
// API BASE URL — ALTERAR PARA SUA URL DO HF SPACES
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

/**
 * Retorna configurações salvas no localStorage (ou padrão)
 */
function getConfig() {
    try {
        const saved = localStorage.getItem('wd_config');
        if (saved) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn('[Config] Erro ao ler localStorage:', e);
    }
    return { ...DEFAULT_CONFIG };
}

/**
 * Salva configurações no localStorage
 */
function saveConfig(config) {
    try {
        localStorage.setItem('wd_config', JSON.stringify(config));
        console.log('[Config] Salvo com sucesso');
    } catch (e) {
        console.error('[Config] Erro ao salvar:', e);
    }
}

// =============================================
// API WRAPPERS (fetch com URL completa)
// =============================================

/**
 * GET request à API
 */
async function apiGet(path) {
    const url = API_BASE_URL + path;
    console.log('[API GET]', url);

    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`GET ${path} failed (${response.status}): ${errorText}`);
    }

    return await response.json();
}

/**
 * POST request à API
 */
async function apiPost(path, body) {
    const url = API_BASE_URL + path;
    console.log('[API POST]', url, body);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`POST ${path} failed (${response.status}): ${errorText}`);
    }

    return await response.json();
}

/**
 * PUT request à API
 */
async function apiPut(path, body) {
    const url = API_BASE_URL + path;
    console.log('[API PUT]', url, body);

    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`PUT ${path} failed (${response.status}): ${errorText}`);
    }

    return await response.json();
}

/**
 * DELETE request à API
 */
async function apiDelete(path) {
    const url = API_BASE_URL + path;
    console.log('[API DELETE]', url);

    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`DELETE ${path} failed (${response.status}): ${errorText}`);
    }

    return await response.json();
}

// =============================================
// FORMATAÇÃO
// =============================================

/**
 * Formata valor em Reais: 3235 → "R$ 3.235,00"
 */
function formatCurrency(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

/**
 * Formata data ISO para DD/MM/YYYY: "2026-03-19" → "19/03/2026"
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    // Se já está em formato DD/MM/YYYY, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

    // Pega só a parte da data (ignora hora se tiver)
    const datePart = dateStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

/**
 * Retorna data de hoje no formato YYYY-MM-DD
 */
function getToday() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Retorna data de hoje + N dias no formato YYYY-MM-DD
 */
function getDatePlusDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + (days || 0));
    return d.toISOString().split('T')[0];
}

/**
 * Capitaliza primeira letra
 */
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Gera nome de arquivo para PDF: "Produto - 19-03-2026.pdf"
 */
function formatFileName(name, dateStr) {
    const cleanName = (name || 'Orcamento').replace(/[^a-zA-Z0-9À-ú\s\-#]/g, '').trim();
    let dateFormatted = '';
    if (dateStr) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            dateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    if (!dateFormatted) {
        const now = new Date();
        dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    }
    return `${cleanName} - ${dateFormatted}`;
}

// =============================================
// MÁSCARAS DE FORMATAÇÃO
// =============================================

/**
 * Formata telefone: 16991966519 → "(16) 99196-6519"
 * Aceita 10 dígitos (fixo) ou 11 (celular)
 */
function formatPhone(value) {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
        // Fixo: (XX) XXXX-XXXX
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    }
    // Celular: (XX) XXXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Formata CEP: 14409170 → "14409-170"
 */
function formatCEP(value) {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Formata CPF: 12345678901 → "123.456.789-01"
 */
function formatCPF(value) {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Formata CNPJ: 29595239000133 → "29.595.239/0001-33"
 */
function formatCNPJ(value) {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Formata CPF ou CNPJ automaticamente baseado na quantidade de dígitos
 * Até 11 dígitos → CPF, acima → CNPJ
 */
function formatCPFCNPJ(value) {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length <= 11) {
        return formatCPF(digits);
    }
    return formatCNPJ(digits);
}

/**
 * Remove máscara — retorna apenas dígitos
 * Nome principal: unmaskValue (chamado pelos JS de páginas)
 */
function unmaskValue(value) {
    if (!value) return '';
    return String(value).replace(/\D/g, '');
}

// Alias: alguns arquivos usam "unmask" em vez de "unmaskValue"
window.unmask = unmaskValue;

/**
 * Aplica máscara em um input conforme o usuário digita
 * @param {HTMLInputElement} input
 * @param {Function} formatFn — função de formatação (formatPhone, formatCEP, etc.)
 */
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

/**
 * Lê um arquivo como Base64 com validação de tamanho e tipo
 * Nome principal: readFileAsBase64 (chamado por produtos.js e configuracoes.js)
 *
 * @param {File} file — arquivo do input
 * @param {number} maxBytes — tamanho máximo em bytes (ex: 2 * 1024 * 1024 = 2MB)
 * @param {string[]} [allowedTypes] — tipos MIME permitidos (opcional)
 * @returns {Promise<string>} — data URL em base64
 */
function readFileAsBase64(file, maxBytes, allowedTypes) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Nenhum arquivo selecionado'));
            return;
        }

        // Validar tamanho
        if (maxBytes && file.size > maxBytes) {
            const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
            reject(new Error(`Arquivo muito grande. Máximo: ${maxMB} MB`));
            return;
        }

        // Validar tipo
        if (allowedTypes && Array.isArray(allowedTypes) && allowedTypes.length > 0) {
            if (!allowedTypes.includes(file.type)) {
                reject(new Error(`Tipo de arquivo não permitido: ${file.type}. Aceitos: ${allowedTypes.join(', ')}`));
                return;
            }
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            resolve(e.target.result);
        };
        reader.onerror = function () {
            reject(new Error('Erro ao ler arquivo'));
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Alias: o app.js original tinha readImageAsBase64(file, maxSizeMB)
 * Mantém compatibilidade — converte maxSizeMB para bytes e chama readFileAsBase64
 */
function readImageAsBase64(file, maxSizeMB) {
    const maxBytes = (maxSizeMB || 2) * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return readFileAsBase64(file, maxBytes, allowedTypes);
}

// Garantir que ambos os nomes estão no escopo global
window.readFileAsBase64 = readFileAsBase64;
window.readImageAsBase64 = readImageAsBase64;
window.unmaskValue = unmaskValue;

// =============================================
// TOAST NOTIFICATIONS
// =============================================

/**
 * Mostra notificação toast
 * @param {string} message — texto da mensagem
 * @param {string} type — 'success' | 'error' | 'warning' | 'info'
 * @param {number} duration — duração em ms (padrão 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('[Toast] Container não encontrado, usando alert:', message);
        return;
    }

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
        toast.classList.add('toast-show');
    });

    // Auto remover
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 300);
    }, duration);
}

// =============================================
// DEBOUNCE
// =============================================

/**
 * Cria versão debounced de uma função
 */
function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// =============================================
// THEME (Dark / Light)
// =============================================

/**
 * Inicializa tema baseado no localStorage
 */
function initTheme() {
    const saved = localStorage.getItem('wd_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon();
}

/**
 * Alterna entre dark e light
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('wd_theme', next);
    updateThemeIcon();
    console.log('[Theme] Alternado para:', next);
}

/**
 * Atualiza ícone do botão de tema
 */
function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';

    // Buscar ícone — pode estar em diferentes IDs dependendo da página
    const iconEl = document.getElementById('themeIcon');
    if (iconEl) {
        iconEl.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

// =============================================
// SIDEBAR
// =============================================

/**
 * Inicializa sidebar: collapse e mobile toggle
 * Busca IDs: sidebarCollapse OU sidebarCollapseBtn (compatibilidade)
 */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Restaurar estado salvo
    const collapsed = localStorage.getItem('wd_sidebar_collapsed') === 'true';
    if (collapsed) {
        sidebar.classList.add('collapsed');
    }

    // Botão collapse — aceita AMBOS os IDs
    const collapseBtn = document.getElementById('sidebarCollapse') || document.getElementById('sidebarCollapseBtn');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('wd_sidebar_collapsed', isCollapsed);
            console.log('[Sidebar] Collapsed:', isCollapsed);
        });
    }

    // Menu toggle mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Overlay mobile — fechar ao clicar
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
        });
    }

    // Fechar sidebar mobile ao clicar em link
    const navLinks = sidebar.querySelectorAll('.nav-link, .sidebar-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-open');
            }
        });
    });
}

// =============================================
// HELPER: extrair array da resposta da API
// =============================================

/**
 * A API retorna em formatos diferentes dependendo do endpoint:
 *   { clientes: [...] }              — /api/clientes
 *   { produtos: [...] }              — /api/produtos
 *   { orcamentos: [...] }            — /api/orcamentos
 *   { success: true, data: [...] }   — formato alternativo
 *   [...]                            — array direto
 *
 * Esta função extrai o array independente do formato.
 */
function extrairArray(data, chave) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (chave && data[chave] && Array.isArray(data[chave])) return data[chave];
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
}

// =============================================
// INICIALIZAÇÃO GLOBAL
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] Inicializando...');
    console.log('[App] API_BASE_URL:', API_BASE_URL);

    // Tema
    initTheme();

    // Sidebar
    initSidebar();

    // Theme toggle button — aceita AMBOS os IDs
    const themeBtn = document.getElementById('themeToggle') || document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    console.log('[App] Inicializado com sucesso');
});
