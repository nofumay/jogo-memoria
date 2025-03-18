import React from 'react';

const Card = ({ id, value, isFlipped, isMatched, onClick }) => {
  // Array de emojis para as cartas com temas diferentes
  const emojiThemes = {
    animals: ['🐶', '🐱', '🦁', '🐼', '🐨', '🦊', '🐯', '🦄', '🐮', '🐷', '🐸', '🐔', '🐧', '🦅', '🦋', '🐢'],
    fruits: ['🍎', '🍌', '🍉', '🍇', '🍓', '🍑', '🍍', '🥝', '🥭', '🍒', '🍋', '🥥', '🍅', '🥑', '🍆', '🥔'],
    emojis: ['😀', '😎', '🤩', '😍', '🤔', '🙄', '😴', '🥳', '😂', '🥺', '😱', '🤯', '🥶', '🤢', '👻', '👽'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋', '⛳', '🎯', '🎮', '♟️']
  };

  // Selecione um tema (poderíamos fazer isso dinâmico através de props)
  const currentTheme = 'animals';
  const emojis = emojiThemes[currentTheme];

  const cardClassName = `card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`;

  return (
    <div 
      className={cardClassName}
      onClick={onClick}
    >
      <div className="card-inner">
        <div className="card-front">?</div>
        <div className="card-back">{emojis[value - 1]}</div>
      </div>
    </div>
  );
};

export default Card;