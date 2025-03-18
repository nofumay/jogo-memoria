import React from 'react';
import './ScorePanel.css';

const ScorePanel = ({ moves }) => {
  return (
    <div className="score-panel">
      <div className="moves">
        <span>Movimentos: {moves}</span>
      </div>
    </div>
  );
};

export default ScorePanel; 