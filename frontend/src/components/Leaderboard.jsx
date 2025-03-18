import React, { useState, useEffect } from 'react';

const Leaderboard = ({ currentDifficulty = 'all' }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(currentDifficulty);
  
  // Dados mockados para exemplo
  const mockData = [
    { id: 1, username: 'jogador1', score: 850, moves: 14, time: 45, difficulty: 'easy', date: '2023-03-16' },
    { id: 2, username: 'mestre123', score: 780, moves: 16, time: 52, difficulty: 'easy', date: '2023-03-15' },
    { id: 3, username: 'proPlayer', score: 1200, moves: 20, time: 75, difficulty: 'medium', date: '2023-03-17' },
    { id: 4, username: 'gameMaster', score: 1050, moves: 22, time: 80, difficulty: 'medium', date: '2023-03-14' },
    { id: 5, username: 'campeão', score: 1500, moves: 30, time: 120, difficulty: 'hard', date: '2023-03-18' },
    { id: 6, username: 'desafiante', score: 1450, moves: 32, time: 130, difficulty: 'hard', date: '2023-03-13' },
    { id: 7, username: 'novoJogador', score: 720, moves: 18, time: 60, difficulty: 'easy', date: '2023-03-12' },
    { id: 8, username: 'memoryKing', score: 980, moves: 24, time: 92, difficulty: 'medium', date: '2023-03-10' },
    { id: 9, username: 'expert99', score: 1350, moves: 34, time: 140, difficulty: 'hard', date: '2023-03-11' },
    { id: 10, username: 'jogadorX', score: 700, moves: 20, time: 65, difficulty: 'easy', date: '2023-03-09' },
  ];
  
  useEffect(() => {
    // Simula carregamento de dados do servidor
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Em um ambiente real, faria uma chamada de API aqui
        // const response = await api.get('/leaderboard');
        // setLeaderboardData(response.data);
        
        // Usando dados mockados para demonstração
        setTimeout(() => {
          setLeaderboardData(mockData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar o ranking:', error);
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const getFilteredData = () => {
    if (filter === 'all') {
      return leaderboardData;
    }
    return leaderboardData.filter(entry => entry.difficulty === filter);
  };
  
  const filteredData = getFilteredData().sort((a, b) => b.score - a.score).slice(0, 10);
  
  return (
    <div className="leaderboard">
      <h2>Ranking dos Jogadores</h2>
      
      <div className="leaderboard-filters">
        <button 
          className={`button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button 
          className={`button ${filter === 'easy' ? 'active' : ''}`}
          onClick={() => setFilter('easy')}
        >
          Fácil
        </button>
        <button 
          className={`button ${filter === 'medium' ? 'active' : ''}`}
          onClick={() => setFilter('medium')}
        >
          Médio
        </button>
        <button 
          className={`button ${filter === 'hard' ? 'active' : ''}`}
          onClick={() => setFilter('hard')}
        >
          Difícil
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Carregando ranking</div>
      ) : (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Posição</th>
                <th>Jogador</th>
                <th>Pontuação</th>
                <th>Movimentos</th>
                <th>Tempo</th>
                <th>Dificuldade</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((entry, index) => (
                  <tr key={entry.id} className={index < 3 ? `top-${index + 1}` : ''}>
                    <td>{index + 1}</td>
                    <td>{entry.username}</td>
                    <td>{entry.score}</td>
                    <td>{entry.moves}</td>
                    <td>{formatTime(entry.time)}</td>
                    <td>
                      <span className={`difficulty-badge ${entry.difficulty}`}>
                        {entry.difficulty === 'easy' ? 'Fácil' : 
                         entry.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </span>
                    </td>
                    <td>{formatDate(entry.date)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    Nenhum registro encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="leaderboard-info">
        <p>
          Os pontos são calculados com base no tempo, número de movimentos e nível de dificuldade.
          Termine o jogo mais rápido e com menos movimentos para conseguir uma pontuação mais alta!
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;