import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import Card from './Card';

// Configurações do jogo
const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, flipDelay: 1200 },
  medium: { pairs: 8, flipDelay: 1000 },
  hard: { pairs: 12, flipDelay: 800 }
};

const THEMES = ['animals', 'fruits', 'emojis', 'sports'];

const GameBoard = () => {
  // Estados do jogo
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Configurações do jogo
  const [difficulty, setDifficulty] = useState('medium');
  const [theme, setTheme] = useState('animals');
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  // Inicializar jogo e conectar ao socket
  useEffect(() => {
    // Conecta ao servidor Socket.io
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Ouvintes de eventos do socket
    newSocket.on('connect', () => {
      console.log('Conectado ao servidor!');
    });

    newSocket.on('roomCreated', (data) => {
      setRoomId(data.roomId);
      toast.success(`Sala criada: ${data.roomId}`);
    });

    newSocket.on('playerJoined', (data) => {
      setPlayers(data.players);
      toast.info(`${data.playerName} entrou na sala!`);
    });

    newSocket.on('playerLeft', (data) => {
      setPlayers(data.players);
      toast.info(`${data.playerName} saiu da sala!`);
    });

    newSocket.on('gameStarted', (data) => {
      setCards(data.cards);
      setGameStarted(true);
      setLoading(false);
      toast.success('O jogo começou!');
      startTimer();
    });

    newSocket.on('cardFlipped', (data) => {
      if (data.playerId !== newSocket.id) {
        // Atualize apenas se não for o jogador atual
        handleOpponentFlip(data.cardIndex);
      }
    });

    newSocket.on('updateScore', (data) => {
      setPlayers(data.players);
    });

    newSocket.on('gameOver', (data) => {
      setGameOver(true);
      stopTimer();
      toast.success(`Jogo finalizado! Vencedor: ${data.winner}`);
    });

    // Inicializar o jogo solo por padrão
    initGame();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      clearInterval(timerInterval);
    };
  }, []);

  // Iniciar timer
  const startTimer = () => {
    stopTimer();
    setTimer(0);
    const interval = setInterval(() => {
      setTimer(prevTimer => prevTimer + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  // Parar timer
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // Formatação do tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Inicializar o jogo
  const initGame = useCallback(() => {
    setLoading(true);
    setGameStarted(false);
    setMoves(0);
    stopTimer();
    
    const { pairs } = DIFFICULTY_LEVELS[difficulty];
    
    // Gerar cartas
    const cardValues = Array(pairs).fill(0).map((_, i) => i + 1);
    const cardDeck = [...cardValues, ...cardValues]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }));

    setCards(cardDeck);
    setFlippedCards([]);
    setMatchedPairs([]);
    setScore(0);
    setGameOver(false);
    setLoading(false);
  }, [difficulty]);

  // Efeito para reiniciar o jogo quando a dificuldade muda
  useEffect(() => {
    if (!isMultiplayer) {
      initGame();
    }
  }, [difficulty, initGame, isMultiplayer]);

  // Criar uma sala multijogador
  const createRoom = () => {
    if (socket) {
      socket.emit('createRoom', { playerName: getPlayerName() });
      setIsMultiplayer(true);
      setLoading(true);
    }
  };

  // Entrar em uma sala
  const joinRoom = (roomToJoin) => {
    if (socket && roomToJoin) {
      socket.emit('joinRoom', {
        roomId: roomToJoin,
        playerName: getPlayerName()
      });
      setRoomId(roomToJoin);
      setIsMultiplayer(true);
      setLoading(true);
    }
  };

  // Iniciar o jogo multijogador
  const startMultiplayerGame = () => {
    if (socket && roomId) {
      socket.emit('startGame', { 
        roomId,
        difficulty,
        theme 
      });
    }
  };

  // Obter o nome do jogador do localStorage
  const getPlayerName = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.username || 'Jogador';
  };

  // Lidar com clique na carta
  const handleCardClick = (id) => {
    // Não permitir cliques se o jogo não começou, acabou, ou se já há 2 cartas viradas
    if (!gameStarted && !isMultiplayer) {
      startGame();
      return;
    }
    
    if (gameOver || flippedCards.length >= 2) {
      return;
    }

    // Encontrar a carta clicada
    const clickedCard = cards.find(card => card.id === id);

    // Não permitir clicar em cartas já viradas ou combinadas
    if (clickedCard.isFlipped || matchedPairs.includes(clickedCard.value)) {
      return;
    }

    // Adicionar a carta ao estado de cartas viradas
    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);

    // Atualizar o estado das cartas para mostrar a carta virada
    const newCards = cards.map(card => {
      if (card.id === id) {
        return { ...card, isFlipped: true };
      }
      return card;
    });
    setCards(newCards);
    
    // Incrementar o contador de movimentos
    setMoves(moves + 1);

    // Enviar evento para outros jogadores no modo multijogador
    if (isMultiplayer && socket) {
      socket.emit('flipCard', {
        roomId,
        cardIndex: id,
        playerId: socket.id
      });
    }

    // Verificar se há um par
    if (newFlippedCards.length === 2) {
      const [firstCard, secondCard] = newFlippedCards;

      if (firstCard.value === secondCard.value) {
        // Match encontrado
        setMatchedPairs([...matchedPairs, firstCard.value]);
        setScore(prevScore => prevScore + 10);
        setFlippedCards([]);

        // Enviar atualização de pontuação no modo multijogador
        if (isMultiplayer && socket) {
          socket.emit('updateScore', {
            roomId,
            playerId: socket.id,
            score: score + 10
          });
        }

        // Verificar se o jogo acabou
        const { pairs } = DIFFICULTY_LEVELS[difficulty];
        if (matchedPairs.length + 1 === pairs) {
          setGameOver(true);
          stopTimer();
          toast.success('Parabéns! Você completou o jogo!');

          if (isMultiplayer && socket) {
            socket.emit('gameOver', {
              roomId,
              playerId: socket.id,
              playerName: getPlayerName()
            });
          }
        }
      } else {
        // Sem match, virar as cartas de volta após um delay
        const { flipDelay } = DIFFICULTY_LEVELS[difficulty];
        setTimeout(() => {
          setCards(
            cards.map(card => {
              if (card.id === firstCard.id || card.id === secondCard.id) {
                return { ...card, isFlipped: false };
              }
              return card;
            })
          );
          setFlippedCards([]);
        }, flipDelay);
      }
    }
  };

  // Iniciar o jogo single player
  const startGame = () => {
    setGameStarted(true);
    startTimer();
  };

  // Lidar com cartas viradas pelo oponente
  const handleOpponentFlip = (cardIndex) => {
    const newCards = [...cards];
    const card = newCards.find(c => c.id === cardIndex);
    
    if (card) {
      card.isFlipped = true;
      setCards(newCards);
    }
  };

  // Reiniciar o jogo
  const restartGame = () => {
    if (isMultiplayer) {
      if (socket) {
        socket.emit('leaveRoom', { roomId });
      }
      setIsMultiplayer(false);
      setRoomId('');
      setPlayers([]);
    }
    initGame();
  };

  // Mudar o nível de dificuldade
  const changeDifficulty = (newDifficulty) => {
    if (difficulty !== newDifficulty && !gameStarted) {
      setDifficulty(newDifficulty);
    } else if (gameStarted) {
      toast.info('Não é possível alterar a dificuldade durante o jogo');
    }
  };

  // Mudar o tema
  const changeTheme = (newTheme) => {
    if (theme !== newTheme && !gameStarted) {
      setTheme(newTheme);
    } else if (gameStarted) {
      toast.info('Não é possível alterar o tema durante o jogo');
    }
  };

  // Renderizar o grid de cards baseado na dificuldade
  const getGridClass = () => {
    const { pairs } = DIFFICULTY_LEVELS[difficulty];
    if (pairs === 6) return 'game-board game-board-easy';
    if (pairs === 12) return 'game-board game-board-hard';
    return 'game-board';
  };

  // Renderizar o tabuleiro de jogo
  return (
    <div className="game-container">
      <div className="game-info">
        <div>
          <h2>Jogo da Memória</h2>
          <div className="game-stats">
            <p>Pontuação: {score}</p>
            <p>Movimentos: {moves}</p>
            <p>Tempo: {formatTime(timer)}</p>
          </div>
        </div>
        
        <div className="game-controls">
          {!isMultiplayer ? (
            <>
              <div className="difficulty-selector">
                <h3>Dificuldade:</h3>
                <div className="button-group">
                  <button 
                    className={`button ${difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => changeDifficulty('easy')}
                    disabled={gameStarted}
                  >
                    Fácil
                  </button>
                  <button 
                    className={`button ${difficulty === 'medium' ? 'active' : ''}`}
                    onClick={() => changeDifficulty('medium')}
                    disabled={gameStarted}
                  >
                    Médio
                  </button>
                  <button 
                    className={`button ${difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => changeDifficulty('hard')}
                    disabled={gameStarted}
                  >
                    Difícil
                  </button>
                </div>
              </div>
              
              <div className="theme-selector">
                <h3>Tema:</h3>
                <div className="button-group">
                  {THEMES.map((t) => (
                    <button 
                      key={t}
                      className={`button ${theme === t ? 'active' : ''}`}
                      onClick={() => changeTheme(t)}
                      disabled={gameStarted}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                className="button"
                onClick={createRoom}
              >
                Criar Sala Multiplayer
              </button>
              
              <div className="join-room">
                <input 
                  type="text" 
                  placeholder="ID da Sala"
                  onChange={(e) => setRoomId(e.target.value)}
                  value={roomId}
                />
                <button 
                  className="button"
                  onClick={() => joinRoom(roomId)}
                >
                  Entrar na Sala
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="room-info">
                <p>Sala: {roomId}</p>
                <p>Jogadores: {players.length}</p>
              </div>
              
              <div className="difficulty-selector">
                <h3>Dificuldade:</h3>
                <div className="button-group">
                  <button 
                    className={`button ${difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => changeDifficulty('easy')}
                    disabled={gameStarted}
                  >
                    Fácil
                  </button>
                  <button 
                    className={`button ${difficulty === 'medium' ? 'active' : ''}`}
                    onClick={() => changeDifficulty('medium')}
                    disabled={gameStarted}
                  >
                    Médio
                  </button>
                  <button 
                    className={`button ${difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => changeDifficulty('hard')}
                    disabled={gameStarted}
                  >
                    Difícil
                  </button>
                </div>
              </div>
              
              <div className="theme-selector">
                <h3>Tema:</h3>
                <div className="button-group">
                  {THEMES.map((t) => (
                    <button 
                      key={t}
                      className={`button ${theme === t ? 'active' : ''}`}
                      onClick={() => changeTheme(t)}
                      disabled={gameStarted}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {players.length > 0 && (
                <div className="players-list">
                  <h3>Jogadores:</h3>
                  <ul>
                    {players.map((player, index) => (
                      <li key={index}>
                        {player.name}: {player.score} pontos
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button 
                className="button"
                onClick={startMultiplayerGame}
                disabled={players.length < 1 || gameStarted}
              >
                Iniciar Jogo
              </button>
            </>
          )}
          
          <button 
            className="button"
            onClick={restartGame}
          >
            {isMultiplayer ? 'Sair da Sala' : 'Reiniciar Jogo'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className={getGridClass()}>
          {cards.map(card => (
            <Card
              key={card.id}
              id={card.id}
              value={card.value}
              isFlipped={card.isFlipped || matchedPairs.includes(card.value)}
              isMatched={matchedPairs.includes(card.value)}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>
      )}

      {gameOver && (
        <div className="game-over">
          <h2>Jogo Finalizado!</h2>
          <p>Sua pontuação: {score}</p>
          <p>Movimentos: {moves}</p>
          <p>Tempo: {formatTime(timer)}</p>
          <button 
            className="button"
            onClick={restartGame}
          >
            Jogar Novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default GameBoard;