import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Card from '../Card';
import ScorePanel from '../ScorePanel';
import MultiplayerService from '../../services/MultiplayerService';
import AuthService from '../../services/AuthService';
import ThemeService from '../../services/ThemeService';
import './MultiplayerGame.css';

const MultiplayerGame = () => {
  const { roomId, themeId, difficulty } = useParams();
  const navigate = useNavigate();
  
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(null);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  
  // Obter usuário atual
  const currentUser = AuthService.getCurrentUser();
  const username = currentUser ? currentUser.username : 'Anonymous';
  
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      toast.error('Você precisa estar logado para jogar multiplayer');
      navigate('/login');
      return;
    }
    
    // Carregar cartas para o tema selecionado
    const loadCards = async () => {
      try {
        setLoading(true);
        const themeData = await ThemeService.getThemeById(themeId);
        setTheme(themeData);
        
        const cardData = await ThemeService.getCardsForTheme(themeId, difficulty);
        setCards(cardData);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar cartas:', error);
        toast.error('Erro ao carregar o jogo');
        setLoading(false);
      }
    };
    
    loadCards();
    
    // Conectar ao WebSocket
    MultiplayerService.connect({
      onConnect: () => {
        console.log('Conectado ao jogo multiplayer');
        MultiplayerService.joinRoom(roomId, username);
      },
      onDisconnect: () => {
        console.log('Desconectado do jogo multiplayer');
      },
      onMessage: (message) => {
        console.log('Mensagem recebida:', message);
        
        switch (message.type) {
          case 'join':
            if (message.senderId !== username) {
              toast.info(`${message.senderId} entrou na sala`);
              setPlayers(prev => {
                if (!prev.includes(message.senderId)) {
                  return [...prev, message.senderId];
                }
                return prev;
              });
            }
            break;
            
          case 'leave':
            if (message.senderId !== username) {
              toast.info(`${message.senderId} saiu da sala`);
              setPlayers(prev => prev.filter(player => player !== message.senderId));
            }
            break;
            
          case 'move':
            if (message.senderId !== username) {
              // Processar movimento de outro jogador
              handleRemoteCardFlip(message.content.cardId);
            }
            break;
            
          case 'chat':
            setMessages(prev => [...prev, message]);
            break;
            
          default:
            break;
        }
      },
      onError: (error) => {
        console.error('Erro na conexão WebSocket:', error);
        toast.error('Erro na conexão. Tente novamente.');
      }
    });
    
    return () => {
      // Desconectar ao sair
      MultiplayerService.disconnect();
    };
  }, [roomId, themeId, difficulty, username, navigate]);
  
  const handleCardClick = (id) => {
    // Ignora cliques se o jogo estiver carregando, acabou, ou mais de duas cartas estiverem viradas
    if (loading || gameOver || flippedCards.length >= 2 || matchedPairs.includes(id) || flippedCards.includes(id)) {
      return;
    }
    
    // Adiciona a carta à lista de cartas viradas
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);
    
    // Envia o movimento para outros jogadores
    MultiplayerService.sendMove(id);
    
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
          MultiplayerService.sendMessage('gameOver', { winner: username, moves });
        }
      } else {
        // Se não formarem um par, vira as cartas de volta após um tempo
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };
  
  const handleRemoteCardFlip = (id) => {
    // Processa o movimento de um jogador remoto
    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);
    
    if (newFlippedCards.length === 2) {
      const [firstCardId, secondCardId] = newFlippedCards;
      const firstCard = cards.find(card => card.id === firstCardId);
      const secondCard = cards.find(card => card.id === secondCardId);
      
      if (firstCard.value === secondCard.value) {
        setMatchedPairs([...matchedPairs, firstCardId, secondCardId]);
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!chatMessage.trim()) return;
    
    MultiplayerService.sendChatMessage(chatMessage);
    setChatMessage('');
  };
  
  const exitGame = () => {
    MultiplayerService.disconnect();
    navigate('/');
  };
  
  if (loading) {
    return <div className="loading">Carregando...</div>;
  }
  
  return (
    <div className="multiplayer-game-container">
      <div className="multiplayer-game">
        <h1>Jogo da Memória - Multiplayer</h1>
        <div className="game-info">
          <h2>{theme ? theme.name : 'Tema'}</h2>
          <p>Sala: {roomId}</p>
          <p>Dificuldade: {difficulty}</p>
        </div>
        
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
            <button onClick={exitGame}>Sair do Jogo</button>
          </div>
        )}
      </div>
      
      <div className="multiplayer-sidebar">
        <div className="players-list">
          <h3>Jogadores</h3>
          <ul>
            <li className="current-player">{username} (Você)</li>
            {players.filter(player => player !== username).map(player => (
              <li key={player}>{player}</li>
            ))}
          </ul>
        </div>
        
        <div className="chat-box">
          <h3>Chat</h3>
          <div className="messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message ${msg.senderId === username ? 'own-message' : 'other-message'}`}
              >
                <span className="sender">{msg.senderId}:</span>
                <span className="content">{msg.content.text}</span>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSendMessage} className="chat-form">
            <input 
              type="text" 
              value={chatMessage} 
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Digite uma mensagem..."
            />
            <button type="submit">Enviar</button>
          </form>
        </div>
        
        <button onClick={exitGame} className="exit-button">Sair do Jogo</button>
      </div>
    </div>
  );
};

export default MultiplayerGame; 