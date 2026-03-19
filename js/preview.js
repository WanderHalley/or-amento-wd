/**
 * ============================================================
 * preview.js - Visualização / Preview do Orçamento
 * Renderiza o orçamento no estilo profissional para impressão
 * ============================================================
 */

// Dados do orçamento carregado
let orcamentoAtual = null;

// ============================================================
// Inicialização
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();

    // Pegar ID da URL
    const params = new URLSearchParams(window.location.search);
    const orcId = params.get('id');

    if (!orcId) {
        document.getElementById('previewContent').innerHTML = `
            <div class="empty-state">
                <h4>Nenhum orçamento selecionado</h4>
                <p>Selecione um orçamento para visualizar</p>
                <a href="orcamentos.html" class="btn btn-primary btn-sm">Ver Orçamentos</a>
            </div>
        `;
        return;
    }

    carregarOrcamento(orcId);
});

/**
 * Carrega os dados completos do orçamento e renderiza o preview.
 * @param {string} id - ID do orçamento
 */
async function carregarOrcamento(id) {
    try {
        const result = await apiGet(`/api/orcamentos/${id}`);
        if (result.success) {
            orcamentoAtual = result.data;
            renderizarPreview(orcamentoAtual);
        }
    } catch (error) {
        document.getElementById('previewContent').innerHTML = `
            <div class="empty-state">
                <h4>Erro ao carregar orçamento</h4>
                <p>${escapeHtml(error.message)}</p>
                <a href="orcamentos.html" class="btn btn-primary btn-sm">Voltar</a>
            </div>
        `;
    }
}

/**
 * Renderiza o preview completo do orçamento.
 * @param {Object} orc - Dados do orçamento
 */
function renderizarPreview(orc) {
    const container = document.getElementById('previewContent');
    const empresa = orc.empresa || {};
    const cliente = orc.clientes || {};
    const itens = orc.itens || [];

    // Montar linhas da tabela de itens
    let itensHTML = '';
    itens.forEach((item, index) => {
        const produto = item.produtos || {};
        itensHTML += `
            <tr>
                <td>${index + 1}</td>
                <td class="nome-produto">${escapeHtml(produto.nome || 'Produto')}</td>
                <td>${item.quantidade}</td>
                <td>${formatCurrency(item.valor_unitario)}</td>
                <td><strong>${formatCurrency(item.valor_total)}</strong></td>
            </tr>
        `;
    });

    // Montar especificações e dimensões de todos os produtos
    let specsHTML = '';
    let dimensoesHTML = '';
    let imagensHTML = '';

    itens.forEach(item => {
        const produto = item.produtos || {};

        // Imagem do produto
        if (produto.imagem_url) {
            imagensHTML += `
                <div class="orc-produto-imagem">
                    <img src="${escapeHtml(produto.imagem_url)}" alt="${escapeHtml(produto.nome || 'Produto')}">
                </div>
            `;
        }

        // Especificações
        if (produto.descricao || produto.especificacoes) {
            specsHTML += `
                <div class="orc-specs">
                    <h4>${escapeHtml(produto.nome || 'Produto')}</h4>
                    ${produto.descricao ? `<p>${escapeHtml(produto.descricao)}</p>` : ''}
                    ${produto.especificacoes ? `<p>${escapeHtml(produto.especificacoes)}</p>` : ''}
                </div>
            `;
        }

        // Dimensões
        if (produto.altura_cm || produto.largura_cm || produto.profundidade_cm || produto.peso_kg) {
            dimensoesHTML += `
                <div class="orc-dimensoes">
                    ${produto.altura_cm ? `
                    <div class="orc-dim-item">
                        <div class="dim-label">Altura</div>
                        <div class="dim-value">${produto.altura_cm}</div>
                        <div class="dim-unit">CM</div>
                    </div>
                    ` : ''}
                    ${produto.largura_cm ? `
                    <div class="orc-dim-item">
                        <div class="dim-label">Largura</div>
                        <div class="dim-value">${produto.largura_cm}</div>
                        <div class="dim-unit">CM</div>
                    </div>
                    ` : ''}
                    ${produto.profundidade_cm ? `
                    <div class="orc-dim-item">
                        <div class="dim-label">Profundidade</div>
                        <div class="dim-value">${produto.profundidade_cm}</div>
                        <div class="dim-unit">CM</div>
                    </div>
                    ` : ''}
                    ${produto.peso_kg ? `
                    <div class="orc-dim-item">
                        <div class="dim-label">Peso</div>
                        <div class="dim-value">${produto.peso_kg}</div>
                        <div class="dim-unit">KG</div>
                    </div>
                    ` : ''}
                </div>
            `;
        }
    });

    // Montar HTML completo do preview
    container.innerHTML = `
        <!-- HEADER -->
        <div class="orc-header">
            <div class="orc-empresa">
                <h2>${escapeHtml(empresa.nome || 'WD MÁQUINAS')}</h2>
                <p>${escapeHtml(empresa.endereco || '')}</p>
                <p>${escapeHtml(empresa.bairro_cep || '')}</p>
                <p>CNPJ: ${escapeHtml(empresa.cnpj || '')}</p>
                <p>${escapeHtml(empresa.telefone || '')} | ${escapeHtml(empresa.email || '')}</p>
            </div>
            <div class="orc-meta">
                <h3>ORÇAMENTO</h3>
                <div class="orc-numero">#${orc.numero_orcamento || '-'}</div>
                <div class="orc-meta-row"><strong>Emissão:</strong> ${formatDate(orc.data_emissao)}</div>
                <div class="orc-meta-row"><strong>Validade:</strong> ${formatDate(orc.data_validade)}</div>
                <div style="margin-top:8px">
                    <span class="badge badge-${orc.status}">${capitalizeFirst(orc.status)}</span>
                </div>
            </div>
        </div>

        <!-- CLIENTE -->
        <div class="orc-cliente-section">
            <h4>Cliente</h4>
            <div class="nome">${escapeHtml(cliente.nome || '-')}${cliente.empresa ? ' - ' + escapeHtml(cliente.empresa) : ''}</div>
            ${cliente.telefone ? `<div class="info">Tel: ${escapeHtml(cliente.telefone)}</div>` : ''}
            ${cliente.email ? `<div class="info">Email: ${escapeHtml(cliente.email)}</div>` : ''}
            ${cliente.endereco ? `<div class="info">Endereço: ${escapeHtml(cliente.endereco)}${cliente.cidade ? ', ' + escapeHtml(cliente.cidade) : ''}${cliente.estado ? '/' + escapeHtml(cliente.estado) : ''}${cliente.cep ? ' - CEP: ' + escapeHtml(cliente.cep) : ''}</div>` : ''}
            ${cliente.cnpj_cpf ? `<div class="info">CNPJ/CPF: ${escapeHtml(cliente.cnpj_cpf)}</div>` : ''}
        </div>

        <!-- TABELA DE ITENS -->
        <table class="orc-tabela">
            <thead>
                <tr>
                    <th style="width:50px">#</th>
                    <th>Produto</th>
                    <th style="width:80px">Qtd</th>
                    <th style="width:130px">Valor Un.</th>
                    <th style="width:130px">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itensHTML}
            </tbody>
        </table>

        <!-- TOTAL -->
        <div class="orc-total-row">
            <div class="orc-total-box">
                <span>VALOR TOTAL</span>
                <strong>${formatCurrency(orc.valor_total)}</strong>
            </div>
        </div>

        <!-- INFORMAÇÕES: PAGAMENTO, DESPACHO, DIMENSÕES -->
        <div class="orc-info-grid">
            <div class="orc-info-box">
                <h5>Prazo de Pagamento</h5>
                <p>${escapeHtml(orc.prazo_pagamento || '-')}</p>
            </div>
            <div class="orc-info-box">
                <h5>Prazo para Despacho</h5>
                <p>${escapeHtml(orc.prazo_despacho || '-')}</p>
            </div>
            <div class="orc-info-box">
                <h5>Observações</h5>
                <p>${escapeHtml(orc.observacoes || 'Nenhuma observação')}</p>
            </div>
        </div>

        <!-- IMAGENS DOS PRODUTOS -->
        ${imagensHTML}

        <!-- ESPECIFICAÇÕES -->
        ${specsHTML}

        <!-- DIMENSÕES -->
        ${dimensoesHTML}

        <!-- FOOTER -->
        <div class="orc-footer">
            <p>${escapeHtml(empresa.nome || 'WD MÁQUINAS')} - ${escapeHtml(empresa.telefone || '')} - ${escapeHtml(empresa.email || '')}</p>
            <p style="margin-top:4px">Orçamento válido até ${formatDate(orc.data_validade)}</p>
        </div>
    `;
}

// ============================================================
// Compartilhar via WhatsApp
// ============================================================

/**
 * Gera link de compartilhamento do orçamento via WhatsApp.
 */
function compartilharWhatsApp() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'warning');
        return;
    }

    const orc = orcamentoAtual;
    const cliente = orc.clientes || {};
    const empresa = orc.empresa || {};

    // Montar itens em texto
    const itensTexto = (orc.itens || []).map((item, i) => {
        const prod = item.produtos || {};
        return `${i + 1}. ${prod.nome || 'Produto'} - Qtd: ${item.quantidade} - ${formatCurrency(item.valor_total)}`;
    }).join('\n');

    const texto = `*${empresa.nome || 'WD MÁQUINAS'}*\n` +
        `*ORÇAMENTO #${orc.numero_orcamento || '-'}*\n\n` +
        `*Cliente:* ${cliente.nome || '-'}${cliente.empresa ? ' - ' + cliente.empresa : ''}\n` +
        `*Emissão:* ${formatDate(orc.data_emissao)}\n` +
        `*Validade:* ${formatDate(orc.data_validade)}\n\n` +
        `*Itens:*\n${itensTexto}\n\n` +
        `*TOTAL: ${formatCurrency(orc.valor_total)}*\n\n` +
        `*Pagamento:* ${orc.prazo_pagamento || '-'}\n` +
        `*Despacho:* ${orc.prazo_despacho || '-'}\n\n` +
        `${empresa.telefone || ''} | ${empresa.email || ''}`;

    const encoded = encodeURIComponent(texto);

    // Se o cliente tem telefone, direcionar para ele
    let whatsUrl = `https://wa.me/?text=${encoded}`;
    if (cliente.telefone) {
        // Limpar telefone - remover tudo que não é número
        const tel = cliente.telefone.replace(/\D/g, '');
        if (tel.length >= 10) {
            const telFull = tel.startsWith('55') ? tel : '55' + tel;
            whatsUrl = `https://wa.me/${telFull}?text=${encoded}`;
        }
    }

    window.open(whatsUrl, '_blank');
}
