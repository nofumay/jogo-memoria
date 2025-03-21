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
    const checkAuthStatus = () => {
      try {
        const isAuth = AuthService.isAuthenticated();
        setIsAuthenticated(isAuth);
        setCurrentUser(isAuth ? AuthService.getCurrentUser() : null);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };

    checkAuthStatus();
  }, [location]);

  const handleLogout = (e) => {
    e.preventDefault(); // Prevenir comportamento padrão
    
    try {
      console.log("Iniciando logout...");
      
      // Atualizar estado do componente antes de executar logout
      setIsAuthenticated(false);
      setCurrentUser(null);
      
      // Usar o navigate do React Router em vez de window.location
      navigate('/login');
      
      // Executar logout no AuthService após navegação
      setTimeout(() => {
        AuthService.logout();
        console.log("Logout completo");
      }, 100);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert("Erro ao fazer logout. Por favor, tente novamente.");
      
      // Mesmo com erro, tentar redirecionar usando o React Router
      navigate('/login');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={isAuthenticated ? "/game" : "/"}>Jogo da Memória</Link>
      </div>
      
      <div className="navbar-mobile-toggle" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setIsMenuOpen(false)}>Início</Link>
        
        {isAuthenticated ? (
          <>
            <Link to="/game" onClick={() => setIsMenuOpen(false)}>Jogar</Link>
            <span className="navbar-user">
              Olá, {currentUser?.username || 'Usuário'}
            </span>
            <button 
              onClick={handleLogout} 
              className="navbar-button"
              id="sair-button"
            >
              Sair
            </button>
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