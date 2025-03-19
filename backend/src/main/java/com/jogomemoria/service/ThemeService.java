package com.jogomemoria.service;

import com.jogomemoria.model.Card;
import com.jogomemoria.model.Theme;
import com.jogomemoria.repository.ThemeRepository;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Scope;
import io.opentelemetry.api.OpenTelemetry;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class ThemeService {
    
    private final ThemeRepository themeRepository;
    private final Tracer tracer;
    
    @Autowired
    public ThemeService(ThemeRepository themeRepository, OpenTelemetry openTelemetry) {
        this.themeRepository = themeRepository;
        this.tracer = openTelemetry.getTracer(ThemeService.class.getName());
    }
    
    @PostConstruct
    public void initializeDefaultThemes() {
        Span span = tracer.spanBuilder("initializeDefaultThemes").startSpan();
        try (Scope scope = span.makeCurrent()) {
            if (themeRepository.count() == 0) {
                // Tema Frutas
                Theme fruits = new Theme("Frutas", Arrays.asList("🍎", "🍌", "🍇", "🍓", "🍊", "🥭", "🍍", "🥥"));
                themeRepository.save(fruits);
                
                // Tema Animais
                Theme animals = new Theme("Animais", Arrays.asList("🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼"));
                themeRepository.save(animals);
                
                // Tema Esportes
                Theme sports = new Theme("Esportes", Arrays.asList("⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱"));
                themeRepository.save(sports);
                
                // Tema Expressões
                Theme emotions = new Theme("Expressões", Arrays.asList("😀", "😍", "🥳", "😎", "🙄", "😱", "🤔", "😴"));
                themeRepository.save(emotions);
                
                span.setAttribute("themes.initialized", 4);
            }
        } finally {
            span.end();
        }
    }
    
    public List<Theme> getAllThemes() {
        Span span = tracer.spanBuilder("getAllThemes").startSpan();
        try (Scope scope = span.makeCurrent()) {
            List<Theme> themes = themeRepository.findAll();
            span.setAttribute("themes.count", themes.size());
            return themes;
        } finally {
            span.end();
        }
    }
    
    public Theme getThemeById(Long id) {
        Span span = tracer.spanBuilder("getThemeById").startSpan();
        try (Scope scope = span.makeCurrent()) {
            span.setAttribute("theme.id", id);
            return themeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tema não encontrado"));
        } finally {
            span.end();
        }
    }
    
    public List<Card> generateCardsForTheme(Long themeId, String difficulty) {
        Span span = tracer.spanBuilder("generateCardsForTheme").startSpan();
        try (Scope scope = span.makeCurrent()) {
            span.setAttribute("theme.id", themeId);
            span.setAttribute("game.difficulty", difficulty);
            
            Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new RuntimeException("Tema não encontrado"));
            
            List<String> symbols = theme.getSymbols();
            
            int pairCount;
            switch (difficulty.toLowerCase()) {
                case "easy":
                    pairCount = 4; // 8 cartas
                    break;
                case "medium":
                    pairCount = 8; // 16 cartas
                    break;
                case "hard":
                    pairCount = 12; // 24 cartas
                    break;
                default:
                    pairCount = 8;
            }
            
            // Ajustar o número de símbolos baseado na dificuldade
            List<String> selectedSymbols = symbols.subList(0, Math.min(pairCount, symbols.size()));
            
            // Gerar cartas
            List<Card> cards = new ArrayList<>();
            long id = 1;
            
            for (String symbol : selectedSymbols) {
                cards.add(new Card(id++, symbol));
                cards.add(new Card(id++, symbol));
            }
            
            Collections.shuffle(cards);
            span.setAttribute("cards.count", cards.size());
            
            return cards;
        } finally {
            span.end();
        }
    }
} 