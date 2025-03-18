import React, { useState, useEffect } from 'react';
import './Ranking.css';
import GameService from '../services/GameService';
import { toast } from 'react-toastify';

const Ranking = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const highScores = await GameService.getHighScores();
      setScores(highScores);
      setLoading(false);
    } catch (error) {
      toast.error('Erro ao carregar o ranking');
      console.error('Erro ao buscar pontuações:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  if (loading) {
    return <div className="loading">Carregando ranking...</div>;
  }

  return (
    <div className="ranking-container">
      <h1>Ranking de Pontuações</h1>
      
      {scores.length === 0 ? (
        <div className="no-scores">
          <p>Ainda não há pontuações registradas.</p>
          <p>Jogue uma partida para entrar no ranking!</p>
        </div>
      ) : (
        <div className="scores-table">
          <table>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Jogador</th>
                <th>Movimentos</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={score.id} className={index === 0 ? 'first-place' : ''}>
                  <td>{index + 1}º</td>
                  <td>{score.username}</td>
                  <td>{score.moves}</td>
                  <td>{formatDate(score.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <button onClick={fetchScores} className="refresh-button">
        Atualizar Ranking
      </button>
    </div>
  );
};

export default Ranking; 