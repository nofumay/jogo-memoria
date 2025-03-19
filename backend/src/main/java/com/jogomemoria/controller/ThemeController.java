package com.jogomemoria.controller;

import com.jogomemoria.model.Theme;
import com.jogomemoria.service.ThemeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/themes")
@CrossOrigin(origins = "http://localhost:3000")
public class ThemeController {

    private final ThemeService themeService;

    @Autowired
    public ThemeController(ThemeService themeService) {
        this.themeService = themeService;
    }

    @GetMapping
    public ResponseEntity<List<Theme>> getAllThemes() {
        List<Theme> themes = themeService.getAllThemes();
        return ResponseEntity.ok(themes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Theme> getThemeById(@PathVariable Long id) {
        Theme theme = themeService.getThemeById(id);
        return ResponseEntity.ok(theme);
    }

    @GetMapping("/{id}/cards")
    public ResponseEntity<?> getCardsForTheme(
            @PathVariable Long id,
            @RequestParam(defaultValue = "medium") String difficulty) {
        return ResponseEntity.ok(themeService.generateCardsForTheme(id, difficulty));
    }
} 