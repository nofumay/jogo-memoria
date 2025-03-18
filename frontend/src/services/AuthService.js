import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const AuthService = {
  // Função para login
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Função para registro
  register: async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Função para logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Verifica se o usuário está autenticado
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },
  
  // Obtém o usuário atual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  },
  
  // Obtém o token JWT
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default AuthService;