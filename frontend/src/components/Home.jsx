import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/AuthService';

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const user = AuthService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setUsername(user.username);
          // Carregar pontos do usuário do localStorage
          const points = localStorage.getItem(`memoryGamePoints_${user.username}`);
          setTotalPoints(points ? parseInt(points) : 0);
        } else {
          setIsAuthenticated(false);
          setUsername('');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <div className="home-container">
      <h1>Jogo da Memória Multiplayer</h1>
      
      {isAuthenticated ? (
        <>
          <p>Bem-vindo(a), {username}! <span className="points-display">Pontos: <strong>{totalPoints}</strong></span></p>
          <div className="home-buttons">
            <Link to="/game" className="button">Jogar Agora</Link>
            <Link to="/leaderboard" className="button">Ranking</Link>
          </div>
        </>
      ) : (
        <>
          <p>Faça login ou crie uma conta para jogar e salvar seu progresso!</p>
          <div className="home-buttons">
            <Link to="/login" className="button">Login</Link>
            <Link to="/register" className="button">Cadastrar</Link>
          </div>
        </>
      )}

      <h2>Funcionalidades</h2>
      <div className="home-features">
        <div className="card">
          <h3>Multijogador</h3>
          <p>Jogue contra amigos online em tempo real!</p>
        </div>
        <div className="card">
          <h3>Temas Variados</h3>
          <p>Escolha entre emojis, animais, comidas e esportes.</p>
        </div>
        <div className="card">
          <h3>Dificuldade</h3>
          <p>Ajuste a dificuldade do jogo de acordo com sua habilidade.</p>
        </div>
      </div>

      <div className="home-how-to-play">
        <h2>Como Jogar</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <p>Selecione o tema e o nível de dificuldade.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <p>Encontre pares de cartas combinando seus símbolos.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <p>Vença encontrando mais pares que seu oponente!</p>
          </div>
        </div>
      </div>

      <div className="home-footer">
        <p>Jogue online e acumule pontos para aparecer no ranking!</p>
        {isAuthenticated && (
          <Link to="/game" className="button">Começar Agora</Link>
        )}
      </div>
    </div>
  );
};

export default Home;