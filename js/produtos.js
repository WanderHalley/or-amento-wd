/**
 * ============================================================
 * produtos.js - CRUD de Produtos
 * ============================================================
 */

// Estado local
let produtosData = [];
let deleteProdutoId = null;

// ============================================================
// Carregar produtos ao abrir a página
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    carregarProdutos();
});

/**
 * Carrega a lista de produtos da API e renderiza na tabela.
 * @param {string} busca - Termo de busca opcional
 */
async function carregarProdutos(busca = '') {
    const tbody = document.getElementById('tbodyProdutos');
    tbody.innerHTML = '<tr><td colspan="6"><div class="spinner"></div></td></tr>';

    try {
        let endpoint = '/api/produtos?limit=200';
        if (busca) endpoint += `&busca=${encodeURIComponent(busca)}`;

        const result = await apiGet(endpoint);

        if (result.success) {
            produtosData = result.data;
            renderizarProdutos(produtosData);
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--danger)">Erro ao carregar produtos: ${escapeHtml(error.message)}</td></tr>`;
        showToast('Erro ao carregar produtos', 'error');
    }
}

/**
 * Renderiza a lista de produtos na tabela HTML.
 * @param {Array} produtos
 */
function renderizarProdutos(produtos) {
    const tbody = document.getElementById('tbodyProdutos');

    if (!produtos || produtos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        <h4>Nenhum produto cadastrado</h4>
                        <p>Adicione seu primeiro produto para começar</p>
                        <button class="btn btn-primary btn-sm" onclick="abrirModalProduto()">Adicionar Produto</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = produtos.map(p => {
        const dims = [];
        if (p.altura_cm) dims.push(`A: ${p.altura_cm}cm`);
        if (p.largura_cm) dims.push(`L: ${p.largura_cm}cm`);
        if (p.profundidade_cm) dims.push(`P: ${p.profundidade_cm}cm`);
        const dimStr = dims.length > 0 ? dims.join(' x ') : '-';

        return `
        <tr>
            <td>
                <strong>${escapeHtml(p.nome)}</strong>
                ${p.descricao ? `<br><span style="font-size:12px;color:var(--gray-500)">${escapeHtml(p.descricao.substring(0, 80))}${p.descricao.length > 80 ? '...' : ''}</span>` : ''}
            </td>
            <td style="font-size:13px">${dimStr}</td>
            <td>${p.peso_kg ? p.peso_kg + ' kg' : '-'}</td>
            <td><strong style="color:var(--primary)">${formatCurrency(p.valor)}</strong></td>
            <td><span class="badge ${p.ativo ? 'badge-aprovado' : 'badge-expirado'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
            <td>
                <button class="btn-icon edit" title="Editar" onclick="editarProduto('${p.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon delete" title="Excluir" onclick="confirmarDeleteProduto('${p.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// ============================================================
// Busca com debounce
// ============================================================
const buscarProdutosDebounced = debounce((termo) => {
    carregarProdutos(termo);
}, 400);

function buscarProdutos() {
    const termo = document.getElementById('buscaProduto').value.trim();
    buscarProdutosDebounced(termo);
}

// ============================================================
// Modal - Abrir / Fechar
// ============================================================

function abrirModalProduto() {
    document.getElementById('modalProdutoTitulo').textContent = 'Novo Produto';
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('modalProduto').classList.add('active');
}

function fecharModalProduto() {
    document.getElementById('modalProduto').classList.remove('active');
}

async function editarProduto(id) {
    try {
        const result = await apiGet(`/api/produtos/${id}`);
        if (result.success) {
            const p = result.data;
            document.getElementById('modalProdutoTitulo').textContent = 'Editar Produto';
            document.getElementById('produtoId').value = p.id;
            document.getElementById('produtoNome').value = p.nome || '';
            document.getElementById('produtoDescricao').value = p.descricao || '';
            document.getElementById('produtoEspecificacoes').value = p.especificacoes || '';
            document.getElementById('produtoValor').value = p.valor || '';
            document.getElementById('produtoAltura').value = p.altura_cm || '';
            document.getElementById('produtoLargura').value = p.largura_cm || '';
            document.getElementById('produtoProfundidade').value = p.profundidade_cm || '';
            document.getElementById('produtoPeso').value = p.peso_kg || '';
            document.getElementById('produtoImagem').value = p.imagem_url || '';
            document.getElementById('modalProduto').classList.add('active');
        }
    } catch (error) {
        showToast('Erro ao carregar produto', 'error');
    }
}

// ============================================================
// Salvar (Criar / Atualizar)
// ============================================================

async function salvarProduto(event) {
    event.preventDefault();

    const id = document.getElementById('produtoId').value;
    const dados = {
        nome: document.getElementById('produtoNome').value.trim(),
        descricao: document.getElementById('produtoDescricao').value.trim() || null,
        especificacoes: document.getElementById('produtoEspecificacoes').value.trim() || null,
        valor: parseFloat(document.getElementById('produtoValor').value) || 0,
        altura_cm: parseFloat(document.getElementById('produtoAltura').value) || null,
        largura_cm: parseFloat(document.getElementById('produtoLargura').value) || null,
        profundidade_cm: parseFloat(document.getElementById('produtoProfundidade').value) || null,
        peso_kg: parseFloat(document.getElementById('produtoPeso').value) || null,
        imagem_url: document.getElementById('produtoImagem').value.trim() || null,
    };

    if (!dados.nome) {
        showToast('O nome do produto é obrigatório', 'warning');
        return;
    }
    if (!dados.valor || dados.valor <= 0) {
        showToast('Informe um valor válido para o produto', 'warning');
        return;
    }

    try {
        if (id) {
            await apiPut(`/api/produtos/${id}`, dados);
            showToast('Produto atualizado com sucesso!', 'success');
        } else {
            await apiPost('/api/produtos', dados);
            showToast('Produto criado com sucesso!', 'success');
        }

        fecharModalProduto();
        carregarProdutos();
    } catch (error) {
        showToast(`Erro ao salvar: ${error.message}`, 'error');
    }
}

// ============================================================
// Excluir
// ============================================================

function confirmarDeleteProduto(id) {
    deleteProdutoId = id;
    document.getElementById('modalConfirmDelete').classList.add('active');
    document.getElementById('btnConfirmDelete').onclick = async () => {
        await deletarProduto(deleteProdutoId);
    };
}

function fecharConfirmDelete() {
    document.getElementById('modalConfirmDelete').classList.remove('active');
    deleteProdutoId = null;
}

async function deletarProduto(id) {
    try {
        await apiDelete(`/api/produtos/${id}`);
        showToast('Produto excluído com sucesso!', 'success');
        fecharConfirmDelete();
        carregarProdutos();
    } catch (error) {
        showToast(`Erro ao excluir: ${error.message}`, 'error');
        fecharConfirmDelete();
    }
}
