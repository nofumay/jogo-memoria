// Interceptador de formulários para compatibilidade com o sistema de armazenamento local
document.addEventListener('DOMContentLoaded', function() {
    console.log('Form Interceptor inicializado');
    
    // Verificar se o localStorage existe e está disponível
    if (typeof localStorage === 'undefined') {
        console.error('LocalStorage não está disponível neste navegador');
        return;
    }
    
    // Funções auxiliares para manipulação de usuários
    const getUsers = () => {
        try {
            const usersStr = localStorage.getItem('users');
            console.log('Dados de usuários encontrados:', usersStr);
            return JSON.parse(usersStr || '[]');
        } catch (error) {
            console.error('Erro ao obter usuários:', error);
            return [];
        }
    };
    
    const saveUsers = (users) => {
        try {
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Usuários salvos:', users);
        } catch (error) {
            console.error('Erro ao salvar usuários:', error);
        }
    };
    
    const userExists = (username, email) => {
        const users = getUsers();
        return users.some(u => u.username === username || (email && u.email === email));
    };
    
    const saveSession = (user) => {
        try {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', 'fake-jwt-token-' + user.username);
            localStorage.setItem('isAuthenticated', 'true');
            console.log('Sessão salva para:', user.username);
        } catch (error) {
            console.error('Erro ao salvar sessão:', error);
        }
    };
    
    // Interceptar todos os formulários de envio
    document.addEventListener('submit', function(event) {
        const form = event.target;
        console.log('Formulário submetido:', form);
        
        // Verificar se é um formulário de cadastro
        const isRegisterForm = form.querySelector('input[name="confirm-password"]') || 
                                form.action.includes('register') || 
                                form.action.includes('cadastro');
        
        // Verificar se é um formulário de login
        const isLoginForm = form.action.includes('login') || 
                            (form.querySelector('input[type="password"]') && 
                             !form.querySelector('input[name="confirm-password"]'));
        
        if (isRegisterForm) {
            console.log('Formulário de cadastro detectado');
            event.preventDefault();
            
            const usernameField = form.querySelector('input[name="username"]') || 
                                form.querySelector('input[type="text"]');
            const emailField = form.querySelector('input[name="email"]') || 
                             form.querySelector('input[type="email"]');
            const passwordField = form.querySelector('input[name="password"]') || 
                                form.querySelector('input[type="password"]:not([name="confirm-password"])');
            
            if (!usernameField || !passwordField) {
                console.error('Campos obrigatórios não encontrados no formulário');
                return;
            }
            
            const username = usernameField.value;
            const email = emailField ? emailField.value : `${username}@exemplo.com`;
            const password = passwordField.value;
            
            console.log('Interceptando formulário de cadastro:', username, email);
            
            if (userExists(username, email)) {
                alert('Este nome de usuário ou email já está em uso. Tente outro.');
                return;
            }
            
            const users = getUsers();
            const newUser = {
                id: Date.now(),
                username,
                email,
                password,
                points: 0,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            saveUsers(users);
            
            // Salvar sessão (login automático)
            const sessionUser = { ...newUser };
            delete sessionUser.password;
            saveSession(sessionUser);
            
            alert('Cadastro realizado com sucesso! Redirecionando...');
            window.location.href = '/game';
        }
        
        else if (isLoginForm) {
            console.log('Formulário de login detectado');
            event.preventDefault();
            
            const usernameField = form.querySelector('input[name="username"]') || 
                                form.querySelector('input[type="text"]');
            const passwordField = form.querySelector('input[name="password"]') || 
                                form.querySelector('input[type="password"]');
            
            if (!usernameField || !passwordField) {
                console.error('Campos obrigatórios não encontrados no formulário de login');
                return;
            }
            
            const username = usernameField.value;
            const password = passwordField.value;
            
            console.log('Tentando login para:', username);
            
            const users = getUsers();
            console.log('Usuários disponíveis:', users.map(u => u.username));
            
            const user = users.find(u => u.username === username && u.password === password);
            
            if (!user) {
                console.error('Credenciais inválidas para:', username);
                alert('Nome de usuário ou senha incorretos.');
                return;
            }
            
            // Salvar sessão
            const sessionUser = { ...user };
            delete sessionUser.password;
            saveSession(sessionUser);
            
            console.log('Login bem-sucedido para:', username);
            window.location.href = '/game';
        }
    });
    
    // Adicionar usuário demo se não existir ou resetar para ter certeza que existe
    const createDemoUser = () => {
        try {
            const users = getUsers();
            
            // Verificar se o usuário demo já existe
            const demoExists = users.some(u => u.username === 'fumay');
            
            if (!demoExists) {
                // Criar usuário demo
                const demoUser = {
                    id: Date.now(),
                    username: 'fumay',
                    email: 'fumay@exemplo.com',
                    password: 'fumay',
                    points: 100,
                    createdAt: new Date().toISOString()
                };
                
                users.push(demoUser);
                saveUsers(users);
                console.log('Usuário demo criado com sucesso');
            } else {
                // Resetar senha do usuário demo para garantir acesso
                const updatedUsers = users.map(u => {
                    if (u.username === 'fumay') {
                        return { ...u, password: 'fumay' };
                    }
                    return u;
                });
                saveUsers(updatedUsers);
                console.log('Usuário demo atualizado com sucesso');
            }
            
            // Para depuração, mostrar usuários
            console.log('Usuários disponíveis:', getUsers().map(u => u.username));
        } catch (error) {
            console.error('Erro ao criar usuário demo:', error);
        }
    };
    
    // Verificar e salvar o usuário atual se estiver autenticado
    const checkCurrentSession = () => {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (userStr && token) {
            try {
                const user = JSON.parse(userStr);
                console.log('Sessão atual encontrada para:', user.username);
                
                // Verificar se o usuário existe na lista de usuários
                const users = getUsers();
                const userExists = users.some(u => u.username === user.username);
                
                if (!userExists) {
                    console.log('Usuário logado não encontrado na lista, re-adicionando...');
                    // Adicionar usuário de volta à lista se foi perdido
                    users.push({
                        id: user.id || Date.now(),
                        username: user.username,
                        email: user.email || `${user.username}@exemplo.com`,
                        password: user.username, // Senha padrão é o próprio username
                        points: user.points || 0,
                        createdAt: user.createdAt || new Date().toISOString()
                    });
                    saveUsers(users);
                }
            } catch (error) {
                console.error('Erro ao verificar sessão atual:', error);
            }
        }
    };
    
    // Interceptar logout para garantir que seja completo
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Verificar se é um botão/link de logout
        if (target && 
            ((target.id === 'sair-button' || 
              target.id === 'logout-button') ||
             (target.tagName === 'A' && 
              (target.href.includes('logout') || 
               target.textContent.toLowerCase().includes('sair')))))
        {
            console.log('Botão de logout clicado');
            // Salvar nome do usuário atual antes de fazer logout
            const userStr = localStorage.getItem('user');
            let username = '';
            
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    username = user.username;
                } catch (e) {
                    console.error('Erro ao ler usuário atual:', e);
                }
            }
            
            // Limpar dados de sessão
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('isAuthenticated');
            
            console.log('Logout realizado para:', username);
        }
    });
    
    // Inicialização
    createDemoUser();
    checkCurrentSession();
}); 