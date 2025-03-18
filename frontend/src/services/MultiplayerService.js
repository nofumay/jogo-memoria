// Simulação de serviço multiplayer usando localStorage para desenvolvimento
class MultiplayerService {
  constructor() {
    this.callbacks = {
      onConnect: () => {},
      onDisconnect: () => {},
      onMessage: () => {},
      onError: () => {}
    };
    this.connected = false;
    this.roomId = null;
    this.username = null;
    this.messageInterval = null;
  }

  // Conectar ao serviço de multiplayer (simulado)
  connect(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    
    // Simular conexão após um pequeno atraso
    setTimeout(() => {
      this.connected = true;
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    }, 500);
    
    return this;
  }

  // Desconectar do serviço
  disconnect() {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
    
    // Simular saída da sala
    if (this.roomId && this.username) {
      this.leaveRoom();
    }
    
    // Simular desconexão após um pequeno atraso
    setTimeout(() => {
      this.connected = false;
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect();
      }
    }, 500);
  }

  // Entrar em uma sala
  joinRoom(roomId, username) {
    if (!this.connected) {
      if (this.callbacks.onError) {
        this.callbacks.onError(new Error('Não conectado ao serviço multiplayer'));
      }
      return;
    }
    
    this.roomId = roomId;
    this.username = username;
    
    // Salvar informações da sala no localStorage
    let rooms = this.getRooms();
    let room = rooms.find(r => r.id === roomId);
    
    if (!room) {
      room = {
        id: roomId,
        players: [username],
        messages: [],
        createdAt: new Date().toISOString()
      };
      rooms.push(room);
    } else if (!room.players.includes(username)) {
      room.players.push(username);
    }
    
    localStorage.setItem('multiplayer_rooms', JSON.stringify(rooms));
    
    // Notificar outros jogadores (simulado)
    this.broadcastMessage({
      type: 'join',
      senderId: username,
      roomId: roomId,
      content: { text: `${username} entrou na sala` },
      timestamp: new Date().toISOString()
    });
    
    // Simular mensagens de outros jogadores
    this.simulateOtherPlayers();
  }

  // Sair de uma sala
  leaveRoom() {
    if (!this.roomId || !this.username) return;
    
    // Atualizar informações da sala
    let rooms = this.getRooms();
    let roomIndex = rooms.findIndex(r => r.id === this.roomId);
    
    if (roomIndex !== -1) {
      let room = rooms[roomIndex];
      room.players = room.players.filter(player => player !== this.username);
      
      // Se não houver mais jogadores, remover a sala
      if (room.players.length === 0) {
        rooms.splice(roomIndex, 1);
      } else {
        rooms[roomIndex] = room;
      }
      
      localStorage.setItem('multiplayer_rooms', JSON.stringify(rooms));
      
      // Notificar outros jogadores
      this.broadcastMessage({
        type: 'leave',
        senderId: this.username,
        roomId: this.roomId,
        content: { text: `${this.username} saiu da sala` },
        timestamp: new Date().toISOString()
      });
    }
    
    this.roomId = null;
    this.username = null;
  }

  // Enviar movimento
  sendMove(cardId) {
    if (!this.connected || !this.roomId || !this.username) return;
    
    this.broadcastMessage({
      type: 'move',
      senderId: this.username,
      roomId: this.roomId,
      content: { cardId },
      timestamp: new Date().toISOString()
    });
  }

  // Enviar mensagem de chat
  sendChatMessage(text) {
    if (!this.connected || !this.roomId || !this.username) return;
    
    const message = {
      type: 'chat',
      senderId: this.username,
      roomId: this.roomId,
      content: { text },
      timestamp: new Date().toISOString()
    };
    
    // Adicionar mensagem à sala
    let rooms = this.getRooms();
    let room = rooms.find(r => r.id === this.roomId);
    
    if (room) {
      room.messages.push(message);
      localStorage.setItem('multiplayer_rooms', JSON.stringify(rooms));
    }
    
    // Notificar usuário atual e outros jogadores
    this.callbacks.onMessage(message);
    this.broadcastMessage(message);
  }

  // Enviar mensagem genérica
  sendMessage(type, content) {
    if (!this.connected || !this.roomId || !this.username) return;
    
    this.broadcastMessage({
      type,
      senderId: this.username,
      roomId: this.roomId,
      content,
      timestamp: new Date().toISOString()
    });
  }

  // Funções auxiliares
  broadcastMessage(message) {
    // Em um ambiente real, isso seria enviado através de websockets
    // Aqui apenas salvamos no localStorage para simular
    let rooms = this.getRooms();
    let room = rooms.find(r => r.id === message.roomId);
    
    if (room) {
      room.messages.push(message);
      localStorage.setItem('multiplayer_rooms', JSON.stringify(rooms));
      
      // Simular recebimento por outros jogadores
      if (message.senderId !== this.username) {
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(message);
        }
      }
    }
  }

  getRooms() {
    const roomsStr = localStorage.getItem('multiplayer_rooms');
    return roomsStr ? JSON.parse(roomsStr) : [];
  }

  // Simulação de atividade de outros jogadores
  simulateOtherPlayers() {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }
    
    // Não simular nada no momento para simplificar
  }
}

export default new MultiplayerService(); 