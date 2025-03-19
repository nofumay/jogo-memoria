# Jogo da Memória

Este é um jogo da memória desenvolvido com React no frontend e Java Spring Boot no backend.

## Estrutura do Projeto

- `frontend/`: Aplicação React
- `backend/`: API REST em Java Spring Boot

## Tecnologias Utilizadas

### Frontend
- React
- Axios para requisições HTTP
- CSS para estilização

### Backend
- Java 17
- Spring Boot
- Spring Data JPA
- Banco de dados H2 (em memória)

## Como Executar

### Backend
1. Navegue até a pasta `backend`
2. Execute `./mvnw spring-boot:run` (Linux/Mac) ou `mvnw.cmd spring-boot:run` (Windows)
3. O servidor será iniciado na porta 8080

### Frontend
1. Navegue até a pasta `frontend`
2. Execute `npm install` para instalar as dependências
3. Execute `npm start` para iniciar o servidor de desenvolvimento
4. Acesse `http://localhost:3000` no navegador

## Funcionalidades

- Jogo da memória com cartas de emojis
- Armazenamento das pontuações (menor número de movimentos)
- Visualização das melhores pontuações
- Interface responsiva e interativa

## Como Jogar

1. Clique em uma carta para virá-la
2. Clique em outra carta para tentar encontrar o par
3. Se as cartas forem iguais, elas permanecerão viradas
4. Se forem diferentes, elas serão viradas de volta após 1 segundo
5. O objetivo é encontrar todos os pares com o menor número de movimentos possível 