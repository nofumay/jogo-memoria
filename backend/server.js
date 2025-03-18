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
function generateCards(difficulty = 'medium') {
  const { pairs } = DIFFICULTY_LEVELS[difficulty];
  
  // Gerar valores das cartas
  const cardValues = Array(pairs).fill(0).map((_, i) => i + 1);
  
  // Duplicar valores e embaralhar
  const cards = [...cardValues, ...cardValues]
    .sort(() => Math.random() - 0.5)
    .map((value, index) => ({
      id: index,
      value,
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
        cards: [],
        matchedPairs: [],
        currentPlayer: player1.id,
        gameStarted: false,
        createdAt: Date.now()
      };
      
      // Adicionar jogadores à sala
      socket.join(roomId);
      io.to(player2.id).emit('matchFound', { 
        roomId, 
        players: rooms[roomId].players 
      });
      socket.emit('matchFound', { 
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
  });
  
  // Iniciar jogo
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
    
    // Gerar cartas
    const cards = generateCards(rooms[roomId].difficulty);
    rooms[roomId].cards = cards;
    rooms[roomId].gameStarted = true;
    
    // Selecionar o primeiro jogador aleatoriamente
    const randomIndex = Math.floor(Math.random() * rooms[roomId].players.length);
    rooms[roomId].currentPlayer = rooms[roomId].players[randomIndex].id;
    
    console.log(`Jogo iniciado na sala ${roomId}`);
    
    // Notificar todos na sala
    io.to(roomId).emit('gameStarted', {
      cards,
      currentPlayer: rooms[roomId].currentPlayer
    });
    
    // Notificar quem é o jogador atual
    io.to(rooms[roomId].currentPlayer).emit('yourTurn');
    // Notificar outros jogadores para aguardar
    rooms[roomId].players.forEach(player => {
      if (player.id !== rooms[roomId].currentPlayer) {
        io.to(player.id).emit('waitTurn');
      }
    });
  });
  
  // Virar carta
  socket.on('flipCard', (data) => {
    const { roomId, cardIndex, cardValue, playerId } = data;
    
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
      playerId
    });
  });
  
  // Par encontrado
  socket.on('matchFound', (data) => {
    const { roomId, playerId, playerName, cardValue, score } = data;
    
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
      playerName
    });
    
    // Atualizar pontuação
    io.to(roomId).emit('updateScore', {
      players: rooms[roomId].players
    });
    
    // Verificar se o jogo acabou
    const { pairs } = DIFFICULTY_LEVELS[rooms[roomId].difficulty];
    if (rooms[roomId].matchedPairs.length === pairs) {
      // Determinar o vencedor
      const winner = rooms[roomId].players.reduce((a, b) => a.score > b.score ? a : b);
      winner.winner = true;
      
      // Notificar todos na sala
      io.to(roomId).emit('gameOver', {
        winner: winner.name,
        players: rooms[roomId].players
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
    
    // Notificar todos na sala
    io.to(roomId).emit('gameOver', {
      winner: playerName,
      players: rooms[roomId].players
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
        
        // Notificar o jogador que ficou
        io.to(winner.id).emit('playerLeft', {
          playerName,
          players: [winner],
          winnerByDefault: true
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
  
  // Jogador saindo (ex: fechando o navegador)
  socket.on('playerLeaving', (data) => {
    const { roomId } = data;
    
    // Simular evento de saída da sala
    socket.emit('leaveRoom', { roomId });
  });
  
  // Reconectar à sala
  socket.on('reconnectToRoom', (data) => {
    const { roomId, playerName, playerId } = data;
    
    // Verificar se a sala existe
    if (!rooms[roomId]) {
      socket.emit('error', { message: 'Sala não encontrada' });
      return;
    }
    
    // Verificar se o jogador estava na sala
    const playerIndex = rooms[roomId].players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      socket.emit('error', { message: 'Jogador não encontrado na sala' });
      return;
    }
    
    // Atualizar ID do socket
    rooms[roomId].players[playerIndex].id = socket.id;
    if (rooms[roomId].currentPlayer === playerId) {
      rooms[roomId].currentPlayer = socket.id;
    }
    
    // Adicionar jogador ao socketio room
    socket.join(roomId);
    
    console.log(`${playerName} reconectou à sala ${roomId}`);
    
    // Enviar estado atual do jogo
    socket.emit('reconnected', {
      gameState: {
        cards: rooms[roomId].cards,
        matchedPairs: rooms[roomId].matchedPairs,
        players: rooms[roomId].players,
        gameStarted: rooms[roomId].gameStarted,
        currentPlayer: rooms[roomId].currentPlayer
      }
    });
    
    // Notificar se é a vez do jogador
    if (rooms[roomId].currentPlayer === socket.id) {
      socket.emit('yourTurn');
    } else {
      socket.emit('waitTurn');
    }
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
        
        // Notificar outros jogadores
        io.to(roomId).emit('playerLeft', {
          playerName,
          players: rooms[roomId].players.filter(p => p.id !== socket.id)
        });
        
        // Se o jogo já começou, verificar se há outro jogador
        if (rooms[roomId].gameStarted) {
          const remainingPlayers = rooms[roomId].players.filter(p => p.id !== socket.id);
          if (remainingPlayers.length > 0) {
            // O jogador que ficou vence
            const winner = remainingPlayers[0];
            winner.score += 50; // Pontos por W.O.
            winner.winner = true;
            
            // Notificar o jogador que ficou
            io.to(winner.id).emit('playerLeft', {
              playerName,
              players: [winner],
              winnerByDefault: true
            });
          }
        }
        
        // Remover jogador da sala
        rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
        
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