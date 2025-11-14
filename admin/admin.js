(function() {
    
    const $ = id => document.getElementById(id);

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role !== 'admin') {
        localStorage.removeItem('currentUser');
        window.location = '../index.html'; 
        return; 
    }

    const userNameDisplay = $('userName');
    const btnLogout = $('btnLogout');
    const form = $('createUserForm');
    const errorBox = $('adminError');
    const successBox = $('adminSuccess');

    if (userNameDisplay) {
        userNameDisplay.textContent = currentUser.name || 'Admin';
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', (ev) => {
            ev.preventDefault();
            localStorage.removeItem('currentUser');
            window.location = '../index.html';
        });
    }

    if (form) {
        form.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            errorBox.style.display = 'none';
            successBox.style.display = 'none';

            const name = $('newName').value.trim();
            const email = $('newEmail').value.trim().toLowerCase();
            const password = $('newPassword').value.trim();
            const role = $('newRole').value;
            
            const adminId = currentUser.id; 

            if (!name || !email || !password || !role) {
                errorBox.textContent = 'Por favor, preencha todos os campos.';
                errorBox.style.display = 'block';
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/admin/create-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        name: name, 
                        email: email, 
                        password: password, 
                        role: role,
                        adminId: adminId 
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    errorBox.textContent = data.message || 'Erro ao criar usuário.';
                    errorBox.style.display = 'block';
                } else {
                    successBox.textContent = data.message || 'Usuário criado com sucesso!';
                    successBox.style.display = 'block';
                    form.reset(); 
                }

            } catch (e) {
                console.error('Erro ao criar usuário:', e);
                errorBox.textContent = 'Falha ao conectar com o servidor. O backend está rodando?';
                errorBox.style.display = 'block';
            }
        });
    }

})();