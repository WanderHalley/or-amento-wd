/**
 * ============================================================
 * preview.js — Visualização / Preview do Orçamento
 * ============================================================
 */

/* Estado */
let orcamentoAtual = null;

/* ============================================================
   Inicialização
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initSidebar();
    bindEventosPreview();

    var params = new URLSearchParams(window.location.search);
    var orcId = params.get('id');

    if (!orcId) {
        document.getElementById('previewLoading').style.display = 'none';
        document.getElementById('previewArea').style.display = '';
        document.getElementById('previewArea').innerHTML = '<div class="empty-state">' +
            '<h4>Nenhum orçamento selecionado</h4>' +
            '<p>Selecione um orçamento para visualizar</p>' +
            '<a href="orcamentos.html" class="btn btn-primary btn-sm">Ver Orçamentos</a></div>';
        return;
    }

    carregarOrcamentoPreview(orcId);
});

function bindEventosPreview() {
    var btnPDF = document.getElementById('btnSalvarPDF');
    if (btnPDF) btnPDF.addEventListener('click', salvarPDF);

    var btnWhats = document.getElementById('btnWhatsApp');
    if (btnWhats) btnWhats.addEventListener('click', compartilharWhatsApp);

    var btnPrint = document.getElementById('btnImprimir');
    if (btnPrint) btnPrint.addEventListener('click', imprimirOrcamento);

    var btnEmail = document.getElementById('btnEnviarEmail');
    if (btnEmail) btnEmail.addEventListener('click', abrirModalEmail);

    var btnFecharEmail = document.getElementById('btnFecharModalEmail');
    if (btnFecharEmail) btnFecharEmail.addEventListener('click', fecharModalEmail);

    var btnCancelarEmail = document.getElementById('btnCancelarEmail');
    if (btnCancelarEmail) btnCancelarEmail.addEventListener('click', fecharModalEmail);

    var btnConfirmarEmail = document.getElementById('btnConfirmarEmail');
    if (btnConfirmarEmail) btnConfirmarEmail.addEventListener('click', enviarEmail);

    var modalEmail = document.getElementById('modalEmail');
    if (modalEmail) {
        modalEmail.addEventListener('click', function (e) {
            if (e.target === modalEmail) fecharModalEmail();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') fecharModalEmail();
    });
}

/* ============================================================
   Helper — Limpar texto para nome de arquivo
   ============================================================ */

function limparParaNome(texto) {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, '.')
        .replace(/\.+/g, '.')
        .replace(/^\.+|\.+$/g, '');
}

/* ============================================================
   Helper — Gerar nome do arquivo
   produto + cliente + data atual
   ============================================================ */

function gerarNomeArquivo() {
    var orc = orcamentoAtual;
    if (!orc) return 'orcamento';

    var nomeProduto = '';
    var itens = orc.itens || [];
    if (itens.length > 0) {
        var primeiroProduto = itens[0].produtos || {};
        nomeProduto = primeiroProduto.nome || '';
    }
    if (!nomeProduto) nomeProduto = 'orcamento';

    var cliente = orc.clientes || {};
    var nomeCliente = cliente.nome || '';

    var hoje = new Date();
    var dia = String(hoje.getDate()).padStart(2, '0');
    var mes = String(hoje.getMonth() + 1).padStart(2, '0');
    var ano = String(hoje.getFullYear()).slice(-2);
    var dataFormatada = dia + '.' + mes + '.' + ano;

    var partes = [];
    partes.push(limparParaNome(nomeProduto));
    if (nomeCliente) partes.push(limparParaNome(nomeCliente));
    partes.push(dataFormatada);

    return partes.join('.');
}

/* ============================================================
   Carregar Orçamento
   ============================================================ */

async function carregarOrcamentoPreview(id) {
    try {
        var result = await apiGet('/api/orcamentos/' + id);
        if (result.success && result.data) {
            orcamentoAtual = result.data;
            renderizarPreview(orcamentoAtual);
        }
    } catch (error) {
        document.getElementById('previewLoading').style.display = 'none';
        document.getElementById('previewArea').style.display = '';
        document.getElementById('previewArea').innerHTML = '<div class="empty-state">' +
            '<h4>Erro ao carregar orçamento</h4>' +
            '<p>' + escapeHtml(error.message) + '</p>' +
            '<a href="orcamentos.html" class="btn btn-primary btn-sm">Voltar</a></div>';
    }
}

/* ============================================================
   Renderizar Preview
   ============================================================ */

function renderizarPreview(orc) {
    var loading = document.getElementById('previewLoading');
    var area = document.getElementById('previewArea');

    loading.style.display = 'none';
    area.style.display = '';

    var empresa = orc.empresa || {};
    var cliente = orc.clientes || {};
    var itens = orc.itens || [];

    var logoHtml = '';
    if (empresa.logo_base64) {
        logoHtml = '<img src="' + empresa.logo_base64 + '" alt="Logo" class="orc-empresa-logo">';
    }

    var itensHTML = '';
    itens.forEach(function (item, index) {
        var produto = item.produtos || {};
        itensHTML += '<tr>' +
            '<td>' + (index + 1) + '</td>' +
            '<td class="nome-produto">' + escapeHtml(produto.nome || 'Produto') + '</td>' +
            '<td>' + item.quantidade + '</td>' +
            '<td>' + formatCurrency(item.valor_unitario) + '</td>' +
            '<td><strong>' + formatCurrency(item.valor_total) + '</strong></td>' +
            '</tr>';
    });

    var specsHTML = '';
    var dimensoesHTML = '';
    var imagensHTML = '';

    itens.forEach(function (item) {
        var produto = item.produtos || {};

        var imgSrc = produto.imagem_base64 || produto.imagem_url || '';
        if (imgSrc) {
            imagensHTML += '<div class="orc-produto-imagem">' +
                '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(produto.nome || '') + '">' +
                '</div>';
        }

        if (produto.descricao || produto.especificacoes) {
            specsHTML += '<div class="orc-specs">' +
                '<h4>' + escapeHtml(produto.nome || 'Produto') + '</h4>' +
                (produto.descricao ? '<p>' + escapeHtml(produto.descricao) + '</p>' : '') +
                (produto.especificacoes ? '<p>' + escapeHtml(produto.especificacoes) + '</p>' : '') +
                '</div>';
        }

        if (produto.altura_cm || produto.largura_cm || produto.profundidade_cm || produto.peso_kg) {
            dimensoesHTML += '<div class="orc-dimensoes">' +
                (produto.altura_cm ? '<div class="orc-dim-item"><div class="dim-label">Altura</div><div class="dim-value">' + produto.altura_cm + '</div><div class="dim-unit">CM</div></div>' : '') +
                (produto.largura_cm ? '<div class="orc-dim-item"><div class="dim-label">Largura</div><div class="dim-value">' + produto.largura_cm + '</div><div class="dim-unit">CM</div></div>' : '') +
                (produto.profundidade_cm ? '<div class="orc-dim-item"><div class="dim-label">Profundidade</div><div class="dim-value">' + produto.profundidade_cm + '</div><div class="dim-unit">CM</div></div>' : '') +
                (produto.peso_kg ? '<div class="orc-dim-item"><div class="dim-label">Peso</div><div class="dim-value">' + produto.peso_kg + '</div><div class="dim-unit">KG</div></div>' : '') +
                '</div>';
        }
    });

    var obsHtml = '';
    if (orc.observacoes) {
        obsHtml = '<div class="orc-section">' +
            '<div class="orc-section-title">Observações</div>' +
            '<p class="orc-obs-text">' + escapeHtml(orc.observacoes) + '</p>' +
            '</div>';
    }

    area.innerHTML =
        '<div class="orc-header">' +
            '<div class="orc-empresa">' +
                logoHtml +
                '<h2>' + escapeHtml(empresa.nome || 'WD MÁQUINAS') + '</h2>' +
                (empresa.endereco ? '<p>' + escapeHtml(empresa.endereco) + '</p>' : '') +
                (empresa.cnpj ? '<p>CNPJ: ' + escapeHtml(formatCNPJ(empresa.cnpj)) + '</p>' : '') +
                (empresa.telefone || empresa.email ? '<p>' + (empresa.telefone ? escapeHtml(formatPhone(empresa.telefone)) : '') + (empresa.telefone && empresa.email ? ' | ' : '') + (empresa.email ? escapeHtml(empresa.email) : '') + '</p>' : '') +
            '</div>' +
            '<div class="orc-meta">' +
                '<h3>ORÇAMENTO</h3>' +
                '<div class="orc-numero">#' + escapeHtml(String(orc.numero_orcamento || '-')) + '</div>' +
                '<div class="orc-meta-row"><strong>Emissão:</strong> ' + formatDate(orc.data_emissao) + '</div>' +
                '<div class="orc-meta-row"><strong>Validade:</strong> ' + formatDate(orc.data_validade) + '</div>' +
                '<div class="orc-status-badge no-print">' +
                    '<span class="badge badge-' + (orc.status || 'pendente') + '">' + capitalizeFirst(orc.status || 'pendente') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>' +

        '<div class="orc-section"><div class="orc-section-title">Dados do Cliente</div>' +
            '<div class="orc-cliente-box">' +
                '<div class="nome">' + escapeHtml(cliente.nome || '-') + (cliente.empresa ? ' - ' + escapeHtml(cliente.empresa) : '') + '</div>' +
                (cliente.cpf_cnpj ? '<div class="info">CPF/CNPJ: ' + escapeHtml(formatCPFCNPJ(cliente.cpf_cnpj)) + '</div>' : '') +
                (cliente.telefone ? '<div class="info">Tel: ' + escapeHtml(formatPhone(cliente.telefone)) + '</div>' : '') +
                (cliente.email ? '<div class="info">Email: ' + escapeHtml(cliente.email) + '</div>' : '') +
                (cliente.endereco ? '<div class="info">Endereço: ' + escapeHtml(cliente.endereco) + (cliente.cidade ? ', ' + escapeHtml(cliente.cidade) : '') + (cliente.estado ? '/' + escapeHtml(cliente.estado) : '') + (cliente.cep ? ' - CEP: ' + escapeHtml(formatCEP(cliente.cep)) : '') + '</div>' : '') +
            '</div>' +
        '</div>' +

        '<div class="orc-section"><div class="orc-section-title">Itens do Orçamento</div>' +
            '<table class="orc-tabela"><thead><tr>' +
                '<th style="width:50px;">#</th><th>Produto</th><th style="width:80px;">Qtd</th><th style="width:130px;">Valor Un.</th><th style="width:130px;">Total</th>' +
            '</tr></thead><tbody>' + itensHTML + '</tbody></table>' +
        '</div>' +

        '<div class="orc-total-row"><div class="orc-total-box"><span>VALOR TOTAL</span><strong>' + formatCurrency(orc.valor_total) + '</strong></div></div>' +

        '<div class="orc-section"><div class="orc-section-title">Condições Comerciais</div>' +
            '<div class="orc-info-grid">' +
                '<div class="orc-info-box"><h5>Forma de Pagamento</h5><p>' + escapeHtml(orc.forma_pagamento || '-') + '</p></div>' +
                '<div class="orc-info-box"><h5>Prazo de Entrega</h5><p>' + escapeHtml(orc.prazo_entrega || '-') + '</p></div>' +
            '</div>' +
        '</div>' +

        obsHtml +

        (imagensHTML ? '<div class="orc-section"><div class="orc-section-title">Imagens dos Produtos</div>' + imagensHTML + '</div>' : '') +
        (specsHTML ? '<div class="orc-section"><div class="orc-section-title">Especificações Técnicas</div>' + specsHTML + '</div>' : '') +
        (dimensoesHTML ? '<div class="orc-section"><div class="orc-section-title">Dimensões</div>' + dimensoesHTML + '</div>' : '') +

        '<div class="orc-footer">' +
            '<p>' + escapeHtml(empresa.nome || 'WD MÁQUINAS') +
            (empresa.telefone ? ' - ' + escapeHtml(formatPhone(empresa.telefone)) : '') +
            (empresa.email ? ' - ' + escapeHtml(empresa.email) : '') + '</p>' +
            '<p>Orçamento válido até ' + formatDate(orc.data_validade) + '</p>' +
        '</div>';
}

/* ============================================================
   PDF — Preenche a folha A4 inteira, sem bordas
   ============================================================ */

async function salvarPDF() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'warning');
        return;
    }

    var btn = document.getElementById('btnSalvarPDF');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Gerando PDF...';

    var clone = null;

    try {
        var previewArea = document.getElementById('previewArea');

        var a4Wpx = 794;
        var a4Hpx = 1123;
        var paddingInterno = 40;

        /* Clonar conteúdo */
        clone = previewArea.cloneNode(true);
        clone.classList.add('pdf-mode');

        /* Esconder status */
        var badgesClone = clone.querySelectorAll('.no-print');
        badgesClone.forEach(function (el) { el.style.display = 'none'; });

        /* Posicionar offscreen com dimensões exatas de A4 */
        clone.style.cssText =
            'position:absolute;left:-9999px;top:0;' +
            'width:' + a4Wpx + 'px;' +
            'min-height:' + a4Hpx + 'px;' +
            'padding:' + paddingInterno + 'px;' +
            'margin:0;' +
            'background:#ffffff;color:#1a1a1a;' +
            "font-family:'Inter',sans-serif;" +
            'font-size:14px;line-height:1.5;' +
            'display:block;box-sizing:border-box;' +
            'overflow:hidden;';

        document.body.appendChild(clone);
        await new Promise(function (r) { setTimeout(r, 200); });

        /* Medir altura real */
        var alturaReal = clone.scrollHeight;

        /* Se excede A4, aplicar scale para comprimir */
        if (alturaReal > a4Hpx) {
            var escala = a4Hpx / alturaReal;
            clone.style.transform = 'scale(' + escala + ')';
            clone.style.transformOrigin = 'top left';
            clone.style.width = (a4Wpx / escala) + 'px';
            clone.style.padding = (paddingInterno / escala) + 'px';

            await new Promise(function (r) { setTimeout(r, 200); });
        }

        /* Capturar */
        var captureW = Math.ceil(clone.getBoundingClientRect().width) || a4Wpx;

        var canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: a4Wpx,
            height: a4Hpx,
            windowWidth: captureW
        });

        /* Remover clone */
        document.body.removeChild(clone);
        clone = null;

        /* Criar PDF */
        var jsPDFClass = null;
        if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF === 'function') {
            jsPDFClass = window.jspdf.jsPDF;
        } else if (typeof window.jsPDF === 'function') {
            jsPDFClass = window.jsPDF;
        } else {
            throw new Error('Biblioteca jsPDF não foi carregada. Recarregue a página.');
        }

        var pdf = new jsPDFClass('p', 'mm', 'a4');
        var pdfW = pdf.internal.pageSize.getWidth();
        var pdfH = pdf.internal.pageSize.getHeight();

        /* Imagem ocupa a folha INTEIRA — margem 0 */
        var imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

        /* Salvar */
        var nomeArquivo = gerarNomeArquivo() + '.pdf';
        pdf.save(nomeArquivo);
        showToast('PDF salvo: ' + nomeArquivo, 'success');

    } catch (error) {
        if (clone && clone.parentNode) {
            clone.parentNode.removeChild(clone);
        }
        showToast('Erro ao gerar PDF: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Salvar PDF';
    }
}

/* ============================================================
   Imprimir
   ============================================================ */

function imprimirOrcamento() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'warning');
        return;
    }

    var tituloOriginal = document.title;
    document.title = gerarNomeArquivo();

    setTimeout(function () {
        window.print();
        setTimeout(function () {
            document.title = tituloOriginal;
        }, 1000);
    }, 100);
}

/* ============================================================
   WhatsApp
   ============================================================ */

function compartilharWhatsApp() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'warning');
        return;
    }

    var orc = orcamentoAtual;
    var cliente = orc.clientes || {};
    var empresa = orc.empresa || {};

    var itensTexto = (orc.itens || []).map(function (item, i) {
        var prod = item.produtos || {};
        return (i + 1) + '. ' + (prod.nome || 'Produto') + ' - Qtd: ' + item.quantidade + ' - ' + formatCurrency(item.valor_total);
    }).join('\n');

    var texto = '*' + (empresa.nome || 'WD MÁQUINAS') + '*\n' +
        '*ORÇAMENTO #' + (orc.numero_orcamento || '-') + '*\n\n' +
        '*Cliente:* ' + (cliente.nome || '-') + (cliente.empresa ? ' - ' + cliente.empresa : '') + '\n' +
        '*Emissão:* ' + formatDate(orc.data_emissao) + '\n' +
        '*Validade:* ' + formatDate(orc.data_validade) + '\n\n' +
        '*Itens:*\n' + itensTexto + '\n\n' +
        '*TOTAL: ' + formatCurrency(orc.valor_total) + '*\n\n' +
        '*Pagamento:* ' + (orc.forma_pagamento || '-') + '\n' +
        '*Entrega:* ' + (orc.prazo_entrega || '-') + '\n\n' +
        (empresa.telefone ? formatPhone(empresa.telefone) : '') +
        (empresa.email ? ' | ' + empresa.email : '');

    var encoded = encodeURIComponent(texto);
    var whatsUrl = 'https://wa.me/?text=' + encoded;

    if (cliente.telefone) {
        var tel = unmask(cliente.telefone);
        if (tel.length >= 10) {
            var telFull = tel.indexOf('55') === 0 ? tel : '55' + tel;
            whatsUrl = 'https://wa.me/' + telFull + '?text=' + encoded;
        }
    }

    window.open(whatsUrl, '_blank');
}

/* ============================================================
   Email
   ============================================================ */

function abrirModalEmail() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'warning');
        return;
    }

    var orc = orcamentoAtual;
    var cliente = orc.clientes || {};
    var empresa = orc.empresa || {};

    var emailInput = document.getElementById('emailDestinatario');
    if (emailInput) emailInput.value = cliente.email || '';

    var assuntoInput = document.getElementById('emailAssunto');
    if (assuntoInput) {
        assuntoInput.value = 'Orçamento #' + (orc.numero_orcamento || '') + ' - ' + (empresa.nome || 'WD Máquinas');
    }

    var msgInput = document.getElementById('emailMensagem');
    if (msgInput) {
        msgInput.value = 'Prezado(a) ' + (cliente.nome || 'Cliente') + ',\n\n' +
            'Segue o orçamento #' + (orc.numero_orcamento || '') + ' conforme solicitado.\n' +
            'Valor total: ' + formatCurrency(orc.valor_total) + '\n' +
            'Validade: ' + formatDate(orc.data_validade) + '\n\n' +
            'Qualquer dúvida, estamos à disposição.\n\n' +
            'Atenciosamente,\n' +
            (empresa.nome || 'WD Máquinas') + '\n' +
            (empresa.telefone ? formatPhone(empresa.telefone) : '');
    }

    document.getElementById('modalEmail').classList.add('active');
}

function fecharModalEmail() {
    document.getElementById('modalEmail').classList.remove('active');
}

function enviarEmail() {
    var email = document.getElementById('emailDestinatario').value.trim();
    var assunto = document.getElementById('emailAssunto').value.trim();
    var mensagem = document.getElementById('emailMensagem').value.trim();

    if (!email) {
        showToast('Informe o email do destinatário', 'warning');
        return;
    }

    if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
        showToast('Email inválido', 'warning');
        return;
    }

    var mailtoUrl = 'mailto:' + encodeURIComponent(email) +
        '?subject=' + encodeURIComponent(assunto) +
        '&body=' + encodeURIComponent(mensagem);

    window.open(mailtoUrl, '_blank');
    fecharModalEmail();
    showToast('Abrindo cliente de email...', 'info');
}
