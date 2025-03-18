import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = AuthService.isAuthenticated();
  const currentUser = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Jogo da Memória</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/">Início</Link>
        {isAuthenticated ? (
          <>
            <Link to="/game">Jogar</Link>
            <span className="navbar-user">Olá, {currentUser?.username || 'Usuário'}</span>
            <button className="navbar-button" onClick={handleLogout}>Sair</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Registrar</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;