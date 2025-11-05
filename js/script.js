document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Seleção de Elementos ---
    const nomeDoGrupoElement = document.getElementById('nomeDoGrupo');
    const solicitacaoForm = document.getElementById('solicitacaoForm');
    const listaSolicitacoesElement = document.getElementById('listaSolicitacoes');
    const mensagemSemSolicitacoes = document.getElementById('mensagemSemSolicitacoes');
    
    // (Elementos do CSV)
    const exportCsvBtn = document.getElementById('exportCsvBtn'); 

    // (NOVO - Elementos de Filtro/Busca)
    const searchBar = document.getElementById('searchBar');
    const filterButtonsContainer = document.querySelector('.filter-buttons');
    const mensagemSemResultados = document.getElementById('mensagemSemResultados');

    // --- 2. Obter Dados da URL ---
    const params = new URLSearchParams(window.location.search);
    const grupoId = params.get('id');
    const grupoNome = params.get('nome');

    if (!grupoId || !grupoNome) {
        alert('Grupo inválido ou não encontrado.');
        window.location.href = 'home.html';
        return;
    }

    // --- 3. Configuração Inicial ---
    document.title = `${grupoNome} - Sistema de Materiais`;
    nomeDoGrupoElement.textContent = `Exibindo solicitações para: ${grupoNome}`;
    const storageKey = `solicitacoes_grupo_${grupoId}`;
    let solicitacoes = [];

    // (NOVO - Estado dos Filtros)
    let filtroStatus = 'todos'; // 'todos', 'pendente', 'aprovado', etc.
    let termoBusca = '';

    // --- 4. Funções de Dados (Carregar/Salvar) ---
    function carregarSolicitacoes() {
        solicitacoes = JSON.parse(localStorage.getItem(storageKey)) || [];
    }

    function salvarSolicitacoes() {
        localStorage.setItem(storageKey, JSON.stringify(solicitacoes));
    }

    // --- Helper de Formatar Data (Usado por Render e CSV) ---
    const formatarDataInput = (dataString) => {
        if (!dataString) return ''; // Retorna vazio se não houver data
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    // --- Função de Resetar Formulário (da feature Editar) ---
    window.resetarFormulario = () => {
        solicitacaoForm.reset();
        document.getElementById('editId').value = ''; 
        document.querySelector('.form-card h2').textContent = 'Nova Solicitação';
        const submitButton = document.querySelector('#solicitacaoForm button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Solicitação';
        submitButton.style.backgroundColor = 'var(--cor-primaria)';
        const cancelButton = document.getElementById('cancelEditBtn');
        if (cancelButton) {
            cancelButton.remove();
        }
    }

    // --- 5. Funções de Ação (Acessíveis Globalmente) ---
    
    // ATUALIZAR O STATUS
    window.atualizarStatus = (id, novoStatus) => {
        const item = solicitacoes.find(s => s.id === id);
        if (item) {
            item.status = novoStatus;
            salvarSolicitacoes();
            renderizarSolicitacoes();
        }
    }

    // MOSTRAR O FORMULÁRIO DE REJEIÇÃO
    window.mostrarFormRejeicao = (id) => {
        const acoesContainer = document.getElementById(`acoes-${id}`);
        acoesContainer.innerHTML = `
            <form class="rejeicao-form" onsubmit="event.preventDefault(); salvarRejeicao(${id});">
                <input type="text" id="rejeicao-motivo-${id}" placeholder="Qual o motivo da rejeição?" required>
                <button type="submit" class="btn-acao btn-rejeitar"><i class="fas fa-save"></i> Salvar Rejeição</button>
                <button type="button" class="btn-acao btn-reverter" onclick="cancelarRejeicao()"><i class="fas fa-times"></i> Cancelar</button>
            </form>
        `;
        document.getElementById(`rejeicao-motivo-${id}`).focus();
    }

    // SALVAR A REJEIÇÃO
    window.salvarRejeicao = (id) => {
        const inputMotivo = document.getElementById(`rejeicao-motivo-${id}`);
        const motivo = inputMotivo.value.trim();
        if (motivo === "") {
            alert("O motivo não pode ficar em branco.");
            return;
        }
        const item = solicitacoes.find(s => s.id === id);
        if (item) {
            item.status = 'rejeitado';
            item.motivoRejeicao = motivo;
            salvarSolicitacoes();
            renderizarSolicitacoes();
        }
    }

    // CANCELAR A REJEIÇÃO
    window.cancelarRejeicao = () => {
        renderizarSolicitacoes();
    }

    // SALVAR A PESSOA QUE RECEBEU A ENTREGA
    window.salvarEntrega = (id) => {
        const inputNome = document.getElementById(`entregue-nome-${id}`);
        const inputData = document.getElementById(`entregue-data-${id}`);
        const nomePessoa = inputNome.value.trim();
        const dataEntrega = inputData.value; 
        if (nomePessoa === '') {
            alert('Por favor, preencha o nome da pessoa que recebeu.');
            return;
        }
        if (dataEntrega === '') {
            alert('Por favor, selecione a data da entrega.');
            return;
        }
        const item = solicitacoes.find(s => s.id === id);
        if (item) {
            item.status = 'entregue';
            item.pessoaEntregue = nomePessoa;
            item.dataEntrega = dataEntrega;
            salvarSolicitacoes();
            renderizarSolicitacoes();
        }
    }

    // REVERTER O STATUS
    window.reverterStatus = (id) => {
        const item = solicitacoes.find(s => s.id === id);
        if (!item) return;
        switch (item.status) {
            case 'aprovado': item.status = 'pendente'; break;
            case 'rejeitado':
                item.status = 'pendente';
                item.motivoRejeicao = null;
                break;
            case 'comprado': item.status = 'aprovado'; break;
            case 'entregue':
                item.status = 'comprado';
                item.pessoaEntregue = null;
                item.dataEntrega = null; 
                break;
        }
        salvarSolicitacoes();
        renderizarSolicitacoes();
    }

    // --- Função Carregar para Edição (da feature Editar) ---
    window.carregarParaEdicao = (id) => {
        const item = solicitacoes.find(s => s.id === id);
        if (!item) return;

        document.getElementById('editId').value = item.id;
        document.getElementById('nome').value = item.nome;
        document.getElementById('setor').value = item.setor;
        document.getElementById('item').value = item.item;
        document.getElementById('justificativa').value = item.justificativa;
        document.getElementById('link').value = item.link;
        document.getElementById('local').value = item.local;

        document.querySelector('.form-card h2').textContent = 'Editando Solicitação';
        const submitButton = document.querySelector('#solicitacaoForm button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitButton.style.backgroundColor = 'var(--cor-sucesso)';

        if (!document.getElementById('cancelEditBtn')) {
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.id = 'cancelEditBtn';
            cancelButton.innerHTML = '<i class="fas fa-times"></i> Cancelar Edição';
            cancelButton.onclick = window.resetarFormulario;
            solicitacaoForm.appendChild(cancelButton);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.getElementById('nome').focus();
    };

    // --- 6. Função de Renderização (A Principal) ---
    // --- (MODIFICADA) para incluir lógica de FILTRO e BUSCA ---
    function renderizarSolicitacoes() {
        // Limpa a lista e esconde mensagens
        listaSolicitacoesElement.innerHTML = ''; 
        mensagemSemSolicitacoes.style.display = 'none';
        mensagemSemResultados.style.display = 'none';

        // --- (NOVO) Lógica de Filtro e Busca ---
        let solicitacoesFiltradas = solicitacoes;

        // 1. Filtro por Status
        if (filtroStatus !== 'todos') {
            solicitacoesFiltradas = solicitacoesFiltradas.filter(s => s.status === filtroStatus);
        }

        // 2. Filtro por Busca (em item, nome ou setor)
        if (termoBusca !== '') {
            solicitacoesFiltradas = solicitacoesFiltradas.filter(s =>
                s.item.toLowerCase().includes(termoBusca) ||
                s.nome.toLowerCase().includes(termoBusca) ||
                s.setor.toLowerCase().includes(termoBusca)
            );
        }
        // --- Fim da Lógica de Filtro ---

        // (MODIFICADO) Lógica de exibição de mensagens
        if (solicitacoes.length === 0) {
            // Caso 1: Não há nenhuma solicitação salva
            listaSolicitacoesElement.appendChild(mensagemSemSolicitacoes);
            mensagemSemSolicitacoes.style.display = 'block';
        } else if (solicitacoesFiltradas.length === 0) {
            // Caso 2: Há solicitações, mas nenhuma passou no filtro/busca
            listaSolicitacoesElement.appendChild(mensagemSemResultados);
            mensagemSemResultados.style.display = 'block';
        } else {
            // Caso 3: Há itens para mostrar
            // (MODIFICADO) Usa o array filtrado
            solicitacoesFiltradas.forEach(s => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'solicitacao-item';
                const dataFormatada = new Date(s.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                // (Lógica de Edição) Botão de editar
                itemDiv.innerHTML = `
                    <div class="item-header">
                        <h3>${s.item}</h3>
                        <div class="header-right">
                            ${s.status === 'pendente' ? `
                            <button class="btn-edit" onclick="carregarParaEdicao(${s.id})" title="Editar Solicitação">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            ` : ''}
                            <span class="status-tag ${s.status}">${s.status.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="item-detalhes">
                        <p><strong>Solicitante:</strong> ${s.nome}</p>
                        <p><strong>Setor:</strong> ${s.setor}</p>
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        <p><strong>Local de Destino:</strong> ${s.local}</p>
                        <p class="item-justificativa"><strong>Justificativa:</strong> ${s.justificativa || 'N/A'}</p>
                        ${s.link ? `<p class="item-justificativa"><strong>Link:</strong> <a href="${s.link}" target="_blank">Acessar link</a></p>` : ''}
                    </div>
                    ${s.status === 'rejeitado' && s.motivoRejeicao ? 
                        `<div class="item-motivo-rejeicao"><strong>Motivo da Rejeição:</strong><p>${s.motivoRejeicao}</p></div>` : ''}
                    <div class="item-acoes" id="acoes-${s.id}"></div>
                `;

                // (Lógica de Ações) Preenche os botões de status
                const acoesContainer = itemDiv.querySelector(`#acoes-${s.id}`);
                if (s.status === 'pendente') {
                    acoesContainer.innerHTML = `
                        <button class="btn-acao btn-aprovar" onclick="atualizarStatus(${s.id}, 'aprovado')"><i class="fas fa-check"></i> Aprovar</button>
                        <button class="btn-acao btn-rejeitar" onclick="mostrarFormRejeicao(${s.id})"><i class="fas fa-times"></i> Rejeitar</button>
                    `;
                } else if (s.status === 'aprovado') {
                    acoesContainer.innerHTML = `
                        <button class="btn-acao btn-comprado" onclick="atualizarStatus(${s.id}, 'comprado')"><i class="fas fa-shopping-cart"></i> Marcar como Comprado</button>
                        <button class="btn-acao btn-reverter" onclick="reverterStatus(${s.id})"><i class="fas fa-undo"></i> Reverter p/ Pendente</button>
                    `;
                } else if (s.status === 'comprado') {
                    acoesContainer.innerHTML = `
                        <form class="entregue-form" onsubmit="event.preventDefault(); salvarEntrega(${s.id});">
                            <input type="text" id="entregue-nome-${s.id}" placeholder="Nome de quem recebeu" required>
                            <input type="date" id="entregue-data-${s.id}" required>
                            <button type="submit" class="btn-acao"><i class="fas fa-user-check"></i> Salvar Entrega</button>
                        </form>
                        <button class="btn-acao btn-reverter" onclick="reverterStatus(${s.id})"><i class="fas fa-undo"></i> Reverter p/ Aprovado</button>
                    `;
                } else if (s.status === 'entregue') {
                    const dataEntregaFormatada = formatarDataInput(s.dataEntrega);
                    acoesContainer.innerHTML = `
                        <div class="entregue-info-wrapper">
                            <p class="entregue-info"><i class="fas fa-user-check"></i> Entregue para: <strong>${s.pessoaEntregue}</strong></p>
                            <p class="entregue-info"><i class="fas fa-calendar-check"></i> Data da Entrega: <strong>${dataEntregaFormatada}</strong></p>
                        </div>
                        <button class="btn-acao btn-reverter" onclick="reverterStatus(${s.id})"><i class="fas fa-undo"></i> Reverter p/ Comprado</button>
                    `;
                } else if (s.status === 'rejeitado') {
                    acoesContainer.innerHTML = `
                        <button class="btn-acao btn-reverter" onclick="reverterStatus(${s.id})"><i class="fas fa-undo"></i> Reverter p/ Pendente</button>
                    `;
                }

                listaSolicitacoesElement.appendChild(itemDiv);
            });
        }
    } // Fim da função renderizarSolicitacoes

    // --- 7. Event Listener do Formulário (Lógica de Edição) ---
    solicitacaoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const editId = document.getElementById('editId').value;

        if (editId) {
            // --- MODO DE ATUALIZAÇÃO ---
            const itemIndex = solicitacoes.findIndex(s => s.id === parseInt(editId));
            if (itemIndex > -1) {
                solicitacoes[itemIndex].nome = document.getElementById('nome').value;
                solicitacoes[itemIndex].setor = document.getElementById('setor').value;
                solicitacoes[itemIndex].item = document.getElementById('item').value;
                solicitacoes[itemIndex].justificativa = document.getElementById('justificativa').value;
                solicitacoes[itemIndex].link = document.getElementById('link').value;
                solicitacoes[itemIndex].local = document.getElementById('local').value;
            }
        } else {
            // --- MODO DE CRIAÇÃO ---
            const novaSolicitacao = {
                id: Date.now(),
                data: new Date().toISOString(),
                nome: document.getElementById('nome').value,
                setor: document.getElementById('setor').value,
                item: document.getElementById('item').value,
                justificativa: document.getElementById('justificativa').value,
                link: document.getElementById('link').value,
                local: document.getElementById('local').value,
                status: 'pendente',
                pessoaEntregue: null,
                motivoRejeicao: null,
                dataEntrega: null
            };
            solicitacoes.unshift(novaSolicitacao);
        }
        
        salvarSolicitacoes();
        renderizarSolicitacoes();
        window.resetarFormulario();
    });

    // --- Funções de Exportação CSV ---
    function escapeCSV(value) {
        if (value == null) return '';
        let str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = str.replace(/"/g, '""');
            return `"${str}"`;
        }
        return str;
    }

    function exportarParaCSV() {
        if (solicitacoes.length === 0) {
            alert('Não há solicitações para exportar.');
            return;
        }

        const headers = [
            'ID', 'Data Solicitação', 'Solicitante', 'Setor', 'Item', 
            'Justificativa', 'Link', 'Local', 'Status', 
            'Motivo da Rejeição', 'Entregue Para', 'Data da Entrega'
        ];
        
        let csvContent = headers.join(',') + '\n';

        // (MODIFICADO) Exporta a lista COMPLETA, não apenas a filtrada
        solicitacoes.forEach(s => {
            const dataSolicitacao = new Date(s.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const dataEntrega = formatarDataInput(s.dataEntrega);
            const row = [
                s.id, dataSolicitacao, escapeCSV(s.nome), escapeCSV(s.setor),
                escapeCSV(s.item), escapeCSV(s.justificativa), escapeCSV(s.link),
                escapeCSV(s.local), escapeCSV(s.status), escapeCSV(s.motivoRejeicao),
                escapeCSV(s.pessoaEntregue), dataEntrega
            ];
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const safeNome = grupoNome.replace(/[^a-z0-9_-\s]/gi, '').replace(/\s+/g, '_');
        const filename = `relatorio_solicitacoes_${safeNome}.csv`;
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- 8. Inicialização e Event Listeners ---
    
    // Listener do Botão Exportar CSV
    exportCsvBtn.addEventListener('click', exportarParaCSV);

    // --- (NOVO) Event Listeners para Filtro e Busca ---
    
    // 1. Listener da Barra de Busca
    searchBar.addEventListener('input', (e) => {
        termoBusca = e.target.value.toLowerCase();
        renderizarSolicitacoes();
    });

    // 2. Listener dos Botões de Filtro
    filterButtonsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-filter')) {
            filterButtonsContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            filtroStatus = e.target.dataset.status;
            renderizarSolicitacoes();
        }
    });
    
    // Inicialização da Página
    carregarSolicitacoes();
    renderizarSolicitacoes();
});