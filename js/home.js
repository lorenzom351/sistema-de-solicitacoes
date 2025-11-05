document.addEventListener('DOMContentLoaded', () => {

    // Seleciona os elementos da página
    const novoGrupoForm = document.getElementById('novoGrupoForm');
    const nomeGrupoInput = document.getElementById('nomeGrupoInput');
    const listaDeGrupos = document.getElementById('listaDeGrupos');
    const mensagemSemGrupos = document.getElementById('mensagemSemGrupos');

    let grupos = []; // Array para guardar nossos grupos

    // --- FUNÇÕES DE DADOS ---

    // Função para buscar os grupos salvos no localStorage
    function carregarGrupos() {
        // Pega os dados, se não houver nada, retorna um array vazio
        grupos = JSON.parse(localStorage.getItem('solicitacao_grupos')) || [];
    }

    // Função para salvar os grupos no localStorage
    function salvarGrupos() {
        localStorage.setItem('solicitacao_grupos', JSON.stringify(grupos));
    }

    // --- FUNÇÕES DE AÇÃO ---

    // Função para adicionar um novo grupo
    function adicionarGrupo(e) {
        e.preventDefault(); // Impede o recarregamento da página

        const nome = nomeGrupoInput.value.trim();
        if (nome === '') {
            alert('Por favor, digite um nome para o grupo.');
            return;
        }

        // Cria um objeto para o novo grupo com um ID único
        const novoGrupo = {
            id: Date.now(), // ID único baseado no tempo atual
            nome: nome
        };

        grupos.push(novoGrupo); // Adiciona ao array
        salvarGrupos(); // Salva no localStorage
        renderizarGrupos(); // Atualiza a lista na tela
        nomeGrupoInput.value = ''; // Limpa o campo
    }

    // Função para deletar um grupo
    function deletarGrupo(idParaDeletar) {
        // Pede confirmação
        if (!confirm('Tem certeza que deseja excluir este grupo?')) {
            return; // Cancela se o usuário clicar em "Cancelar"
        }

        // Filtra o array, mantendo apenas os grupos com ID diferente
        grupos = grupos.filter(grupo => grupo.id !== idParaDeletar);
        
        salvarGrupos(); // Salva a nova lista (sem o item deletado)
        renderizarGrupos(); // Atualiza a tela
    }

    // --- FUNÇÃO DE RENDERIZAÇÃO ---

    // Função para desenhar a lista de grupos na tela
    function renderizarGrupos() {
        listaDeGrupos.innerHTML = ''; // Limpa a lista atual

        if (grupos.length === 0) {
            mensagemSemGrupos.style.display = 'block'; // Mostra a mensagem
        } else {
            mensagemSemGrupos.style.display = 'none'; // Esconde a mensagem
            
            grupos.forEach(grupo => {
                // Cria os elementos HTML para cada grupo
                const item = document.createElement('div');
                item.className = 'grupo-item';

                const link = document.createElement('a');
                link.textContent = grupo.nome;
                // Este link levará para a tela 3, passando o ID e o Nome do grupo na URL
                link.href = `solicitacoes.html?id=${grupo.id}&nome=${encodeURIComponent(grupo.nome)}`;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Ícone de lixeira
                
                // Adiciona o evento de clique para deletar
                deleteBtn.onclick = () => deletarGrupo(grupo.id);

                // Monta o item
                item.appendChild(link);
                item.appendChild(deleteBtn);
                
                // Adiciona o item na lista
                listaDeGrupos.appendChild(item);
            });
        }
    }

    // --- INICIALIZAÇÃO ---

    // Adiciona o "ouvidor" de evento no formulário
    novoGrupoForm.addEventListener('submit', adicionarGrupo);

    // Carrega os grupos e renderiza na tela assim que a página abre
    carregarGrupos();
    renderizarGrupos();
});