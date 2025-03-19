import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário estiver autenticado, redirecioná-lo para o jogo
    // Caso contrário, para a página de login
    if (AuthService.isAuthenticated()) {
      navigate('/game');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="not-found-page">
      <h2>Página não encontrada</h2>
      <p>A página que você está procurando não existe ou não está disponível.</p>
      <p>Redirecionando automaticamente...</p>
      <div className="links">
        <Link to="/login" className="button">Ir para Login</Link>
        <Link to="/" className="button">Ir para Página Inicial</Link>
      </div>
    </div>
  );
};

export default NotFound;