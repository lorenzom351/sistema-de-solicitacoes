document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    // Você pode definir usuários e senhas fixos aqui para demonstração
    // Em um sistema real, isso seria verificado em um servidor/banco de dados
    const validUsers = {
        'financeiro': 'financeiro1510!',
        'informatica': 'abacc1510'
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o envio padrão do formulário

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        const username = usernameInput.value;
        const password = passwordInput.value;

        if (validUsers[username] && validUsers[username] === password) {
            // Login bem-sucedido
            alert('Login bem-sucedido!');
            // Redireciona para a tela de grupos
            window.location.href = 'home.html'; 
        } else {
            // Login falhou
            alert('Usuário ou senha inválidos!');
            usernameInput.value = ''; // Limpa o campo de usuário
            passwordInput.value = ''; // Limpa o campo de senha
            usernameInput.focus(); // Coloca o foco no campo de usuário
        }
    });
});