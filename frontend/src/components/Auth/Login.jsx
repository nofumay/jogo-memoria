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
    <div className="auth-form">
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
          />
        </div>
        
        <button 
          type="submit" 
          className="form-button"
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Entrar'}
        </button>
      </form>
      
      <div className="form-footer">
        <p>Não tem uma conta? <Link to="/register">Registre-se</Link></p>
      </div>
    </div>
  );
};

export default Login;