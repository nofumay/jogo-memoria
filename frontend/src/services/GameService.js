import ThemeService from './ThemeService';

// Versão simulada do GameService para desenvolvimento
class GameService {
  constructor() {
    this.initLocalStorage();
  }

  // Retorna cartas para o jogo (com o tema padrão "Emoji")
  async getCards() {
    try {
      // Usar o tema de emojis por padrão quando iniciado diretamente
      const defaultThemeId = 1; // ID do tema Emoji
      const defaultDifficulty = 'medium';
      
      const cards = await ThemeService.getCardsForTheme(defaultThemeId, defaultDifficulty);
      return cards;
    } catch (error) {
      console.error('Erro ao buscar cartas:', error);
      throw error;
    }
  }

  // Salva a pontuação no localStorage
  async saveScore(moves) {
    try {
      const scores = this.getScoresFromStorage();
      const username = this.getCurrentUsername();
      
      scores.push({
        id: Date.now(),
        username: username || 'Jogador Anônimo',
        moves: moves,
        date: new Date().toISOString()
      });
      
      // Ordenar pontuações (menor número de movimentos = melhor)
      scores.sort((a, b) => a.moves - b.moves);
      
      // Limitar a 10 melhores pontuações
      const topScores = scores.slice(0, 10);
      
      localStorage.setItem('memory_scores', JSON.stringify(topScores));
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar pontuação:', error);
      throw error;
    }
  }

  // Retorna as pontuações mais altas
  async getHighScores() {
    try {
      return this.getScoresFromStorage();
    } catch (error) {
      console.error('Erro ao buscar pontuações:', error);
      throw error;
    }
  }

  // Funções auxiliares
  getCurrentUsername() {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      return user.username;
    } catch (error) {
      return null;
    }
  }

  getScoresFromStorage() {
    const scoresStr = localStorage.getItem('memory_scores');
    return scoresStr ? JSON.parse(scoresStr) : [];
  }

  // Inicializar localStorage se necessário
  initLocalStorage() {
    if (!localStorage.getItem('memory_scores')) {
      localStorage.setItem('memory_scores', JSON.stringify([]));
    }
  }
}

export default new GameService(); 