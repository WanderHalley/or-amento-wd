/**
 * ============================================================
 * dashboard.js — Lógica do Dashboard (index.html)
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initSidebar();
    carregarDashboard();
    carregarUltimosOrcamentos();
});

/**
 * Carrega as estatísticas do dashboard.
 */
async function carregarDashboard() {
    try {
        const result = await apiGet('/api/dashboard');
        if (result.success && result.data) {
            const d = result.data;
            const elClientes = document.getElementById('statClientes');
            const elProdutos = document.getElementById('statProdutos');
            const elPendentes = document.getElementById('statPendentes');
            const elAprovados = document.getElementById('statAprovados');
            if (elClientes) elClientes.textContent = d.total_clientes || 0;
            if (elProdutos) elProdutos.textContent = d.total_produtos_ativos || 0;
            if (elPendentes) elPendentes.textContent = d.total_orcamentos_pendentes || 0;
            if (elAprovados) elAprovados.textContent = formatCurrency(d.total_valor_aprovados || 0);
        }
    } catch (error) {
        console.error('[Dashboard] Erro ao carregar stats:', error);
        const elClientes = document.getElementById('statClientes');
        const elProdutos = document.getElementById('statProdutos');
        const elPendentes = document.getElementById('statPendentes');
        const elAprovados = document.getElementById('statAprovados');
        if (elClientes) elClientes.textContent = '0';
        if (elProdutos) elProdutos.textContent = '0';
        if (elPendentes) elPendentes.textContent = '0';
        if (elAprovados) elAprovados.textContent = 'R$ 0,00';
    }
}

/**
 * Carrega os últimos 10 orçamentos para a tabela do dashboard.
 */
async function carregarUltimosOrcamentos() {
    const tbody = document.getElementById('tabelaUltimosOrcamentos');
    if (!tbody) return;

    try {
        const result = await apiGet('/api/orcamentos?limit=10');
        const orcamentos = (result.success && result.data) ? result.data : [];

        if (!Array.isArray(orcamentos) || orcamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
                '<h4>Nenhum orçamento encontrado</h4>' +
                '<p>Crie seu primeiro orçamento</p>' +
                '<a href="orcamentos.html?novo=1" class="btn btn-primary btn-sm">Criar orçamento</a>' +
                '</div></td></tr>';
            return;
        }

        tbody.innerHTML = orcamentos.map(function (orc) {
            const numero = orc.numero_orcamento || '-';
            const cliente = orc.clientes || {};
            const clienteNome = cliente.nome || '-';
            const dataStr = formatDate(orc.data_emissao || orc.created_at);
            const valor = formatCurrency(orc.valor_total || 0);
            const status = orc.status || 'pendente';
            const badgeClass = 'badge-' + status;
            const statusLabel = capitalizeFirst(status);

            return '<tr>' +
                '<td><strong>#' + escapeHtml(String(numero)) + '</strong></td>' +
                '<td>' + escapeHtml(clienteNome) + '</td>' +
                '<td>' + dataStr + '</td>' +
                '<td><strong>' + valor + '</strong></td>' +
                '<td><span class="badge ' + badgeClass + '">' + statusLabel + '</span></td>' +
                '<td><a href="preview.html?id=' + orc.id + '" class="btn-icon view" title="Visualizar">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
                '</a></td>' +
                '</tr>';
        }).join('');
    } catch (error) {
        console.error('[Dashboard] Erro ao carregar orçamentos:', error);
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">' +
            '<h4>Erro ao carregar orçamentos</h4>' +
            '<p>' + escapeHtml(error.message) + '</p>' +
            '</div></td></tr>';
    }
}
