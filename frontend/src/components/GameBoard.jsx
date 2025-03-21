import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import AuthService from '../services/AuthService';

const GameBoard = () => {
  const [cards, setCards] = useState([]);
  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [theme, setTheme] = useState('emojis');
  const [difficulty, setDifficulty] = useState('medium');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [username, setUsername] = useState('');
  const [gameResults, setGameResults] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [isWaitingForPlayer, setIsWaitingForPlayer] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [hasSound, setHasSound] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(50);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [playerLeft, setPlayerLeft] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const socketRef = useRef(null);
  const audioRef = useRef({});
  const connectionAttemptsRef = useRef(0);

  useEffect(() => {
    const checkAuth = async () => {
      const user = AuthService.getCurrentUser();
      if (user) {
        setUsername(user.username);
        setTotalPoints(user.points || 0);
        // Inicializar o socket ao carregar o componente
        initializeSocket();
      } else {
        navigate('/login');
      }
    };

    checkAuth();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [navigate]);

  useEffect(() => {
    const loadSounds = () => {
      const sounds = ['flip', 'match', 'error', 'win', 'start', 'restart', 'opponent_move'];
      sounds.forEach(sound => {
        try {
          audioRef.current[sound] = new Audio(`/sounds/${sound}.mp3`);
          audioRef.current[sound].volume = volumeLevel / 100;
        } catch (error) {
          console.warn(`Não foi possível carregar o som: ${sound}`, error);
        }
      });
    };

    loadSounds();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      Object.values(audioRef.current).forEach(audio => {
        if (audio) audio.volume = volumeLevel / 100;
      });
    }
  }, [volumeLevel]);

  const playSound = (soundName) => {
    if (hasSound && audioRef.current[soundName]) {
      try {
        audioRef.current[soundName].currentTime = 0;
        audioRef.current[soundName].play().catch(e => console.log("Audio play error:", e));
      } catch (error) {
        console.warn(`Erro ao reproduzir som: ${soundName}`, error);
      }
    }
  };

  const initializeSocket = () => {
    if (socketRef.current && socketRef.current.connected) {
      // Socket já inicializado e conectado
      setSocketConnected(true);
      return;
    }

    try {
      console.log("Inicializando socket...");
      
      // Usar o servidor do Netlify em produção ou localhost em desenvolvimento
      const isProduction = window.location.hostname !== 'localhost';
      const serverUrl = isProduction 
        ? 'https://jogo-memoria-server.onrender.com' // URL do servidor hospedado
        : 'http://localhost:3001';
        
      console.log("Conectando ao servidor:", serverUrl);
      
      socketRef.current = io(serverUrl, {
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000
      });
      
      socketRef.current.on('connect', () => {
        console.log('Conectado ao servidor. Socket ID:', socketRef.current.id);
        setSocketConnected(true);
        setErrorMessage('');
        connectionAttemptsRef.current = 0;
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Erro de conexão:', error);
        connectionAttemptsRef.current += 1;
        setSocketConnected(false);
        
        if (connectionAttemptsRef.current >= 3) {
          console.log('Múltiplas falhas de conexão, alternando para modo offline');
          setErrorMessage('');
          setOfflineMode(true);
          // Desconectar socket para evitar novas tentativas
          if (socketRef.current) {
            socketRef.current.disconnect();
          }
        } else {
          setErrorMessage('Não foi possível conectar ao servidor. Verifique se o servidor está rodando e tente novamente.');
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('Desconectado do servidor');
        setSocketConnected(false);
      });

      socketRef.current.on('roomCreated', (data) => {
        console.log('Sala criada, aguardando jogadores:', data);
        setRoomId(data.roomId);
        setIsWaitingForPlayer(true);
        setIsMatchmaking(false);
        alert(`Sala criada com sucesso! Código: ${data.roomId}`);
      });

      socketRef.current.on('playerJoined', (data) => {
        console.log('Jogador entrou:', data);
        setPlayers(data.players);
        
        if (data.players.length === 2) {
          setIsWaitingForPlayer(false);
          alert('Outro jogador entrou na sala! O jogo vai começar...');
        }
      });

      socketRef.current.on('gameStarted', (data) => {
        console.log('Jogo iniciado:', data);
        setCards(data.cards);
        setIsGameStarted(true);
        setCurrentPlayer(data.currentPlayer);
        setIsYourTurn(data.currentPlayer === socketRef.current.id);
        playSound('start');
      });

      socketRef.current.on('cardFlipped', (data) => {
        if (data.playerId !== socketRef.current.id) {
          playSound('opponent_move');
          setFlippedIndexes(prev => [...prev, data.cardIndex]);
        }
      });

      socketRef.current.on('matchFound', (data) => {
        console.log('Par encontrado:', data);
        // Atualizar o estado do jogo com o novo par encontrado
        const cardValue = data.cardValue;
        setMatchedPairs(prev => [...prev, cardValue]);
        
        // Atualizar pontuação dos jogadores
        const players = data.players || [];
        if (players.length > 0) {
          setPlayers(players);
        }
        
        playSound('match');
      });

      socketRef.current.on('noMatchFound', (data) => {
        console.log('Sem match:', data);
        // Resetar as cartas viradas após um delay
        setTimeout(() => {
          setFlippedIndexes([]);
        }, 1000);
        
        playSound('error');
      });

      socketRef.current.on('turnComplete', (data) => {
        console.log('Turno completo, próximo jogador:', data);
        setCurrentPlayer(data.nextPlayer);
        setIsYourTurn(data.nextPlayer === socketRef.current.id);
        setFlippedIndexes([]);
      });

      socketRef.current.on('yourTurn', () => {
        console.log('É a sua vez de jogar!');
        setIsYourTurn(true);
      });

      socketRef.current.on('waitTurn', () => {
        console.log('Aguarde seu turno...');
        setIsYourTurn(false);
      });

      socketRef.current.on('updateScore', (data) => {
        console.log('Atualização de pontuação:', data);
        setPlayers(data.players);
      });

      socketRef.current.on('gameOver', (data) => {
        console.log('Fim de jogo:', data);
        setIsGameOver(true);
        
        // Formatar os resultados para exibição
        const results = data.results || [];
        setGameResults(results);
        
        // Encontrar o próprio jogador nos resultados
        const currentPlayerResult = results.find(result => 
          result.id === socketRef.current.id
        );
        
        if (currentPlayerResult) {
          setFinalScore(currentPlayerResult.score || 0);
          
          // Calcular pontos ganhos
          const pointsEarned = currentPlayerResult.isWinner ? 
            currentPlayerResult.score + 20 : 
            Math.floor(currentPlayerResult.score / 2);
          
          setPointsEarned(pointsEarned);
          setTotalPoints(prev => prev + pointsEarned);
          
          // Atualizar no localStorage
          const user = AuthService.getCurrentUser();
          if (user) {
            user.points = (user.points || 0) + pointsEarned;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        
        playSound('win');
      });

      socketRef.current.on('playerLeft', (data) => {
        console.log('Jogador saiu:', data);
        setPlayerLeft(true);
        setPlayers(data.players || []);
        
        if (data.winnerByDefault) {
          alert('O outro jogador saiu. Você venceu por W.O.!');
          
          const results = data.results || [];
          setGameResults(results);
          setIsGameOver(true);
          
          const currentPlayerResult = results.find(result => 
            result.id === socketRef.current.id
          );
          
          if (currentPlayerResult) {
            setFinalScore(currentPlayerResult.score || 0);
            setPointsEarned(50); // Pontos por W.O.
            setTotalPoints(prev => prev + 50);
            
            // Atualizar no localStorage
            const user = AuthService.getCurrentUser();
            if (user) {
              user.points = (user.points || 0) + 50;
              localStorage.setItem('user', JSON.stringify(user));
            }
          }
        }
      });

      socketRef.current.on('matchFound', (data) => {
        console.log("Match encontrado:", data);
        setRoomId(data.roomId);
        setIsMatchmaking(false);
        setPlayers(data.players);
        alert('Match encontrado! Iniciando jogo...');
      });

      socketRef.current.on('enterMatchmaking', () => {
        console.log('Entrou na fila de matchmaking');
        setIsMatchmaking(true);
      });

      socketRef.current.on('error', (error) => {
        console.error('Erro do socket:', error);
        setErrorMessage(error.message || 'Ocorreu um erro no jogo');
        alert(`Erro: ${error.message}`);
      });
    } catch (error) {
      console.error('Erro ao inicializar socket:', error);
      setSocketConnected(false);
      setErrorMessage('Erro ao conectar ao servidor. Verifique se o servidor está rodando.');
      setOfflineMode(true);
    }
  };

  const startGame = (isMulti = false) => {
    if (isMulti && !socketConnected && !offlineMode) {
      // Tentar inicializar o socket novamente
      connectionAttemptsRef.current = 0;
      initializeSocket();
      
      if (!socketConnected && !offlineMode) {
        alert('Não foi possível conectar ao servidor para jogar no modo multiplayer. Tente o modo offline.');
        return;
      }
    }
    
    setIsMultiplayer(isMulti);
    
    if (isMulti && socketConnected) {
      console.log('Entrando na fila de matchmaking...');
      socketRef.current.emit('enterMatchmaking', { 
        playerName: username,
        difficulty: difficulty,
        theme: theme
      });
      
      setIsMatchmaking(true);
    } else {
      // Modo single player ou offline
      initializeGame(theme, difficulty);
      setIsGameStarted(true);
      playSound('start');
    }
  };

  const joinRoom = () => {
    if (!roomId.trim()) {
      alert("Digite o código da sala");
      return;
    }
    
    if (!socketConnected && !offlineMode) {
      // Tentar inicializar o socket novamente
      connectionAttemptsRef.current = 0;
      initializeSocket();
      
      if (!socketConnected && !offlineMode) {
        alert('Não foi possível conectar ao servidor. Verifique se o servidor está rodando e tente novamente.');
        return;
      }
    }
    
    if (socketConnected) {
      console.log("Entrando na sala:", roomId, "como", username);
      socketRef.current.emit('joinRoom', { 
        roomId: roomId.trim().toUpperCase(), 
        playerName: username 
      });
    } else {
      alert('Funcionalidade indisponível no modo offline. Tente jogar no modo solo.');
    }
  };

  const createRoom = () => {
    if (!socketConnected && !offlineMode) {
      // Tentar inicializar o socket novamente
      connectionAttemptsRef.current = 0;
      initializeSocket();
      
      if (!socketConnected && !offlineMode) {
        alert('Não foi possível conectar ao servidor. Verifique se o servidor está rodando e tente novamente.');
        return;
      }
    }
    
    if (socketConnected) {
      console.log("Criando sala como", username, "com tema", theme, "e dificuldade", difficulty);
      socketRef.current.emit('createRoom', { 
        playerName: username,
        difficulty: difficulty,
        theme: theme
      });
    } else {
      alert('Funcionalidade indisponível no modo offline. Tente jogar no modo solo.');
    }
  };

  const initializeGame = (selectedTheme, selectedDifficulty) => {
    const themes = {
      emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '🥲', '😚', '🙂'],
      animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅'],
      foods: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦'],
      sports: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🥊', '🥋', '⛸', '🥌', '🛹', '🛼', '🛷', '⛷']
    };
    
    const difficultySettings = {
      easy: { pairs: 6, gridClass: 'game-board-easy' },
      medium: { pairs: 8, gridClass: 'game-board' },
      hard: { pairs: 10, gridClass: 'game-board-hard' }
    };
    
    setTheme(selectedTheme);
    setDifficulty(selectedDifficulty);
    
    const numPairs = difficultySettings[selectedDifficulty].pairs;
    const selectedEmojis = themes[selectedTheme].slice(0, numPairs);

    // Create pairs of cards
    let newCards = [...selectedEmojis, ...selectedEmojis].map((symbol, index) => ({
      id: index,
      content: symbol,
      isFlipped: false,
      isMatched: false
    }));
    
    // Shuffle the cards
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    
    setCards(newCards);
    setFlippedIndexes([]);
    setMatchedPairs([]);
    setScore(0);
    setMoves(0);
    setTimer(0);
    setIsGameOver(false);
    
    // Start the timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const handleCardClick = (index) => {
    // Return if:
    // - The card is already flipped or matched
    // - Two cards are already flipped
    // - It's multiplayer and not your turn
    if (cards[index].isFlipped || 
        cards[index].isMatched || 
        flippedIndexes.length >= 2 ||
        (isMultiplayer && socketConnected && !isYourTurn)) {
      return;
    }
    
    playSound('flip');
    
    // Emit the card flip event in multiplayer mode
    if (isMultiplayer && socketConnected && socketRef.current) {
      socketRef.current.emit('flipCard', { 
        roomId, 
        cardIndex: index, 
        cardValue: cards[index].content,
        playerId: socketRef.current.id
      });
    }
    
    const newFlippedIndexes = [...flippedIndexes, index];
    setFlippedIndexes(newFlippedIndexes);
    
    // Check if two cards are flipped
    if (newFlippedIndexes.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstIndex, secondIndex] = newFlippedIndexes;
      
      // Check if the cards match
      if (cards[firstIndex].content === cards[secondIndex].content) {
        // In multiplayer, emit the match found event
        if (isMultiplayer && socketConnected && socketRef.current) {
          const newScore = score + 10;
          setScore(newScore);
          
          socketRef.current.emit('matchFound', { 
            roomId, 
            cardValue: cards[firstIndex].content,
            playerId: socketRef.current.id,
            playerName: username,
            score: newScore
          });
          
          // Check if you continue your turn
          socketRef.current.emit('continueTurn', { roomId });
        } else {
          // In single player, update the state directly
          const newMatchedPairs = [...matchedPairs, cards[firstIndex].content];
          setMatchedPairs(newMatchedPairs);
          setScore(prev => prev + 10);
          
          // Check if the game is over
          if (newMatchedPairs.length === cards.length / 2) {
            setIsGameOver(true);
            clearInterval(timerRef.current);
            const finalScore = Math.max(100 - (moves * 2) + (100 - Math.min(timer, 100)), 10);
            setFinalScore(finalScore);
            
            // Add points to user's total
            setPointsEarned(finalScore);
            setTotalPoints(prev => prev + finalScore);
            
            // Update in local storage
            const user = AuthService.getCurrentUser();
            if (user) {
              const newPoints = (user.points || 0) + finalScore;
              user.points = newPoints;
              localStorage.setItem('user', JSON.stringify(user));
            }
            
            playSound('win');
          } else {
            playSound('match');
          }
        }
      } else {
        playSound('error');
        
        // In multiplayer, emit the end turn event
        if (isMultiplayer && socketConnected && socketRef.current) {
          socketRef.current.emit('endTurn', { 
            roomId,
            firstCardId: firstIndex,
            secondCardId: secondIndex
          });
        } else {
          // In single player, flip the cards back after a delay
          setTimeout(() => {
            setFlippedIndexes([]);
          }, 1000);
        }
      }
    }
  };

  const restartGame = () => {
    playSound('restart');
    clearInterval(timerRef.current);
    
    if (isMultiplayer && socketConnected && socketRef.current) {
      // Sair da sala atual
      socketRef.current.emit('leaveRoom', { roomId });
    }
    
    setIsGameOver(false);
    setIsGameStarted(false);
    setIsMultiplayer(false);
    setIsWaitingForPlayer(false);
    setIsMatchmaking(false);
    setPlayerLeft(false);
    setRoomId('');
  };

  const copyRoomIdToClipboard = () => {
    try {
      navigator.clipboard.writeText(roomId);
      alert('Código da sala copiado!');
    } catch (error) {
      console.error('Erro ao copiar para a área de transferência:', error);
      alert(`Código da sala: ${roomId} (copie manualmente)`);
    }
  };

  const renderCard = (card, index) => {
    const isFlipped = flippedIndexes.includes(index) || card.isMatched || matchedPairs.includes(card.content);
    const isMatched = card.isMatched || matchedPairs.includes(card.content);
    const isPlayable = isYourTurn && !isFlipped && isMultiplayer;
    
    const cardClasses = `card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''} ${isPlayable ? 'playable' : ''}`;
    
    return (
      <div 
        key={index} 
        className={cardClasses} 
        onClick={() => handleCardClick(index)}
      >
        <div className="card-inner">
          <div className="card-front">
            {isPlayable && <div className="card-playable-indicator"></div>}
          </div>
          <div className="card-back">{card.content}</div>
        </div>
      </div>
    );
  };

  const getPlayerName = () => {
    return username || "Anônimo";
  };

  const getCurrentPlayerName = () => {
    const player = players.find(p => p.id === currentPlayer);
    return player ? player.name : 'Desconhecido';
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const tryAgainConnection = () => {
    setOfflineMode(false);
    connectionAttemptsRef.current = 0;
    setErrorMessage('');
    initializeSocket();
  };

  if (!isGameStarted) {
    return (
      <div className="game-container">
        <div className="game-start-overlay">
          <h3>Jogo da Memória</h3>
          
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
              <button className="button" onClick={tryAgainConnection}>Tentar novamente</button>
            </div>
          )}
          
          {offlineMode && (
            <div className="info-message">
              <p>Você está no modo offline. Algumas funcionalidades como jogos multiplayer não estão disponíveis.</p>
              <button className="button" onClick={tryAgainConnection}>Tentar conectar ao servidor</button>
            </div>
          )}
          
          {isMatchmaking ? (
            <div>
              <p>Procurando oponente...</p>
              <div className="matchmaking-animation">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <button 
                className="button" 
                onClick={() => {
                  setIsMatchmaking(false);
                  if (socketRef.current) {
                    socketRef.current.emit('cancelMatchmaking');
                  }
                }}
              >
                Cancelar
              </button>
            </div>
          ) : isWaitingForPlayer ? (
            <div>
              <p>Aguardando outro jogador entrar na sala...</p>
              <div className="room-code-display">
                {roomId}
                <button className="copy-button" onClick={copyRoomIdToClipboard}>Copiar</button>
              </div>
              <div className="waiting-animation">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <p>Compartilhe este código com um amigo para que ele possa entrar!</p>
              <button className="button" onClick={restartGame}>Cancelar</button>
            </div>
          ) : (
            <>
              <p>Escolha um modo de jogo:</p>
              
              <div className="button-group">
                <button 
                  className="button" 
                  onClick={() => startGame(false)}
                >
                  Jogar Solo
                </button>
                
                {!offlineMode && (
                  <button 
                    className="button" 
                    onClick={() => startGame(true)}
                    disabled={!socketConnected}
                  >
                    Encontrar Oponente
                  </button>
                )}
              </div>
              
              {!offlineMode && (
                <>
                  <p>Ou entre em uma sala existente:</p>
                  
                  <div className="join-room">
                    <input 
                      type="text" 
                      value={roomId} 
                      onChange={(e) => setRoomId(e.target.value)} 
                      placeholder="Código da sala"
                      style={{ 
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white'
                      }}
                    />
                    <button 
                      className="button"
                      onClick={joinRoom}
                      disabled={!socketConnected}
                    >
                      Entrar
                    </button>
                  </div>
                  
                  <div className="button-group" style={{ marginTop: '20px' }}>
                    <button 
                      className="button" 
                      onClick={createRoom}
                      disabled={!socketConnected}
                    >
                      Criar Sala
                    </button>
                  </div>
                </>
              )}
              
              <div className="settings-section" style={{ marginTop: '30px' }}>
                <div className="theme-selector">
                  <h4>Tema</h4>
                  <select 
                    value={theme} 
                    onChange={(e) => setTheme(e.target.value)}
                    style={{ 
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <option value="emojis">Emojis</option>
                    <option value="animals">Animais</option>
                    <option value="foods">Comidas</option>
                    <option value="sports">Esportes</option>
                  </select>
                </div>
                
                <div className="difficulty-selector">
                  <h4>Dificuldade</h4>
                  <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{ 
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
                
                <div className="sound-controls">
                  <h4>Som</h4>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={hasSound}
                      onChange={() => setHasSound(!hasSound)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">{hasSound ? 'Ligado' : 'Desligado'}</span>
                  </label>
                  
                  {hasSound && (
                    <div className="volume-slider-container">
                      <span className="volume-icon">🔊</span>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={volumeLevel}
                        onChange={(e) => setVolumeLevel(parseInt(e.target.value))}
                        className="volume-slider"
                      />
                      <span>{volumeLevel}%</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-info">
        <div className="game-stats">
          <p>Pontuação: {score}</p>
          <p>Movimentos: {moves}</p>
          <p>Tempo: {formatTime(timer)}</p>
          {isMultiplayer && (
            <p className={isYourTurn ? 'your-turn-indicator' : ''}>
              {isYourTurn ? 'Seu turno!' : `Turno de: ${getCurrentPlayerName()}`}
            </p>
          )}
        </div>
        
        {isMultiplayer && (
          <div className="players-list">
            <h3>Jogadores</h3>
            <ul>
              {players.map(player => {
                const isCurrentTurn = player.id === currentPlayer;
                const isYou = player.id === socketRef.current?.id;
                
                return (
                  <li key={player.id} className={`${isCurrentTurn ? 'active-player' : ''} ${isYou ? 'current-player' : ''}`}>
                    <span>{player.name} {isYou && '(Você)'}</span>
                    <span>Score: {player.score || 0}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      
      <div className={`game-board ${difficulty === 'easy' ? 'game-board-easy' : difficulty === 'hard' ? 'game-board-hard' : ''}`}>
        {cards.map((card, index) => renderCard(card, index))}
      </div>
      
      <div className="game-controls">
        <button className="button" onClick={restartGame}>Reiniciar Jogo</button>
        {playerLeft && !isGameOver && (
          <div style={{ marginTop: '10px', color: '#ffeb3b' }}>
            O outro jogador saiu da partida. Você pode continuar jogando ou reiniciar.
          </div>
        )}
      </div>
      
      {isGameOver && (
        <div className="game-over">
          <h2>Fim de Jogo!</h2>
          
          {isMultiplayer ? (
            <>
              <h3>Resultado Final</h3>
              <ul className="final-score-list">
                {gameResults && gameResults.map(result => {
                  const isWinner = result.isWinner;
                  const isYou = result.id === socketRef.current?.id;
                  
                  return (
                    <li 
                      key={result.id} 
                      className={`${isWinner ? 'winner' : ''} ${isYou ? 'you' : ''}`}
                    >
                      <span>
                        {result.username} {isYou && '(Você)'}
                        {isWinner && <span className="winner-badge">👑 Vencedor!</span>}
                      </span>
                      <span>{result.score} pontos</span>
                    </li>
                  );
                })}
              </ul>
              
              {pointsEarned > 0 && (
                <div className="points-earned">
                  + {pointsEarned} pontos adicionados ao seu perfil!
                </div>
              )}
            </>
          ) : (
            <>
              <h3>Sua pontuação: {finalScore}</h3>
              {pointsEarned > 0 && (
                <div className="points-earned">
                  + {pointsEarned} pontos adicionados ao seu perfil!
                </div>
              )}
            </>
          )}
          
          <div style={{ marginTop: '30px' }}>
            <p>Pontuação total: <strong>{totalPoints}</strong></p>
          </div>
          
          <button className="button" onClick={restartGame} style={{ marginTop: '30px' }}>
            Jogar Novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default GameBoard;