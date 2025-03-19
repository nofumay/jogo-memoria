const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

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

// Rota básica para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor do Jogo da Memória está online! 🎮');
});

// Armazenar informações das salas
const rooms = {};

io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  // Entrar em uma sala
  socket.on('joinRoom', ({ roomId, username }) => {
    socket.join(roomId);
    console.log(`${username} entrou na sala ${roomId}`);
    
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        gameState: 'waiting'
      };
    }
    
    rooms[roomId].players.push({
      id: socket.id,
      username
    });
    
    // Notificar todos na sala sobre o novo jogador
    io.to(roomId).emit('playerJoined', {
      senderId: username,
      type: 'join',
      content: { text: `${username} entrou na sala` }
    });

    // Enviar lista de jogadores
    io.to(roomId).emit('playersList', {
      players: rooms[roomId].players.map(p => p.username)
    });
  });

  // Jogador faz um movimento
  socket.on('makeMove', ({ roomId, cardId, username }) => {
    console.log(`${username} virou a carta ${cardId} na sala ${roomId}`);
    
    // Transmitir o movimento para todos os outros jogadores na sala
    socket.to(roomId).emit('playerMove', {
      senderId: username,
      type: 'move',
      content: { cardId }
    });
  });

  // Mensagem de chat
  socket.on('chatMessage', ({ roomId, text, username }) => {
    console.log(`Mensagem de ${username} na sala ${roomId}: ${text}`);
    
    io.to(roomId).emit('newChatMessage', {
      senderId: username,
      type: 'chat',
      content: { text }
    });
  });
  
  // Solicitação de estado do jogo
  socket.on('getGameState', ({ roomId }) => {
    if (rooms[roomId]) {
      socket.emit('gameState', {
        players: rooms[roomId].players.map(p => p.username),
        gameState: rooms[roomId].gameState
      });
    }
  });

  // Jogador desconecta
  socket.on('disconnect', () => {
    console.log('Jogador desconectado:', socket.id);
    
    // Remover jogador de todas as salas
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const username = room.players[playerIndex].username;
        console.log(`${username} saiu da sala ${roomId}`);
        
        room.players.splice(playerIndex, 1);
        
        // Notificar os outros jogadores
        socket.to(roomId).emit('playerLeft', {
          senderId: username,
          type: 'leave',
          content: { text: `${username} saiu da sala` }
        });

        // Atualizar lista de jogadores
        io.to(roomId).emit('playersList', {
          players: room.players.map(p => p.username)
        });
        
        // Se não há mais jogadores, remover a sala
        if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(`Sala ${roomId} removida`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});