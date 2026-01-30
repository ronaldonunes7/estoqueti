# ============================================================================
# Script de Instalação Automatizada - Sistema de Inventário TI
# Ambiente: Windows Server
# Versão: 1.0.0
# ============================================================================

param(
    [string]$InstallPath = "C:\apps\inventario-ti",
    [string]$LogPath = "C:\logs\inventario-ti",
    [string]$BackupPath = "C:\backup\inventario-ti",
    [switch]$SkipNodeCheck,
    [switch]$SkipBuild,
    [switch]$Force
)

# Configurações
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Cores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

# Função para log com timestamp
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Função para verificar se está rodando como administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Função para verificar se um comando existe
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Função para criar diretórios
function New-DirectoryIfNotExists {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        Write-Log "Criando diretório: $Path" $Blue
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

# Início do script
Write-Log "============================================================================" $Blue
Write-Log "INSTALAÇÃO DO SISTEMA DE INVENTÁRIO TI - WINDOWS SERVER" $Blue
Write-Log "============================================================================" $Blue

# Verificar se está rodando como administrador
if (-not (Test-Administrator)) {
    Write-Log "ERRO: Este script deve ser executado como Administrador!" $Red
    Write-Log "Clique com o botão direito no PowerShell e selecione 'Executar como administrador'" $Yellow
    exit 1
}

Write-Log "✓ Executando como Administrador" $Green

try {
    # 1. Verificar Node.js e NPM
    Write-Log "============================================================================" $Blue
    Write-Log "1. VERIFICANDO PRÉ-REQUISITOS" $Blue
    Write-Log "============================================================================" $Blue

    if (-not $SkipNodeCheck) {
        if (-not (Test-Command "node")) {
            Write-Log "ERRO: Node.js não está instalado!" $Red
            Write-Log "Baixe e instale o Node.js LTS de: https://nodejs.org/" $Yellow
            Write-Log "Versão recomendada: 18.x ou superior" $Yellow
            exit 1
        }

        $nodeVersion = node --version
        Write-Log "✓ Node.js encontrado: $nodeVersion" $Green

        if (-not (Test-Command "npm")) {
            Write-Log "ERRO: NPM não está instalado!" $Red
            exit 1
        }

        $npmVersion = npm --version
        Write-Log "✓ NPM encontrado: v$npmVersion" $Green
    }

    # 2. Criar diretórios necessários
    Write-Log "============================================================================" $Blue
    Write-Log "2. CRIANDO ESTRUTURA DE DIRETÓRIOS" $Blue
    Write-Log "============================================================================" $Blue

    New-DirectoryIfNotExists $InstallPath
    New-DirectoryIfNotExists $LogPath
    New-DirectoryIfNotExists $BackupPath
    New-DirectoryIfNotExists "$BackupPath\database"
    New-DirectoryIfNotExists "$LogPath\archive"

    Write-Log "✓ Estrutura de diretórios criada" $Green

    # 3. Instalar dependências globais
    Write-Log "============================================================================" $Blue
    Write-Log "3. INSTALANDO DEPENDÊNCIAS GLOBAIS" $Blue
    Write-Log "============================================================================" $Blue

    $globalPackages = @("pm2", "pm2-windows-startup")
    
    foreach ($package in $globalPackages) {
        Write-Log "Instalando $package..." $Blue
        try {
            npm install -g $package --silent
            Write-Log "✓ $package instalado com sucesso" $Green
        }
        catch {
            Write-Log "ERRO ao instalar $package: $_" $Red
            throw
        }
    }

    # 4. Copiar arquivos do projeto (se não estiver no diretório correto)
    Write-Log "============================================================================" $Blue
    Write-Log "4. CONFIGURANDO PROJETO" $Blue
    Write-Log "============================================================================" $Blue

    $currentPath = Get-Location
    if ($currentPath.Path -ne $InstallPath) {
        Write-Log "Copiando arquivos para $InstallPath..." $Blue
        
        if ($Force -and (Test-Path $InstallPath)) {
            Remove-Item "$InstallPath\*" -Recurse -Force
        }
        
        Copy-Item -Path "$currentPath\*" -Destination $InstallPath -Recurse -Force
        Set-Location $InstallPath
        Write-Log "✓ Arquivos copiados para $InstallPath" $Green
    }

    # 5. Instalar dependências do projeto
    Write-Log "============================================================================" $Blue
    Write-Log "5. INSTALANDO DEPENDÊNCIAS DO PROJETO" $Blue
    Write-Log "============================================================================" $Blue

    Write-Log "Instalando dependências do backend..." $Blue
    npm install --production --silent

    Write-Log "Instalando dependências do frontend..." $Blue
    Set-Location "client"
    npm install --silent
    Set-Location ".."

    Write-Log "✓ Dependências instaladas" $Green

    # 6. Build do projeto
    if (-not $SkipBuild) {
        Write-Log "============================================================================" $Blue
        Write-Log "6. FAZENDO BUILD DO PROJETO" $Blue
        Write-Log "============================================================================" $Blue

        Write-Log "Fazendo build do frontend..." $Blue
        Set-Location "client"
        npm run build
        Set-Location ".."

        Write-Log "✓ Build concluído" $Green
    }

    # 7. Configurar arquivo de ambiente
    Write-Log "============================================================================" $Blue
    Write-Log "7. CONFIGURANDO AMBIENTE DE PRODUÇÃO" $Blue
    Write-Log "============================================================================" $Blue

    if (Test-Path ".env.production") {
        if (-not (Test-Path ".env") -or $Force) {
            Copy-Item ".env.production" ".env"
            Write-Log "✓ Arquivo .env criado a partir do .env.production" $Green
        }
        else {
            Write-Log "! Arquivo .env já existe. Use -Force para sobrescrever" $Yellow
        }
    }

    # Atualizar caminhos no .env
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace "C:\\logs\\inventario-ti", $LogPath
    $envContent = $envContent -replace "C:\\backup\\inventario-ti", $BackupPath
    Set-Content ".env" $envContent

    Write-Log "✓ Variáveis de ambiente configuradas" $Green

    # 8. Configurar PM2
    Write-Log "============================================================================" $Blue
    Write-Log "8. CONFIGURANDO PM2" $Blue
    Write-Log "============================================================================" $Blue

    # Parar processos existentes (se houver)
    try {
        pm2 stop all 2>$null
        pm2 delete all 2>$null
    }
    catch {
        # Ignorar erros se não houver processos
    }

    # Atualizar caminhos no ecosystem.config.js
    $ecosystemContent = Get-Content "ecosystem.config.js" -Raw
    $ecosystemContent = $ecosystemContent -replace "C:\\logs\\inventario-ti", $LogPath
    Set-Content "ecosystem.config.js" $ecosystemContent

    # Iniciar aplicação
    Write-Log "Iniciando aplicação com PM2..." $Blue
    pm2 start ecosystem.config.js --env production

    # Salvar configuração do PM2
    pm2 save

    Write-Log "✓ PM2 configurado e aplicação iniciada" $Green

    # 9. Configurar inicialização automática
    Write-Log "============================================================================" $Blue
    Write-Log "9. CONFIGURANDO INICIALIZAÇÃO AUTOMÁTICA" $Blue
    Write-Log "============================================================================" $Blue

    try {
        pm2-startup install
        Write-Log "✓ Inicialização automática configurada" $Green
    }
    catch {
        Write-Log "! Aviso: Não foi possível configurar inicialização automática automaticamente" $Yellow
        Write-Log "Execute manualmente: pm2-startup install" $Yellow
    }

    # 10. Configurar rotação de logs
    Write-Log "============================================================================" $Blue
    Write-Log "10. CONFIGURANDO ROTAÇÃO DE LOGS" $Blue
    Write-Log "============================================================================" $Blue

    try {
        pm2 install pm2-logrotate
        pm2 set pm2-logrotate:max_size 10M
        pm2 set pm2-logrotate:retain 30
        pm2 set pm2-logrotate:compress true
        pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
        pm2 set pm2-logrotate:workerInterval 30
        pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
        Write-Log "✓ Rotação de logs configurada" $Green
    }
    catch {
        Write-Log "! Aviso: Não foi possível configurar rotação de logs" $Yellow
    }

    # 11. Criar script de backup
    Write-Log "============================================================================" $Blue
    Write-Log "11. CRIANDO SCRIPT DE BACKUP" $Blue
    Write-Log "============================================================================" $Blue

    $backupScript = @"
# Script de Backup Automático - Sistema de Inventário TI
`$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
`$backupFile = "$BackupPath\database\database_`$timestamp.sqlite"
`$sourceFile = "$InstallPath\database.sqlite"

if (Test-Path `$sourceFile) {
    Copy-Item `$sourceFile `$backupFile
    Write-Host "Backup criado: `$backupFile"
    
    # Limpar backups antigos (manter apenas 30 dias)
    Get-ChildItem "$BackupPath\database" -Filter "*.sqlite" | 
        Where-Object { `$_.CreationTime -lt (Get-Date).AddDays(-30) } | 
        Remove-Item -Force
}
"@

    Set-Content "$InstallPath\backup-database.ps1" $backupScript
    Write-Log "✓ Script de backup criado em: $InstallPath\backup-database.ps1" $Green

    # 12. Verificar status final
    Write-Log "============================================================================" $Blue
    Write-Log "12. VERIFICAÇÃO FINAL" $Blue
    Write-Log "============================================================================" $Blue

    Start-Sleep 5
    $status = pm2 status --no-color
    Write-Log "Status dos processos PM2:" $Blue
    Write-Host $status

    # Testar endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 10
        Write-Log "✓ API respondendo corretamente" $Green
        Write-Log "Resposta: $($response.message)" $Blue
    }
    catch {
        Write-Log "! Aviso: API não está respondendo ainda. Aguarde alguns segundos." $Yellow
    }

    # Sucesso!
    Write-Log "============================================================================" $Green
    Write-Log "✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!" $Green
    Write-Log "============================================================================" $Green
    Write-Log ""
    Write-Log "📍 INFORMAÇÕES IMPORTANTES:" $Blue
    Write-Log "   • Aplicação instalada em: $InstallPath" $Blue
    Write-Log "   • Logs salvos em: $LogPath" $Blue
    Write-Log "   • Backups em: $BackupPath" $Blue
    Write-Log "   • URL da aplicação: http://localhost:3001" $Blue
    Write-Log "   • Frontend (se aplicável): http://localhost:5173" $Blue
    Write-Log ""
    Write-Log "🔧 COMANDOS ÚTEIS:" $Blue
    Write-Log "   • Ver status: pm2 status" $Blue
    Write-Log "   • Ver logs: pm2 logs" $Blue
    Write-Log "   • Reiniciar: pm2 restart inventario-ti-api" $Blue
    Write-Log "   • Parar: pm2 stop inventario-ti-api" $Blue
    Write-Log "   • Backup manual: .\backup-database.ps1" $Blue
    Write-Log ""
    Write-Log "⚠️  PRÓXIMOS PASSOS:" $Yellow
    Write-Log "   1. Altere a JWT_SECRET no arquivo .env" $Yellow
    Write-Log "   2. Configure o firewall para a porta 3001" $Yellow
    Write-Log "   3. Configure backup automático (Agendador de Tarefas)" $Yellow
    Write-Log "   4. Teste todas as funcionalidades" $Yellow
    Write-Log ""

}
catch {
    Write-Log "============================================================================" $Red
    Write-Log "❌ ERRO DURANTE A INSTALAÇÃO" $Red
    Write-Log "============================================================================" $Red
    Write-Log "Erro: $_" $Red
    Write-Log ""
    Write-Log "Para suporte, verifique:" $Yellow
    Write-Log "• Se está executando como Administrador" $Yellow
    Write-Log "• Se o Node.js está instalado corretamente" $Yellow
    Write-Log "• Se há espaço suficiente em disco" $Yellow
    Write-Log "• Se não há antivírus bloqueando a instalação" $Yellow
    exit 1
}

Write-Log "Pressione qualquer tecla para continuar..." $Blue
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")