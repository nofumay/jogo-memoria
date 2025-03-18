# Jogo da Memória Multiplayer

Um jogo da memória multiplayer online desenvolvido com React e Socket.io, permitindo que jogadores se divirtam encontrando pares de cartas em tempo real.

## Funcionalidades

- 🎮 **Multiplayer em tempo real** - Jogue contra amigos online
- 🎭 **Múltiplos temas** - Escolha entre emojis, animais, comidas e esportes
- 🎚️ **Níveis de dificuldade** - Jogue no modo fácil, médio ou difícil
- 🏆 **Sistema de pontuação** - Acumule pontos e veja o ranking
- 🔊 **Efeitos sonoros** - Desfrute de uma experiência com áudio imersiva

## Como iniciar o jogo

### Pré-requisitos

- Node.js (v14+)
- NPM ou Yarn

### Instalação

1. Clone o repositório

```bash
git clone https://github.com/nofumay/jogo-memoria.git
cd jogo-memoria
```

2. Instale as dependências do backend

```bash
cd backend
npm install
```

3. Instale as dependências do frontend

```bash
cd ../frontend
npm install
```

### Executando o jogo

1. Inicie o servidor backend (em uma janela de terminal)

```bash
cd backend
npm start
```

2. Inicie o cliente frontend (em outra janela de terminal)

```bash
cd frontend
npm start
```

3. Acesse o jogo em seu navegador: [http://localhost:3000](http://localhost:3000)

## Como jogar

1. **Login/Registro** - Crie uma conta ou faça login para começar
2. **Escolha o modo de jogo**:
   - **Jogar Solo** - Pratique sozinho
   - **Encontrar Oponente** - Jogue contra outro jogador online
   - **Criar Sala** - Crie uma sala e convide um amigo
   - **Entrar em Sala** - Entre em uma sala existente usando o código

3. **Durante o jogo**:
   - Clique nas cartas para virá-las
   - Encontre pares correspondentes
   - No modo multiplayer, os jogadores se alternam após uma tentativa incorreta
   - Quem encontrar mais pares ganha!

## Problemas comuns e soluções

**Os botões não estão funcionando?**
- Certifique-se de que o servidor backend está rodando na porta 3001
- Verifique se o frontend está conectado ao backend (verifique o console para mensagens de "Conectado ao servidor")

**Erro de CORS?**
- Verifique se as configurações CORS no servidor estão corretas
- Certifique-se de que está acessando o frontend pela URL correta

**Som não está funcionando?**
- Verifique se os arquivos de som estão na pasta `/frontend/public/sounds/`
- Verifique se o som está habilitado nas configurações do jogo

## Tecnologias utilizadas

- Frontend: React, React Router, Socket.io Client
- Backend: Node.js, Express, Socket.io
- Estilo: CSS3 com animações

---

Desenvolvido por Diego Silva | Jogo da Memória Multiplayer &copy; 2024