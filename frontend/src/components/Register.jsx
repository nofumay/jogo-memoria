import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import '../styles/Auth.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    
    // Validações básicas
    if (!username.trim()) {
      setError('Por favor, digite um nome de usuário');
      return;
    }
    
    if (!email.trim()) {
      setError('Por favor, digite um email');
      return;
    }
    
    if (!password.trim()) {
      setError('Por favor, digite uma senha');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não correspondem');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await AuthService.register(username, email, password);
      console.log('Registro bem-sucedido:', result);
      
      // Login automático após registro bem-sucedido
      await AuthService.login(username, password);
      
      // Redirecionar para a página do jogo
      navigate('/game');
    } catch (error) {
      console.error('Erro ao registrar:', error);
      setError(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Criar Conta</h2>
        
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
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
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
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua senha"
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Já tem uma conta? <Link to="/login">Fazer Login</Link>
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

export default Register;