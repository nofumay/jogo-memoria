import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verifica se o usuário está logado verificando se há um nome de usuário na barra de navegação
    // Em um sistema real, isso seria feito verificando tokens de autenticação ou sessão
    const checkAuthentication = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setIsAuthenticated(true);
          setUsername(userData.username || 'usuário');
        } catch (e) {
          console.error('Erro ao processar dados do usuário:', e);
          setIsAuthenticated(false);
        }
      } else {
        // Simulação: verificar se estamos mostrando usuário logado na UI
        const userElement = document.querySelector('.navbar-user');
        if (userElement && userElement.textContent.includes('fumay')) {
          setIsAuthenticated(true);
          setUsername('fumay');
        }
      }
    };
    
    checkAuthentication();
  }, []);

  // Função para iniciar o jogo diretamente
  const startGame = () => {
    navigate('/game');
  };

  return (
    <div className="home-container">
      <h1>Jogo da Memória Multiplayer</h1>
      
      {isAuthenticated ? (
        <>
          <p>Bem-vindo de volta, <strong>{username}</strong>! Continue desafiando sua memória e divirta-se com diferentes temas e níveis de dificuldade.</p>
          <div className="home-buttons">
            <button onClick={startGame} className="button start-game-button">Jogar Agora</button>
            <Link to="/leaderboard" className="button">Ranking</Link>
          </div>
        </>
      ) : (
        <>
          <p>Bem-vindo ao melhor jogo da memória online! Teste suas habilidades de memorização, 
          desafie seus amigos e divirta-se com diferentes temas e níveis de dificuldade.</p>
          <div className="home-buttons">
            <Link to="/login" className="button">Entrar</Link>
            <Link to="/register" className="button">Cadastrar</Link>
          </div>
        </>
      )}
      
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
          <button onClick={startGame} className="button start-game-button">Começar a Jogar Agora!</button>
        ) : (
          <p>Faça login ou cadastre-se para começar a jogar e salvar suas pontuações!</p>
        )}
      </div>
    </div>
  );
};

export default Home;