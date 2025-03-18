import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import Card from './Card';
import GameSettings from './GameSettings';
import AuthService from '../services/AuthService';
import soundService from '../services/SoundService';

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  
  // Configurações do jogo
  const [difficulty, setDifficulty] = useState('medium');
  const [theme, setTheme] = useState('animals');
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(!soundService.getMuteState());
  const [showSettings, setShowSettings] = useState(false);
  const [gameInputRoomId, setGameInputRoomId] = useState('');
  const [yourTurn, setYourTurn] = useState(false);

  // Referência ao jogador atual
  const [currentPlayer, setCurrentPlayer] = useState(null);

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexão com a internet restaurada!");
      
      // Reconectar ao socket se estiver em uma sala
      if (isMultiplayer && roomId) {
        reconnectToRoom();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Conexão com a internet perdida! O jogo requer conexão online.");
      
      // Pausar o jogo
      if (gameStarted) {
        stopTimer();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMultiplayer, roomId, gameStarted]);

  // Reconectar à sala após recuperar conexão
  const reconnectToRoom = () => {
    if (socket && roomId) {
      socket.emit('reconnectToRoom', {
        roomId,
        playerName: getPlayerName(),
        playerId: socket.id
      });
    }
  };

  // Efeito para configurar o SoundService
  useEffect(() => {
    // Sincronizar o estado do som com o SoundService
    soundService.toggleMute(!soundEnabled);
  }, [soundEnabled]);

  // Efeito para carregar o jogador atual
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentPlayer(user);
    } else {
      // Redirecionar para login se não estiver autenticado
      window.location.href = '/login';
    }
  }, []);

  // Inicializar jogo e conectar ao socket
  useEffect(() => {
    if (!isOnline) {
      toast.error("Este jogo requer conexão com a internet para funcionar.");
      return;
    }
    
    // Conecta ao servidor Socket.io
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Ouvintes de eventos do socket
    newSocket.on('connect', () => {
      console.log('Conectado ao servidor!');
      toast.success("Conectado ao servidor de jogo!");
    });

    newSocket.on('connect_error', () => {
      toast.error("Erro ao conectar ao servidor de jogo. Verifique sua conexão.");
      setIsOnline(false);
    });

    newSocket.on('roomCreated', (data) => {
      setRoomId(data.roomId);
      setGameInputRoomId(data.roomId);
      setWaitingForPlayers(true);
      toast.success(`Sala criada: ${data.roomId}`);
      soundService.play('start');
    });

    newSocket.on('playerJoined', (data) => {
      setPlayers(data.players);
      toast.info(`${data.playerName} entrou na sala!`);
      soundService.play('opponent_move');
      setWaitingForPlayers(data.players.length < 2);
    });

    newSocket.on('playerLeft', (data) => {
      setPlayers(data.players);
      toast.info(`${data.playerName} saiu da sala!`);
      
      // Se não houver jogadores suficientes, pausar o jogo
      if (data.players.length < 2 && gameStarted) {
        toast.warning("Aguardando mais jogadores para continuar...");
        setWaitingForPlayers(true);
      }
    });

    newSocket.on('gameStarted', (data) => {
      setCards(data.cards);
      setGameStarted(true);
      setLoading(false);
      setWaitingForPlayers(false);
      toast.success('O jogo começou!');
      soundService.play('start');
      startTimer();
      
      // Definir de quem é a vez
      if (data.currentPlayer === newSocket.id) {
        setYourTurn(true);
        toast.info("É a sua vez de jogar!");
      } else {
        setYourTurn(false);
        toast.info("Aguarde sua vez...");
      }
    });

    newSocket.on('yourTurn', () => {
      setYourTurn(true);
      toast.info("É a sua vez de jogar!");
      soundService.play('start');
    });

    newSocket.on('waitTurn', () => {
      setYourTurn(false);
      toast.info("Aguarde sua vez...");
    });

    newSocket.on('cardFlipped', (data) => {
      if (data.playerId !== newSocket.id) {
        // Atualize apenas se não for o jogador atual
        handleOpponentFlip(data.cardIndex);
      }
    });

    newSocket.on('turnComplete', (data) => {
      // O servidor informa que o turno de alguém foi concluído
      if (data.nextPlayer === newSocket.id) {
        setYourTurn(true);
        toast.info("É a sua vez de jogar!");
      } else {
        setYourTurn(false);
      }
    });

    newSocket.on('updateScore', (data) => {
      setPlayers(data.players);
    });

    newSocket.on('matchFound', (data) => {
      // Adicionar o par encontrado
      setMatchedPairs(prev => [...prev, data.cardValue]);
      
      if (data.playerId === newSocket.id) {
        soundService.play('match');
        toast.success("Você encontrou um par!");
        setScore(prev => prev + 10);
      } else {
        soundService.play('opponent_move');
        toast.info(`${data.playerName} encontrou um par!`);
      }
    });

    newSocket.on('noMatchFound', (data) => {
      if (data.playerId !== newSocket.id) {
        soundService.play('error');
        
        // Virar as cartas de volta após um delay
        setTimeout(() => {
          setCards(prev => 
            prev.map(card => {
              if (card.id === data.firstCardId || card.id === data.secondCardId) {
                return { ...card, isFlipped: false };
              }
              return card;
            })
          );
        }, DIFFICULTY_LEVELS[difficulty].flipDelay);
      }
    });

    newSocket.on('gameOver', (data) => {
      setGameOver(true);
      stopTimer();
      soundService.play('win');
      toast.success(`Jogo finalizado! Vencedor: ${data.winner}`);
    });

    newSocket.on('reconnected', (data) => {
      // Atualizar o estado do jogo após reconexão
      setCards(data.gameState.cards);
      setMatchedPairs(data.gameState.matchedPairs);
      setPlayers(data.gameState.players);
      setGameStarted(data.gameState.gameStarted);
      setYourTurn(data.gameState.currentPlayer === newSocket.id);
      setLoading(false);
      
      toast.success("Reconectado à sala com sucesso!");
    });

    // Verificar se tem jogos acontecendo
    newSocket.on('availableRooms', (data) => {
      if (data.rooms.length > 0) {
        toast.info(`Existem ${data.rooms.length} salas disponíveis para entrar!`);
      }
    });

    // Inicialmente, verifique se há salas disponíveis
    setTimeout(() => {
      if (newSocket.connected) {
        newSocket.emit('getRooms');
      }
    }, 2000);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      clearInterval(timerInterval);
    };
  }, [isOnline]);

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
    if (!isOnline) {
      toast.error("Este jogo requer conexão com a internet para funcionar.");
      return;
    }
    
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
  }, [difficulty, timerEnabled, isOnline]);

  // Criar uma sala multijogador
  const createRoom = () => {
    if (!isOnline) {
      toast.error("Este jogo requer conexão com a internet para funcionar.");
      return;
    }
    
    if (socket) {
      socket.emit('createRoom', { 
        playerName: getPlayerName(),
        difficulty,
        theme
      });
      setIsMultiplayer(true);
      setLoading(true);
      setShowSettings(false);
      setWaitingForPlayers(true);
    }
  };

  // Entrar em uma sala
  const joinRoom = (roomToJoin) => {
    if (!isOnline) {
      toast.error("Este jogo requer conexão com a internet para funcionar.");
      return;
    }
    
    if (socket && roomToJoin) {
      socket.emit('joinRoom', {
        roomId: roomToJoin,
        playerName: getPlayerName()
      });
      setRoomId(roomToJoin);
      setIsMultiplayer(true);
      setLoading(true);
      setShowSettings(false);
      setWaitingForPlayers(true);
    }
  };

  // Iniciar o jogo multijogador
  const startMultiplayerGame = () => {
    if (!isOnline) {
      toast.error("Este jogo requer conexão com a internet para funcionar.");
      return;
    }
    
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
    // Verificar se está online
    if (!isOnline) {
      toast.error("Este jogo requer conexão com a internet para funcionar.");
      return;
    }
    
    // Verificar se é a vez do jogador em modo multiplayer
    if (isMultiplayer && !yourTurn) {
      toast.warning("Aguarde sua vez para jogar!");
      return;
    }
    
    // Não permitir cliques se o jogo acabou, ou se já há 2 cartas viradas
    if (gameOver || flippedCards.length >= 2 || waitingForPlayers) {
      return;
    }

    // Encontrar a carta clicada
    const clickedCard = cards.find(card => card.id === id);

    // Não permitir clicar em cartas já viradas ou combinadas
    if (clickedCard.isFlipped || matchedPairs.includes(clickedCard.value)) {
      return;
    }

    // Reproduzir som de clique
    soundService.play('flip');

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
        cardValue: clickedCard.value,
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
        soundService.play('match');

        // Enviar atualização de pontuação no modo multijogador
        if (isMultiplayer && socket) {
          socket.emit('matchFound', {
            roomId,
            playerId: socket.id,
            playerName: getPlayerName(),
            cardValue: firstCard.value,
            score: score + 10
          });
        }

        // Verificar se o jogo acabou
        const { pairs } = DIFFICULTY_LEVELS[difficulty];
        if (matchedPairs.length + 1 === pairs) {
          setGameOver(true);
          stopTimer();
          
          // Reproduzir som de vitória
          soundService.play('win');
          
          toast.success('Parabéns! Você completou o jogo!');

          if (isMultiplayer && socket) {
            socket.emit('gameOver', {
              roomId,
              playerId: socket.id,
              playerName: getPlayerName(),
              score: score + 10
            });
          }
        } else if (isMultiplayer) {
          // Se não acabou, continue com o turno do jogador já que acertou
          socket.emit('continueTurn', { roomId });
        }
      } else {
        // Sem match, virar as cartas de volta após um delay
        const { flipDelay } = DIFFICULTY_LEVELS[difficulty];
        
        // Reproduzir som de erro
        soundService.play('error');
        
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
          
          // Passar a vez para o próximo jogador em modo multiplayer
          if (isMultiplayer && socket) {
            socket.emit('endTurn', {
              roomId,
              firstCardId: firstCard.id,
              secondCardId: secondCard.id
            });
            setYourTurn(false);
          }
        }, flipDelay);
      }
    }
  };

  // Lidar com cartas viradas pelo oponente
  const handleOpponentFlip = (cardIndex) => {
    const newCards = [...cards];
    const card = newCards.find(c => c.id === cardIndex);
    
    if (card) {
      card.isFlipped = true;
      setCards(newCards);
      soundService.play('opponent_move');
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
      setGameInputRoomId('');
      setPlayers([]);
      setWaitingForPlayers(false);
    }
    soundService.play('restart');
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

  // Alternar o som
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Ajustar o volume do som
  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    soundService.setVolume(value);
  };

  // Procurar salas disponíveis
  const findRooms = () => {
    if (socket) {
      socket.emit('getRooms');
    }
  };

  // Se não estiver online, mostrar mensagem de erro
  if (!isOnline) {
    return (
      <div className="offline-message">
        <h2>Conexão Offline</h2>
        <p>Este jogo requer uma conexão com a internet para funcionar.</p>
        <p>Por favor, verifique sua conexão e tente novamente.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Tentar Novamente
        </button>
      </div>
    );
  }

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
            {isMultiplayer && yourTurn && (
              <p className="your-turn-indicator">Sua vez!</p>
            )}
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
            setSoundEnabled={toggleSound}
            resetGame={resetGame}
            currentThemes={THEMES}
            handleVolumeChange={handleVolumeChange}
            volume={soundService.getVolume()}
          />
        )}
        
        {isMultiplayer && (
          <div className="game-controls">
            <div className="room-info">
              <p>Sala: <span className="room-code">{roomId}</span></p>
              <p>Jogadores: {players.length}/2</p>
            </div>
            
            {players.length > 0 && (
              <div className="players-list">
                <h3>Jogadores:</h3>
                <ul>
                  {players.map((player, index) => (
                    <li key={index} className={player.active ? 'active-player' : ''}>
                      {player.name === getPlayerName() ? `Você (${player.name})` : player.name}: {player.score} pontos
                      {player.isCurrentPlayer && <span className="current-player-indicator"> ⭐</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {!gameStarted && (
              <button 
                className="button"
                onClick={startMultiplayerGame}
                disabled={players.length < 2}
              >
                {players.length < 2 ? 'Aguardando jogadores...' : 'Iniciar Jogo'}
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
        <div className="loading">Carregando o jogo...</div>
      ) : (
        <>
          {!isMultiplayer && !gameStarted && (
            <div className="game-start-overlay">
              <h3>Bem-vindo ao Jogo da Memória Multiplayer</h3>
              <p>Jogue online contra outros jogadores ou crie sua própria sala!</p>
              
              <div className="button-group">
                <button className="button" onClick={createRoom}>Criar Sala Multiplayer</button>
                <button className="button" onClick={findRooms}>Buscar Salas</button>
              </div>
              
              <div className="join-room">
                <input 
                  type="text" 
                  placeholder="Digite o código da sala"
                  onChange={(e) => setGameInputRoomId(e.target.value)}
                  value={gameInputRoomId}
                />
                <button 
                  className="button"
                  onClick={() => joinRoom(gameInputRoomId)}
                  disabled={!gameInputRoomId}
                >
                  Entrar na Sala
                </button>
              </div>
              
              <p className="online-note">
                Este jogo funciona exclusivamente online.
                <br />
                Jogadores conectados: {socket ? 'Online ✅' : 'Offline ❌'}
              </p>
            </div>
          )}
          
          {waitingForPlayers && isMultiplayer && (
            <div className="waiting-overlay">
              <h3>Aguardando Jogadores</h3>
              <p>Compartilhe este código com um amigo:</p>
              <div className="room-code-display">
                {roomId}
                <button 
                  className="copy-button"
                  onClick={() => {
                    navigator.clipboard.writeText(roomId);
                    toast.info("Código da sala copiado!");
                  }}
                >
                  Copiar
                </button>
              </div>
              <p>Jogadores: {players.length}/2</p>
              <div className="waiting-animation">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
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
                disabled={isMultiplayer && !yourTurn}
              />
            ))}
          </div>
        </>
      )}

      {gameOver && (
        <div className="game-over">
          <h2>Jogo Finalizado!</h2>
          {isMultiplayer ? (
            <>
              <h3>Placar Final:</h3>
              <ul className="final-score-list">
                {players.map((player, index) => (
                  <li key={index} className={player.winner ? 'winner' : ''}>
                    {player.name}: {player.score} pontos
                    {player.winner && <span className="winner-badge">🏆 Vencedor</span>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p>Sua pontuação: {score}</p>
              <p>Movimentos: {moves}</p>
              {timerEnabled && <p>Tempo: {formatTime(timer)}</p>}
            </>
          )}
          <div className="game-over-buttons">
            <button 
              className="button"
              onClick={resetGame}
            >
              Jogar Novamente
            </button>
            <button 
              className="button"
              onClick={createRoom}
            >
              Nova Sala Multiplayer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;