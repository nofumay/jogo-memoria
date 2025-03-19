import React from 'react';
import './Card.css';

const Card = ({ id, value, isFlipped, isMatched, onClick }) => {
  return (
    <div 
      className={`memory-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
      onClick={onClick}
    >
      <div className="card-inner">
        <div className="card-front">
          <span className="card-icon">?</span>
        </div>
        <div className="card-back">
          <span className="card-value">{value}</span>
        </div>
      </div>
    </div>
  );
};

export default Card; 