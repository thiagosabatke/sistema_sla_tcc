// Arquivo: reset-password.js

(function() {
    const $ = id => document.getElementById(id);

    const form = $('resetForm');
    const passwordInput = $('password');
    const confirmPasswordInput = $('confirmPassword');
    const errorBox = $('resetError');
    const successBox = $('resetSuccess');

    // 1. Pegar o Token da URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        errorBox.textContent = 'Token de redefinição não encontrado. Verifique o link ou tente novamente.';
        errorBox.style.display = 'block';
        form.style.display = 'none';
        return;
    }

    // 2. Adicionar listener ao formulário
    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        errorBox.style.display = 'none';
        successBox.style.display = 'none';

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password !== confirmPassword) {
            errorBox.textContent = 'As senhas não coincidem.';
            errorBox.style.display = 'block';
            return;
        }

        if (password.length < 3) { // Validação mínima
            errorBox.textContent = 'A senha é muito curta.';
            errorBox.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, password: password })
            });

            const data = await response.json();

            if (!data.success) {
                errorBox.textContent = data.message || 'Não foi possível redefinir a senha.';
                errorBox.style.display = 'block';
            } else {
                // Sucesso!
                form.style.display = 'none';
                successBox.textContent = 'Senha redefinida com sucesso! Redirecionando para o login...';
                successBox.style.display = 'block';

                setTimeout(() => {
                    window.location.href = 'index.html'; // Redireciona para o login
                }, 3000);
            }

        } catch (e) {
            console.error('Erro ao redefinir senha:', e);
            errorBox.textContent = 'Erro ao conectar com o servidor.';
            errorBox.style.display = 'block';
        }
    });

})();