// ═══════════════════════════════════════════
// 📌 ABA: DASHBOARD
// Toda lógica EXCLUSIVA do Dashboard
// ═══════════════════════════════════════════

/**
 * IDs usados nesta aba:
 *   statClientes, statProdutos, statPendentes, statAprovados,
 *   tabelaUltimosOrcamentos
 *
 * API:
 *   GET /api/dashboard → { total_clientes, total_produtos_ativos, total_orcamentos_pendentes, total_valor_aprovados }
 *   GET /api/orcamentos?limit=10 → { orcamentos: [...], total }
 */

// ========== ESTADO LOCAL ==========
let dashboard_carregado = false;

// ========== INIT ==========
function init_dashboard() {
    // Recarregar sempre ao entrar na aba (dados podem ter mudado)
    dashboard_carregarStats();
    dashboard_carregarUltimosOrcamentos();
    dashboard_carregado = true;
}

// ========== HELPERS COM FALLBACK ==========
function dashboard_fmtCurrency(v) {
    if (typeof formatCurrency === 'function') return formatCurrency(v);
    return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

function dashboard_fmtDate(d) {
    if (typeof formatDate === 'function') return formatDate(d);
    if (!d) return '-';
    const part = d.split('T')[0].split('-');
    if (part.length === 3) return part[2] + '/' + part[1] + '/' + part[0];
    return d;
}

function dashboard_safeEscape(s) {
    if (typeof escapeHtml === 'function') return escapeHtml(s);
    const div = document.createElement('div');
    div.textContent = String(s || '');
    return div.innerHTML;
}

// ========== DASHBOARD STATS ==========
async function dashboard_carregarStats() {
    const el = (id) => document.getElementById(id);

    try {
        const data = await apiGet('/api/dashboard');
        console.log('[Dashboard] Resposta:', data);

        const clientes = data.total_clientes ?? 0;
        const produtos = data.total_produtos_ativos ?? 0;
        const pendentes = data.total_orcamentos_pendentes ?? 0;
        const aprovados = data.total_valor_aprovados ?? 0;

        if (el('statClientes')) el('statClientes').textContent = clientes;
        if (el('statProdutos')) el('statProdutos').textContent = produtos;
        if (el('statPendentes')) el('statPendentes').textContent = pendentes;
        if (el('statAprovados')) el('statAprovados').textContent = dashboard_fmtCurrency(aprovados);

    } catch (error) {
        console.error('[Dashboard] Erro ao carregar stats:', error);
        if (el('statClientes')) el('statClientes').textContent = '0';
        if (el('statProdutos')) el('statProdutos').textContent = '0';
        if (el('statPendentes')) el('statPendentes').textContent = '0';
        if (el('statAprovados')) el('statAprovados').textContent = 'R$ 0,00';
    }
}

// ========== ÚLTIMOS ORÇAMENTOS ==========
async function dashboard_carregarUltimosOrcamentos() {
    const tbody = document.getElementById('tabelaUltimosOrcamentos');
    if (!tbody) return;

    try {
        const data = await apiGet('/api/orcamentos?limit=10');
        console.log('[Dashboard] Orçamentos resposta:', data);

        const orcamentos = data.orcamentos || data.data || [];

        if (!Array.isArray(orcamentos) || orcamentos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:40px;">
                        <p>Nenhum orçamento encontrado.</p>
                        <button class="btn btn-primary btn-sm" onclick="navegarAba('orcamentos'); setTimeout(mostrarFormulario, 100);" style="margin-top:10px;">Criar primeiro orçamento</button>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = orcamentos.map(orc => {
            const numero = orc.numero || orc.numero_orcamento || orc.id?.substring(0, 8) || '-';
            const clienteNome = orc.cliente_nome || orc.cliente?.nome || '-';
            const dataStr = dashboard_fmtDate(orc.data_emissao || orc.created_at);
            const valor = dashboard_fmtCurrency(orc.valor_total || 0);
            const status = orc.status || 'pendente';

            const badgeClass = {
                'pendente': 'badge-pendente',
                'aprovado': 'badge-aprovado',
                'recusado': 'badge-recusado',
                'expirado': 'badge-expirado'
            }[status] || 'badge-expirado';

            const statusLabel = {
                'pendente': 'Pendente',
                'aprovado': 'Aprovado',
                'recusado': 'Recusado',
                'expirado': 'Expirado'
            }[status] || status;

            return `
                <tr>
                    <td><strong>#${dashboard_safeEscape(String(numero))}</strong></td>
                    <td>${dashboard_safeEscape(clienteNome)}</td>
                    <td>${dataStr}</td>
                    <td><strong>${valor}</strong></td>
                    <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                    <td>
                        <a href="preview.html?id=${orc.id}" class="btn btn-secondary btn-sm" title="Visualizar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </a>
                    </td>
                </tr>`;
        }).join('');

    } catch (error) {
        console.error('[Dashboard] Erro ao carregar orçamentos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:40px;">
                    <p>Erro ao carregar orçamentos.</p>
                </td>
            </tr>`;
    }
}
