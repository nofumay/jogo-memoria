// Script para corrigir o AuthService.js
const fs = require('fs');
const path = require('path');

const authServicePath = path.join(__dirname, 'src', 'services', 'AuthService.js');

// Função principal
async function fixAuthService() {
  console.log('Iniciando correção do AuthService.js');
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(authServicePath)) {
      console.error(`Arquivo ${authServicePath} não encontrado!`);
      return;
    }
    
    // Ler o conteúdo do arquivo
    let content = fs.readFileSync(authServicePath, 'utf8');
    
    // Verificar se há o problema específico
    if (content.includes('export default AuthService;import')) {
      console.log('Encontrado problema de sintaxe. Corrigindo...');
      
      // Corrigir o problema
      content = content.replace(/export default AuthService;import.*?from\s+['"]\.\/localStorageService['"];?/gs, 'export default AuthService;');
      
      // Escrever o conteúdo corrigido de volta no arquivo
      fs.writeFileSync(authServicePath, content);
      
      console.log('Arquivo corrigido com sucesso!');
    } else {
      console.log('Nenhum problema encontrado no AuthService.js');
    }

    // Verificar também se há referências ao GameBoard
    checkForGameBoard();
    
  } catch (error) {
    console.error('Erro ao processar o arquivo:', error);
  }
}

// Função para verificar referências ao GameBoard
function checkForGameBoard() {
  console.log('Verificando referências a GameBoard...');
  
  const srcDir = path.join(__dirname, 'src');
  
  // Verificar se há um arquivo GameBoard.jsx que não deveria existir
  const gameBoardPath = path.join(srcDir, 'components', 'GameBoard.jsx');
  if (fs.existsSync(gameBoardPath)) {
    console.log('GameBoard.jsx encontrado. Este arquivo não deveria existir e pode causar problemas.');
    
    // Renomear para backup
    fs.renameSync(gameBoardPath, `${gameBoardPath}.bak`);
    console.log('GameBoard.jsx renomeado para GameBoard.jsx.bak');
  }
  
  // Verificar se há referências ao GameBoard em App.jsx
  const appPath = path.join(srcDir, 'App.jsx');
  if (fs.existsSync(appPath)) {
    let appContent = fs.readFileSync(appPath, 'utf8');
    
    if (appContent.includes('import GameBoard')) {
      console.log('Encontrada referência a GameBoard em App.jsx. Corrigindo...');
      
      // Remover a importação
      appContent = appContent.replace(/import\s+GameBoard\s+from\s+['"]\.\/components\/GameBoard['"];?\n?/g, '');
      
      // Escrever o conteúdo corrigido de volta no arquivo
      fs.writeFileSync(appPath, appContent);
      
      console.log('App.jsx corrigido.');
    }
  }
  
  console.log('Verificação concluída.');
}

// Executar a função principal
fixAuthService().then(() => {
  console.log('Processo de correção concluído!');
}); 