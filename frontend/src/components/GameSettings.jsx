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
  currentThemes,
  handleVolumeChange,
  volume = 0.7
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
        
        {soundEnabled && (
          <div className="sound-controls">
            <h4>Volume</h4>
            <div className="volume-slider-container">
              <span className="volume-icon low">🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
              <span className="volume-icon high">🔊</span>
            </div>
            <p className="volume-level">Nível: {Math.round(volume * 100)}%</p>
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button className="reset-button" onClick={resetGame}>
          Reiniciar Jogo
        </button>
        
        <div className="settings-note">
          <p>As configurações serão salvas automaticamente.</p>
        </div>
      </div>
    </div>
  );
};

export default GameSettings;