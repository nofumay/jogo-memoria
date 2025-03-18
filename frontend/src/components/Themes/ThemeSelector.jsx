import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ThemeService from '../../services/ThemeService';
import './ThemeSelector.css';

const ThemeSelector = () => {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadThemes = async () => {
      try {
        setLoading(true);
        const data = await ThemeService.getAllThemes();
        setThemes(data);
        if (data.length > 0) {
          setSelectedTheme(data[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar temas:', error);
        toast.error('Erro ao carregar temas. Tente novamente.');
        setLoading(false);
      }
    };

    loadThemes();
  }, []);

  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
  };

  const startGame = () => {
    if (selectedTheme) {
      navigate(`/game/${selectedTheme.id}/${difficulty}`);
    }
  };

  const createMultiplayerGame = () => {
    if (selectedTheme) {
      // Gerar um ID de sala aleatório
      const roomId = Math.random().toString(36).substring(2, 9);
      navigate(`/multiplayer/${roomId}/${selectedTheme.id}/${difficulty}`);
    }
  };

  if (loading) {
    return <div className="loading">Carregando temas...</div>;
  }

  return (
    <div className="theme-selector">
      <h2>Selecione um Tema</h2>
      
      <div className="themes-grid">
        {themes.map(theme => (
          <div 
            key={theme.id}
            className={`theme-card ${selectedTheme && selectedTheme.id === theme.id ? 'selected' : ''}`}
            onClick={() => handleThemeSelect(theme)}
          >
            <h3>{theme.name}</h3>
            <div className="theme-preview">
              {theme.symbols.slice(0, 4).map((symbol, index) => (
                <div key={index} className="symbol-preview">{symbol}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="game-options">
        <div className="difficulty-selector">
          <h3>Dificuldade</h3>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="difficulty"
                value="easy"
                checked={difficulty === 'easy'}
                onChange={handleDifficultyChange}
              />
              Fácil (8 cartas)
            </label>
            
            <label>
              <input
                type="radio"
                name="difficulty"
                value="medium"
                checked={difficulty === 'medium'}
                onChange={handleDifficultyChange}
              />
              Médio (16 cartas)
            </label>
            
            <label>
              <input
                type="radio"
                name="difficulty"
                value="hard"
                checked={difficulty === 'hard'}
                onChange={handleDifficultyChange}
              />
              Difícil (24 cartas)
            </label>
          </div>
        </div>

        <div className="start-buttons">
          <button 
            onClick={startGame}
            disabled={!selectedTheme}
            className="start-game-button"
          >
            Iniciar Jogo Solo
          </button>
          
          <button 
            onClick={createMultiplayerGame}
            disabled={!selectedTheme}
            className="multiplayer-button"
          >
            Criar Jogo Multiplayer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector; 