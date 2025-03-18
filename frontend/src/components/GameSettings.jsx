import React from 'react';

const GameSettings = ({ 
  difficulty, 
  setDifficulty, 
  theme, 
  setTheme, 
  timerEnabled, 
  setTimerEnabled,
  soundEnabled,
  setSoundEnabled,
  resetGame,
  currentThemes
}) => {
  return (
    <div className="game-settings">
      <h3>Configurações do Jogo</h3>
      
      <div className="settings-section">
        <div className="difficulty-selector">
          <h4>Nível de Dificuldade</h4>
          <div className="button-group">
            <button 
              className={`button ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => setDifficulty('easy')}
            >
              Fácil
            </button>
            <button 
              className={`button ${difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => setDifficulty('medium')}
            >
              Médio
            </button>
            <button 
              className={`button ${difficulty === 'hard' ? 'active' : ''}`}
              onClick={() => setDifficulty('hard')}
            >
              Difícil
            </button>
          </div>
        </div>

        <div className="theme-selector">
          <h4>Tema</h4>
          <div className="button-group">
            {currentThemes.map((t) => (
              <button 
                key={t.name}
                className={`button ${theme === t.name ? 'active' : ''}`}
                onClick={() => setTheme(t.name)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="game-options">
          <h4>Opções</h4>
          <div className="option-toggles">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={timerEnabled}
                onChange={() => setTimerEnabled(!timerEnabled)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Cronômetro</span>
            </label>
            
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={soundEnabled}
                onChange={() => setSoundEnabled(!soundEnabled)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Sons</span>
            </label>
          </div>
        </div>
      </div>

      <button className="reset-button" onClick={resetGame}>
        Reiniciar Jogo
      </button>
    </div>
  );
};

export default GameSettings;