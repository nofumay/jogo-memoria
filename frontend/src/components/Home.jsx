import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/AuthService';

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    // Verificar se o usuário está logado
    const user = AuthService.getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setUsername(user.username);
      
      // Carregar pontos do jogador
      const points = localStorage.getItem(`memoryGamePoints_${user.username}`);
      if (points) {
        setTotalPoints(parseInt(points, 10));
      }
    }
  }, []);

  return (
    <div className="home-container">
      <h1>Jogo da Memória Multiplayer</h1>
      
      {isAuthenticated ? (
        <p>Bem-vindo de volta, <strong>{username}</strong>! Continue desafiando sua memória e divirta-se com diferentes temas e níveis de dificuldade.</p>
      ) : (
        <p>Teste sua memória neste divertido jogo multiplayer! Encontre pares de cartas e desafie seus amigos.</p>
      )}
      
      <div className="home-buttons">
        {isAuthenticated ? (
          <>
            <Link to="/game" className="button start-game-button">Jogar Agora</Link>
            {totalPoints > 0 && (
              <div className="points-display">
                <span>Seus pontos: <strong>{totalPoints}</strong></span>
              </div>
            )}
          </>
        ) : (
          <>
            <Link to="/login" className="button">Entrar</Link>
            <Link to="/register" className="button">Registrar</Link>
          </>
        )}
      </div>

      <h2>Novidades e Funcionalidades</h2>
      
      <div className="home-features">
        <div className="card">
          <h3>Multiplayer</h3>
          <p>Jogue com amigos em tempo real! Crie uma sala e compartilhe o código para que seus amigos entrem na partida.</p>
        </div>
        
        <div className="card">
          <h3>Temas Variados</h3>
          <p>Escolha entre diferentes temas como animais, frutas, emojis e esportes para personalizar sua experiência.</p>
        </div>
        
        <div className="card">
          <h3>Níveis de Dificuldade</h3>
          <p>Desafie-se com diferentes níveis: fácil, médio e difícil, cada um com seu próprio layout e número de cartas.</p>
        </div>
      </div>

      <div className="home-how-to-play">
        <h2>Como Jogar</h2>
        
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <p>Escolha um tema e nível de dificuldade</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <p>Encontre pares de cartas clicando nelas</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <p>Quando for sua vez, tente fazer mais pontos que seu oponente</p>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <p>Quem encontrar mais pares vence!</p>
          </div>
        </div>
      </div>

      <div className="home-footer">
        {isAuthenticated ? (
          <Link to="/game" className="button start-game-button">Iniciar Jogo</Link>
        ) : (
          <p>Faça login para começar a jogar online!</p>
        )}
      </div>
    </div>
  );
};

export default Home;