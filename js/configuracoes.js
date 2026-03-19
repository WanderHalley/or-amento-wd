/**
 * configuracoes.js — Gerencia configurações da empresa (localStorage)
 * Depende de: app.js (getConfig, saveConfig, showToast, readFileAsBase64, formatCNPJ, formatPhone)
 */

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initTheme === 'function') initTheme();
    if (typeof initSidebar === 'function') initSidebar();
    if (typeof updateThemeIcon === 'function') updateThemeIcon();

    carregarConfiguracoes();
    verificarStatusAPI();
    aplicarMascarasConfig();
});

/**
 * Aplica máscaras nos campos de configuração
 */
function aplicarMascarasConfig() {
    const cnpjInput = document.getElementById('cfgCnpj');
    const telInput = document.getElementById('cfgTelefone');

    if (cnpjInput) {
        cnpjInput.addEventListener('input', function () {
            this.value = formatCNPJ(this.value);
        });
    }
    if (telInput) {
        telInput.addEventListener('input', function () {
            this.value = formatPhone(this.value);
        });
    }
}

/**
 * Carrega configurações do localStorage e preenche o formulário
 */
function carregarConfiguracoes() {
    const config = typeof getConfig === 'function' ? getConfig() : {};
    console.log('[Config] Carregando:', config);

    // Logo
    if (config.logo) {
        document.getElementById('cfgLogoImg').src = config.logo;
        document.getElementById('cfgLogoImg').style.display = 'block';
        document.getElementById('btnRemoverLogo').style.display = 'inline-block';
    }

    // Campos
    document.getElementById('cfgNomeEmpresa').value = config.nomeEmpresa || '';
    document.getElementById('cfgCnpj').value = config.cnpj ? formatCNPJ(config.cnpj) : '';
    document.getElementById('cfgTelefone').value = config.telefone ? formatPhone(config.telefone) : '';
    document.getElementById('cfgEmail').value = config.email || '';
    document.getElementById('cfgSite').value = config.site || '';
    document.getElementById('cfgEndereco').value = config.endereco || '';
    document.getElementById('cfgCondicoesPadrao').value = config.condicoesPadrao || '';
    document.getElementById('cfgValidadeDias').value = config.validadeDias || 15;
    document.getElementById('cfgPrazoEntregaPadrao').value = config.prazoEntregaPadrao || '';
    document.getElementById('cfgObservacoesPadrao').value = config.observacoesPadrao || '';
}

/**
 * Preview do logo ao selecionar arquivo
 */
async function previewLogoConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Logo max 500 KB
        const base64 = await readFileAsBase64(file, 500 * 1024, ['image/jpeg', 'image/png', 'image/webp']);

        document.getElementById('cfgLogoImg').src = base64;
        document.getElementById('cfgLogoImg').style.display = 'block';
        document.getElementById('btnRemoverLogo').style.display = 'inline-block';

        // Salvar temporariamente no dataset para pegar ao salvar
        document.getElementById('cfgLogoImg').dataset.newLogo = base64;

        console.log('[Config] Logo carregado, tamanho:', base64.length);

    } catch (error) {
        console.error('[Config] Erro no upload do logo:', error);
        showToast(error.message || 'Erro ao carregar logo', 'error');
        event.target.value = '';
    }
}

/**
 * Remove logo
 */
function removerLogoConfig() {
    document.getElementById('cfgLogoImg').src = '';
    document.getElementById('cfgLogoImg').style.display = 'none';
    document.getElementById('cfgLogo').value = '';
    document.getElementById('btnRemoverLogo').style.display = 'none';
    document.getElementById('cfgLogoImg').dataset.newLogo = '';
}

/**
 * Salva configurações no localStorage
 */
function salvarConfiguracoes(event) {
    event.preventDefault();

    const nomeEmpresa = document.getElementById('cfgNomeEmpresa').value.trim();
    if (!nomeEmpresa) {
        showToast('O nome da empresa é obrigatório', 'warning');
        return;
    }

    // Logo: se tem um novo, usa ele; senão mantém o existente
    const configAtual = typeof getConfig === 'function' ? getConfig() : {};
    const newLogo = document.getElementById('cfgLogoImg').dataset.newLogo;
    let logo = configAtual.logo || '';

    if (newLogo !== undefined && newLogo !== '') {
        logo = newLogo;
    } else if (document.getElementById('cfgLogoImg').style.display === 'none') {
        // Logo foi removido
        logo = '';
    }

    const novaConfig = {
        logo: logo,
        nomeEmpresa: nomeEmpresa,
        cnpj: unmaskValue(document.getElementById('cfgCnpj').value) || '',
        telefone: unmaskValue(document.getElementById('cfgTelefone').value) || '',
        email: document.getElementById('cfgEmail').value.trim() || '',
        site: document.getElementById('cfgSite').value.trim() || '',
        endereco: document.getElementById('cfgEndereco').value.trim() || '',
        condicoesPadrao: document.getElementById('cfgCondicoesPadrao').value.trim() || '',
        validadeDias: parseInt(document.getElementById('cfgValidadeDias').value) || 15,
        prazoEntregaPadrao: document.getElementById('cfgPrazoEntregaPadrao').value.trim() || '',
        observacoesPadrao: document.getElementById('cfgObservacoesPadrao').value.trim() || '',
    };

    console.log('[Config] Salvando:', { ...novaConfig, logo: novaConfig.logo ? `[${novaConfig.logo.length} chars]` : '' });

    if (typeof saveConfig === 'function') {
        saveConfig(novaConfig);
    } else {
        localStorage.setItem('wd_config', JSON.stringify(novaConfig));
    }

    showToast('Configurações salvas com sucesso!', 'success');

    // Limpar flag de novo logo
    document.getElementById('cfgLogoImg').dataset.newLogo = '';
}

/**
 * Restaurar configurações padrão
 */
function resetarConfiguracoes() {
    if (!confirm('Tem certeza que deseja restaurar as configurações padrão? Isso apagará todas as personalizações.')) {
        return;
    }

    localStorage.removeItem('wd_config');

    // Recarregar a página para aplicar os padrões
    showToast('Configurações restauradas para o padrão', 'info');
    setTimeout(() => {
        window.location.reload();
    }, 800);
}

/**
 * Verifica se a API está online
 */
async function verificarStatusAPI() {
    const statusEl = document.getElementById('cfgApiStatus');
    try {
        const data = await apiGet('/health');
        if (data.status === 'healthy') {
            statusEl.innerHTML = '<span style="color:var(--success-color);">✅ Online (banco conectado)</span>';
        } else {
            statusEl.innerHTML = '<span style="color:var(--warning-color);">⚠️ Instável</span>';
        }
    } catch (error) {
        statusEl.innerHTML = '<span style="color:var(--danger-color);">❌ Offline</span>';
    }
}
