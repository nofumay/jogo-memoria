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

const register = (username, email, password) => {
  try {
    // Simulação de registro local
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Verificar se o usuário já existe
    if (users.find(u => u.username === username || (email && u.email === email))) {
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
    console.log('Usuários disponíveis:', users);
    
    // Buscar o usuário
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      console.error('Credenciais inválidas para:', username);
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
    
    // Se não há usuários, criar um demo
    if (users.length === 0) {
      console.log('Criando usuário demo...');
      const demoUser = {
        id: Date.now(),
        username: 'fumay',
        email: 'fumay@exemplo.com',
        password: 'fumay',
        points: 100,
        createdAt: new Date().toISOString()
      };
      
      users.push(demoUser);
      localStorage.setItem('users', JSON.stringify(users));
      console.log('Usuário demo criado com sucesso');
    }
  } catch (error) {
    console.error('Erro ao verificar usuários demo:', error);
  }
};

// Verificar usuários demo na inicialização
checkAndCreateDemoUsers();

export default {
  saveUser,
  getUser,
  register,
  login
};