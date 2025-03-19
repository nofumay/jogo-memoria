const saveUser = (user) => {
  try {
    localStorage.setItem('user', JSON.stringify(user));
    
    // Também salvar o token para autenticação
    localStorage.setItem('token', 'fake-jwt-token-' + user.username);
    
    console.log('Usuário salvo com sucesso:', user);
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
  }
};

const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
};

// Verificar se o usuário já existe
const userExists = (username, email) => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.some(u => 
      u.username === username || 
      (email && u.email === email)
    );
  } catch (error) {
    console.error('Erro ao verificar usuário existente:', error);
    return false;
  }
};

const register = (username, email, password) => {
  try {
    console.log('Tentando registrar:', username, email);
    
    // Simulação de registro local
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Verificar se o usuário já existe
    if (userExists(username, email)) {
      console.error('Usuário ou email já existente:', username, email);
      throw new Error('Usuário ou email já existente');
    }
    
    // Criação do usuário com pontos iniciais
    const newUser = { 
      id: Date.now(), 
      username, 
      email: email || `${username}@exemplo.com`, 
      password,
      points: 0,
      createdAt: new Date().toISOString()
    };
    
    // Adicionar o novo usuário à lista
    users.push(newUser);
    
    // Persistir a lista atualizada
    localStorage.setItem('users', JSON.stringify(users));
    console.log('Usuários registrados:', users);
    
    // Criar versão segura do usuário (sem senha) para retornar
    const userData = { 
      id: newUser.id, 
      username, 
      email: newUser.email,
      points: 0 
    };
    
    // Salvar sessão do usuário
    saveUser(userData);
    
    return { user: userData };
  } catch (error) {
    console.error('Erro ao registrar:', error);
    throw error;
  }
};

const login = (username, password) => {
  try {
    // Obter lista de usuários
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('Tentando login para:', username);
    
    // Buscar o usuário
    const user = users.find(u => 
      u.username === username && 
      u.password === password
    );
    
    if (!user) {
      console.error('Credenciais inválidas para:', username);
      console.log('Usuários disponíveis:', users.map(u => u.username));
      throw new Error('Credenciais inválidas');
    }
    
    // Criar versão segura do usuário (sem senha)
    const userData = { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      points: user.points || 0
    };
    
    // Salvar sessão do usuário
    saveUser(userData);
    
    console.log('Login bem-sucedido para:', username);
    return { 
      user: userData, 
      token: 'fake-jwt-token-' + username 
    };
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
};

// Função para verificar se temos usuários demo para uso inicial
const checkAndCreateDemoUsers = () => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Remover usuário "fumay" existente para evitar problemas
    const filteredUsers = users.filter(u => u.username !== 'fumay');
    
    // Criar usuário demo fumay para garantir que ele exista
    const demoUser = {
      id: Date.now(),
      username: 'fumay',
      email: 'fumay@exemplo.com',
      password: 'fumay',
      points: 100,
      createdAt: new Date().toISOString()
    };
    
    filteredUsers.push(demoUser);
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    console.log('Usuário demo atualizado com sucesso');
    
    // Para depuração, mostrar usuários
    console.log('Usuários disponíveis:', filteredUsers.map(u => u.username));
  } catch (error) {
    console.error('Erro ao verificar usuários demo:', error);
  }
};

// Função para capturar tentativas de registro diretamente no formulário
window.addEventListener('submit', function(event) {
  const form = event.target;
  
  // Verificar se é um formulário de registro
  if (form && (form.id === 'registerForm' || form.action.includes('register'))) {
    try {
      event.preventDefault(); // Evitar envio normal do formulário
      
      const usernameField = form.querySelector('input[type="text"], input[id="username"]');
      const emailField = form.querySelector('input[type="email"]');
      const passwordField = form.querySelector('input[type="password"]');
      
      if (usernameField && passwordField) {
        const username = usernameField.value;
        const email = emailField ? emailField.value : null;
        const password = passwordField.value;
        
        console.log('Interceptando envio de formulário de registro:', username, email);
        
        // Registrar o usuário usando nossa função
        if (!userExists(username, email)) {
          register(username, email, password);
          alert('Cadastro realizado com sucesso! Redirecionando para o jogo...');
          
          // Redirecionar para a página do jogo
          setTimeout(() => {
            window.location.href = '/game';
          }, 500);
        } else {
          alert('Usuário ou email já existe. Tente outro nome de usuário.');
        }
      }
    } catch (error) {
      console.error('Erro ao interceptar formulário:', error);
    }
  }
});

// Verificar usuários demo na inicialização
checkAndCreateDemoUsers();

export default {
  saveUser,
  getUser,
  register,
  login,
  userExists
};