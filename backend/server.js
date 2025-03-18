const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Estado do jogo
const rooms = {};
const matchmakingQueue = [];

// Configurações do jogo
const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, flipDelay: 1200 },
  medium: { pairs: 8, flipDelay: 1000 },
  hard: { pairs: 12, flipDelay: 800 }
};

// Gerar um conjunto de cartas baseado na dificuldade
function generateCards(difficulty = 'medium', theme = 'emojis') {
  const { pairs } = DIFFICULTY_LEVELS[difficulty];
  
  // Temas disponíveis
  const themes = {
    emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '🥲', '😚', '🙂'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅'],
    foods: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🥊', '🥋', '⛸', '🥌', '🛹', '🛼', '🛷', '⛷']
  };
  
  // Selecionar símbolos do tema escolhido
  const themeSymbols = themes[theme] || themes.emojis;
  
  // Selecionar número de pares de acordo com a dificuldade
  const selectedSymbols = themeSymbols.slice(0, pairs);
  
  // Duplicar valores e embaralhar
  const cardValues = [...selectedSymbols, ...selectedSymbols];
  
  const cards = cardValues
    .sort(() => Math.random() - 0.5)
    .map((content, index) => ({
      id: index,
      content,
      isFlipped: false,
      isMatched: false
    }));
    
  return cards;
}

// Conexão do Socket.io
io.on('connection', (socket) => {
  console.log(`Novo cliente conectado: ${socket.id}`);
  
  // Entrar na fila de matchmaking
  socket.on('enterMatchmaking', (data) => {
    const { playerName, difficulty = 'medium', theme = 'animals' } = data;
    
    // Adicionar jogador à fila
    matchmakingQueue.push({
      id: socket.id,
      name: playerName,
      difficulty,
      theme,
      timestamp: Date.now()
    });
    
    console.log(`${playerName} entrou na fila de matchmaking`);
    socket.emit('enterMatchmaking');
    
    // Verificar se há outro jogador esperando
    checkMatchmaking();
  });
  
  // Cancelar matchmaking
  socket.on('cancelMatchmaking', () => {
    // Remover jogador da fila
    const index = matchmakingQueue.findIndex(player => player.id === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      console.log(`Jogador ${socket.id} cancelou matchmaking`);
    }
  });
  
  // Função para verificar matchmaking
  function checkMatchmaking() {
    // Se tivermos pelo menos 2 jogadores na fila
    if (matchmakingQueue.length >= 2) {
      // Pegar os dois primeiros jogadores
      const player1 = matchmakingQueue.shift();
      const player2 = matchmakingQueue.shift();
      
      // Criar uma nova sala
      const roomId = uuidv4().substring(0, 6).toUpperCase();
      
      // Configurar a sala (usar configurações do jogador 1)
      rooms[roomId] = {
        id: roomId,
        players: [
          { id: player1.id, name: player1.name, score: 0, active: true },
          { id: player2.id, name: player2.name, score: 0, active: true }
        ],
        difficulty: player1.difficulty,
        theme: player1.theme,
        cards: generateCards(player1.difficulty, player1.theme),
        matchedPairs: [],
        currentPlayer: player1.id,
        gameStarted: false,
        createdAt: Date.now()
      };
      
      // Adicionar jogadores à sala
      socket.join(roomId);
      const otherSocket = io.sockets.sockets.get(player2.id);
      if (otherSocket) {
        otherSocket.join(roomId);
      }
      
      // Notificar os jogadores
      io.to(player2.id).emit('matchFound', { 
        roomId, 
        players: rooms[roomId].players 
      });
      io.to(player1.id).emit('matchFound', { 
        roomId, 
        players: rooms[roomId].players 
      });
      
      console.log(`Match encontrado entre ${player1.name} e ${player2.name} - Sala: ${roomId}`);
    }
  }
  
  // Criar sala
  socket.on('createRoom', (data) => {
    const { playerName, difficulty = 'medium', theme = 'animals' } = data;
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    
    // Criar sala
    rooms[roomId] = {
      id: roomId,
      players: [
        { id: socket.id, name: playerName, score: 0, active: true }
      ],
      difficulty,
      theme,
      cards: [],
      matchedPairs: [],
      currentPlayer: null,
      gameStarted: false,
      createdAt: Date.now()
    };
    
    // Adicionar jogador à sala
    socket.join(roomId);
    console.log(`Sala ${roomId} criada por ${playerName}`);
    
    // Notificar jogador
    socket.emit('roomCreated', { roomId });
  });
  
  // Entrar em uma sala
  socket.on('joinRoom', (data) => {
    const { roomId, playerName } = data;
    
    // Verificar se a sala existe
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Sala não encontrada' });
      return;
    }
    
    // Verificar se a sala está cheia
    if (rooms[roomId].players.length >= 2) {
      socket.emit('error', { message: 'Sala cheia' });
      return;
    }
    
    // Adicionar jogador à sala
    const playerData = { id: socket.id, name: playerName, score: 0, active: true };
    rooms[roomId].players.push(playerData);
    
    // Adicionar jogador ao socketio room
    socket.join(roomId);
    
    console.log(`${playerName} entrou na sala ${roomId}`);
    
    // Notificar todos na sala
    io.to(roomId).emit('playerJoined', {
      playerName,
      players: rooms[roomId].players
    });
    
    // Se agora temos 2 jogadores, iniciar o jogo automaticamente
    if (rooms[roomId].players.length === 2) {
      setTimeout(() => {
        startGame(roomId);
      }, 2000); // Pequeno delay para dar tempo de ver a mensagem de jogador entrou
    }
  });
  
  // Função para iniciar o jogo
  function startGame(roomId) {
    if (!rooms[roomId]) return;
    
    // Gerar cartas
    const room = rooms[roomId];
    room.cards = generateCards(room.difficulty, room.theme);
    room.gameStarted = true;
    
    // Selecionar o primeiro jogador aleatoriamente
    const randomIndex = Math.floor(Math.random() * room.players.length);
    room.currentPlayer = room.players[randomIndex].id;
    
    console.log(`Jogo iniciado na sala ${roomId}`);
    
    // Notificar todos na sala
    io.to(roomId).emit('gameStarted', {
      cards: room.cards,
      currentPlayer: room.currentPlayer
    });
    
    // Notificar quem é o jogador atual
    io.to(room.currentPlayer).emit('yourTurn');
    
    // Notificar outros jogadores para aguardar
    room.players.forEach(player => {
      if (player.id !== room.currentPlayer) {
        io.to(player.id).emit('waitTurn');
      }
    });
  }
  
  // Iniciar jogo (manual)
  socket.on('startGame', (data) => {
    const { roomId } = data;
    
    // Verificar se a sala existe
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Sala não encontrada' });
      return;
    }
    
    // Verificar se há pelo menos 2 jogadores
    if (rooms[roomId].players.length < 2) {
      socket.emit('error', { message: 'Aguarde mais jogadores' });
      return;
    }
    
    startGame(roomId);
  });
  
  // Virar carta
  socket.on('flipCard', (data) => {
    const { roomId, cardIndex, cardValue } = data;
    
    // Verificar se a sala existe
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Sala não encontrada' });
      return;
    }
    
    // Verificar se é a vez do jogador
    if (rooms[roomId].currentPlayer !== socket.id) {
      socket.emit('error', { message: 'Não é sua vez' });
      return;
    }
    
    // Notificar todos na sala sobre a carta virada
    io.to(roomId).emit('cardFlipped', {
      cardIndex,
      playerId: socket.id
    });
  });
  
  // Par encontrado
  socket.on('matchFound', (data) => {
    const { roomId, cardValue, playerId, playerName, score } = data;
    
    // Verificar se a sala existe
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Sala não encontrada' });
      return;
    }
    
    // Adicionar par encontrado
    rooms[roomId].matchedPairs.push(cardValue);
    
    // Atualizar pontuação do jogador
    const playerIndex = rooms[roomId].players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      rooms[roomId].players[playerIndex].score = score;
    }
    
    // Notificar todos na sala
    io.to(roomId).emit('matchFound', {
      cardValue,
      playerId,
      playerName,
      players: rooms[roomId].players
    });
    
    // Verificar se o jogo acabou
    const { pairs } = DIFFICULTY_LEVELS[rooms[roomId].difficulty];
    if (rooms[roomId].matchedPairs.length === pairs) {
      // Determinar o vencedor
      const winner = rooms[roomId].players.reduce((a, b) => 
        (a.score > b.score) ? a : (a.score === b.score) ? (Math.random() > 0.5 ? a : b) : b
      );
      winner.winner = true;
      
      const results = rooms[roomId].players.map(player => ({
        id: player.id,
        username: player.name,
        score: player.score,
        isWinner: player.id === winner.id
      }));
      
      // Notificar todos na sala
      io.to(roomId).emit('gameOver', {
        results: results
      });
    }
  });
  
  // Continuar turno
  socket.on('continueTurn', (data) => {
    const { roomId } = data;
    
    // Verificar se a sala existe
    if (!rooms[roomId]) return;
    
    // O mesmo jogador continua (acertou um par)
    io.to(rooms[roomId].currentPlayer).emit('yourTurn');
  });
  
  // Finalizar turno
  socket.on('endTurn', (data) => {
    const { roomId, firstCardId, secondCardId } = data;
    
    // Verificar se a sala existe
    if (!rooms[roomId]) return;
    
    // Notificar sobre cartas sem match
    io.to(roomId).emit('noMatchFound', {
      firstCardId,
      secondCardId,
      playerId: socket.id
    });
    
    // Alternar jogador
    const currentPlayerIndex = rooms[roomId].players.findIndex(p => p.id === socket.id);
    const nextPlayerIndex = (currentPlayerIndex + 1) % rooms[roomId].players.length;
    rooms[roomId].currentPlayer = rooms[roomId].players[nextPlayerIndex].id;
    
    // Notificar sobre a mudança de turno
    io.to(roomId).emit('turnComplete', {
      nextPlayer: rooms[roomId].currentPlayer
    });
    
    // Notificar o próximo jogador
    io.to(rooms[roomId].currentPlayer).emit('yourTurn');
    
    // Notificar outros jogadores para aguardar
    rooms[roomId].players.forEach(player => {
      if (player.id !== rooms[roomId].currentPlayer) {
        io.to(player.id).emit('waitTurn');
      }
    });
  });
  
  // Fim do jogo
  socket.on('gameOver', (data) => {
    const { roomId, playerId, playerName, score } = data;
    
    // Verificar se a sala existe
    if (!rooms[roomId]) return;
    
    // Atualizar pontuação do jogador
    const playerIndex = rooms[roomId].players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      rooms[roomId].players[playerIndex].score = score;
      rooms[roomId].players[playerIndex].winner = true;
    }
    
    // Determinar o vencedor
    const winner = rooms[roomId].players.reduce((a, b) => 
      (a.score > b.score) ? a : (a.score === b.score) ? (Math.random() > 0.5 ? a : b) : b
    );
    winner.winner = true;
    
    const results = rooms[roomId].players.map(player => ({
      id: player.id,
      username: player.name,
      score: player.score,
      isWinner: player.id === winner.id
    }));
    
    // Notificar todos na sala
    io.to(roomId).emit('gameOver', {
      results: results
    });
  });
  
  // Sair da sala
  socket.on('leaveRoom', (data) => {
    const { roomId } = data;
    
    // Verificar se a sala existe
    if (!rooms[roomId]) return;
    
    // Encontrar jogador
    const playerIndex = rooms[roomId].players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;
    
    const playerName = rooms[roomId].players[playerIndex].name;
    
    // Remover jogador da sala
    socket.leave(roomId);
    
    // Se o jogo já começou, o outro jogador vence por W.O.
    if (rooms[roomId].gameStarted) {
      // Verificar se há outro jogador na sala
      const remainingPlayers = rooms[roomId].players.filter(p => p.id !== socket.id);
      if (remainingPlayers.length > 0) {
        // O jogador que ficou vence
        const winner = remainingPlayers[0];
        winner.score += 50; // Pontos por W.O.
        winner.winner = true;
        
        const results = [
          {
            id: winner.id,
            username: winner.name,
            score: winner.score,
            isWinner: true
          }
        ];
        
        // Notificar o jogador que ficou
        io.to(winner.id).emit('playerLeft', {
          playerName,
          players: [winner],
          winnerByDefault: true,
          gameOver: true,
          results: results
        });
      }
    }
    
    // Remover jogador da lista
    rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
    
    console.log(`${playerName} saiu da sala ${roomId}`);
    
    // Notificar outros jogadores
    io.to(roomId).emit('playerLeft', {
      playerName,
      players: rooms[roomId].players
    });
    
    // Se não há mais jogadores, remover a sala
    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
      console.log(`Sala ${roomId} removida`);
    } else {
      // Se o jogador que saiu era o jogador atual, mudar para o próximo
      if (rooms[roomId].currentPlayer === socket.id) {
        rooms[roomId].currentPlayer = rooms[roomId].players[0].id;
        io.to(rooms[roomId].currentPlayer).emit('yourTurn');
      }
    }
  });
  
  // Desconexão
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
    
    // Remover jogador da fila de matchmaking
    const queueIndex = matchmakingQueue.findIndex(player => player.id === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
    }
    
    // Remover jogador de todas as salas
    Object.keys(rooms).forEach(roomId => {
      const playerIndex = rooms[roomId].players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        // Jogador encontrado na sala
        const playerName = rooms[roomId].players[playerIndex].name;
        
        // Se o jogo já começou, verificar se há outro jogador
        if (rooms[roomId].gameStarted) {
          const remainingPlayers = rooms[roomId].players.filter(p => p.id !== socket.id);
          if (remainingPlayers.length > 0) {
            // O jogador que ficou vence
            const winner = remainingPlayers[0];
            winner.score += 50; // Pontos por W.O.
            winner.winner = true;
            
            const results = [
              {
                id: winner.id,
                username: winner.name,
                score: winner.score,
                isWinner: true
              }
            ];
            
            // Notificar o jogador que ficou
            io.to(winner.id).emit('playerLeft', {
              playerName,
              players: [winner],
              winnerByDefault: true,
              gameOver: true,
              results: results
            });
          }
        }
        
        // Remover jogador da sala
        rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
        
        // Notificar outros jogadores
        io.to(roomId).emit('playerLeft', {
          playerName,
          players: rooms[roomId].players
        });
        
        // Se não há mais jogadores, remover a sala
        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId];
          console.log(`Sala ${roomId} removida`);
        } else {
          // Se o jogador que saiu era o jogador atual, mudar para o próximo
          if (rooms[roomId].currentPlayer === socket.id) {
            rooms[roomId].currentPlayer = rooms[roomId].players[0].id;
            io.to(rooms[roomId].currentPlayer).emit('yourTurn');
          }
        }
      }
    });
  });
  
  // Obter salas disponíveis
  socket.on('getRooms', () => {
    // Filtrar salas que estão aguardando jogadores
    const availableRooms = Object.values(rooms).filter(room => 
      room.players.length < 2 && !room.gameStarted
    );
    
    socket.emit('availableRooms', {
      rooms: availableRooms.map(room => ({
        id: room.id,
        players: room.players.length,
        difficulty: room.difficulty,
        theme: room.theme
      }))
    });
  });
});

// Limpeza periódica de salas inativas (a cada 30 minutos)
setInterval(() => {
  const now = Date.now();
  Object.keys(rooms).forEach(roomId => {
    const room = rooms[roomId];
    // Remover salas criadas há mais de 1 hora
    if (now - room.createdAt > 60 * 60 * 1000) {
      io.to(roomId).emit('roomExpired');
      delete rooms[roomId];
      console.log(`Sala ${roomId} expirada e removida`);
    }
  });
}, 30 * 60 * 1000);

// Rotas da API
app.get('/api/rooms', (req, res) => {
  // Retornar salas disponíveis
  const availableRooms = Object.values(rooms).filter(room => 
    room.players.length < 2 && !room.gameStarted
  );
  
  res.json({
    rooms: availableRooms.map(room => ({
      id: room.id,
      players: room.players.length,
      difficulty: room.difficulty,
      theme: room.theme
    }))
  });
});

// Rota para verificar estado do servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    players: io.sockets.sockets.size,
    rooms: Object.keys(rooms).length,
    queue: matchmakingQueue.length
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});