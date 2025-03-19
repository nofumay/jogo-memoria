package com.jogomemoria.service;

import com.jogomemoria.model.Card;
import com.jogomemoria.model.Score;
import com.jogomemoria.repository.ScoreRepository;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Scope;
import io.opentelemetry.api.OpenTelemetry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class GameService {

    private final ScoreRepository scoreRepository;
    private final Tracer tracer;

    @Autowired
    public GameService(ScoreRepository scoreRepository, OpenTelemetry openTelemetry) {
        this.scoreRepository = scoreRepository;
        this.tracer = openTelemetry.getTracer(GameService.class.getName());
    }

    public List<Card> generateCards() {
        Span span = tracer.spanBuilder("generateCards").startSpan();
        try (Scope scope = span.makeCurrent()) {
            List<Card> cards = new ArrayList<>();
            String[] symbols = {"🍎", "🍌", "🍇", "🍓", "🍊", "🥭", "🍍", "🥥"};
            
            long id = 1;
            // Criar pares de cartas
            for (String symbol : symbols) {
                cards.add(new Card(id++, symbol));
                cards.add(new Card(id++, symbol));
            }
            
            // Embaralhar as cartas
            Collections.shuffle(cards);
            span.setAttribute("cards.count", cards.size());
            
            return cards;
        } finally {
            span.end();
        }
    }

    public Score saveScore(int moves) {
        Span span = tracer.spanBuilder("saveScore").startSpan();
        try (Scope scope = span.makeCurrent()) {
            span.setAttribute("score.moves", moves);
            
            Score score = new Score(moves);
            Score savedScore = scoreRepository.save(score);
            
            span.setAttribute("score.id", savedScore.getId());
            return savedScore;
        } finally {
            span.end();
        }
    }

    public List<Score> getHighScores() {
        Span span = tracer.spanBuilder("getHighScores").startSpan();
        try (Scope scope = span.makeCurrent()) {
            List<Score> highScores = scoreRepository.findTop10ByOrderByMovesAsc();
            span.setAttribute("highscores.count", highScores.size());
            return highScores;
        } finally {
            span.end();
        }
    }
} 