import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthService from '../../services/AuthService';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = AuthService.isAuthenticated();
  const currentUser = AuthService.getCurrentUser();
  
  const handleLogout = () => {
    AuthService.logout();
    toast.success('Logout realizado com sucesso!');
    navigate('/');
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Jogo da Memória</Link>
      </div>
      
      <div className="navbar-menu">
        <Link to="/" className="navbar-item">Início</Link>
        <Link to="/ranking" className="navbar-item">Ranking</Link>
        
        {isAuthenticated ? (
          <>
            <span className="navbar-item user-info">
              Olá, {currentUser ? currentUser.username : 'Usuário'}!
            </span>
            <button onClick={handleLogout} className="navbar-item logout-button">
              Sair
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-item">Login</Link>
            <Link to="/register" className="navbar-item">Registrar</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 