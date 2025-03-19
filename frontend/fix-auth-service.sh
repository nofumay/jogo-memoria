#!/bin/bash

# Script para corrigir o erro no AuthService.js

# Caminho para o arquivo
FILE_PATH="src/services/AuthService.js"

# Verificar se o arquivo existe
if [ ! -f "$FILE_PATH" ]; then
    echo "Arquivo $FILE_PATH não encontrado!"
    exit 1
fi

# Verificar se há um problema com import duplicado
if grep -q "export default AuthService;import" "$FILE_PATH"; then
    echo "Encontrado problema de sintaxe no $FILE_PATH. Corrigindo..."
    
    # Corrija o arquivo substituindo a linha problemática
    sed -i 's/export default AuthService;import localStorageService from/export default AuthService;/' "$FILE_PATH"
    
    echo "Arquivo corrigido com sucesso!"
else
    echo "Nenhum problema encontrado no arquivo $FILE_PATH"
fi

echo "Pronto!" 