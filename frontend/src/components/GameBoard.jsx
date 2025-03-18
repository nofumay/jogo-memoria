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
  const [isMultiplayer, setIsMultiplayer] = useState(true); // Por padrão, sempre é multiplayer agora
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  
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
  const [totalPoints, setTotalPoints] = useState(0);
  const [opponent, setOpponent] = useState(null);

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
    
    // Verificar se o jogador fecha a página
    const handleBeforeUnload = (e) => {
      if (isMultiplayer && gameStarted) {
        // Notifica o servidor que o jogador está saindo
        if (socket) {
          socket.emit('playerLeaving', { roomId, playerId: socket.id });
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isMultiplayer, roomId, gameStarted, socket]);

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

  // Efeito para carregar o jogador atual e seus pontos acumulados
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentPlayer(user);
      // Carregar pontos totais do jogador do localStorage
      const storedPoints = localStorage.getItem(`memoryGamePoints_${user.username}`);
      if (storedPoints) {
        setTotalPoints(parseInt(storedPoints, 10));
      }
    } else {
      // Redirecionar para login se não estiver autenticado
      window.location.href = '/login';
    }
  }, []);

  // Salvar pontos ganhos no localStorage
  const savePoints = (newPoints) => {
    if (currentPlayer) {
      const totalNewPoints = totalPoints + newPoints;
      setTotalPoints(totalNewPoints);
      localStorage.setItem(`memoryGamePoints_${currentPlayer.username}`, totalNewPoints.toString());
    }
  };

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

    newSocket.on('matchFound', (data) => {
      setRoomId(data.roomId);
      setIsMatchmaking(false);
      setWaitingForPlayers(false);
      setPlayers(data.players);
      
      // Identificar o oponente
      const opponentPlayer = data.players.find(p => p.id !== newSocket.id);
      if (opponentPlayer) {
        setOpponent(opponentPlayer);
      }
      
      toast.success(`Partida encontrada! Você jogará contra ${opponentPlayer ? opponentPlayer.name : 'um oponente'}`);
      soundService.play('start');
      
      // O jogo começa automaticamente após encontrar uma partida
      setTimeout(() => {
        startMultiplayerGame();
      }, 2000);
    });

    newSocket.on('enterMatchmaking', () => {
      setIsMatchmaking(true);
      toast.info("Procurando um oponente...");
    });

    newSocket.on('playerJoined', (data) => {
      setPlayers(data.players);
      
      // Identificar o oponente
      const opponentPlayer = data.players.find(p => p.id !== newSocket.id);
      if (opponentPlayer) {
        setOpponent(opponentPlayer);
        toast.info(`${opponentPlayer.name} entrou na sala!`);
      } else {
        toast.info(`Um novo jogador entrou na sala!`);
      }
      
      soundService.play('opponent_move');
      setWaitingForPlayers(data.players.length < 2);
    });

    newSocket.on('playerLeft', (data) => {
      setPlayers(data.players);
      
      if (gameStarted) {
        // Se um jogador sair durante o jogo, o outro vence
        toast.warning(`${data.playerName} abandonou a partida!`);
        
        if (data.winnerByDefault) {
          setGameOver(true);
          stopTimer();
          soundService.play('win');
          toast.success("Vitória! Seu oponente abandonou a partida.");
          
          // Adicionar pontos pela vitória por abandono
          const pointsWon = 50;
          setScore(prevScore => prevScore + pointsWon);
          savePoints(pointsWon);
        }
      } else {
        toast.info(`${data.playerName} saiu da sala!`);
      }
      
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
      
      // Atualizar o score do jogador atual
      const currentPlayerFromServer = data.players.find(p => p.id === newSocket.id);
      if (currentPlayerFromServer) {
        setScore(currentPlayerFromServer.score);
      }
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
      
      // Verificar se o jogador atual é o vencedor
      const isWinner = data.winner === getPlayerName();
      
      if (isWinner) {
        soundService.play('win');
        
        // Adicionar pontos ao jogador
        const pointsWon = 100;
        savePoints(pointsWon);
        
        toast.success(`Parabéns! Você venceu e ganhou ${pointsWon} pontos!`);
      } else {
        toast.info(`Jogo finalizado! ${data.winner} venceu a partida.`);
      }
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
  const initGame = useCallback(() => {
    if (!isOnline) {
      toast.error("Este jogo requer conexão com a internet para funcionar.");
      return;
    }
    
    setLoading(true);
    resetGameState();
    setLoading(false);
  }, [difficulty, timerEnabled, isOnline]);

  // Resetar estado do jogo
  const resetGameState = () => {
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs([]);
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setGameStarted(false);
    setYourTurn(false);
    stopTimer();
    setOpponent(null);
  };

  // Entrar na fila de matchmaking
  const startMatchmaking = () => {
    if (!isOnline) {
      toast.error("Este jogo requer conexão com a internet para funcionar.");
      return;
    }
    
    if (socket) {
      socket.emit('enterMatchmaking', { 
        playerName: getPlayerName(),
        difficulty,
        theme
      });
      setIsMultiplayer(true);
      setIsMatchmaking(true);
      setShowSettings(false);
      
      toast.info("Procurando um oponente...");
    }
  };

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
      setLoading(false);
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
      setLoading(false);
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
    if (!yourTurn) {
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

    // Enviar evento para outros jogadores
    if (socket) {
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

        // Enviar atualização de pontuação
        if (socket) {
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

          if (socket) {
            socket.emit('gameOver', {
              roomId,
              playerId: socket.id,
              playerName: getPlayerName(),
              score: score + 10
            });
            
            // Adicionar pontos ao vencer
            savePoints(100);
          }
        } else {
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
          
          // Passar a vez para o próximo jogador
          if (socket) {
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
      setIsMultiplayer(true);
      setRoomId('');
      setGameInputRoomId('');
      setPlayers([]);
      setWaitingForPlayers(false);
      setIsMatchmaking(false);
    }
    soundService.play('restart');
    resetGameState();
  };

  // Cancelar matchmaking
  const cancelMatchmaking = () => {
    if (socket) {
      socket.emit('cancelMatchmaking');
      setIsMatchmaking(false);
    }
    resetGameState();
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
            {yourTurn && gameStarted && (
              <p className="your-turn-indicator">Sua vez!</p>
            )}
            <p className="total-points">Total de Pontos: {totalPoints}</p>
            <button className="settings-button" onClick={toggleSettings}>
              {showSettings ? 'Fechar Configurações' : 'Configurações'}
            </button>
          </div>
        </div>
        
        {showSettings && !gameStarted && (
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
        
        {gameStarted && (
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
                    <li key={index} 
                        className={`${player.active ? 'active-player' : ''} ${player.id === socket?.id ? 'current-player' : ''}`}>
                      {player.id === socket?.id ? `Você (${player.name})` : player.name}: {player.score} pontos
                      {player.isCurrentPlayer && <span className="current-player-indicator"> ⭐</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <button 
              className="button"
              onClick={resetGame}
            >
              Abandonar Partida
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">Carregando o jogo...</div>
      ) : (
        <>
          {!gameStarted && !isMatchmaking && (
            <div className="game-start-overlay">
              <h3>Bem-vindo {currentPlayer?.username}!</h3>
              <p>Total de pontos: {totalPoints}</p>
              
              <div className="button-group">
                <button className="button start-game-button" onClick={startMatchmaking}>
                  Iniciar Jogo
                </button>
                <button className="button" onClick={createRoom}>Criar Sala</button>
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
                Status: {socket?.connected ? 'Conectado ✅' : 'Desconectado ❌'}
              </p>
            </div>
          )}
          
          {isMatchmaking && (
            <div className="matchmaking-overlay">
              <h3>Procurando um oponente...</h3>
              <p>Aguarde enquanto conectamos você a outro jogador.</p>
              <div className="matchmaking-animation">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <button className="button cancel-button" onClick={cancelMatchmaking}>
                Cancelar
              </button>
            </div>
          )}
          
          {waitingForPlayers && !isMatchmaking && (
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
              
              {players.length >= 2 && (
                <button 
                  className="button start-button"
                  onClick={startMultiplayerGame}
                >
                  Iniciar Partida
                </button>
              )}
              
              <button className="button cancel-button" onClick={resetGame}>
                Cancelar
              </button>
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
                disabled={!yourTurn || waitingForPlayers || isMatchmaking}
              />
            ))}
          </div>
        </>
      )}

      {gameOver && (
        <div className="game-over">
          <h2>Jogo Finalizado!</h2>
          {players.length > 0 ? (
            <>
              <h3>Placar Final:</h3>
              <ul className="final-score-list">
                {players.map((player, index) => (
                  <li key={index} className={`${player.winner ? 'winner' : ''} ${player.id === socket?.id ? 'you' : ''}`}>
                    {player.id === socket?.id ? `Você (${player.name})` : player.name}: {player.score} pontos
                    {player.winner && <span className="winner-badge">🏆 Vencedor</span>}
                  </li>
                ))}
              </ul>
              
              {players.find(p => p.id === socket?.id && p.winner) && (
                <p className="points-earned">+100 pontos adicionados ao seu perfil!</p>
              )}
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
              onClick={startMatchmaking}
            >
              Jogar Novamente
            </button>
            <button 
              className="button"
              onClick={createRoom}
            >
              Nova Sala
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;