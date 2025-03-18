const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const register = (username, email, password) => {
  // Simulação de registro local
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Verificar se o usuário já existe
  if (users.find(u => u.username === username || u.email === email)) {
    throw new Error('Usuário ou email já existente');
  }
  
  const newUser = { id: Date.now(), username, email, password };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  return { user: { id: newUser.id, username, email } };
};

const login = (username, password) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    throw new Error('Credenciais inválidas');
  }
  
  const userData = { id: user.id, username: user.username, email: user.email };
  saveUser(userData);
  return { user: userData, token: 'fake-jwt-token' };
};

export default {
  saveUser,
  getUser,
  register,
  login
};