const saveUser = (user) => {
  try {
    localStorage.setItem('user', JSON.stringify(user));

    // Também salvar o token para autenticação
    localStorage.setItem('token', 'fake-jwt-token-' + user.username);
    localStorage.setItem('isAuthenticated', 'true');

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
    console.log('Usuários disponíveis:', users.map(u => u.username));

    // Buscar o usuário
    const user = users.find(u =>
      u.username === username &&
      u.password === password
    );

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

    // Verificar se o usuário demo já existe
    const demoExists = users.some(u => u.username === 'fumay');

    if (!demoExists) {
      // Criar usuário demo fumay para garantir que ele exista
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
    } else {
      // Atualizar senha do usuário demo para garantir que seja sempre fumay
      const updatedUsers = users.map(u => {
        if (u.username === 'fumay') {
          return { ...u, password: 'fumay' };
        }
        return u;
      });
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      console.log('Usuário demo atualizado com sucesso');
    }

    // Para depuração, mostrar usuários
    console.log('Usuários disponíveis:', users.map(u => u.username));
  } catch (error) {
    console.error('Erro ao verificar usuários demo:', error);
  }
};

// Para garantir que o usuário demo existe
document.addEventListener('DOMContentLoaded', function() {
  checkAndCreateDemoUsers();
});

export default {
  saveUser,
  getUser,
  register,
  login,
  userExists,
  checkAndCreateDemoUsers
}; 