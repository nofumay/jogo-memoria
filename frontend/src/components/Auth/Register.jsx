import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthService from '../../services/AuthService';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    if (!username || !email || !password || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    // Verificação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email inválido');
      return;
    }
    
    setLoading(true);
    try {
      await AuthService.register(username, email, password);
      toast.success('Registro realizado com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao registrar:', error);
      toast.error(error.response?.data?.message || 'Falha ao registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Jogo da Memória</h1>
        <h2>Cadastro</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nome de usuário</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Escolha um nome de usuário"
              required
              className="auth-input"
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
              placeholder="Escolha uma senha"
              required
              className="auth-input"
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
              required
              className="auth-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Registrar'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Já tem uma conta? <Link to="/login" className="auth-link">Faça login</Link></p>
        </div>
      </div>
      
      <div className="auth-credits">
        <p>Desenvolvido por Diego Silva</p>
        <p>&copy; 2023 Jogo da Memória - Todos os direitos reservados</p>
      </div>
    </div>
  );
};

export default Register;