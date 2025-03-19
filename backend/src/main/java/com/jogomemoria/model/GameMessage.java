package com.jogomemoria.model;

public class GameMessage {
    private String type;
    private String senderId;
    private String roomId;
    private Object content;
    
    public GameMessage() {
    }
    
    public GameMessage(String type, String senderId, String roomId, Object content) {
        this.type = type;
        this.senderId = senderId;
        this.roomId = roomId;
        this.content = content;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getSenderId() {
        return senderId;
    }
    
    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }
    
    public String getRoomId() {
        return roomId;
    }
    
    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }
    
    public Object getContent() {
        return content;
    }
    
    public void setContent(Object content) {
        this.content = content;
    }
} 