# ============================================================================
# Script de Configuração de Logs Avançados
# Sistema de Inventário TI - Windows Server
# ============================================================================

param(
    [string]$LogPath = "C:\logs\inventario-ti",
    [int]$RetentionDays = 30,
    [string]$MaxLogSize = "10M"
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

Write-Log "Configurando sistema de logs avançado..." "Cyan"

# Criar estrutura de diretórios de logs
$logDirs = @(
    "$LogPath",
    "$LogPath\api",
    "$LogPath\archive",
    "$LogPath\system",
    "$LogPath\backup"
)

foreach ($dir in $logDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Log "Diretório criado: $dir" "Green"
    }
}

# Configurar PM2 Log Rotate
Write-Log "Configurando rotação de logs do PM2..." "Blue"

try {
    # Instalar pm2-logrotate se não estiver instalado
    $logrotateInstalled = pm2 list | Select-String "pm2-logrotate"
    if (-not $logrotateInstalled) {
        pm2 install pm2-logrotate
    }

    # Configurar parâmetros de rotação
    pm2 set pm2-logrotate:max_size $MaxLogSize
    pm2 set pm2-logrotate:retain $RetentionDays
    pm2 set pm2-logrotate:compress true
    pm2 set pm2-logrotate:dateFormat "YYYY-MM-DD_HH-mm-ss"
    pm2 set pm2-logrotate:workerInterval 30
    pm2 set pm2-logrotate:rotateInterval "0 0 * * *"  # Diariamente à meia-noite
    pm2 set pm2-logrotate:rotateModule true

    Write-Log "✓ PM2 Log Rotate configurado" "Green"
}
catch {
    Write-Log "Erro ao configurar PM2 Log Rotate: $_" "Red"
}

# Criar script de limpeza de logs
$cleanupScript = @"
# Script de Limpeza de Logs - Sistema de Inventário TI
# Executa limpeza automática de logs antigos

param(
    [int]`$RetentionDays = $RetentionDays,
    [string]`$LogPath = "$LogPath"
)

`$cutoffDate = (Get-Date).AddDays(-`$RetentionDays)
`$totalCleaned = 0
`$totalSize = 0

Write-Host "Iniciando limpeza de logs anteriores a `$(`$cutoffDate.ToString('yyyy-MM-dd'))"

# Limpar logs do PM2
Get-ChildItem "`$LogPath" -Recurse -File | Where-Object {
    `$_.CreationTime -lt `$cutoffDate -and 
    (`$_.Extension -eq '.log' -or `$_.Extension -eq '.gz')
} | ForEach-Object {
    `$totalSize += `$_.Length
    `$totalCleaned++
    Write-Host "Removendo: `$(`$_.FullName)"
    Remove-Item `$_.FullName -Force
}

# Limpar logs do sistema
Get-ChildItem "`$LogPath\system" -File | Where-Object {
    `$_.CreationTime -lt `$cutoffDate
} | ForEach-Object {
    `$totalSize += `$_.Length
    `$totalCleaned++
    Remove-Item `$_.FullName -Force
}

`$sizeMB = [math]::Round(`$totalSize / 1MB, 2)
Write-Host "Limpeza concluída: `$totalCleaned arquivos removidos (`$sizeMB MB liberados)"

# Log da operação
`$logEntry = "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Limpeza: `$totalCleaned arquivos, `$sizeMB MB"
Add-Content "`$LogPath\system\cleanup.log" `$logEntry
"@

Set-Content "$LogPath\cleanup-logs.ps1" $cleanupScript
Write-Log "✓ Script de limpeza criado: $LogPath\cleanup-logs.ps1" "Green"

# Criar script de monitoramento de logs
$monitorScript = @"
# Script de Monitoramento de Logs - Sistema de Inventário TI
# Monitora tamanho e crescimento dos logs

param(
    [string]`$LogPath = "$LogPath",
    [int]`$WarningThresholdMB = 100,
    [int]`$CriticalThresholdMB = 500
)

function Get-DirectorySize {
    param([string]`$Path)
    if (Test-Path `$Path) {
        return (Get-ChildItem `$Path -Recurse -File | Measure-Object -Property Length -Sum).Sum
    }
    return 0
}

`$totalSize = Get-DirectorySize `$LogPath
`$sizeMB = [math]::Round(`$totalSize / 1MB, 2)

`$status = "OK"
`$color = "Green"

if (`$sizeMB -gt `$CriticalThresholdMB) {
    `$status = "CRITICAL"
    `$color = "Red"
} elseif (`$sizeMB -gt `$WarningThresholdMB) {
    `$status = "WARNING"
    `$color = "Yellow"
}

Write-Host "Status dos Logs: `$status - Tamanho total: `$sizeMB MB" -ForegroundColor `$color

# Detalhes por diretório
Get-ChildItem `$LogPath -Directory | ForEach-Object {
    `$dirSize = Get-DirectorySize `$_.FullName
    `$dirSizeMB = [math]::Round(`$dirSize / 1MB, 2)
    Write-Host "  `$(`$_.Name): `$dirSizeMB MB"
}

# Log do monitoramento
`$logEntry = "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Status: `$status, Tamanho: `$sizeMB MB"
Add-Content "`$LogPath\system\monitor.log" `$logEntry

return @{
    Status = `$status
    SizeMB = `$sizeMB
    Path = `$LogPath
}
"@

Set-Content "$LogPath\monitor-logs.ps1" $monitorScript
Write-Log "✓ Script de monitoramento criado: $LogPath\monitor-logs.ps1" "Green"

# Criar configuração de logs para o Winston (Node.js)
$winstonConfig = @"
// Configuração de Logs para Produção - Winston
// Adicione este código ao seu servidor Node.js

const winston = require('winston');
const path = require('path');

const logDir = '$($LogPath.Replace('\', '\\'))';

// Configuração do Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'inventario-ti-api' },
  transports: [
    // Log de erros
    new winston.transports.File({
      filename: path.join(logDir, 'api', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Log combinado
    new winston.transports.File({
      filename: path.join(logDir, 'api', 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Log de auditoria
    new winston.transports.File({
      filename: path.join(logDir, 'api', 'audit.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 30,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `[`${timestamp}`] `${level.toUpperCase()}: `${message} `${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    })
  ]
});

// Em desenvolvimento, também log no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
"@

Set-Content "$LogPath\winston-config.js" $winstonConfig
Write-Log "✓ Configuração do Winston criada: $LogPath\winston-config.js" "Green"

# Criar tarefa agendada para limpeza automática
Write-Log "Configurando tarefa agendada para limpeza de logs..." "Blue"

$taskName = "InventarioTI-LogCleanup"
$taskExists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($taskExists) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$LogPath\cleanup-logs.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At "02:00AM"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Limpeza automática de logs do Sistema de Inventário TI"

Write-Log "✓ Tarefa agendada criada: $taskName" "Green"

Write-Log "============================================================================" "Green"
Write-Log "✅ CONFIGURAÇÃO DE LOGS CONCLUÍDA!" "Green"
Write-Log "============================================================================" "Green"
Write-Log ""
Write-Log "📁 Estrutura de logs criada em: $LogPath" "Blue"
Write-Log "🔄 Rotação configurada: $MaxLogSize por arquivo, $RetentionDays dias de retenção" "Blue"
Write-Log "⏰ Limpeza automática: Diariamente às 02:00" "Blue"
Write-Log ""
Write-Log "🔧 Scripts disponíveis:" "Blue"
Write-Log "   • Limpeza manual: $LogPath\cleanup-logs.ps1" "Blue"
Write-Log "   • Monitoramento: $LogPath\monitor-logs.ps1" "Blue"
Write-Log "   • Config Winston: $LogPath\winston-config.js" "Blue"
Write-Log ""