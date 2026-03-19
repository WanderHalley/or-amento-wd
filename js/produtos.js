/**
 * produtos.js — CRUD de Produtos com upload de imagem Base64
 * Depende de: app.js (apiGet, apiPost, apiPut, apiDelete, showToast, readFileAsBase64, etc.)
 */

// ========== ESTADO LOCAL ==========
let produtosData = [];
let deleteProdutoId = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initTheme === 'function') initTheme();
    if (typeof initSidebar === 'function') initSidebar();
    if (typeof updateThemeIcon === 'function') updateThemeIcon();

    carregarProdutos();
});

// ========== CARREGAR PRODUTOS ==========
async function carregarProdutos(busca = '') {
    const tbody = document.getElementById('tabelaProdutos');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-state">
                <div class="loading-spinner"></div>
                <p>Carregando...</p>
            </td>
        </tr>`;

    try {
        let url = '/api/produtos?limit=200';
        if (busca) url += `&busca=${encodeURIComponent(busca)}`;

        const data = await apiGet(url);
        produtosData = data.produtos || data || [];

        console.log('[Produtos] Carregados:', produtosData.length);
        renderizarProdutos(produtosData);

    } catch (error) {
        console.error('[Produtos] Erro ao carregar:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p>Erro ao carregar produtos.</p>
                </td>
            </tr>`;
        showToast('Erro ao carregar produtos', 'error');
    }
}

// ========== RENDERIZAR TABELA ==========
function renderizarProdutos(produtos) {
    const tbody = document.getElementById('tabelaProdutos');
    if (!tbody) return;

    if (!produtos || produtos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p>Nenhum produto encontrado.</p>
                    <button class="btn btn-primary btn-sm" onclick="abrirModalProduto()" style="margin-top:10px;">+ Adicionar produto</button>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = produtos.map(p => {
        const nome = escapeHtml(p.nome || '-');

        // Imagem: prioridade base64 > url > placeholder
        let imgHtml = '<span style="color:var(--text-muted);">Sem imagem</span>';
        if (p.imagem_base64) {
            imgHtml = `<img src="${p.imagem_base64}" alt="${nome}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;">`;
        } else if (p.imagem_url) {
            imgHtml = `<img src="${escapeHtml(p.imagem_url)}" alt="${nome}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;" onerror="this.outerHTML='<span>Sem imagem</span>'">`;
        }

        // Dimensões
        const dims = [];
        if (p.altura) dims.push(`A: ${p.altura}cm`);
        if (p.largura) dims.push(`L: ${p.largura}cm`);
        if (p.profundidade) dims.push(`P: ${p.profundidade}cm`);
        const dimensoes = dims.length > 0 ? dims.join(' × ') : '-';

        const peso = p.peso ? `${p.peso} kg` : '-';
        const preco = formatCurrency(p.valor || 0);
        const statusClass = p.ativo ? 'badge-success' : 'badge-secondary';
        const statusLabel = p.ativo ? 'Ativo' : 'Inativo';

        return `
            <tr>
                <td>${imgHtml}</td>
                <td><strong>${nome}</strong></td>
                <td><small>${dimensoes}</small></td>
                <td>${peso}</td>
                <td><strong>${preco}</strong></td>
                <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button class="btn btn-outline btn-sm" onclick="editarProduto('${p.id}')" title="Editar">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmarDeleteProduto('${p.id}')" title="Excluir">🗑️</button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

// ========== BUSCA COM DEBOUNCE ==========
const buscarProdutosDebounced = debounce(() => {
    const busca = document.getElementById('buscaProduto')?.value || '';
    carregarProdutos(busca);
}, 400);

// ========== MODAL: ABRIR/FECHAR ==========
function abrirModalProduto() {
    document.getElementById('modalProdutoTitulo').textContent = 'Novo Produto';
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('produtoImagemBase64').value = '';
    document.getElementById('produtoImagemPreview').style.display = 'none';
    document.getElementById('produtoAtivo').value = 'true';
    document.getElementById('modalProduto').classList.add('active');
}

function fecharModalProduto() {
    document.getElementById('modalProduto').classList.remove('active');
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('produtoImagemBase64').value = '';
    document.getElementById('produtoImagemPreview').style.display = 'none';
}

// ========== EDITAR PRODUTO ==========
async function editarProduto(id) {
    try {
        const produto = await apiGet(`/api/produtos/${id}`);
        console.log('[Produtos] Editando:', produto);

        document.getElementById('modalProdutoTitulo').textContent = 'Editar Produto';
        document.getElementById('produtoId').value = produto.id;
        document.getElementById('produtoNome').value = produto.nome || '';
        document.getElementById('produtoDescricao').value = produto.descricao || '';
        document.getElementById('produtoEspecificacoes').value = produto.especificacoes || '';
        document.getElementById('produtoValor').value = produto.valor || '';
        document.getElementById('produtoPeso').value = produto.peso || '';
        document.getElementById('produtoAltura').value = produto.altura || '';
        document.getElementById('produtoLargura').value = produto.largura || '';
        document.getElementById('produtoProfundidade').value = produto.profundidade || '';
        document.getElementById('produtoAtivo').value = produto.ativo ? 'true' : 'false';
        document.getElementById('produtoImagemUrl').value = produto.imagem_url || '';

        // Imagem base64 existente
        const base64 = produto.imagem_base64 || '';
        document.getElementById('produtoImagemBase64').value = base64;
        if (base64) {
            document.getElementById('produtoImagemTag').src = base64;
            document.getElementById('produtoImagemPreview').style.display = 'block';
        } else if (produto.imagem_url) {
            document.getElementById('produtoImagemTag').src = produto.imagem_url;
            document.getElementById('produtoImagemPreview').style.display = 'block';
        } else {
            document.getElementById('produtoImagemPreview').style.display = 'none';
        }

        document.getElementById('modalProduto').classList.add('active');

    } catch (error) {
        console.error('[Produtos] Erro ao carregar produto:', error);
        showToast('Erro ao carregar dados do produto', 'error');
    }
}

// ========== PREVIEW DE IMAGEM ==========
async function previewImagemProduto(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Usa a função do app.js para ler e validar
        const base64 = await readFileAsBase64(file, 2 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/webp']);

        document.getElementById('produtoImagemBase64').value = base64;
        document.getElementById('produtoImagemTag').src = base64;
        document.getElementById('produtoImagemPreview').style.display = 'block';

        console.log('[Produtos] Imagem carregada, tamanho base64:', base64.length);

    } catch (error) {
        console.error('[Produtos] Erro no upload de imagem:', error);
        showToast(error.message || 'Erro ao carregar imagem', 'error');
        event.target.value = '';
    }
}

function removerImagemProduto() {
    document.getElementById('produtoImagemBase64').value = '';
    document.getElementById('produtoImagem').value = '';
    document.getElementById('produtoImagemPreview').style.display = 'none';
    document.getElementById('produtoImagemTag').src = '';
}

// ========== SALVAR PRODUTO ==========
async function salvarProduto(event) {
    event.preventDefault();

    const id = document.getElementById('produtoId').value;
    const nome = document.getElementById('produtoNome').value.trim();
    const valor = parseFloat(document.getElementById('produtoValor').value);

    // Validação
    if (!nome) {
        showToast('O nome do produto é obrigatório', 'warning');
        return;
    }
    if (!valor || valor <= 0) {
        showToast('O preço deve ser maior que zero', 'warning');
        return;
    }

    const dados = {
        nome: nome,
        descricao: document.getElementById('produtoDescricao').value.trim() || null,
        especificacoes: document.getElementById('produtoEspecificacoes').value.trim() || null,
        valor: valor,
        peso: parseFloat(document.getElementById('produtoPeso').value) || null,
        altura: parseFloat(document.getElementById('produtoAltura').value) || null,
        largura: parseFloat(document.getElementById('produtoLargura').value) || null,
        profundidade: parseFloat(document.getElementById('produtoProfundidade').value) || null,
        ativo: document.getElementById('produtoAtivo').value === 'true',
        imagem_url: document.getElementById('produtoImagemUrl').value.trim() || null,
        imagem_base64: document.getElementById('produtoImagemBase64').value || null,
    };

    console.log('[Produtos] Salvando:', { ...dados, imagem_base64: dados.imagem_base64 ? `[${dados.imagem_base64.length} chars]` : null });

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
        console.error('[Produtos] Erro ao salvar:', error);
        showToast(`Erro ao salvar produto: ${error.message}`, 'error');
    }
}

// ========== DELETAR PRODUTO ==========
function confirmarDeleteProduto(id) {
    deleteProdutoId = id;
    document.getElementById('confirmDeleteProduto').classList.add('active');
}

function fecharConfirmDeleteProduto() {
    deleteProdutoId = null;
    document.getElementById('confirmDeleteProduto').classList.remove('active');
}

async function deletarProduto() {
    if (!deleteProdutoId) return;

    try {
        await apiDelete(`/api/produtos/${deleteProdutoId}`);
        showToast('Produto excluído com sucesso!', 'success');
        fecharConfirmDeleteProduto();
        carregarProdutos();

    } catch (error) {
        console.error('[Produtos] Erro ao excluir:', error);
        showToast(`Erro ao excluir produto: ${error.message}`, 'error');
        fecharConfirmDeleteProduto();
    }
}
