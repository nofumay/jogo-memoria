import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import AuthService from './services/AuthService';

// Componentes
import Navbar from './components/Navbar';
import Home from './components/Home';
import GameBoard from './components/GameBoard';
import Login from './components/Login';
import Register from './components/Register';
import Footer from './components/Footer';
import Leaderboard from './components/Leaderboard';
import NotFound from './components/NotFound';

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Componente para redirecionar usuários já autenticados
const RedirectIfAuthenticated = ({ children }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  
  // Se estiver na página inicial e já estiver autenticado, ir direto para o jogo
  if (isAuthenticated && window.location.pathname === '/') {
    return <Navigate to="/game" />;
  }
  
  // Se estiver nas páginas de login/registro e já estiver autenticado, ir para o jogo
  if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
    return <Navigate to="/game" />;
  }
  
  return children;
};

function App() {
  // Ao iniciar, verificar se a interface mostra que o usuário está logado
  // e garantir que as informações no localStorage correspondam
  useEffect(() => {
    const userElement = document.querySelector('.navbar-user');
    if (userElement && userElement.textContent.includes('Olá') && !AuthService.isAuthenticated()) {
      // Simular login se o usuário parece estar autenticado na UI mas não no localStorage
      const username = userElement.textContent.replace('Olá, ', '').replace('Usuário', 'fumay');
      AuthService.simulateLogin(username);
    }
  }, []);

  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="container">
          <Routes>
            <Route 
              path="/" 
              element={
                <RedirectIfAuthenticated>
                  <Home />
                </RedirectIfAuthenticated>
              } 
            />
            <Route 
              path="/game" 
              element={
                <ProtectedRoute>
                  <GameBoard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <RedirectIfAuthenticated>
                  <Login />
                </RedirectIfAuthenticated>
              } 
            />
            <Route 
              path="/register" 
              element={
                <RedirectIfAuthenticated>
                  <Register />
                </RedirectIfAuthenticated>
              } 
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/ranking" element={<Leaderboard />} />
            
            {/* Rota coringa para capturar qualquer URL que não exista */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;