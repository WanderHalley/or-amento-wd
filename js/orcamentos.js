/**
 * ============================================================
 * orcamentos.js - Gerenciamento de Orçamentos
 * Lista, criação, alteração de status, exclusão
 * ============================================================
 */

// Estado local
let orcamentosData = [];
let produtosDisponiveis = [];
let clientesDisponiveis = [];
let deleteOrcamentoId = null;
let itemCounter = 0;

// ============================================================
// Inicialização
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    carregarOrcamentos();

    // Verificar se veio com ?novo=1 na URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('novo') === '1') {
        mostrarFormulario();
    }
});

// ============================================================
// Views: Lista vs Formulário
// ============================================================

/**
 * Mostra a lista de orçamentos.
 */
function mostrarLista() {
    document.getElementById('viewLista').style.display = '';
    document.getElementById('viewFormulario').style.display = 'none';
    document.getElementById('pageTitle').textContent = 'Orçamentos';
    document.getElementById('headerActions').innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="mostrarFormulario()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Orçamento
        </button>
    `;
    carregarOrcamentos();
}

/**
 * Mostra o formulário de criação de orçamento.
 */
async function mostrarFormulario() {
    document.getElementById('viewLista').style.display = 'none';
    document.getElementById('viewFormulario').style.display = '';
    document.getElementById('pageTitle').textContent = 'Novo Orçamento';
    document.getElementById('headerActions').innerHTML = '';

    // Resetar formulário
    document.getElementById('formOrcamento').reset();
    document.getElementById('itensContainer').innerHTML = '';
    document.getElementById('totalOrcamento').textContent = 'R$ 0,00';
    itemCounter = 0;

    // Preencher datas padrão
    document.getElementById('orcDataEmissao').value = getToday();
    document.getElementById('orcDataValidade').value = getDatePlusDays(30);

    // Restaurar valores padrão dos prazos
    document.getElementById('orcPrazoPagamento').value = 'Dividimos em Até 10x Sem Juros no Cartão de Crédito ou 10% de Desconto no Boleto ou Pix à Vista';
    document.getElementById('orcPrazoDespacho').value = 'Em Até 5 Dias Úteis';

    // Carregar clientes e produtos para os selects
    await Promise.all([
        carregarClientesSelect(),
        carregarProdutosSelect()
    ]);

    // Adicionar primeiro item
    adicionarItem();
}

/**
 * Carrega clientes no select do formulário.
 */
async function carregarClientesSelect() {
    try {
        const result = await apiGet('/api/clientes?limit=200');
        if (result.success) {
            clientesDisponiveis = result.data;
            const select = document.getElementById('orcClienteId');
            select.innerHTML = '<option value="">Selecione o cliente...</option>';
            clientesDisponiveis.forEach(c => {
                const label = c.empresa ? `${c.nome} - ${c.empresa}` : c.nome;
                select.innerHTML += `<option value="${c.id}">${escapeHtml(label)}</option>`;
            });
        }
    } catch (error) {
        showToast('Erro ao carregar clientes', 'error');
    }
}

/**
 * Carrega produtos para uso nos itens do orçamento.
 */
async function carregarProdutosSelect() {
    try {
        const result = await apiGet('/api/produtos?ativo=true&limit=200');
        if (result.success) {
            produtosDisponiveis = result.data;
        }
    } catch (error) {
        showToast('Erro ao carregar produtos', 'error');
    }
}

// ============================================================
// Itens dinâmicos do orçamento
// ============================================================

/**
 * Adiciona uma nova linha de item ao formulário.
 */
function adicionarItem() {
    itemCounter++;
    const container = document.getElementById('itensContainer');

    const optionsProdutos = produtosDisponiveis.map(p =>
        `<option value="${p.id}" data-valor="${p.valor}">${escapeHtml(p.nome)} - ${formatCurrency(p.valor)}</option>`
    ).join('');

    const html = `
        <div class="item-row" id="itemRow_${itemCounter}" data-item-id="${itemCounter}">
            <div class="form-group">
                <label>Produto <span class="required">*</span></label>
                <select id="itemProduto_${itemCounter}" onchange="atualizarItemValor(${itemCounter})" required>
                    <option value="">Selecione...</option>
                    ${optionsProdutos}
                </select>
                <div class="item-info" id="itemInfo_${itemCounter}"></div>
            </div>
            <div class="form-group">
                <label>Qtd <span class="required">*</span></label>
                <input type="number" id="itemQtd_${itemCounter}" value="1" min="1" onchange="atualizarItemValor(${itemCounter})" oninput="atualizarItemValor(${itemCounter})" required>
            </div>
            <div>
                <button type="button" class="btn-icon delete" title="Remover item" onclick="removerItem(${itemCounter})" style="margin-bottom:8px">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
}

/**
 * Atualiza a informação de valor do item e recalcula o total.
 * @param {number} idx - Índice do item
 */
function atualizarItemValor(idx) {
    const select = document.getElementById(`itemProduto_${idx}`);
    const qtdInput = document.getElementById(`itemQtd_${idx}`);
    const info = document.getElementById(`itemInfo_${idx}`);

    if (!select || !qtdInput || !info) return;

    const selectedOption = select.options[select.selectedIndex];
    const valor = parseFloat(selectedOption?.dataset?.valor || 0);
    const qtd = parseInt(qtdInput.value) || 1;
    const subtotal = valor * qtd;

    if (valor > 0) {
        info.innerHTML = `<span class="item-valor">Subtotal: ${formatCurrency(subtotal)}</span>`;
    } else {
        info.innerHTML = '';
    }

    recalcularTotal();
}

/**
 * Remove um item do formulário.
 * @param {number} idx - Índice do item
 */
function removerItem(idx) {
    const row = document.getElementById(`itemRow_${idx}`);
    if (row) {
        row.remove();
        recalcularTotal();
    }
}

/**
 * Recalcula o total do orçamento baseado nos itens visíveis.
 */
function recalcularTotal() {
    let total = 0;
    const rows = document.querySelectorAll('#itensContainer .item-row');

    rows.forEach(row => {
        const idx = row.dataset.itemId;
        const select = document.getElementById(`itemProduto_${idx}`);
        const qtdInput = document.getElementById(`itemQtd_${idx}`);

        if (select && qtdInput) {
            const selectedOption = select.options[select.selectedIndex];
            const valor = parseFloat(selectedOption?.dataset?.valor || 0);
            const qtd = parseInt(qtdInput.value) || 0;
            total += valor * qtd;
        }
    });

    document.getElementById('totalOrcamento').textContent = formatCurrency(total);
}

// ============================================================
// Salvar Orçamento
// ============================================================

/**
 * Salva o orçamento no banco de dados.
 * @param {Event} event
 */
async function salvarOrcamento(event) {
    event.preventDefault();

    const clienteId = document.getElementById('orcClienteId').value;
    if (!clienteId) {
        showToast('Selecione um cliente', 'warning');
        return;
    }

    // Coletar itens
    const itens = [];
    const rows = document.querySelectorAll('#itensContainer .item-row');

    rows.forEach(row => {
        const idx = row.dataset.itemId;
        const select = document.getElementById(`itemProduto_${idx}`);
        const qtdInput = document.getElementById(`itemQtd_${idx}`);

        if (select && qtdInput && select.value) {
            itens.push({
                produto_id: select.value,
                quantidade: parseInt(qtdInput.value) || 1
            });
        }
    });

    if (itens.length === 0) {
        showToast('Adicione pelo menos um produto ao orçamento', 'warning');
        return;
    }

    const dados = {
        cliente_id: clienteId,
        data_emissao: document.getElementById('orcDataEmissao').value || null,
        data_validade: document.getElementById('orcDataValidade').value || null,
        prazo_pagamento: document.getElementById('orcPrazoPagamento').value.trim() || null,
        prazo_despacho: document.getElementById('orcPrazoDespacho').value.trim() || null,
        observacoes: document.getElementById('orcObservacoes').value.trim() || null,
        itens: itens
    };

    try {
        const result = await apiPost('/api/orcamentos', dados);
        if (result.success) {
            showToast('Orçamento criado com sucesso!', 'success');
            // Redirecionar para preview
            const orcId = result.data.id;
            window.location.href = `preview.html?id=${orcId}`;
        }
    } catch (error) {
        showToast(`Erro ao salvar orçamento: ${error.message}`, 'error');
    }
}

// ============================================================
// Listar Orçamentos
// ============================================================

/**
 * Carrega a lista de orçamentos.
 */
async function carregarOrcamentos() {
    const tbody = document.getElementById('tbodyOrcamentos');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';

    try {
        let endpoint = '/api/orcamentos?limit=100';
        const status = document.getElementById('filtroStatus')?.value;
        if (status) endpoint += `&status=${status}`;

        const result = await apiGet(endpoint);

        if (result.success) {
            orcamentosData = result.data;
            renderizarOrcamentos(orcamentosData);
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--danger)">Erro ao carregar: ${escapeHtml(error.message)}</td></tr>`;
    }
}

/**
 * Renderiza os orçamentos na tabela.
 * @param {Array} orcamentos
 */
function renderizarOrcamentos(orcamentos) {
    const tbody = document.getElementById('tbodyOrcamentos');

    if (!orcamentos || orcamentos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <h4>Nenhum orçamento encontrado</h4>
                        <p>Crie seu primeiro orçamento</p>
                        <button class="btn btn-primary btn-sm" onclick="mostrarFormulario()">Criar Orçamento</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orcamentos.map(orc => {
        const clienteNome = orc.clientes ? orc.clientes.nome : '-';
        const clienteEmpresa = orc.clientes && orc.clientes.empresa ? ` - ${orc.clientes.empresa}` : '';

        return `
        <tr>
            <td><strong>#${orc.numero_orcamento || '-'}</strong></td>
            <td>${escapeHtml(clienteNome)}${escapeHtml(clienteEmpresa)}</td>
            <td>${formatDate(orc.data_emissao)}</td>
            <td>${formatDate(orc.data_validade)}</td>
            <td><strong>${formatCurrency(orc.valor_total)}</strong></td>
            <td><span class="badge badge-${orc.status}">${capitalizeFirst(orc.status)}</span></td>
            <td>
                <a href="preview.html?id=${orc.id}" class="btn-icon view" title="Visualizar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </a>
                <button class="btn-icon edit" title="Alterar Status" onclick="abrirModalStatus('${orc.id}', '${orc.status}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </button>
                <button class="btn-icon delete" title="Excluir" onclick="confirmarDeleteOrcamento('${orc.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Busca com debounce
const buscarOrcamentosDebounced = debounce(() => {
    carregarOrcamentos();
}, 400);

function buscarOrcamentos() {
    buscarOrcamentosDebounced();
}

// ============================================================
// Status
// ============================================================

/**
 * Abre o modal para alterar o status de um orçamento.
 * @param {string} id
 * @param {string} statusAtual
 */
function abrirModalStatus(id, statusAtual) {
    document.getElementById('statusOrcamentoId').value = id;
    document.getElementById('statusNovoValor').value = statusAtual;
    document.getElementById('modalStatus').classList.add('active');
}

/**
 * Fecha o modal de status.
 */
function fecharModalStatus() {
    document.getElementById('modalStatus').classList.remove('active');
}

/**
 * Confirma a alteração de status.
 */
async function confirmarMudarStatus() {
    const id = document.getElementById('statusOrcamentoId').value;
    const status = document.getElementById('statusNovoValor').value;

    try {
        await apiPut(`/api/orcamentos/${id}/status`, { status });
        showToast('Status atualizado com sucesso!', 'success');
        fecharModalStatus();
        carregarOrcamentos();
    } catch (error) {
        showToast(`Erro ao atualizar status: ${error.message}`, 'error');
    }
}

// ============================================================
// Excluir Orçamento
// ============================================================

/**
 * Abre o modal de confirmação para excluir.
 * @param {string} id
 */
function confirmarDeleteOrcamento(id) {
    deleteOrcamentoId = id;
    document.getElementById('modalConfirmDelete').classList.add('active');
    document.getElementById('btnConfirmDelete').onclick = async () => {
        await deletarOrcamento(deleteOrcamentoId);
    };
}

/**
 * Fecha o modal de confirmação.
 */
function fecharConfirmDelete() {
    document.getElementById('modalConfirmDelete').classList.remove('active');
    deleteOrcamentoId = null;
}

/**
 * Exclui o orçamento.
 * @param {string} id
 */
async function deletarOrcamento(id) {
    try {
        await apiDelete(`/api/orcamentos/${id}`);
        showToast('Orçamento excluído com sucesso!', 'success');
        fecharConfirmDelete();
        carregarOrcamentos();
    } catch (error) {
        showToast(`Erro ao excluir: ${error.message}`, 'error');
        fecharConfirmDelete();
    }
}
