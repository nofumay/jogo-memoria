import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Componentes
import Navbar from './components/Navbar';
import Home from './components/Home';
import GameBoard from './components/GameBoard';
import Login from './components/Login';
import Register from './components/Register';
import Footer from './components/Footer';
import Leaderboard from './components/Leaderboard';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<GameBoard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;