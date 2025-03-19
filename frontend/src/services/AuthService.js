import axios from 'axios';
import localStorageService from './localStorageService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const USE_LOCAL_AUTH = true; // Alternar entre autenticação local e API

const AuthService = {
  // Função para login
  login: async (username, password) => {
    try {
      if (USE_LOCAL_AUTH) {
        return localStorageService.login(username, password);
      }
      
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
      if (USE_LOCAL_AUTH) {
        return localStorageService.register(username, email, password);
      }
      
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
  
  // Função para criar uma sessão simulada para fins de demonstração
  simulateLogin: (username) => {
    const userData = {
      id: 'simulated-id',
      username: username || 'fumay',
      email: `${username || 'fumay'}@example.com`,
      points: 0
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', 'simulated-token');
    
    return { user: userData, token: 'simulated-token' };
  },
  
  // Função para logout
  logout: () => {
    try {
      console.log("Executando logout...");
      
      // Armazenar o nome de usuário atual antes de limpar
      const user = AuthService.getCurrentUser();
      const username = user ? user.username : null;
      
      // Limpar TODOS os dados do localStorage para garantir logout completo
      localStorage.clear();
      
      // Limpar sessionStorage também
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
      
      // Limpar quaisquer cookies relacionados à autenticação
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Remover especificamente os itens de autenticação
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Remover pontos do jogo, se houver
      if (username) {
        localStorage.removeItem(`memoryGamePoints_${username}`);
      }
      
      // Se a API estiver sendo usada, notificar o servidor
      if (!USE_LOCAL_AUTH) {
        // Esta seria a chamada para o backend se tivéssemos uma API
        // axios.post(`${API_URL}/auth/logout`);
      }
      
      console.log("Logout completo!");
      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      
      // Tentar limpar manualmente mesmo se houver erro
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        console.error('Erro ao limpar localStorage:', e);
      }
      
      return false;
    }
  },
  
  // Verifica se o usuário está autenticado
  isAuthenticated: () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      return !!(token && user);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  },
  
  // Obtém o usuário atual
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  },
  
  // Obtém o token JWT
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default AuthService;