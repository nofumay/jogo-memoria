import React, { useState, useEffect } from 'react';
import './MemoryGame.css';
import Card from './Card';
import ScorePanel from './ScorePanel';
import GameService from '../services/GameService';
import MultiplayerService from '../services/MultiplayerService';

const MemoryGame = () => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [multiplayerService, setMultiplayerService] = useState(null);
  
  useEffect(() => {
    initGame();
    connectMultiplayerService();
  }, []);
  
  const initGame = async () => {
    try {
      setLoading(true);
      const gameCards = await GameService.getCards();
      setCards(gameCards);
      setFlippedCards([]);
      setMatchedPairs([]);
      setMoves(0);
      setGameOver(false);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao inicializar o jogo:", error);
      setLoading(false);
    }
  };
  
  const connectMultiplayerService = () => {
    const service = new MultiplayerService();
    service.connect({
      onConnect: () => {
        console.log('Conectado ao serviço de multiplayer');
      },
      onDisconnect: () => {
        console.log('Desconectado do serviço de multiplayer');
      },
      onMessage: (message) => {
        console.log('Mensagem recebida:', message);
      },
      onError: (error) => {
        console.error('Erro ao se conectar ao serviço de multiplayer:', error);
      }
    });
    setMultiplayerService(service);
  };
  
  const handleCardClick = (id) => {
    // Ignora cliques se o jogo estiver carregando, acabou, ou mais de duas cartas estiverem viradas
    if (loading || gameOver || flippedCards.length >= 2 || matchedPairs.includes(id) || flippedCards.includes(id)) {
      return;
    }
    
    // Adiciona a carta à lista de cartas viradas
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);
    
    // Se esta é a segunda carta virada
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      const [firstCardId, secondCardId] = newFlippedCards;
      const firstCard = cards.find(card => card.id === firstCardId);
      const secondCard = cards.find(card => card.id === secondCardId);
      
      // Verifica se as cartas formam um par
      if (firstCard.value === secondCard.value) {
        // Adiciona as cartas à lista de pares formados
        setMatchedPairs([...matchedPairs, firstCardId, secondCardId]);
        setFlippedCards([]);
        
        // Verifica se todas as cartas foram encontradas
        if (matchedPairs.length + 2 === cards.length) {
          setGameOver(true);
          GameService.saveScore(moves);
        }
      } else {
        // Se não formarem um par, vira as cartas de volta após um tempo
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };
  
  const restartGame = () => {
    initGame();
  };
  
  if (loading) {
    return <div className="loading">Carregando...</div>;
  }
  
  return (
    <div className="memory-game">
      <h1>Jogo da Memória</h1>
      <ScorePanel moves={moves} />
      <div className="game-board">
        {cards.map(card => (
          <Card 
            key={card.id} 
            id={card.id}
            value={card.value}
            isFlipped={flippedCards.includes(card.id) || matchedPairs.includes(card.id)}
            isMatched={matchedPairs.includes(card.id)}
            onClick={() => handleCardClick(card.id)}
          />
        ))}
      </div>
      {gameOver && (
        <div className="game-over">
          <h2>Parabéns!</h2>
          <p>Você completou o jogo em {moves} movimentos!</p>
          <button onClick={restartGame}>Jogar Novamente</button>
        </div>
      )}
    </div>
  );
};

export default MemoryGame; 