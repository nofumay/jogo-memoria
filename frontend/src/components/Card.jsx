import React from 'react';

const Card = ({ id, value, isFlipped, isMatched, onClick, theme = 'animals', disabled = false }) => {
  // Array de emojis para as cartas com temas diferentes
  const emojiThemes = {
    animals: ['🐶', '🐱', '🦁', '🐼', '🐨', '🦊', '🐯', '🦄', '🐮', '🐷', '🐸', '🐔', '🐧', '🦅', '🦋', '🐢'],
    fruits: ['🍎', '🍌', '🍉', '🍇', '🍓', '🍑', '🍍', '🥝', '🥭', '🍒', '🍋', '🥥', '🍅', '🥑', '🍆', '🥔'],
    emojis: ['😀', '😎', '🤩', '😍', '🤔', '🙄', '😴', '🥳', '😂', '🥺', '😱', '🤯', '🥶', '🤢', '👻', '👽'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋', '⛳', '🎯', '🎮', '♟️']
  };

  // Use o tema passado por props
  const emojis = emojiThemes[theme] || emojiThemes.animals;

  // Classes para a carta
  const cardClassName = `
    card 
    ${isFlipped ? 'flipped' : ''} 
    ${isMatched ? 'matched' : ''} 
    ${disabled ? 'disabled' : ''} 
    ${!isFlipped && !isMatched && !disabled ? 'playable' : ''}
  `;

  return (
    <div 
      className={cardClassName}
      onClick={onClick}
      data-id={id}
      data-value={value}
    >
      <div className="card-inner">
        <div className="card-front">
          <span className="card-question">?</span>
          {!isFlipped && !isMatched && !disabled && (
            <div className="card-playable-indicator"></div>
          )}
        </div>
        <div className="card-back">
          <span className="card-emoji">{emojis[value - 1]}</span>
        </div>
      </div>
    </div>
  );
};

export default Card;