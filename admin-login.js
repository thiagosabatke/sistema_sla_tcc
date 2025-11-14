
(function(){
    
    const $ = id => document.getElementById(id);

    const form = $('adminLoginForm');
    const emailInput = $('email');
    const passwordInput = $('password');
    const errorBox = $('loginError');

    try {
        const cur = localStorage.getItem('currentUser');
        if(cur){
            const u = JSON.parse(cur);
            if(u && u.role === 'admin') window.location = 'Admin/admin.html';
        }
    } catch(e) {}

    form && form.addEventListener('submit', async function(ev){
        ev.preventDefault();
        errorBox.style.display = 'none';

        const email = (emailInput.value || '').trim().toLowerCase();
        const pass = (passwordInput.value || '').trim();

        if (!email || !pass) {
            errorBox.textContent = 'Email e senha são obrigatórios.';
            errorBox.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: pass })
            });

            const data = await response.json();

            if (!data.success) {
                errorBox.textContent = data.message || 'Credenciais inválidas.';
                errorBox.style.display = 'block';
                return;
            }

            localStorage.setItem('currentUser', JSON.stringify(data.user));
            window.location = 'Admin/admin.html'; 

        } catch(e) {
            console.error('Erro no login admin:', e);
            errorBox.textContent = 'Não foi possível conectar ao servidor.';
            errorBox.style.display = 'block';
        }
    });

})();