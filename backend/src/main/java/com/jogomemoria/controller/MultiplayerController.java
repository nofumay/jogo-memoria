package com.jogomemoria.controller;

import com.jogomemoria.model.GameMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class MultiplayerController {
    
    @MessageMapping("/game/{roomId}/move")
    @SendTo("/topic/game/{roomId}")
    public GameMessage processMove(@DestinationVariable String roomId, GameMessage message) {
        // Aqui você poderia processar a jogada e atualizar o estado do jogo
        return message;
    }
    
    @MessageMapping("/game/{roomId}/join")
    @SendTo("/topic/game/{roomId}")
    public GameMessage joinGame(@DestinationVariable String roomId, GameMessage message) {
        // Adicionar jogador à sala
        return new GameMessage("join", message.getSenderId(), roomId, 
            String.format("Jogador %s entrou na sala", message.getSenderId()));
    }
    
    @MessageMapping("/game/{roomId}/leave")
    @SendTo("/topic/game/{roomId}")
    public GameMessage leaveGame(@DestinationVariable String roomId, GameMessage message) {
        // Remover jogador da sala
        return new GameMessage("leave", message.getSenderId(), roomId, 
            String.format("Jogador %s saiu da sala", message.getSenderId()));
    }
    
    @MessageMapping("/game/{roomId}/chat")
    @SendTo("/topic/game/{roomId}")
    public GameMessage chatMessage(@DestinationVariable String roomId, GameMessage message) {
        // Mensagem de chat
        return message;
    }
} 