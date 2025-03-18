import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthService from '../../services/AuthService';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!username || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    setLoading(true);
    try {
      const response = await AuthService.login(username, password);
      
      // Armazenar token e informações do usuário
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast.success('Login realizado com sucesso!');
      navigate('/game');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error(error.response?.data?.message || 'Falha ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Jogo da Memória</h1>
        <h2>Login</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nome de usuário</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu nome de usuário"
              required
              className="auth-input"
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
              required
              className="auth-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Não tem uma conta? <Link to="/register" className="auth-link">Registre-se</Link></p>
        </div>

        <div className="auth-features">
          <div className="feature-item">
            <span className="feature-icon">🎮</span>
            <p>Jogue com seus amigos</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏆</span>
            <p>Acumule pontos</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🧠</span>
            <p>Treine sua memória</p>
          </div>
        </div>
      </div>
      
      <div className="auth-credits">
        <p>Desenvolvido por Diego Silva</p>
        <p>&copy; 2023 Jogo da Memória - Todos os direitos reservados</p>
      </div>
    </div>
  );
};

export default Login;