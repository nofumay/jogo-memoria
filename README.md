# Jogo da Memória Multiplayer

Um jogo da memória multiplayer online onde você pode criar salas, jogar contra amigos e acumular pontos!

## Funcionalidades

- **Modo Multiplayer Online**: Jogue contra outros jogadores em tempo real
- **Sistema de Matchmaking**: Encontre oponentes automaticamente
- **Salas Personalizadas**: Crie sua própria sala e convide amigos usando o código
- **Diferentes Temas**: Escolha entre temas como Animais, Frutas, Emojis e Esportes
- **Níveis de Dificuldade**: Três níveis de dificuldade (Fácil, Médio, Difícil)
- **Sistema de Pontuação**: Ganhe pontos ao vencer partidas e acumule-os no seu perfil
- **Efeitos Sonoros**: Sons para uma experiência imersiva de jogo

## Como Jogar

1. **Crie uma conta ou faça login** - Primeiro, registre-se ou faça login para acessar o jogo
2. **Escolha como jogar**:
   - Clique em "Iniciar Jogo" para entrar na fila de matchmaking
   - Clique em "Criar Sala" para criar uma sala e convidar amigos
   - Digite um código de sala e clique em "Entrar na Sala" para entrar em uma sala existente
3. **Jogue**:
   - A cada turno, selecione duas cartas para encontrar pares
   - Você continua jogando enquanto acertar os pares
   - Quando errar, passa a vez para o oponente
4. **Ganhe pontos**:
   - Ganhe 10 pontos por cada par encontrado
   - Ganhe 100 pontos adicionais ao vencer a partida
   - Se seu oponente abandonar o jogo, você ganha 50 pontos e a vitória

## Configuração para Desenvolvimento

### Requisitos
- Node.js 14+ 
- npm ou yarn

### Frontend

1. Navegue até a pasta frontend
```bash
cd frontend
```

2. Instale as dependências
```bash
npm install
# ou
yarn install
```

3. Configure o arquivo .env na raiz do frontend
```
REACT_APP_SOCKET_URL=http://localhost:3001
```

4. Inicie o servidor de desenvolvimento
```bash
npm start
# ou
yarn start
```

### Backend

1. Navegue até a pasta backend
```bash
cd backend
```

2. Instale as dependências
```bash
npm install
# ou
yarn install
```

3. Inicie o servidor
```bash
npm start
# ou
yarn start
```

## Como funciona o Matchmaking

Quando você clica em "Iniciar Jogo", o sistema:

1. Adiciona você à fila de matchmaking
2. Procura outro jogador que também esteja na fila
3. Quando encontra um par, cria uma sala automaticamente 
4. Conecta ambos os jogadores à sala
5. Inicia a partida

É necessário que o jogo tenha exatamente dois jogadores para iniciar. 
Se um jogador sair ou atualizar a página durante a partida, o outro jogador ganha automaticamente.

## Como jogar com amigos

1. Um jogador clica em "Criar Sala"
2. O sistema gera um código único de sala
3. O jogador compartilha esse código com o amigo
4. O amigo usa o código para entrar na sala
5. Quando ambos estiverem prontos, a partida pode começar

## Tecnologias Utilizadas

- **Frontend**: React, Socket.io-client, CSS
- **Backend**: Node.js, Express, Socket.io
- **Armazenamento**: LocalStorage para pontuações e perfis

## Pontos de Extensão

Algumas ideias para melhorar o jogo no futuro:

- Adicionar mais temas e cartas
- Implementar um sistema de ranking global
- Adicionar um modo de jogo para mais de 2 jogadores
- Adicionar animações e efeitos visuais mais elaborados
- Criar um sistema de "conquistas" para os jogadores

---

Divirta-se jogando!