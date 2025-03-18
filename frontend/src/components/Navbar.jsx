import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Verificar autenticação sempre que a rota mudar
  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated());
    setCurrentUser(AuthService.getCurrentUser());
  }, [location]);

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Jogo da Memória</Link>
      </div>
      
      <div className="navbar-mobile-toggle" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setIsMenuOpen(false)}>Início</Link>
        {isAuthenticated ? (
          <>
            <Link to="/game" onClick={() => setIsMenuOpen(false)}>Jogar</Link>
            <div className="navbar-user">
              <span>Olá, {currentUser?.username || 'Usuário'}</span>
            </div>
            <button className="navbar-button" onClick={handleLogout}>Sair</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
            <Link to="/register" onClick={() => setIsMenuOpen(false)}>Registrar</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;