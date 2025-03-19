package com.jogomemoria.controller;

import com.jogomemoria.model.Card;
import com.jogomemoria.model.Score;
import com.jogomemoria.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class GameController {

    private final GameService gameService;

    @Autowired
    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/cards")
    public ResponseEntity<List<Card>> getCards() {
        List<Card> cards = gameService.generateCards();
        return ResponseEntity.ok(cards);
    }

    @PostMapping("/scores")
    public ResponseEntity<Score> saveScore(@RequestBody Map<String, Integer> payload) {
        int moves = payload.get("moves");
        Score savedScore = gameService.saveScore(moves);
        return ResponseEntity.ok(savedScore);
    }

    @GetMapping("/scores")
    public ResponseEntity<List<Score>> getHighScores() {
        List<Score> highScores = gameService.getHighScores();
        return ResponseEntity.ok(highScores);
    }
} 