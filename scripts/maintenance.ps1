# ============================================================================
# Scripts de Manutenção - Sistema de Inventário TI
# Windows Server - Operações de manutenção automatizadas
# ============================================================================

param(
    [string]$Action = "status",
    [string]$InstallPath = "C:\apps\inventario-ti",
    [string]$LogPath = "C:\logs\inventario-ti",
    [string]$BackupPath = "C:\backup\inventario-ti"
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Show-Help {
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host "SISTEMA DE INVENTÁRIO TI - SCRIPTS DE MANUTENÇÃO" -ForegroundColor Cyan
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USO: .\maintenance.ps1 -Action <acao>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "AÇÕES DISPONÍVEIS:" -ForegroundColor Green
    Write-Host "  status      - Mostra status completo do sistema" -ForegroundColor White
    Write-Host "  start       - Inicia todos os serviços" -ForegroundColor White
    Write-Host "  stop        - Para todos os serviços" -ForegroundColor White
    Write-Host "  restart     - Reinicia todos os serviços" -ForegroundColor White
    Write-Host "  backup      - Faz backup do banco de dados" -ForegroundColor White
    Write-Host "  restore     - Restaura backup do banco (interativo)" -ForegroundColor White
    Write-Host "  update      - Atualiza o sistema (git pull + build)" -ForegroundColor White
    Write-Host "  health      - Verifica saúde do sistema" -ForegroundColor White
    Write-Host "  logs        - Mostra logs em tempo real" -ForegroundColor White
    Write-Host "  cleanup     - Limpa logs e arquivos temporários" -ForegroundColor White
    Write-Host "  monitor     - Monitoramento contínuo (Ctrl+C para sair)" -ForegroundColor White
    Write-Host ""
    Write-Host "EXEMPLOS:" -ForegroundColor Green
    Write-Host "  .\maintenance.ps1 -Action status" -ForegroundColor Gray
    Write-Host "  .\maintenance.ps1 -Action backup" -ForegroundColor Gray
    Write-Host "  .\maintenance.ps1 -Action restart" -ForegroundColor Gray
    Write-Host ""
}

function Get-SystemStatus {
    Write-Log "============================================================================" "Cyan"
    Write-Log "STATUS DO SISTEMA DE INVENTÁRIO TI" "Cyan"
    Write-Log "============================================================================" "Cyan"
    
    # Status do PM2
    Write-Log "📊 STATUS DOS PROCESSOS PM2:" "Blue"
    try {
        pm2 status
        Write-Log "✓ PM2 respondendo" "Green"
    }
    catch {
        Write-Log "❌ Erro ao acessar PM2: $_" "Red"
    }
    
    # Status da API
    Write-Log "`n🌐 STATUS DA API:" "Blue"
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
        Write-Log "✓ API respondendo: $($response.message)" "Green"
        Write-Log "   Timestamp: $($response.timestamp)" "Gray"
    }
    catch {
        Write-Log "❌ API não está respondendo: $_" "Red"
    }
    
    # Uso de recursos
    Write-Log "`n💻 USO DE RECURSOS:" "Blue"
    $cpu = Get-Counter "\Processor(_Total)\% Processor Time" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    $memory = Get-Counter "\Memory\Available MBytes" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
    $totalMemory = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB
    $usedMemory = $totalMemory - $memory
    $memoryPercent = ($usedMemory / $totalMemory) * 100
    
    Write-Log "   CPU: $([math]::Round($cpu, 1))%" "White"
    Write-Log "   Memória: $([math]::Round($memoryPercent, 1))% ($([math]::Round($usedMemory, 0)) MB / $([math]::Round($totalMemory, 0)) MB)" "White"
    
    # Espaço em disco
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Where-Object { $_.DeviceID -eq "C:" }
    $diskUsedPercent = (($disk.Size - $disk.FreeSpace) / $disk.Size) * 100
    Write-Log "   Disco C:: $([math]::Round($diskUsedPercent, 1))% usado ($([math]::Round($disk.FreeSpace / 1GB, 1)) GB livres)" "White"
    
    # Tamanho dos logs
    if (Test-Path $LogPath) {
        $logSize = (Get-ChildItem $LogPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Log "   Logs: $([math]::Round($logSize, 1)) MB" "White"
    }
    
    # Tamanho do banco
    $dbPath = "$InstallPath\database.sqlite"
    if (Test-Path $dbPath) {
        $dbSize = (Get-Item $dbPath).Length / 1MB
        Write-Log "   Banco de dados: $([math]::Round($dbSize, 1)) MB" "White"
    }
    
    Write-Log "`n⏰ UPTIME:" "Blue"
    $uptime = (Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
    Write-Log "   Sistema: $($uptime.Days) dias, $($uptime.Hours) horas, $($uptime.Minutes) minutos" "White"
}

function Start-Services {
    Write-Log "Iniciando serviços..." "Blue"
    try {
        Set-Location $InstallPath
        pm2 start ecosystem.config.js --env production
        pm2 save
        Write-Log "✓ Serviços iniciados" "Green"
    }
    catch {
        Write-Log "❌ Erro ao iniciar serviços: $_" "Red"
    }
}

function Stop-Services {
    Write-Log "Parando serviços..." "Blue"
    try {
        pm2 stop all
        Write-Log "✓ Serviços parados" "Green"
    }
    catch {
        Write-Log "❌ Erro ao parar serviços: $_" "Red"
    }
}

function Restart-Services {
    Write-Log "Reiniciando serviços..." "Blue"
    try {
        pm2 restart all
        Start-Sleep 5
        Write-Log "✓ Serviços reiniciados" "Green"
        
        # Verificar se a API voltou
        $retries = 0
        do {
            Start-Sleep 2
            try {
                $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 3
                Write-Log "✓ API respondendo novamente" "Green"
                break
            }
            catch {
                $retries++
                Write-Log "Aguardando API responder... ($retries/10)" "Yellow"
            }
        } while ($retries -lt 10)
    }
    catch {
        Write-Log "❌ Erro ao reiniciar serviços: $_" "Red"
    }
}

function Backup-Database {
    Write-Log "Fazendo backup do banco de dados..." "Blue"
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupFile = "$BackupPath\database\database_$timestamp.sqlite"
    $sourceFile = "$InstallPath\database.sqlite"
    
    if (-not (Test-Path $BackupPath\database)) {
        New-Item -ItemType Directory -Path "$BackupPath\database" -Force | Out-Null
    }
    
    if (Test-Path $sourceFile) {
        try {
            Copy-Item $sourceFile $backupFile
            $size = (Get-Item $backupFile).Length / 1MB
            Write-Log "✓ Backup criado: $backupFile ($([math]::Round($size, 1)) MB)" "Green"
            
            # Limpar backups antigos (manter apenas 30)
            $oldBackups = Get-ChildItem "$BackupPath\database" -Filter "*.sqlite" | Sort-Object CreationTime -Descending | Select-Object -Skip 30
            if ($oldBackups) {
                $oldBackups | Remove-Item -Force
                Write-Log "✓ $($oldBackups.Count) backups antigos removidos" "Green"
            }
        }
        catch {
            Write-Log "❌ Erro ao criar backup: $_" "Red"
        }
    }
    else {
        Write-Log "❌ Arquivo do banco não encontrado: $sourceFile" "Red"
    }
}

function Restore-Database {
    Write-Log "Listando backups disponíveis..." "Blue"
    
    $backups = Get-ChildItem "$BackupPath\database" -Filter "*.sqlite" | Sort-Object CreationTime -Descending
    
    if (-not $backups) {
        Write-Log "❌ Nenhum backup encontrado em $BackupPath\database" "Red"
        return
    }
    
    Write-Log "Backups disponíveis:" "Green"
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $backup = $backups[$i]
        $size = $backup.Length / 1MB
        Write-Log "  [$i] $($backup.Name) - $($backup.CreationTime) ($([math]::Round($size, 1)) MB)" "White"
    }
    
    $selection = Read-Host "Digite o número do backup para restaurar (ou 'c' para cancelar)"
    
    if ($selection -eq 'c') {
        Write-Log "Operação cancelada" "Yellow"
        return
    }
    
    try {
        $selectedBackup = $backups[[int]$selection]
        $sourceFile = "$InstallPath\database.sqlite"
        
        Write-Log "⚠️  ATENÇÃO: Esta operação irá substituir o banco atual!" "Yellow"
        $confirm = Read-Host "Digite 'CONFIRMAR' para continuar"
        
        if ($confirm -eq 'CONFIRMAR') {
            # Parar serviços
            pm2 stop all
            
            # Fazer backup do banco atual
            $currentBackup = "$BackupPath\database\pre-restore_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').sqlite"
            if (Test-Path $sourceFile) {
                Copy-Item $sourceFile $currentBackup
                Write-Log "✓ Backup do banco atual salvo em: $currentBackup" "Green"
            }
            
            # Restaurar backup selecionado
            Copy-Item $selectedBackup.FullName $sourceFile -Force
            Write-Log "✓ Banco restaurado de: $($selectedBackup.Name)" "Green"
            
            # Reiniciar serviços
            pm2 start all
            Write-Log "✓ Serviços reiniciados" "Green"
        }
        else {
            Write-Log "Operação cancelada" "Yellow"
        }
    }
    catch {
        Write-Log "❌ Erro durante restauração: $_" "Red"
    }
}

function Update-System {
    Write-Log "Atualizando sistema..." "Blue"
    
    try {
        Set-Location $InstallPath
        
        # Verificar se é um repositório git
        if (Test-Path ".git") {
            Write-Log "Fazendo pull do repositório..." "Blue"
            git pull origin main
            
            Write-Log "Instalando dependências..." "Blue"
            npm install --production
            
            Set-Location "client"
            npm install
            
            Write-Log "Fazendo build..." "Blue"
            npm run build
            
            Set-Location ".."
            
            Write-Log "Reiniciando serviços..." "Blue"
            pm2 restart all
            
            Write-Log "✓ Sistema atualizado com sucesso" "Green"
        }
        else {
            Write-Log "❌ Não é um repositório git. Atualização manual necessária." "Red"
        }
    }
    catch {
        Write-Log "❌ Erro durante atualização: $_" "Red"
    }
}

function Test-Health {
    Write-Log "Verificando saúde do sistema..." "Blue"
    
    $issues = @()
    
    # Verificar processos PM2
    try {
        $pm2Status = pm2 jlist | ConvertFrom-Json
        $runningProcesses = $pm2Status | Where-Object { $_.pm2_env.status -eq "online" }
        
        if ($runningProcesses.Count -eq 0) {
            $issues += "Nenhum processo PM2 está rodando"
        }
        else {
            Write-Log "✓ $($runningProcesses.Count) processo(s) PM2 rodando" "Green"
        }
    }
    catch {
        $issues += "Erro ao verificar status do PM2: $_"
    }
    
    # Verificar API
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
        Write-Log "✓ API respondendo corretamente" "Green"
    }
    catch {
        $issues += "API não está respondendo: $_"
    }
    
    # Verificar espaço em disco
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Where-Object { $_.DeviceID -eq "C:" }
    $freeSpaceGB = $disk.FreeSpace / 1GB
    if ($freeSpaceGB -lt 1) {
        $issues += "Pouco espaço em disco: apenas $([math]::Round($freeSpaceGB, 1)) GB livres"
    }
    
    # Verificar tamanho dos logs
    if (Test-Path $LogPath) {
        $logSize = (Get-ChildItem $LogPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
        if ($logSize -gt 500) {
            $issues += "Logs muito grandes: $([math]::Round($logSize, 1)) MB"
        }
    }
    
    # Verificar banco de dados
    $dbPath = "$InstallPath\database.sqlite"
    if (-not (Test-Path $dbPath)) {
        $issues += "Arquivo do banco de dados não encontrado: $dbPath"
    }
    
    # Relatório final
    if ($issues.Count -eq 0) {
        Write-Log "✅ Sistema saudável - nenhum problema encontrado" "Green"
    }
    else {
        Write-Log "⚠️  Problemas encontrados:" "Yellow"
        foreach ($issue in $issues) {
            Write-Log "   • $issue" "Red"
        }
    }
}

function Show-Logs {
    Write-Log "Mostrando logs em tempo real (Ctrl+C para sair)..." "Blue"
    try {
        pm2 logs --lines 50
    }
    catch {
        Write-Log "❌ Erro ao mostrar logs: $_" "Red"
    }
}

function Cleanup-System {
    Write-Log "Limpando sistema..." "Blue"
    
    $cleaned = 0
    $totalSize = 0
    
    # Limpar logs antigos
    if (Test-Path "$LogPath\cleanup-logs.ps1") {
        & "$LogPath\cleanup-logs.ps1"
    }
    
    # Limpar cache do npm
    try {
        npm cache clean --force
        Write-Log "✓ Cache do npm limpo" "Green"
    }
    catch {
        Write-Log "! Aviso: Não foi possível limpar cache do npm" "Yellow"
    }
    
    # Limpar arquivos temporários do PM2
    try {
        pm2 flush
        Write-Log "✓ Logs do PM2 limpos" "Green"
    }
    catch {
        Write-Log "! Aviso: Não foi possível limpar logs do PM2" "Yellow"
    }
    
    Write-Log "✓ Limpeza concluída" "Green"
}

function Start-Monitoring {
    Write-Log "Iniciando monitoramento contínuo (Ctrl+C para sair)..." "Blue"
    Write-Log "Atualizando a cada 30 segundos..." "Gray"
    
    try {
        while ($true) {
            Clear-Host
            Get-SystemStatus
            Write-Log "`nPróxima atualização em 30 segundos..." "Gray"
            Start-Sleep 30
        }
    }
    catch {
        Write-Log "`nMonitoramento interrompido" "Yellow"
    }
}

# Execução principal
switch ($Action.ToLower()) {
    "help" { Show-Help }
    "status" { Get-SystemStatus }
    "start" { Start-Services }
    "stop" { Stop-Services }
    "restart" { Restart-Services }
    "backup" { Backup-Database }
    "restore" { Restore-Database }
    "update" { Update-System }
    "health" { Test-Health }
    "logs" { Show-Logs }
    "cleanup" { Cleanup-System }
    "monitor" { Start-Monitoring }
    default { 
        Write-Log "Ação desconhecida: $Action" "Red"
        Write-Log "Use -Action help para ver as opções disponíveis" "Yellow"
    }
}