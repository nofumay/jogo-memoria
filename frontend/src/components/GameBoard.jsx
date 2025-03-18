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
  
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const socketRef = useRef();
  const audioRef = useRef({});

  useEffect(() => {
    const checkAuth = async () => {
      const user = AuthService.getCurrentUser();
      if (user) {
        setUsername(user.username);
        setTotalPoints(user.points || 0);
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
        audioRef.current[sound] = new Audio(`/sounds/${sound}.mp3`);
        audioRef.current[sound].volume = volumeLevel / 100;
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
      audioRef.current[soundName].currentTime = 0;
      audioRef.current[soundName].play().catch(e => console.log("Audio play error:", e));
    }
  };

  const initializeSocket = () => {
    const serverUrl = 'http://localhost:5000';
    socketRef.current = io(serverUrl);
    
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    socketRef.current.on('roomCreated', (data) => {
      setRoomId(data.roomId);
      setIsWaitingForPlayer(true);
      setIsMatchmaking(false);
      console.log('Room created, waiting for players to join:', data.roomId);
    });

    socketRef.current.on('playerJoined', (data) => {
      console.log('Player joined:', data);
      setPlayers(data.players);
      setCurrentPlayer(data.currentPlayer);
      setIsYourTurn(data.currentPlayer === socketRef.current.id);
      
      if (data.players.length === 2) {
        setIsWaitingForPlayer(false);
        initializeGame(theme, difficulty);
      }
    });

    socketRef.current.on('gameStarted', (data) => {
      console.log('Game started:', data);
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
      setMatchedPairs(data.matchedPairs);
      setPlayers(data.players);
    });

    socketRef.current.on('turnChanged', (data) => {
      setCurrentPlayer(data.currentPlayer);
      setIsYourTurn(data.currentPlayer === socketRef.current.id);
      setFlippedIndexes([]);
    });

    socketRef.current.on('gameOver', (data) => {
      setIsGameOver(true);
      setGameResults(data.results);
      const currentPlayerResult = data.results.find(result => 
        result.id === socketRef.current.id
      );
      
      setFinalScore(currentPlayerResult?.score || 0);
      setPointsEarned(currentPlayerResult?.pointsEarned || 0);
      
      // Update total points
      if (currentPlayerResult?.pointsEarned) {
        setTotalPoints(prev => prev + currentPlayerResult.pointsEarned);
        
        // Update in local storage
        const user = AuthService.getCurrentUser();
        if (user) {
          user.points = (user.points || 0) + currentPlayerResult.pointsEarned;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      playSound('win');
    });

    socketRef.current.on('playerLeft', (data) => {
      setPlayerLeft(true);
      console.log('Player left the game:', data);
      setPlayers(data.players);
      
      // If it's a victory by default
      if (data.gameOver) {
        setIsGameOver(true);
        setGameResults(data.results);
        const currentPlayerResult = data.results.find(result => 
          result.id === socketRef.current.id
        );
        
        setFinalScore(currentPlayerResult?.score || 0);
        setPointsEarned(currentPlayerResult?.pointsEarned || 0);
        
        // Update total points
        if (currentPlayerResult?.pointsEarned) {
          setTotalPoints(prev => prev + currentPlayerResult.pointsEarned);
          
          // Update in local storage
          const user = AuthService.getCurrentUser();
          if (user) {
            user.points = (user.points || 0) + currentPlayerResult.pointsEarned;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      }
    });

    socketRef.current.on('matchmakingSuccess', (data) => {
      setRoomId(data.roomId);
      setIsMatchmaking(false);
      setPlayers(data.players);
      setCurrentPlayer(data.currentPlayer);
      setIsYourTurn(data.currentPlayer === socketRef.current.id);
      initializeGame(theme, difficulty);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });
  };

  const startGame = (isMulti = false) => {
    setIsMultiplayer(isMulti);
    
    if (isMulti) {
      if (!socketRef.current) {
        initializeSocket();
      }
      
      setIsMatchmaking(true);
      socketRef.current.emit('findGame', { username });
    } else {
      initializeGame(theme, difficulty);
      setIsGameStarted(true);
      playSound('start');
    }
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;
    
    if (!socketRef.current) {
      initializeSocket();
    }
    
    socketRef.current.emit('joinRoom', { roomId, username });
  };

  const createRoom = () => {
    if (!socketRef.current) {
      initializeSocket();
    }
    
    socketRef.current.emit('createRoom', { username });
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
        (isMultiplayer && !isYourTurn)) {
      return;
    }
    
    playSound('flip');
    
    // Emit the card flip event in multiplayer mode
    if (isMultiplayer && socketRef.current) {
      socketRef.current.emit('flipCard', { roomId, cardIndex: index });
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
        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('matchFound', { roomId, indices: newFlippedIndexes });
        } else {
          // In single player, update the state directly
          const newMatchedPairs = [...matchedPairs, ...newFlippedIndexes];
          setMatchedPairs(newMatchedPairs);
          setScore(prev => prev + 10);
          
          // Check if the game is over
          if (newMatchedPairs.length === cards.length) {
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
              user.points = (user.points || 0) + finalScore;
              localStorage.setItem('user', JSON.stringify(user));
            }
            
            playSound('win');
          } else {
            playSound('match');
          }
        }
      } else {
        playSound('error');
        // In multiplayer, emit the turn change event
        if (isMultiplayer && socketRef.current) {
          socketRef.current.emit('changeTurn', { roomId });
        }
        
        // Flip the cards back after a delay
        setTimeout(() => {
          if (!isMultiplayer) {
            setFlippedIndexes([]);
          }
        }, 1000);
      }
    }
  };

  const restartGame = () => {
    playSound('restart');
    clearInterval(timerRef.current);
    
    if (isMultiplayer && socketRef.current) {
      // Disconnect from the current room
      socketRef.current.disconnect();
      socketRef.current = null;
      setRoomId('');
      setPlayers([]);
    }
    
    setIsGameOver(false);
    setIsGameStarted(false);
    setIsMultiplayer(false);
    setIsWaitingForPlayer(false);
    setIsMatchmaking(false);
    setPlayerLeft(false);
  };

  const copyRoomIdToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    // You could add a visual feedback here
    alert('Código da sala copiado!');
  };

  const renderCard = (card, index) => {
    const isFlipped = flippedIndexes.includes(index) || card.isMatched || matchedPairs.includes(index);
    const isMatched = card.isMatched || matchedPairs.includes(index);
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

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.username : 'Desconhecido';
  };

  const getCurrentPlayerName = () => {
    return getPlayerName(currentPlayer);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isGameStarted) {
    return (
      <div className="game-container">
        <div className="game-start-overlay">
          <h3>Jogo da Memória</h3>
          
          {isMatchmaking ? (
            <div>
              <p>Procurando oponente...</p>
              <div className="matchmaking-animation">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <button className="button" onClick={() => setIsMatchmaking(false)}>Cancelar</button>
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
                <button className="button" onClick={() => startGame(false)}>Jogar Solo</button>
                <button className="button" onClick={() => startGame(true)}>Encontrar Oponente</button>
              </div>
              
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
                <button className="button" onClick={joinRoom}>Entrar</button>
              </div>
              
              <div className="button-group" style={{ marginTop: '20px' }}>
                <button className="button" onClick={createRoom}>Criar Sala</button>
              </div>
              
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
                    <span>{player.username} {isYou && '(Você)'}</span>
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