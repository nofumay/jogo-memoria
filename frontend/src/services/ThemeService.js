// Serviço de temas para o jogo da memória
// Usando simulação em localStorage para desenvolvimento

class ThemeService {
  constructor() {
    this.initializeDefaultThemes();
  }

  // Obter todos os temas
  getAllThemes() {
    return new Promise((resolve) => {
      const themes = this.getThemesFromStorage();
      resolve(themes);
    });
  }

  // Obter um tema específico pelo ID
  getThemeById(themeId) {
    return new Promise((resolve, reject) => {
      const themes = this.getThemesFromStorage();
      const theme = themes.find(t => t.id === parseInt(themeId) || t.id === themeId);
      
      if (theme) {
        resolve(theme);
      } else {
        reject(new Error(`Tema com ID ${themeId} não encontrado`));
      }
    });
  }

  // Obter cartas para um tema e dificuldade específicos
  getCardsForTheme(themeId, difficulty) {
    return new Promise((resolve, reject) => {
      try {
        const theme = this.getThemesFromStorage().find(t => 
          t.id === parseInt(themeId) || t.id === themeId
        );
        
        if (!theme) {
          return reject(new Error(`Tema com ID ${themeId} não encontrado`));
        }
        
        // Determinar número de pares com base na dificuldade
        let pairsCount;
        switch (difficulty) {
          case 'easy':
            pairsCount = 4; // 8 cartas
            break;
          case 'medium':
            pairsCount = 8; // 16 cartas
            break;
          case 'hard':
            pairsCount = 12; // 24 cartas
            break;
          default:
            pairsCount = 8;
        }
        
        // Garantir que temos símbolos suficientes
        if (theme.symbols.length < pairsCount) {
          return reject(new Error(`Tema não tem símbolos suficientes para a dificuldade ${difficulty}`));
        }
        
        // Selecionar símbolos aleatoriamente para o jogo
        const gameSymbols = this.getRandomElements(theme.symbols, pairsCount);
        
        // Criar pares de cartas (duplicando cada símbolo)
        let cards = [];
        gameSymbols.forEach((symbol, index) => {
          // Primeira carta do par
          cards.push({
            id: `card-${index}-a`,
            value: symbol,
            isFlipped: false,
            isMatched: false
          });
          
          // Segunda carta do par
          cards.push({
            id: `card-${index}-b`,
            value: symbol,
            isFlipped: false,
            isMatched: false
          });
        });
        
        // Embaralhar as cartas
        cards = this.shuffleArray(cards);
        
        resolve(cards);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Funções auxiliares
  getThemesFromStorage() {
    const themesStr = localStorage.getItem('memory_themes');
    return themesStr ? JSON.parse(themesStr) : [];
  }

  getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Inicializar temas padrão para desenvolvimento
  initializeDefaultThemes() {
    if (!localStorage.getItem('memory_themes')) {
      const defaultThemes = [
        {
          id: 1,
          name: 'Emoji',
          description: 'Tema com emojis divertidos',
          symbols: ['😀', '😎', '🥳', '🚀', '🎮', '🍕', '🐱', '🐶', '🌈', '🌟', '🎵', '🎁', '🏆', '🍦']
        },
        {
          id: 2,
          name: 'Animais',
          description: 'Tema com animais',
          symbols: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🦄']
        },
        {
          id: 3,
          name: 'Comidas',
          description: 'Tema com comidas',
          symbols: ['🍎', '🍌', '🍓', '🍕', '🍔', '🍦', '🍩', '🍪', '🍫', '🍿', '🥗', '🍣', '🧁', '🥞']
        }
      ];
      
      localStorage.setItem('memory_themes', JSON.stringify(defaultThemes));
    }
  }
}

export default new ThemeService(); 