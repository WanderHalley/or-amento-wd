/**
 * dashboard.js — Aba Dashboard
 * WD Máquinas — Sistema de Orçamentos
 *
 * Função de entrada: init_dashboard()
 * Chamada automaticamente pelo sistema de abas (app.js)
 */

// ========== INIT ==========
function init_dashboard() {
    console.log('[Dashboard] Inicializando...');
    dashboard_carregarStats();
    dashboard_carregarUltimos();
}

// ========== CARREGAR STATS ==========
async function dashboard_carregarStats() {
    const el = (id) => document.getElementById(id);

    try {
        const data = await apiGet('/api/dashboard');
        console.log('[Dashboard] Stats:', data);

        const clientes = data.total_clientes ?? 0;
        const produtos = data.total_produtos_ativos ?? 0;
        const pendentes = data.total_orcamentos_pendentes ?? 0;
        const aprovados = data.total_valor_aprovados ?? 0;

        if (el('statClientes')) el('statClientes').textContent = clientes;
        if (el('statProdutos')) el('statProdutos').textContent = produtos;
        if (el('statPendentes')) el('statPendentes').textContent = pendentes;
        if (el('statAprovados')) el('statAprovados').textContent = formatCurrency(aprovados);

    } catch (error) {
        console.error('[Dashboard] Erro ao carregar stats:', error);
        if (el('statClientes')) el('statClientes').textContent = '0';
        if (el('statProdutos')) el('statProdutos').textContent = '0';
        if (el('statPendentes')) el('statPendentes').textContent = '0';
        if (el('statAprovados')) el('statAprovados').textContent = 'R$ 0,00';
    }
}

// ========== CARREGAR ÚLTIMOS ORÇAMENTOS ==========
async function dashboard_carregarUltimos() {
    const tbody = document.getElementById('tabelaUltimosOrcamentos');
    if (!tbody) return;

    try {
        const data = await apiGet('/api/orcamentos?limit=10');
        console.log('[Dashboard] Últimos orçamentos:', data);

        const orcamentos = data.orcamentos || data.data || [];

        if (!Array.isArray(orcamentos) || orcamentos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:40px;">
                        <p>Nenhum orçamento encontrado.</p>
                        <button class="btn btn-primary btn-sm" data-aba="orcamentos" style="margin-top:10px;">Criar primeiro orçamento</button>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = orcamentos.map(orc => {
            const numero = orc.numero || orc.numero_orcamento || orc.id?.substring(0, 8) || '-';
            const clienteNome = orc.cliente_nome || orc.cliente?.nome || '-';
            const dataStr = formatDate(orc.data_emissao || orc.created_at);
            const valor = formatCurrency(orc.valor_total || 0);
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
                    <td><strong>#${escapeHtml(String(numero))}</strong></td>
                    <td>${escapeHtml(clienteNome)}</td>
                    <td>${dataStr}</td>
                    <td><strong>${valor}</strong></td>
                    <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                    <td>
                        <a href="preview.html?id=${orc.id}" target="_blank" class="btn btn-secondary btn-sm" title="Visualizar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </a>
                    </td>
                </tr>`;
        }).join('');

    } catch (error) {
        console.error('[Dashboard] Erro ao carregar últimos orçamentos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:40px;">
                    <p>Erro ao carregar orçamentos.</p>
                </td>
            </tr>`;
    }
}
