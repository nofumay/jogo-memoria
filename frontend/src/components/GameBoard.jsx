import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import Card from './Card';
import GameSettings from './GameSettings';
import AuthService from '../services/AuthService';

// Configurações do jogo
const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, flipDelay: 1200 },
  medium: { pairs: 8, flipDelay: 1000 },
  hard: { pairs: 12, flipDelay: 800 }
};

const THEMES = [
  { name: 'animals', label: 'Animais' },
  { name: 'fruits', label: 'Frutas' },
  { name: 'emojis', label: 'Emojis' },
  { name: 'sports', label: 'Esportes' }
];

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
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Referência ao jogador atual
  const [currentPlayer, setCurrentPlayer] = useState(null);

  // Efeito para carregar o jogador atual
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentPlayer(user);
    }
  }, []);

  // Inicializar jogo e conectar ao socket
  useEffect(() => {
    // Inicia o jogo automaticamente após carregar o componente
    initGame(true);
    
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

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      clearInterval(timerInterval);
    };
  }, []);

  // Reproduzir som
  const playSound = (soundName) => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(error => console.error("Erro ao reproduzir som:", error));
    } catch (error) {
      console.error("Erro ao criar objeto de áudio:", error);
    }
  };

  // Iniciar timer
  const startTimer = () => {
    if (!timerEnabled) return;
    
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
  const initGame = useCallback((autoStart = false) => {
    setLoading(true);
    setGameStarted(autoStart);
    setMoves(0);
    if (!autoStart) {
      stopTimer();
    }
    
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
    
    if (autoStart) {
      startTimer();
    }
  }, [difficulty, timerEnabled]);

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
      setShowSettings(false);
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
      setShowSettings(false);
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
    return currentPlayer?.username || 'Jogador';
  };

  // Lidar com clique na carta
  const handleCardClick = (id) => {
    // Não permitir cliques se o jogo acabou, ou se já há 2 cartas viradas
    if (gameOver || flippedCards.length >= 2) {
      return;
    }

    // Se o jogo não foi iniciado, inicie-o
    if (!gameStarted && !isMultiplayer) {
      startGame();
    }

    // Encontrar a carta clicada
    const clickedCard = cards.find(card => card.id === id);

    // Não permitir clicar em cartas já viradas ou combinadas
    if (clickedCard.isFlipped || matchedPairs.includes(clickedCard.value)) {
      return;
    }

    // Reproduzir som de clique
    playSound('flip');

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

        // Reproduzir som de match
        playSound('match');

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
          
          // Reproduzir som de vitória
          playSound('win');
          
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
        
        // Reproduzir som de erro
        playSound('error');
        
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
    setShowSettings(false);
    playSound('start');
  };

  // Lidar com cartas viradas pelo oponente
  const handleOpponentFlip = (cardIndex) => {
    const newCards = [...cards];
    const card = newCards.find(c => c.id === cardIndex);
    
    if (card) {
      card.isFlipped = true;
      setCards(newCards);
      playSound('opponent_move');
    }
  };

  // Reiniciar o jogo
  const resetGame = () => {
    if (isMultiplayer) {
      if (socket) {
        socket.emit('leaveRoom', { roomId });
      }
      setIsMultiplayer(false);
      setRoomId('');
      setPlayers([]);
    }
    playSound('restart');
    initGame();
  };

  // Renderizar o grid de cards baseado na dificuldade
  const getGridClass = () => {
    const { pairs } = DIFFICULTY_LEVELS[difficulty];
    if (pairs === 6) return 'game-board game-board-easy';
    if (pairs === 12) return 'game-board game-board-hard';
    return 'game-board';
  };

  // Alternar visualização das configurações
  const toggleSettings = () => {
    setShowSettings(!showSettings);
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
            {timerEnabled && <p>Tempo: {formatTime(timer)}</p>}
            <button className="settings-button" onClick={toggleSettings}>
              {showSettings ? 'Fechar Configurações' : 'Configurações'}
            </button>
          </div>
        </div>
        
        {showSettings && (
          <GameSettings 
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            theme={theme}
            setTheme={setTheme}
            timerEnabled={timerEnabled}
            setTimerEnabled={setTimerEnabled}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            resetGame={resetGame}
            currentThemes={THEMES}
          />
        )}
        
        {isMultiplayer && (
          <div className="game-controls">
            <div className="room-info">
              <p>Sala: {roomId}</p>
              <p>Jogadores: {players.length}</p>
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
            
            {!gameStarted && (
              <button 
                className="button"
                onClick={startMultiplayerGame}
                disabled={players.length < 1}
              >
                Iniciar Jogo
              </button>
            )}
            
            <button 
              className="button"
              onClick={resetGame}
            >
              Sair da Sala
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          {!isMultiplayer && !gameStarted && (
            <div className="game-start-overlay">
              <h3>Clique em uma carta para começar</h3>
              <p>Ou use as configurações para ajustar o jogo antes de iniciar</p>
              <div className="button-group">
                <button className="button" onClick={startGame}>Iniciar Jogo</button>
                <button className="button" onClick={createRoom}>Criar Sala Multiplayer</button>
              </div>
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
                  disabled={!roomId}
                >
                  Entrar na Sala
                </button>
              </div>
            </div>
          )}
          
          <div className={getGridClass()}>
            {cards.map(card => (
              <Card
                key={card.id}
                id={card.id}
                value={card.value}
                isFlipped={card.isFlipped || matchedPairs.includes(card.value)}
                isMatched={matchedPairs.includes(card.value)}
                onClick={() => handleCardClick(card.id)}
                theme={theme}
              />
            ))}
          </div>
        </>
      )}

      {gameOver && (
        <div className="game-over">
          <h2>Jogo Finalizado!</h2>
          <p>Sua pontuação: {score}</p>
          <p>Movimentos: {moves}</p>
          {timerEnabled && <p>Tempo: {formatTime(timer)}</p>}
          <button 
            className="button"
            onClick={resetGame}
          >
            Jogar Novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default GameBoard;