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
            return JSON.parse(localStorage.getItem('users') || '[]');
        } catch (error) {
            console.error('Erro ao obter usuários:', error);
            return [];
        }
    };
    
    const saveUsers = (users) => {
        try {
            localStorage.setItem('users', JSON.stringify(users));
        } catch (error) {
            console.error('Erro ao salvar usuários:', error);
        }
    };
    
    const userExists = (username, email) => {
        const users = getUsers();
        return users.some(u => u.username === username || (email && u.email === email));
    };
    
    const saveSession = (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', 'fake-jwt-token-' + user.username);
        localStorage.setItem('isAuthenticated', 'true');
    };
    
    // Interceptar todos os formulários de envio
    document.addEventListener('submit', function(event) {
        const form = event.target;
        
        // Verificar se é um formulário de cadastro
        if (form.querySelector('input[name="confirm-password"]') || form.action.includes('register')) {
            event.preventDefault();
            
            const usernameField = form.querySelector('input[name="username"]') || form.querySelector('input[type="text"]');
            const emailField = form.querySelector('input[name="email"]') || form.querySelector('input[type="email"]');
            const passwordField = form.querySelector('input[name="password"]') || form.querySelector('input[type="password"]:not([name="confirm-password"])');
            
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
        
        // Verificar se é um formulário de login
        else if (form.action.includes('login')) {
            event.preventDefault();
            
            const usernameField = form.querySelector('input[name="username"]') || form.querySelector('input[type="text"]');
            const passwordField = form.querySelector('input[name="password"]') || form.querySelector('input[type="password"]');
            
            if (!usernameField || !passwordField) {
                console.error('Campos obrigatórios não encontrados no formulário');
                return;
            }
            
            const username = usernameField.value;
            const password = passwordField.value;
            
            console.log('Interceptando formulário de login:', username);
            
            const users = getUsers();
            const user = users.find(u => u.username === username && u.password === password);
            
            if (!user) {
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
    
    // Adicionar usuário demo se não existir
    const createDemoUser = () => {
        const users = getUsers();
        
        // Se já existe um usuário fumay, não criar novamente
        if (users.some(u => u.username === 'fumay')) {
            console.log('Usuário demo já existe');
            return;
        }
        
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
    };
    
    createDemoUser();
});