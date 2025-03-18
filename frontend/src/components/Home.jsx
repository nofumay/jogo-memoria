import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Verificar autenticação do usuário aqui (implementação futura)
    // Por enquanto, vamos simular que não está autenticado
    setIsAuthenticated(false);
  }, []);

  return (
    <div className="home-container">
      <h1>Jogo da Memória Multiplayer</h1>
      <p>Bem-vindo ao melhor jogo da memória online! Teste suas habilidades de memorização, 
      desafie seus amigos e divirta-se com diferentes temas e níveis de dificuldade.</p>
      
      <div className="home-buttons">
        {isAuthenticated ? (
          <Link to="/game" className="button start-game-button">Iniciar Jogo</Link>
        ) : (
          <>
            <Link to="/login" className="button">Entrar</Link>
            <Link to="/register" className="button">Cadastrar</Link>
          </>
        )}
      </div>
      
      <h2>Novidades e Funcionalidades</h2>
      <div className="home-features">
        <div className="card">
          <h3>Multiplayer</h3>
          <p>Jogue com amigos em tempo real! Crie uma sala e compartilhe o código para 
          que seus amigos entrem na partida.</p>
        </div>
        
        <div className="card">
          <h3>Temas Variados</h3>
          <p>Escolha entre diferentes temas como animais, frutas, emojis e esportes para 
          personalizar sua experiência.</p>
        </div>
        
        <div className="card">
          <h3>Níveis de Dificuldade</h3>
          <p>Desafie-se com diferentes níveis: fácil, médio e difícil, cada um com seu 
          próprio layout e número de cartas.</p>
        </div>
      </div>
      
      <div className="home-how-to-play">
        <h2>Como Jogar</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <p>Escolha um tema e um nível de dificuldade para começar.</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <p>Clique nas cartas para virá-las e memorize suas posições.</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <p>Encontre todos os pares de cartas correspondentes para vencer.</p>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <p>Compete pelo melhor tempo e menor número de movimentos!</p>
          </div>
        </div>
      </div>
      
      <div className="home-creator">
        <h2>Sobre o Criador</h2>
        <p>Este jogo foi desenvolvido com carinho por <strong>Diego Silva</strong>, 
        um apaixonado por jogos clássicos e tecnologia. Criado para proporcionar diversão 
        e exercitar a memória de jogadores de todas as idades.</p>
      </div>
      
      <div className="home-footer">
        {isAuthenticated ? (
          <Link to="/game" className="button start-game-button">Começar a Jogar Agora!</Link>
        ) : (
          <p>Faça login ou cadastre-se para começar a jogar e salvar suas pontuações!</p>
        )}
      </div>
    </div>
  );
};

export default Home;