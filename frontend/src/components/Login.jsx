import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import '../styles/Auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      navigate('/game');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Por favor, digite seu nome de usuário');
      return;
    }
    
    if (!password.trim()) {
      setError('Por favor, digite sua senha');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await AuthService.login(username, password);
      console.log('Login bem-sucedido:', result);
      
      // Redirecionar para a página do jogo
      navigate('/game');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Nome de Usuário</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu nome de usuário"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Não tem uma conta? <Link to="/register">Registrar</Link>
          </p>
          <p>
            <Link to="/">Voltar para a página inicial</Link>
          </p>
        </div>
        
        <div className="auth-footer">
          <p>Jogo da Memória - 2025</p>
          <p className="credits">Desenvolvido por FUMAY</p>
        </div>
      </div>
    </div>
  );
};

export default Login;