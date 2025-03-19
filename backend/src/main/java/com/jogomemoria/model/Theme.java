package com.jogomemoria.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "themes")
public class Theme {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name;
    
    @ElementCollection
    @CollectionTable(name = "theme_symbols", joinColumns = @JoinColumn(name = "theme_id"))
    @Column(name = "symbol")
    private List<String> symbols;
    
    public Theme() {
    }
    
    public Theme(String name, List<String> symbols) {
        this.name = name;
        this.symbols = symbols;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public List<String> getSymbols() {
        return symbols;
    }
    
    public void setSymbols(List<String> symbols) {
        this.symbols = symbols;
    }
} 