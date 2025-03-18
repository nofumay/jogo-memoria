import axios from 'axios';
import jwtDecode from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Para desenvolvimento, vamos implementar uma versão simples com localStorage
class AuthService {
  register(username, password, email) {
    // Em ambiente de produção, isso seria uma chamada à API
    return new Promise((resolve, reject) => {
      try {
        // Verificar se o usuário já existe
        const users = this.getAllUsers();
        if (users.some(user => user.username === username)) {
          return reject({ response: { data: { message: 'Nome de usuário já existe' } } });
        }
        
        if (users.some(user => user.email === email)) {
          return reject({ response: { data: { message: 'Email já cadastrado' } } });
        }

        // Criar novo usuário
        const newUser = {
          id: Date.now(),
          username,
          email,
          password, // Em produção, a senha seria encriptada
          createdAt: new Date().toISOString()
        };

        // Salvar no storage
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        resolve({ user: { ...newUser, password: undefined } });
      } catch (error) {
        reject(error);
      }
    });
  }

  login(username, password) {
    // Em ambiente de produção, isso seria uma chamada à API
    return new Promise((resolve, reject) => {
      try {
        const users = this.getAllUsers();
        const user = users.find(
          u => u.username === username && u.password === password
        );

        if (!user) {
          return reject({ response: { data: { message: 'Usuário ou senha inválidos' } } });
        }

        // Criar objeto usuário sem a senha
        const userObj = { ...user, password: undefined };
        
        // Simular JWT
        const token = `mock-jwt-token-${Date.now()}`;
        
        // Salvar no storage
        localStorage.setItem('currentUser', JSON.stringify(userObj));
        localStorage.setItem('token', token);

        resolve({ user: userObj, token });
      } catch (error) {
        reject(error);
      }
    });
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    return JSON.parse(userStr);
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  getAllUsers() {
    const usersStr = localStorage.getItem('users');
    return usersStr ? JSON.parse(usersStr) : [];
  }

  // Para testes e desenvolvimento
  initializeDefaultUsers() {
    if (!localStorage.getItem('users')) {
      const defaultUsers = [
        {
          id: 1,
          username: 'jogador1',
          email: 'jogador1@example.com',
          password: 'senha123',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
  }
}

// Inicializar usuários padrão
const authService = new AuthService();
authService.initializeDefaultUsers();

export default authService; 