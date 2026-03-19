/**
 * ============================================================
 * app.js - Módulo Global
 * Configuração da API, funções utilitárias, sidebar, toast
 * ============================================================
 */

// ============================================================
// CONFIGURAÇÃO - Altere para a URL do seu backend no HF Spaces
// ============================================================
const API_BASE_URL = 'https://Wanderhalleylee-orcamento-wd.hf.space/health';

// ============================================================
// Funções de API (fetch wrapper com tratamento de erro)
// ============================================================

/**
 * Faz uma requisição GET à API.
 * @param {string} endpoint - Caminho da rota (ex: /api/clientes)
 * @returns {Promise<Object>} Resposta JSON
 */
async function apiGet(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Erro ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`GET ${endpoint} falhou:`, error);
        throw error;
    }
}

/**
 * Faz uma requisição POST à API.
 * @param {string} endpoint - Caminho da rota
 * @param {Object} data - Dados a enviar
 * @returns {Promise<Object>} Resposta JSON
 */
async function apiPost(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Erro ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`POST ${endpoint} falhou:`, error);
        throw error;
    }
}

/**
 * Faz uma requisição PUT à API.
 * @param {string} endpoint - Caminho da rota
 * @param {Object} data - Dados a enviar
 * @returns {Promise<Object>} Resposta JSON
 */
async function apiPut(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Erro ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`PUT ${endpoint} falhou:`, error);
        throw error;
    }
}

/**
 * Faz uma requisição DELETE à API.
 * @param {string} endpoint - Caminho da rota
 * @returns {Promise<Object>} Resposta JSON
 */
async function apiDelete(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Erro ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`DELETE ${endpoint} falhou:`, error);
        throw error;
    }
}

// ============================================================
// Funções de Formatação
// ============================================================

/**
 * Formata valor numérico para moeda brasileira (R$).
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado
 */
function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata data ISO para formato brasileiro DD/MM/YYYY.
 * @param {string} dateStr - Data em formato ISO ou YYYY-MM-DD
 * @returns {string} Data formatada
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        // Trata tanto "2026-03-19" quanto "2026-03-19T00:00:00"
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    } catch {
        return dateStr;
    }
}

/**
 * Retorna data atual no formato YYYY-MM-DD.
 * @returns {string}
 */
function getToday() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Retorna data daqui a N dias no formato YYYY-MM-DD.
 * @param {number} days
 * @returns {string}
 */
function getDatePlusDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
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

/**
 * Escapa HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// Toast (Notificações)
// ============================================================

/**
 * Exibe uma notificação toast.
 * @param {string} message - Mensagem
 * @param {string} type - Tipo: success, error, warning, info
 * @param {number} duration - Duração em ms (padrão 4000)
 */
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

    // Auto-remover após duração
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// ============================================================
// Sidebar (mobile toggle)
// ============================================================

/**
 * Inicializa o comportamento do sidebar responsivo.
 */
function initSidebar() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('active');
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// ============================================================
// Debounce para buscas
// ============================================================

/**
 * Cria uma versão debounced de uma função.
 * @param {Function} func
 * @param {number} wait - Tempo em ms
 * @returns {Function}
 */
function debounce(func, wait = 300) {
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

// ============================================================
// Inicialização global
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
});
