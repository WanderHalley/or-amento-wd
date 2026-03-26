/**
 * ============================================================
 * configuracoes.js — Configurações da Empresa
 * ============================================================
 */

/* Estado local */
let logoBase64Atual = '';

/* ============================================================
   Inicialização
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initSidebar();
    aplicarMascarasConfig();
    carregarConfiguracoes();
    verificarApiStatus();
    bindEventosConfig();
});

function aplicarMascarasConfig() {
    maskInput(document.getElementById('cfgCnpj'), 'cnpj');
    maskInput(document.getElementById('cfgTelefone'), 'phone');
}

function bindEventosConfig() {
    const form = document.getElementById('formConfigEmpresa');
    if (form) form.addEventListener('submit', salvarConfiguracoes);

    const btnResetar = document.getElementById('btnResetarConfig');
    if (btnResetar) btnResetar.addEventListener('click', resetarConfiguracoes);

    const inputLogo = document.getElementById('cfgLogo');
    if (inputLogo) inputLogo.addEventListener('change', handleLogoUpload);

    /* Link da API Docs */
    const apiDocsLink = document.getElementById('cfgApiDocsLink');
    if (apiDocsLink) apiDocsLink.href = API_BASE_URL + '/docs';
}

/* ============================================================
   Logo Upload
   ============================================================ */

async function handleLogoUpload(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('cfgLogoPreview');

    if (!file) return;

    try {
        const base64 = await readImageAsBase64(file, 0.5);
        logoBase64Atual = base64;
        renderizarLogoPreview(base64);
    } catch (error) {
        showToast(error.message, 'error');
        event.target.value = '';
    }
}

function renderizarLogoPreview(base64) {
    const previewContainer = document.getElementById('cfgLogoPreview');
    if (!base64) {
        previewContainer.innerHTML = '';
        return;
    }
    previewContainer.innerHTML = '<img src="' + base64 + '" alt="Logo" style="max-width:200px;max-height:100px;border-radius:8px;border:1px solid var(--border-color);">' +
        '<br><button type="button" class="btn btn-danger btn-sm" id="btnRemoverLogoConfig" style="margin-top:8px;">Remover logo</button>';
    const btnRemover = document.getElementById('btnRemoverLogoConfig');
    if (btnRemover) {
        btnRemover.addEventListener('click', function () {
            logoBase64Atual = '';
            previewContainer.innerHTML = '';
            document.getElementById('cfgLogo').value = '';
        });
    }
}

/* ============================================================
   Carregar Configurações
   ============================================================ */

async function carregarConfiguracoes() {
    try {
        const result = await apiGet('/api/configuracoes');
        if (result.success && result.data) {
            const d = result.data;
            document.getElementById('cfgNomeEmpresa').value = d.empresa_nome || '';
            document.getElementById('cfgCnpj').value = d.empresa_cnpj ? formatCNPJ(d.empresa_cnpj) : '';
            document.getElementById('cfgTelefone').value = d.empresa_telefone ? formatPhone(d.empresa_telefone) : '';
            document.getElementById('cfgEmail').value = d.empresa_email || '';
            document.getElementById('cfgSite').value = d.empresa_site || '';
            document.getElementById('cfgEndereco').value = d.empresa_endereco || '';
            document.getElementById('cfgValidadeDias').value = d.orcamento_validade_dias || '';
            document.getElementById('cfgPrazoEntregaPadrao').value = d.orcamento_prazo_entrega_padrao || '';
            document.getElementById('cfgCondicoesPadrao').value = d.orcamento_condicoes_padrao || '';
            document.getElementById('cfgObservacoesPadrao').value = d.orcamento_observacoes_padrao || '';

            /* Logo */
            logoBase64Atual = d.empresa_logo_base64 || '';
            if (logoBase64Atual) {
                renderizarLogoPreview(logoBase64Atual);
            }
        }
    } catch (error) {
        showToast('Erro ao carregar configurações', 'error');
    }
}

/* ============================================================
   Salvar Configurações
   ============================================================ */

async function salvarConfiguracoes(event) {
    event.preventDefault();

    const btnSalvar = document.getElementById('btnSalvarConfig');

    const dados = {
        empresa_nome: document.getElementById('cfgNomeEmpresa').value.trim(),
        empresa_cnpj: unmask(document.getElementById('cfgCnpj').value) || '',
        empresa_telefone: unmask(document.getElementById('cfgTelefone').value) || '',
        empresa_email: document.getElementById('cfgEmail').value.trim() || '',
        empresa_site: document.getElementById('cfgSite').value.trim() || '',
        empresa_endereco: document.getElementById('cfgEndereco').value.trim() || '',
        empresa_logo_base64: logoBase64Atual || '',
        orcamento_validade_dias: document.getElementById('cfgValidadeDias').value || '15',
        orcamento_prazo_entrega_padrao: document.getElementById('cfgPrazoEntregaPadrao').value.trim() || '',
        orcamento_condicoes_padrao: document.getElementById('cfgCondicoesPadrao').value.trim() || '',
        orcamento_observacoes_padrao: document.getElementById('cfgObservacoesPadrao').value.trim() || '',
    };

    if (!dados.empresa_nome) {
        showToast('O nome da empresa é obrigatório', 'warning');
        return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
        await apiPut('/api/configuracoes', dados);
        showToast('Configurações salvas com sucesso!', 'success');
    } catch (error) {
        showToast('Erro ao salvar: ' + error.message, 'error');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar Configurações';
    }
}

/* ============================================================
   Resetar para Padrões
   ============================================================ */

function resetarConfiguracoes() {
    document.getElementById('cfgNomeEmpresa').value = 'WD Máquinas';
    document.getElementById('cfgCnpj').value = '';
    document.getElementById('cfgTelefone').value = '';
    document.getElementById('cfgEmail').value = '';
    document.getElementById('cfgSite').value = '';
    document.getElementById('cfgEndereco').value = '';
    document.getElementById('cfgValidadeDias').value = '15';
    document.getElementById('cfgPrazoEntregaPadrao').value = '15 a 20 dias úteis';
    document.getElementById('cfgCondicoesPadrao').value = '50% de entrada e 50% na entrega do equipamento.';
    document.getElementById('cfgObservacoesPadrao').value = '';
    logoBase64Atual = '';
    document.getElementById('cfgLogoPreview').innerHTML = '';
    document.getElementById('cfgLogo').value = '';
    showToast('Valores restaurados. Clique em Salvar para confirmar.', 'info');
}

/* ============================================================
   Verificar Status da API
   ============================================================ */

async function verificarApiStatus() {
    const el = document.getElementById('cfgApiStatus');
    if (!el) return;

    try {
        const result = await apiGet('/api/health');
        if (result.success) {
            el.innerHTML = '<span style="color:var(--color-success);">Online</span>';
        } else {
            el.innerHTML = '<span style="color:var(--color-danger);">Erro</span>';
        }
    } catch {
        el.innerHTML = '<span style="color:var(--color-danger);">Offline</span>';
    }
}
