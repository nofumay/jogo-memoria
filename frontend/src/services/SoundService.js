/**
 * Serviço para gerenciar efeitos sonoros do jogo
 */

class SoundService {
  constructor() {
    this.sounds = {};
    this.isMuted = localStorage.getItem('memoryGameMuted') === 'true';
    this.volume = parseFloat(localStorage.getItem('memoryGameVolume') || '0.7');
    this.loadSounds();
  }

  /**
   * Carrega todos os efeitos sonoros necessários
   */
  loadSounds() {
    this.loadSound('flip', '/sounds/flip.mp3');
    this.loadSound('match', '/sounds/match.mp3');
    this.loadSound('error', '/sounds/error.mp3'); 
    this.loadSound('win', '/sounds/win.mp3');
    this.loadSound('start', '/sounds/start.mp3');
    this.loadSound('restart', '/sounds/restart.mp3');
    this.loadSound('opponent_move', '/sounds/opponent_move.mp3');
  }

  /**
   * Carrega um arquivo de som individual
   * @param {string} name - Nome do efeito sonoro
   * @param {string} path - Caminho para o arquivo de som
   */
  loadSound(name, path) {
    try {
      const audio = new Audio(path);
      audio.volume = this.volume;
      this.sounds[name] = audio;
    } catch (error) {
      console.warn(`Não foi possível carregar o som ${name}:`, error);
    }
  }

  /**
   * Reproduz um efeito sonoro
   * @param {string} name - Nome do efeito sonoro para reproduzir
   */
  play(name) {
    if (this.isMuted || !this.sounds[name]) return;
    
    try {
      // Cria uma nova instância para permitir sobreposição de sons
      const sound = this.sounds[name].cloneNode();
      sound.volume = this.volume;
      sound.play().catch(error => {
        // Alguns navegadores bloqueiam reprodução automática
        console.warn(`Erro ao reproduzir som ${name}:`, error);
      });
    } catch (error) {
      console.warn(`Erro ao reproduzir som ${name}:`, error);
    }
  }

  /**
   * Alterna o estado de mudo
   * @returns {boolean} Novo estado de mudo
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('memoryGameMuted', this.isMuted);
    return this.isMuted;
  }

  /**
   * Define o volume para todos os efeitos sonoros
   * @param {number} value - Valor do volume (0.0 a 1.0)
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem('memoryGameVolume', this.volume);
    
    // Atualiza o volume de todos os sons carregados
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
  }

  /**
   * Verifica se o sistema está mudo
   * @returns {boolean} Estado de mudo
   */
  getMuteState() {
    return this.isMuted;
  }

  /**
   * Obtém o volume atual
   * @returns {number} Volume atual (0.0 a 1.0)
   */
  getVolume() {
    return this.volume;
  }
}

// Exporta uma única instância do serviço
const soundService = new SoundService();
export default soundService;