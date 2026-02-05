@echo off
echo Criando insumo "teclado"...

REM Fazer login e obter token
echo Fazendo login...
curl -s -X POST -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" http://localhost:3001/api/auth/login > login_response.json

REM Extrair token (método simples para Windows)
for /f "tokens=2 delims=:" %%a in ('findstr "token" login_response.json') do (
    set "token_part=%%a"
)

REM Limpar aspas e vírgulas do token
set "token_part=%token_part:"=%"
set "token_part=%token_part:,=%"
set "token_part=%token_part: =%"

echo Token obtido: %token_part%

REM Criar o insumo teclado
echo Criando insumo teclado...
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer %token_part%" -d "{\"name\":\"teclado\",\"brand_model\":\"Teclado ABNT2 USB\",\"category\":\"Insumos\",\"status\":\"Disponível\",\"asset_type\":\"consumable\",\"stock_quantity\":0,\"min_stock\":5,\"purchase_value\":120.00,\"barcode\":\"7891234567896\"}" http://localhost:3001/api/assets

REM Limpar arquivo temporário
del login_response.json

echo.
echo Insumo "teclado" criado com sucesso!
echo Agora você pode adicionar saldo a este insumo.
pause