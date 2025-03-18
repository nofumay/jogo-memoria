import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import Navbar from './components/Navbar/Navbar';
import MemoryGame from './components/MemoryGame';
import ThemeSelector from './components/Themes/ThemeSelector';
import MultiplayerGame from './components/Multiplayer/MultiplayerGame';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Ranking from './components/Ranking';
import AuthService from './services/AuthService';

// Componente para rotas protegidas
const PrivateRoute = ({ children }) => {
  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <PrivateRoute>
                <ThemeSelector />
              </PrivateRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/game/:themeId/:difficulty" element={
              <PrivateRoute>
                <MemoryGame />
              </PrivateRoute>
            } />
            <Route path="/multiplayer/:roomId/:themeId/:difficulty" element={
              <PrivateRoute>
                <MultiplayerGame />
              </PrivateRoute>
            } />
            <Route path="/ranking" element={<Ranking />} />
          </Routes>
        </main>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </BrowserRouter>
  );
}

export default App; 