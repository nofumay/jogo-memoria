import React from 'react';
import './Card.css';

const Card = ({ id, value, isFlipped, isMatched, onClick }) => {
  const handleClick = () => {
    onClick(id);
  };

  const cardClassName = `memory-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`;

  return (
    <div className={cardClassName} onClick={handleClick}>
      <div className="card-inner">
        <div className="card-front">
          <span>?</span>
        </div>
        <div className="card-back">
          <span>{value}</span>
        </div>
      </div>
    </div>
  );
};

export default Card; 