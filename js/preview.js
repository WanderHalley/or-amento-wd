// ==========================================================
// PREVIEW - Visualização de Orçamento
// ==========================================================

var orcamentoAtual = null;

document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initSidebar();
    bindPreviewEvents();

    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    if (id) {
        carregarOrcamentoPreview(id);
    } else {
        document.getElementById('previewArea').innerHTML =
            '<div class="empty-state"><h4>Nenhum orçamento selecionado</h4><p>Volte à lista de orçamentos e clique em visualizar.</p></div>';
    }
});

// ==========================================================
// EVENTOS
// ==========================================================

function bindPreviewEvents() {
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

    var btnEnviar = document.getElementById('btnEnviarEmailConfirm');
    if (btnEnviar) btnEnviar.addEventListener('click', enviarEmail);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') fecharModalEmail();
    });
}

// ==========================================================
// HELPERS - NOME ARQUIVO
// ==========================================================

function limparParaNome(texto) {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '.')
        .replace(/^\.+|\.+$/g, '');
}

function gerarNomeArquivo() {
    var nomeProduto = 'orcamento';
    var nomeCliente = 'cliente';

    if (orcamentoAtual) {
        if (orcamentoAtual.itens && orcamentoAtual.itens.length > 0) {
            var item = orcamentoAtual.itens[0];
            var prodNome = item.produto_nome || item.descricao || '';
            if (prodNome) nomeProduto = limparParaNome(prodNome);
        }
        if (orcamentoAtual.cliente) {
            var cliNome = orcamentoAtual.cliente.nome || '';
            if (cliNome) nomeCliente = limparParaNome(cliNome);
        }
    }

    var hoje = new Date();
    var dd = String(hoje.getDate()).padStart(2, '0');
    var mm = String(hoje.getMonth() + 1).padStart(2, '0');
    var aa = String(hoje.getFullYear()).slice(-2);

    return nomeProduto + '.' + nomeCliente + '.' + dd + '.' + mm + '.' + aa;
}

// ==========================================================
// CARREGAR ORÇAMENTO
// ==========================================================

async function carregarOrcamentoPreview(id) {
    try {
        var response = await apiGet('/api/orcamentos/' + id);
        if (response.success) {
            orcamentoAtual = response.data;
            renderizarPreview();
        } else {
            showToast('Erro ao carregar orçamento', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        showToast('Erro ao carregar orçamento', 'error');
    }
}

// ==========================================================
// RENDERIZAR PREVIEW
// ==========================================================

function renderizarPreview() {
    var area = document.getElementById('previewArea');
    if (!area || !orcamentoAtual) return;

    var orc = orcamentoAtual;
    var cliente = orc.cliente || {};
    var itens = orc.itens || [];
    var config = orc.configuracoes || {};

    // Status badge — aparece na tela, NÃO no PDF
    var statusMap = {
        'rascunho': 'Rascunho',
        'enviado': 'Enviado',
        'aprovado': 'Aprovado',
        'rejeitado': 'Rejeitado'
    };
    var statusClass = {
        'rascunho': 'badge-expirado',
        'enviado': 'badge-pendente',
        'aprovado': 'badge-aprovado',
        'rejeitado': 'badge-recusado'
    };
    var statusLabel = statusMap[orc.status] || 'Rascunho';
    var statusBadge = statusClass[orc.status] || 'badge-expirado';

    // Datas
    var dataCriacao = orc.created_at ? formatDate(orc.created_at) : '-';
    var dataValidade = orc.validade ? formatDate(orc.validade) : '-';

    // Itens HTML
    var itensHTML = '';
    var totalGeral = 0;
    for (var i = 0; i < itens.length; i++) {
        var item = itens[i];
        var subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        totalGeral += subtotal;
        itensHTML += '<tr>' +
            '<td style="text-align:center;">' + (i + 1) + '</td>' +
            '<td class="nome-produto">' + escapeHtml(item.produto_nome || item.descricao || '-') + '</td>' +
            '<td style="text-align:center;">' + (item.quantidade || 0) + '</td>' +
            '<td style="text-align:right;">' + formatCurrency(item.valor_unitario || 0) + '</td>' +
            '<td style="text-align:right;">' + formatCurrency(subtotal) + '</td>' +
            '</tr>';
    }

    // Seções opcionais
    var observacoesHTML = '';
    if (orc.observacoes) {
        observacoesHTML = '<div class="orc-section">' +
            '<div class="orc-section-title">Observações</div>' +
            '<p class="orc-obs-text">' + escapeHtml(orc.observacoes) + '</p>' +
            '</div>';
    }

    var especificacoesHTML = '';
    if (orc.especificacoes) {
        especificacoesHTML = '<div class="orc-section orc-specs">' +
            '<h4>Especificações Técnicas</h4>' +
            '<p>' + escapeHtml(orc.especificacoes) + '</p>' +
            '</div>';
    }

    var dimensoesHTML = '';
    if (orc.dimensoes) {
        dimensoesHTML = '<div class="orc-section">' +
            '<div class="orc-section-title">Dimensões</div>' +
            '<p class="orc-obs-text">' + escapeHtml(orc.dimensoes) + '</p>' +
            '</div>';
    }

    var imagensHTML = '';
    if (orc.imagens && orc.imagens.length > 0) {
        var imgs = '';
        for (var j = 0; j < orc.imagens.length; j++) {
            imgs += '<div class="orc-produto-imagem"><img src="' + orc.imagens[j] + '" crossorigin="anonymous"></div>';
        }
        imagensHTML = '<div class="orc-section">' +
            '<div class="orc-section-title">Imagens</div>' +
            imgs +
            '</div>';
    }

    // Condições
    var condicoesHTML = '';
    var temCondicao = orc.condicao_pagamento || orc.prazo_entrega;
    if (temCondicao) {
        condicoesHTML = '<div class="orc-info-grid">';
        if (orc.condicao_pagamento) {
            condicoesHTML += '<div class="orc-info-box"><h5>Condição de Pagamento</h5><p>' + escapeHtml(orc.condicao_pagamento) + '</p></div>';
        }
        if (orc.prazo_entrega) {
            condicoesHTML += '<div class="orc-info-box"><h5>Prazo de Entrega</h5><p>' + escapeHtml(orc.prazo_entrega) + '</p></div>';
        }
        condicoesHTML += '</div>';
    }

    // Endereço
    var enderecoCliente = '';
    if (cliente.endereco) {
        enderecoCliente = cliente.endereco;
        if (cliente.cidade) enderecoCliente += ', ' + cliente.cidade;
        if (cliente.estado) enderecoCliente += '/' + cliente.estado;
        if (cliente.cep) enderecoCliente += ' - CEP: ' + cliente.cep;
    }

    // MONTAR HTML
    area.innerHTML =
        '<div class="preview-content">' +

            // Status — NÃO aparece no PDF/impressão
            '<div class="no-print" style="margin-bottom:16px;">' +
                '<span class="badge ' + statusBadge + '">' + statusLabel + '</span>' +
            '</div>' +

            // HEADER
            '<div class="orc-header">' +
                '<div class="orc-empresa">' +
                    (config.empresa_logo ? '<img src="' + config.empresa_logo + '" class="orc-empresa-logo" crossorigin="anonymous">' : '') +
                    '<h2>' + escapeHtml(config.empresa_nome || 'WD Máquinas') + '</h2>' +
                    (config.empresa_endereco ? '<p>' + escapeHtml(config.empresa_endereco) + '</p>' : '') +
                    '<p>' + escapeHtml(config.empresa_telefone || '') +
                        (config.empresa_email ? ' | ' + escapeHtml(config.empresa_email) : '') + '</p>' +
                    (config.empresa_cnpj ? '<p>CNPJ: ' + escapeHtml(config.empresa_cnpj) + '</p>' : '') +
                '</div>' +
                '<div class="orc-meta">' +
                    '<h3>ORÇAMENTO</h3>' +
                    '<div class="orc-numero">Nº ' + escapeHtml(orc.numero || '-') + '</div>' +
                    '<div class="orc-meta-row"><strong>Data:</strong> ' + dataCriacao + '</div>' +
                    '<div class="orc-meta-row"><strong>Validade:</strong> ' + dataValidade + '</div>' +
                '</div>' +
            '</div>' +

            // CLIENTE — apenas nome, sem empresa duplicada
            '<div class="orc-section">' +
                '<div class="orc-section-title">Cliente</div>' +
                '<div class="orc-cliente-box">' +
                    '<div class="nome">' + escapeHtml(cliente.nome || '-') + '</div>' +
                    (cliente.cpf_cnpj ? '<div class="info">CPF/CNPJ: ' + escapeHtml(cliente.cpf_cnpj) + '</div>' : '') +
                    (cliente.telefone ? '<div class="info">Telefone: ' + escapeHtml(cliente.telefone) + '</div>' : '') +
                    (cliente.email ? '<div class="info">Email: ' + escapeHtml(cliente.email) + '</div>' : '') +
                    (enderecoCliente ? '<div class="info">Endereço: ' + escapeHtml(enderecoCliente) + '</div>' : '') +
                '</div>' +
            '</div>' +

            // TABELA DE ITENS
            '<div class="orc-section">' +
                '<div class="orc-section-title">Itens do Orçamento</div>' +
                '<table class="orc-tabela">' +
                    '<thead><tr>' +
                        '<th style="width:40px;text-align:center;">#</th>' +
                        '<th>Produto / Descrição</th>' +
                        '<th style="width:60px;text-align:center;">Qtd</th>' +
                        '<th style="width:110px;text-align:right;">Valor Unit.</th>' +
                        '<th style="width:110px;text-align:right;">Subtotal</th>' +
                    '</tr></thead>' +
                    '<tbody>' + itensHTML + '</tbody>' +
                '</table>' +
            '</div>' +

            // TOTAL
            '<div class="orc-total-row">' +
                '<div class="orc-total-box">' +
                    '<span>Total Geral</span>' +
                    '<strong>' + formatCurrency(totalGeral) + '</strong>' +
                '</div>' +
            '</div>' +

            // CONDIÇÕES
            condicoesHTML +

            // SEÇÕES OPCIONAIS
            observacoesHTML +
            especificacoesHTML +
            dimensoesHTML +
            imagensHTML +

            // RODAPÉ
            '<div class="orc-footer">' +
                '<p>' + escapeHtml(config.empresa_nome || 'WD Máquinas') + ' — ' +
                    escapeHtml(config.empresa_telefone || '') + ' — ' +
                    escapeHtml(config.empresa_email || '') + '</p>' +
                '<p>Orçamento válido até ' + dataValidade + '</p>' +
            '</div>' +

        '</div>';
}

// ==========================================================
// GERAR PDF BLOB (reutilizável por WhatsApp e Email)
// ==========================================================

async function gerarPDFBlob() {
    var jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass) throw new Error('Biblioteca jsPDF não carregada. Recarregue a página.');

    var previewArea = document.getElementById('previewArea');
    if (!previewArea) throw new Error('Área de preview não encontrada');

    // Clonar off-screen com dimensões A4
    var clone = previewArea.cloneNode(true);
    var a4W = 794;
    var a4H = 1123;

    clone.style.cssText =
        'position:fixed;left:-9999px;top:0;' +
        'width:' + a4W + 'px;min-height:auto;' +
        'background:#ffffff;color:#1a1a1a;' +
        'font-family:Inter,Arial,sans-serif;' +
        'padding:0;margin:0;border:none;' +
        'overflow:visible;box-sizing:border-box;';

    // Adicionar classe pdf-mode para forçar cores
    var previewContent = clone.querySelector('.preview-content');
    if (previewContent) {
        previewContent.classList.add('pdf-mode');
    }

    // Remover badges de status
    var noPrintEls = clone.querySelectorAll('.no-print');
    for (var i = 0; i < noPrintEls.length; i++) {
        noPrintEls[i].parentNode.removeChild(noPrintEls[i]);
    }

    document.body.appendChild(clone);
    await new Promise(function(r) { setTimeout(r, 500); });

    // Se conteúdo maior que A4, escalar
    var realH = clone.scrollHeight;
    if (realH > a4H) {
        var fator = a4H / realH;
        clone.style.transformOrigin = 'top left';
        clone.style.transform = 'scale(' + fator + ')';
        clone.style.width = a4W + 'px';
        clone.style.height = a4H + 'px';
        await new Promise(function(r) { setTimeout(r, 300); });
    }

    var canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: a4W,
        height: Math.min(realH, a4H),
        windowWidth: a4W,
        windowHeight: Math.min(realH, a4H)
    });

    document.body.removeChild(clone);

    var pdf = new jsPDFClass('p', 'mm', 'a4');
    var imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

    var nomeArquivo = gerarNomeArquivo() + '.pdf';

    return {
        blob: pdf.output('blob'),
        nome: nomeArquivo,
        pdf: pdf
    };
}

// ==========================================================
// SALVAR PDF
// ==========================================================

async function salvarPDF() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'error');
        return;
    }

    var btnPDF = document.getElementById('btnSalvarPDF');
    if (btnPDF) {
        btnPDF.disabled = true;
        btnPDF.textContent = '⏳ Gerando PDF...';
    }

    try {
        var resultado = await gerarPDFBlob();
        resultado.pdf.save(resultado.nome);
        showToast('PDF salvo: ' + resultado.nome, 'success');
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('Erro ao gerar PDF: ' + error.message, 'error');
    } finally {
        if (btnPDF) {
            btnPDF.disabled = false;
            btnPDF.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> Salvar PDF';
        }
    }
}

// ==========================================================
// IMPRIMIR
// ==========================================================

function imprimirOrcamento() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'error');
        return;
    }
    var nomeOriginal = document.title;
    document.title = gerarNomeArquivo();
    window.print();
    setTimeout(function() {
        document.title = nomeOriginal;
    }, 1500);
}

// ==========================================================
// WHATSAPP — texto + PDF
// ==========================================================

async function compartilharWhatsApp() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'error');
        return;
    }

    var btnWhats = document.getElementById('btnWhatsApp');
    if (btnWhats) {
        btnWhats.disabled = true;
        btnWhats.textContent = '⏳ Preparando...';
    }

    try {
        // Gerar PDF
        var pdfObj = null;
        try {
            pdfObj = await gerarPDFBlob();
        } catch (e) {
            console.warn('Não foi possível gerar PDF:', e);
        }

        var orc = orcamentoAtual;
        var cliente = orc.cliente || {};
        var config = orc.configuracoes || {};
        var itens = orc.itens || [];

        var totalGeral = 0;
        for (var i = 0; i < itens.length; i++) {
            totalGeral += (itens[i].quantidade || 0) * (itens[i].valor_unitario || 0);
        }

        // Mensagem
        var msg = '*' + (config.empresa_nome || 'WD Máquinas') + '*\n';
        msg += '━━━━━━━━━━━━━━━\n';
        msg += '📋 *Orçamento Nº ' + (orc.numero || '-') + '*\n';
        msg += '👤 Cliente: ' + (cliente.nome || '-') + '\n';
        msg += '📅 Data: ' + (orc.created_at ? formatDate(orc.created_at) : '-') + '\n';
        msg += '📅 Validade: ' + (orc.validade ? formatDate(orc.validade) : '-') + '\n';
        msg += '━━━━━━━━━━━━━━━\n';
        msg += '*ITENS:*\n';
        for (var j = 0; j < itens.length; j++) {
            var sub = (itens[j].quantidade || 0) * (itens[j].valor_unitario || 0);
            msg += (j + 1) + '. ' + (itens[j].produto_nome || itens[j].descricao || '-') +
                ' - ' + itens[j].quantidade + 'x ' + formatCurrency(itens[j].valor_unitario || 0) +
                ' = ' + formatCurrency(sub) + '\n';
        }
        msg += '━━━━━━━━━━━━━━━\n';
        msg += '💰 *TOTAL: ' + formatCurrency(totalGeral) + '*\n';
        if (orc.condicao_pagamento) msg += '💳 Pagamento: ' + orc.condicao_pagamento + '\n';
        if (orc.prazo_entrega) msg += '🚚 Entrega: ' + orc.prazo_entrega + '\n';
        msg += '━━━━━━━━━━━━━━━\n';
        msg += (config.empresa_nome || 'WD Máquinas') + ' - ' + (config.empresa_telefone || '');

        // Tentar Web Share API com PDF (mobile)
        if (pdfObj && navigator.canShare) {
            try {
                var file = new File([pdfObj.blob], pdfObj.nome, { type: 'application/pdf' });
                var shareData = { text: msg, files: [file] };
                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    showToast('Orçamento compartilhado!', 'success');
                    return;
                }
            } catch (shareErr) {
                if (shareErr.name === 'AbortError') return;
                console.warn('Web Share falhou, usando fallback:', shareErr);
            }
        }

        // Fallback: baixar PDF + abrir WhatsApp com texto
        if (pdfObj) {
            var url = URL.createObjectURL(pdfObj.blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = pdfObj.nome;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('PDF baixado! Anexe no WhatsApp.', 'info');
        }

        var telefone = '';
        if (cliente.telefone) {
            telefone = cliente.telefone.replace(/\D/g, '');
            if (telefone.length === 11 || telefone.length === 10) {
                telefone = '55' + telefone;
            }
        }

        var whatsUrl = telefone
            ? 'https://wa.me/' + telefone + '?text=' + encodeURIComponent(msg)
            : 'https://wa.me/?text=' + encodeURIComponent(msg);

        window.open(whatsUrl, '_blank');

    } catch (error) {
        console.error('Erro WhatsApp:', error);
        showToast('Erro ao compartilhar: ' + error.message, 'error');
    } finally {
        if (btnWhats) {
            btnWhats.disabled = false;
            btnWhats.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 0 1-4.29-1.248l-.308-.184-2.867.852.852-2.867-.184-.308A7.96 7.96 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg> WhatsApp';
        }
    }
}

// ==========================================================
// EMAIL — Modal + PDF + mailto
// ==========================================================

function abrirModalEmail() {
    if (!orcamentoAtual) {
        showToast('Nenhum orçamento carregado', 'error');
        return;
    }

    var cliente = orcamentoAtual.cliente || {};
    var config = orcamentoAtual.configuracoes || {};
    var nomeArq = gerarNomeArquivo();

    var emailDest = document.getElementById('emailDestinatario');
    var emailAssunto = document.getElementById('emailAssunto');
    var emailMensagem = document.getElementById('emailMensagem');

    if (emailDest) emailDest.value = cliente.email || '';
    if (emailAssunto) emailAssunto.value = 'Orçamento Nº ' + (orcamentoAtual.numero || '') + ' - ' + (config.empresa_nome || 'WD Máquinas');
    if (emailMensagem) {
        emailMensagem.value =
            'Prezado(a) ' + (cliente.nome || 'Cliente') + ',\n\n' +
            'Segue em anexo o orçamento Nº ' + (orcamentoAtual.numero || '') + ' conforme solicitado.\n\n' +
            'O PDF "' + nomeArq + '.pdf" será baixado automaticamente. Por favor, anexe-o ao email.\n\n' +
            'Qualquer dúvida estamos à disposição.\n\n' +
            'Atenciosamente,\n' +
            (config.empresa_nome || 'WD Máquinas') + '\n' +
            (config.empresa_telefone || '');
    }

    var modal = document.getElementById('modalEmail');
    if (modal) modal.classList.add('active');
}

function fecharModalEmail() {
    var modal = document.getElementById('modalEmail');
    if (modal) modal.classList.remove('active');
}

async function enviarEmail() {
    var emailDest = document.getElementById('emailDestinatario');
    var emailAssunto = document.getElementById('emailAssunto');
    var emailMensagem = document.getElementById('emailMensagem');

    var dest = emailDest ? emailDest.value.trim() : '';
    var assunto = emailAssunto ? emailAssunto.value.trim() : '';
    var corpo = emailMensagem ? emailMensagem.value.trim() : '';

    if (!dest) {
        showToast('Informe o email do destinatário', 'error');
        return;
    }

    var btnEnviar = document.getElementById('btnEnviarEmailConfirm');
    if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.textContent = '⏳ Gerando PDF...';
    }

    try {
        // Gerar e baixar PDF
        var pdfObj = await gerarPDFBlob();
        var url = URL.createObjectURL(pdfObj.blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = pdfObj.nome;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Abrir cliente de email
        var mailtoUrl = 'mailto:' + encodeURIComponent(dest) +
            '?subject=' + encodeURIComponent(assunto) +
            '&body=' + encodeURIComponent(corpo);
        window.location.href = mailtoUrl;

        showToast('PDF baixado! Anexe ao email.', 'success');
        fecharModalEmail();

    } catch (error) {
        console.error('Erro email:', error);
        showToast('Erro ao preparar email: ' + error.message, 'error');
    } finally {
        if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar';
        }
    }
}
