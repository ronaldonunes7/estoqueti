@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   🚀 Sistema de Inventário TI - INICIANDO...                  ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js NÃO encontrado!
    echo.
    echo 📥 Execute primeiro: INSTALAR.bat
    echo.
    pause
    exit /b 1
)

REM Verificar se dependências estão instaladas
if not exist node_modules (
    echo ❌ Dependências NÃO instaladas!
    echo.
    echo 📥 Execute primeiro: INSTALAR.bat
    echo.
    pause
    exit /b 1
)

if not exist client\node_modules (
    echo ❌ Dependências do frontend NÃO instaladas!
    echo.
    echo 📥 Execute primeiro: INSTALAR.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Verificações concluídas!
echo.
echo 🌐 Iniciando servidor...
echo.
echo    Backend:  http://localhost:3001
echo    Frontend: http://localhost:5173
echo.
echo 👤 Credenciais:
echo    Usuário: admin
echo    Senha: admin123
echo.
echo ⚠️  Para PARAR o servidor: Pressione Ctrl+C
echo.
echo ════════════════════════════════════════════════════════════════
echo.

REM Iniciar o sistema
npm run dev
