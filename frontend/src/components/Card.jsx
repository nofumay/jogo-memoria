import React from 'react';

const Card = ({ id, value, isFlipped, isMatched, onClick }) => {
  // Emojis para as cartas
  const emojis = [
    '🙂', '😎', '🐱', '🐶', '🦄', '🍕', '🚀', '⚽', 
    '🎮', '🎵', '🎨', '🔥', '💖', '🌟', '🍦', '🌈'
  ];

  const cardClassName = `card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`;

  return (
    <div 
      className={cardClassName}
      onClick={onClick}
    >
      {isFlipped ? emojis[value - 1] : '?'}
    </div>
  );
};

export default Card;