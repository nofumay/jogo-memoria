import React from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/AuthService';

const Home = () => {
  const isAuthenticated = AuthService.isAuthenticated();

  return (
    <div className="home-container">
      <h1>Bem-vindo ao Jogo da Memória Multiplayer</h1>
      <p>Teste sua memória, desafie seus amigos e divirta-se com nosso jogo interativo!</p>
      
      {isAuthenticated ? (
        <div className="home-buttons">
          <Link to="/game" className="button">Iniciar Jogo</Link>
        </div>
      ) : (
        <div className="home-buttons">
          <Link to="/login" className="button">Login</Link>
          <Link to="/register" className="button" style={{ marginLeft: '10px', backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>Registrar</Link>
        </div>
      )}
      
      <div className="home-features">
        <div className="card">
          <h3>🎮 Multiplayer</h3>
          <p>Jogue com seus amigos em tempo real! Crie salas e convide outros jogadores para competir.</p>
        </div>
        
        <div className="card">
          <h3>🔄 Diversos Temas</h3>
          <p>Escolha entre diferentes temas: animais, frutas, emojis e esportes para variar a diversão!</p>
        </div>
        
        <div className="card">
          <h3>🏆 Níveis de Dificuldade</h3>
          <p>Desafie-se com os níveis fácil, médio e difícil, cada um com mais cartas e menos tempo.</p>
        </div>
      </div>
      
      <div className="home-how-to-play">
        <h2>Como Jogar</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <p>Clique em uma carta para virá-la</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <p>Tente encontrar o par correspondente</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <p>Se encontrar o par, as cartas ficam viradas</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <p>Complete todos os pares no menor tempo possível!</p>
          </div>
        </div>
      </div>
      
      <div className="home-footer">
        {isAuthenticated ? (
          <Link to="/game" className="button start-game-button">Começar a Jogar Agora!</Link>
        ) : (
          <Link to="/register" className="button start-game-button">Criar uma Conta</Link>
        )}
      </div>
    </div>
  );
};

export default Home;