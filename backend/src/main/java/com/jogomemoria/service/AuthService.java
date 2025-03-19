package com.jogomemoria.service;

import com.jogomemoria.model.User;
import com.jogomemoria.repository.UserRepository;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Scope;
import io.opentelemetry.api.OpenTelemetry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService implements UserDetailsService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final Tracer tracer;

    @Autowired
    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            OpenTelemetry openTelemetry) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.tracer = openTelemetry.getTracer(AuthService.class.getName());
    }
    
    public User register(String username, String password, String email) {
        Span span = tracer.spanBuilder("register").startSpan();
        try (Scope scope = span.makeCurrent()) {
            if (userRepository.existsByUsername(username)) {
                span.setAttribute("error", "Usuário já existe");
                throw new RuntimeException("Usuário já existe");
            }
            
            if (userRepository.existsByEmail(email)) {
                span.setAttribute("error", "Email já está em uso");
                throw new RuntimeException("Email já está em uso");
            }
            
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(password));
            user.setEmail(email);
            
            span.setAttribute("user.username", username);
            span.setAttribute("user.email", email);
            
            return userRepository.save(user);
        } finally {
            span.end();
        }
    }
    
    public String login(String username, String password) {
        Span span = tracer.spanBuilder("login").startSpan();
        try (Scope scope = span.makeCurrent()) {
            span.setAttribute("user.username", username);
            
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );
            
            if (authentication.isAuthenticated()) {
                return jwtService.generateToken(username);
            }
            
            span.setAttribute("error", "Falha na autenticação");
            throw new RuntimeException("Falha na autenticação");
        } finally {
            span.end();
        }
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Span span = tracer.spanBuilder("loadUserByUsername").startSpan();
        try (Scope scope = span.makeCurrent()) {
            span.setAttribute("user.username", username);
            
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));
            
            return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles("USER")
                .build();
        } finally {
            span.end();
        }
    }
} 