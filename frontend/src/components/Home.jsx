import React from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/AuthService';

const Home = () => {
  const isAuthenticated = AuthService.isAuthenticated();

  return (
    <div className="home-container">
      <h1>Bem-vindo ao Jogo da Memória Multiplayer</h1>
      <p>Teste suas habilidades de memória e desafie seus amigos!</p>
      
      {isAuthenticated ? (
        <div className="home-buttons">
          <Link to="/game" className="button">Iniciar Jogo</Link>
        </div>
      ) : (
        <div className="home-buttons">
          <Link to="/login" className="button">Login</Link>
          <Link to="/register" className="button" style={{ marginLeft: '10px', backgroundColor: '#2196f3' }}>Registrar</Link>
        </div>
      )}
      
      <div className="home-features">
        <div className="card">
          <h3>Jogo Multiplayer</h3>
          <p>Jogue com seus amigos em tempo real!</p>
        </div>
        
        <div className="card">
          <h3>Diferentes Níveis</h3>
          <p>Escolha entre níveis fácil, médio e difícil.</p>
        </div>
        
        <div className="card">
          <h3>Ranqueamento</h3>
          <p>Veja sua posição no ranking global!</p>
        </div>
      </div>
    </div>
  );
};

export default Home;