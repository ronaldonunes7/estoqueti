@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   🚀 INSTALADOR - Sistema de Inventário TI                    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js NÃO está instalado!
    echo.
    echo 📥 Por favor, instale o Node.js primeiro:
    echo    https://nodejs.org/
    echo.
    echo    1. Baixe a versão LTS
    echo    2. Execute o instalador
    echo    3. Marque "Add to PATH"
    echo    4. Reinicie este script
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js encontrado: 
node --version
echo.

REM Verificar se npm está instalado
echo [2/4] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm NÃO está instalado!
    echo    Reinstale o Node.js de: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ npm encontrado: 
npm --version
echo.

REM Verificar se Git está instalado
echo [3/4] Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Git NÃO está instalado (opcional)
    echo    Download: https://git-scm.com/download/win
    echo.
) else (
    echo ✅ Git encontrado: 
    git --version
    echo.
)

REM Instalar dependências
echo [4/4] Instalando dependências do projeto...
echo.
echo 📦 Instalando dependências do BACKEND...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do backend!
    pause
    exit /b 1
)
echo.

echo 📦 Instalando dependências do FRONTEND...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do frontend!
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

REM Criar arquivo .env se não existir
if not exist .env (
    echo 📝 Criando arquivo de configuração .env...
    (
        echo JWT_SECRET=chave-secreta-desenvolvimento-2024
        echo PORT=3001
        echo NODE_ENV=development
    ) > .env
    echo ✅ Arquivo .env criado!
    echo.
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 🎯 Próximos passos:
echo.
echo    1. Execute: INICIAR.bat
echo    2. Aguarde o sistema iniciar
echo    3. Acesse: http://localhost:5173
echo.
echo 👤 Credenciais padrão:
echo    Usuário: admin
echo    Senha: admin123
echo.
pause
