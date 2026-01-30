# ============================================================================
# Health Check Script - Sistema de Inventário TI
# Verificação automática de saúde do sistema para Windows Server
# ============================================================================

param(
    [string]$ConfigFile = "health-check.json",
    [switch]$Detailed,
    [switch]$Json,
    [switch]$Silent,
    [int]$Timeout = 30
)

$ErrorActionPreference = "Continue"

# Configurações padrão
$defaultConfig = @{
    api = @{
        url = "http://localhost:3001/health"
        timeout = 10
        expectedStatus = 200
    }
    pm2 = @{
        expectedProcesses = @("inventario-ti-api")
        minUptime = 60  # segundos
    }
    resources = @{
        maxCpuPercent = 80
        maxMemoryPercent = 85
        minDiskSpaceGB = 2
    }
    logs = @{
        maxSizeMB = 500
        maxErrorsPerHour = 10
    }
    database = @{
        path = "C:\apps\inventario-ti\database.sqlite"
        maxSizeMB = 1000
    }
}

function Write-HealthLog {
    param([string]$Message, [string]$Level = "INFO", [string]$Color = "White")
    
    if (-not $Silent) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $levelColor = switch ($Level) {
            "ERROR" { "Red" }
            "WARN" { "Yellow" }
            "SUCCESS" { "Green" }
            "INFO" { "Cyan" }
            default { $Color }
        }
        Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $levelColor
    }
}

function Test-ApiHealth {
    param($config)
    
    $result = @{
        name = "API Health"
        status = "UNKNOWN"
        message = ""
        details = @{}
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    try {
        Write-HealthLog "Testando API em $($config.url)..." "INFO"
        
        $response = Invoke-RestMethod -Uri $config.url -TimeoutSec $config.timeout -ErrorAction Stop
        
        $result.status = "HEALTHY"
        $result.message = "API respondendo corretamente"
        $result.details = @{
            responseTime = (Measure-Command { Invoke-RestMethod -Uri $config.url -TimeoutSec $config.timeout }).TotalMilliseconds
            message = $response.message
            timestamp = $response.timestamp
        }
        
        Write-HealthLog "✓ API saudável - $($response.message)" "SUCCESS"
    }
    catch {
        $result.status = "UNHEALTHY"
        $result.message = "API não está respondendo: $($_.Exception.Message)"
        $result.details = @{
            error = $_.Exception.Message
            url = $config.url
        }
        
        Write-HealthLog "❌ API com problemas: $($_.Exception.Message)" "ERROR"
    }
    
    return $result
}

function Test-PM2Health {
    param($config)
    
    $result = @{
        name = "PM2 Processes"
        status = "UNKNOWN"
        message = ""
        details = @{}
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    try {
        Write-HealthLog "Verificando processos PM2..." "INFO"
        
        $pm2List = pm2 jlist | ConvertFrom-Json
        $runningProcesses = $pm2List | Where-Object { $_.pm2_env.status -eq "online" }
        
        $processDetails = @{}
        $unhealthyProcesses = @()
        
        foreach ($expectedProcess in $config.expectedProcesses) {
            $process = $runningProcesses | Where-Object { $_.name -eq $expectedProcess }
            
            if ($process) {
                $uptime = $process.pm2_env.pm_uptime
                $uptimeSeconds = ((Get-Date) - [DateTime]::FromFileTime($uptime)).TotalSeconds
                
                $processDetails[$expectedProcess] = @{
                    status = $process.pm2_env.status
                    uptime = $uptimeSeconds
                    memory = $process.monit.memory
                    cpu = $process.monit.cpu
                    restarts = $process.pm2_env.restart_time
                }
                
                if ($uptimeSeconds -lt $config.minUptime) {
                    $unhealthyProcesses += "$expectedProcess (uptime: $([math]::Round($uptimeSeconds, 0))s)"
                }
                
                Write-HealthLog "✓ Processo $expectedProcess: online (uptime: $([math]::Round($uptimeSeconds, 0))s)" "SUCCESS"
            }
            else {
                $unhealthyProcesses += "$expectedProcess (não encontrado)"
                Write-HealthLog "❌ Processo $expectedProcess não está rodando" "ERROR"
            }
        }
        
        if ($unhealthyProcesses.Count -eq 0) {
            $result.status = "HEALTHY"
            $result.message = "Todos os processos PM2 estão saudáveis"
        }
        else {
            $result.status = "UNHEALTHY"
            $result.message = "Processos com problemas: $($unhealthyProcesses -join ', ')"
        }
        
        $result.details = @{
            totalProcesses = $runningProcesses.Count
            expectedProcesses = $config.expectedProcesses.Count
            processDetails = $processDetails
            unhealthyProcesses = $unhealthyProcesses
        }
    }
    catch {
        $result.status = "UNHEALTHY"
        $result.message = "Erro ao verificar PM2: $($_.Exception.Message)"
        $result.details = @{
            error = $_.Exception.Message
        }
        
        Write-HealthLog "❌ Erro ao verificar PM2: $($_.Exception.Message)" "ERROR"
    }
    
    return $result
}

function Test-ResourceHealth {
    param($config)
    
    $result = @{
        name = "System Resources"
        status = "UNKNOWN"
        message = ""
        details = @{}
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    try {
        Write-HealthLog "Verificando recursos do sistema..." "INFO"
        
        # CPU
        $cpu = Get-Counter "\Processor(_Total)\% Processor Time" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
        
        # Memória
        $memory = Get-Counter "\Memory\Available MBytes" | Select-Object -ExpandProperty CounterSamples | Select-Object -ExpandProperty CookedValue
        $totalMemory = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB
        $usedMemory = $totalMemory - $memory
        $memoryPercent = ($usedMemory / $totalMemory) * 100
        
        # Disco
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Where-Object { $_.DeviceID -eq "C:" }
        $freeSpaceGB = $disk.FreeSpace / 1GB
        $diskUsedPercent = (($disk.Size - $disk.FreeSpace) / $disk.Size) * 100
        
        $result.details = @{
            cpu = @{
                percent = [math]::Round($cpu, 1)
                threshold = $config.maxCpuPercent
                status = if ($cpu -gt $config.maxCpuPercent) { "HIGH" } else { "OK" }
            }
            memory = @{
                percent = [math]::Round($memoryPercent, 1)
                usedMB = [math]::Round($usedMemory, 0)
                totalMB = [math]::Round($totalMemory, 0)
                threshold = $config.maxMemoryPercent
                status = if ($memoryPercent -gt $config.maxMemoryPercent) { "HIGH" } else { "OK" }
            }
            disk = @{
                freeGB = [math]::Round($freeSpaceGB, 1)
                usedPercent = [math]::Round($diskUsedPercent, 1)
                threshold = $config.minDiskSpaceGB
                status = if ($freeSpaceGB -lt $config.minDiskSpaceGB) { "LOW" } else { "OK" }
            }
        }
        
        $issues = @()
        if ($cpu -gt $config.maxCpuPercent) { $issues += "CPU alto ($([math]::Round($cpu, 1))%)" }
        if ($memoryPercent -gt $config.maxMemoryPercent) { $issues += "Memória alta ($([math]::Round($memoryPercent, 1))%)" }
        if ($freeSpaceGB -lt $config.minDiskSpaceGB) { $issues += "Pouco espaço em disco ($([math]::Round($freeSpaceGB, 1)) GB)" }
        
        if ($issues.Count -eq 0) {
            $result.status = "HEALTHY"
            $result.message = "Recursos do sistema dentro dos limites"
            Write-HealthLog "✓ Recursos OK - CPU: $([math]::Round($cpu, 1))%, Mem: $([math]::Round($memoryPercent, 1))%, Disco: $([math]::Round($freeSpaceGB, 1))GB livres" "SUCCESS"
        }
        else {
            $result.status = "UNHEALTHY"
            $result.message = "Problemas de recursos: $($issues -join ', ')"
            Write-HealthLog "⚠️  Recursos com problemas: $($issues -join ', ')" "WARN"
        }
    }
    catch {
        $result.status = "UNHEALTHY"
        $result.message = "Erro ao verificar recursos: $($_.Exception.Message)"
        $result.details = @{
            error = $_.Exception.Message
        }
        
        Write-HealthLog "❌ Erro ao verificar recursos: $($_.Exception.Message)" "ERROR"
    }
    
    return $result
}

function Test-DatabaseHealth {
    param($config)
    
    $result = @{
        name = "Database"
        status = "UNKNOWN"
        message = ""
        details = @{}
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    try {
        Write-HealthLog "Verificando banco de dados..." "INFO"
        
        if (Test-Path $config.path) {
            $dbFile = Get-Item $config.path
            $sizeMB = $dbFile.Length / 1MB
            
            $result.details = @{
                path = $config.path
                sizeMB = [math]::Round($sizeMB, 1)
                lastModified = $dbFile.LastWriteTime
                maxSizeMB = $config.maxSizeMB
            }
            
            if ($sizeMB -gt $config.maxSizeMB) {
                $result.status = "UNHEALTHY"
                $result.message = "Banco de dados muito grande: $([math]::Round($sizeMB, 1)) MB"
                Write-HealthLog "⚠️  Banco grande: $([math]::Round($sizeMB, 1)) MB" "WARN"
            }
            else {
                $result.status = "HEALTHY"
                $result.message = "Banco de dados OK"
                Write-HealthLog "✓ Banco OK - $([math]::Round($sizeMB, 1)) MB" "SUCCESS"
            }
        }
        else {
            $result.status = "UNHEALTHY"
            $result.message = "Arquivo do banco não encontrado: $($config.path)"
            $result.details = @{
                path = $config.path
                exists = $false
            }
            Write-HealthLog "❌ Banco não encontrado: $($config.path)" "ERROR"
        }
    }
    catch {
        $result.status = "UNHEALTHY"
        $result.message = "Erro ao verificar banco: $($_.Exception.Message)"
        $result.details = @{
            error = $_.Exception.Message
            path = $config.path
        }
        
        Write-HealthLog "❌ Erro ao verificar banco: $($_.Exception.Message)" "ERROR"
    }
    
    return $result
}

function Test-LogHealth {
    param($config)
    
    $result = @{
        name = "Logs"
        status = "UNKNOWN"
        message = ""
        details = @{}
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    try {
        Write-HealthLog "Verificando logs..." "INFO"
        
        $logPath = "C:\logs\inventario-ti"
        
        if (Test-Path $logPath) {
            $totalSize = (Get-ChildItem $logPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
            
            # Contar erros na última hora
            $errorCount = 0
            $oneHourAgo = (Get-Date).AddHours(-1)
            
            Get-ChildItem $logPath -Recurse -Filter "*error*.log" | ForEach-Object {
                if ($_.LastWriteTime -gt $oneHourAgo) {
                    $content = Get-Content $_.FullName -Tail 100 | Where-Object { $_ -match "ERROR|FATAL" }
                    $errorCount += $content.Count
                }
            }
            
            $result.details = @{
                totalSizeMB = [math]::Round($totalSize, 1)
                maxSizeMB = $config.maxSizeMB
                errorsLastHour = $errorCount
                maxErrorsPerHour = $config.maxErrorsPerHour
                path = $logPath
            }
            
            $issues = @()
            if ($totalSize -gt $config.maxSizeMB) { $issues += "Logs muito grandes ($([math]::Round($totalSize, 1)) MB)" }
            if ($errorCount -gt $config.maxErrorsPerHour) { $issues += "Muitos erros na última hora ($errorCount)" }
            
            if ($issues.Count -eq 0) {
                $result.status = "HEALTHY"
                $result.message = "Logs dentro dos limites"
                Write-HealthLog "✓ Logs OK - $([math]::Round($totalSize, 1)) MB, $errorCount erros/hora" "SUCCESS"
            }
            else {
                $result.status = "UNHEALTHY"
                $result.message = "Problemas nos logs: $($issues -join ', ')"
                Write-HealthLog "⚠️  Problemas nos logs: $($issues -join ', ')" "WARN"
            }
        }
        else {
            $result.status = "UNHEALTHY"
            $result.message = "Diretório de logs não encontrado: $logPath"
            Write-HealthLog "❌ Diretório de logs não encontrado: $logPath" "ERROR"
        }
    }
    catch {
        $result.status = "UNHEALTHY"
        $result.message = "Erro ao verificar logs: $($_.Exception.Message)"
        $result.details = @{
            error = $_.Exception.Message
        }
        
        Write-HealthLog "❌ Erro ao verificar logs: $($_.Exception.Message)" "ERROR"
    }
    
    return $result
}

# Função principal
function Start-HealthCheck {
    param($config)
    
    Write-HealthLog "============================================================================" "INFO"
    Write-HealthLog "VERIFICAÇÃO DE SAÚDE - SISTEMA DE INVENTÁRIO TI" "INFO"
    Write-HealthLog "============================================================================" "INFO"
    
    $startTime = Get-Date
    $results = @()
    
    # Executar todos os testes
    $results += Test-ApiHealth $config.api
    $results += Test-PM2Health $config.pm2
    $results += Test-ResourceHealth $config.resources
    $results += Test-DatabaseHealth $config.database
    $results += Test-LogHealth $config.logs
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    # Calcular status geral
    $healthyCount = ($results | Where-Object { $_.status -eq "HEALTHY" }).Count
    $unhealthyCount = ($results | Where-Object { $_.status -eq "UNHEALTHY" }).Count
    $totalTests = $results.Count
    
    $overallStatus = if ($unhealthyCount -eq 0) { "HEALTHY" } else { "UNHEALTHY" }
    $healthPercentage = [math]::Round(($healthyCount / $totalTests) * 100, 1)
    
    # Relatório final
    $summary = @{
        overallStatus = $overallStatus
        healthPercentage = $healthPercentage
        totalTests = $totalTests
        healthyTests = $healthyCount
        unhealthyTests = $unhealthyCount
        duration = [math]::Round($duration, 2)
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        results = $results
    }
    
    if (-not $Silent) {
        Write-HealthLog "============================================================================" "INFO"
        Write-HealthLog "RESUMO DA VERIFICAÇÃO" "INFO"
        Write-HealthLog "============================================================================" "INFO"
        Write-HealthLog "Status Geral: $overallStatus ($healthPercentage% saudável)" $(if ($overallStatus -eq "HEALTHY") { "SUCCESS" } else { "WARN" })
        Write-HealthLog "Testes: $healthyCount/$totalTests passaram" "INFO"
        Write-HealthLog "Duração: $([math]::Round($duration, 2)) segundos" "INFO"
        
        if ($Detailed) {
            Write-HealthLog "`nDetalhes dos Testes:" "INFO"
            foreach ($result in $results) {
                $statusColor = switch ($result.status) {
                    "HEALTHY" { "SUCCESS" }
                    "UNHEALTHY" { "ERROR" }
                    default { "WARN" }
                }
                Write-HealthLog "  $($result.name): $($result.status) - $($result.message)" $statusColor
            }
        }
    }
    
    if ($Json) {
        return $summary | ConvertTo-Json -Depth 10
    }
    else {
        return $summary
    }
}

# Carregar configuração
if (Test-Path $ConfigFile) {
    $config = Get-Content $ConfigFile | ConvertFrom-Json
    Write-HealthLog "Configuração carregada de: $ConfigFile" "INFO"
}
else {
    $config = $defaultConfig
    Write-HealthLog "Usando configuração padrão" "INFO"
}

# Executar verificação
$result = Start-HealthCheck $config

# Definir código de saída baseado no resultado
if ($result.overallStatus -eq "HEALTHY") {
    exit 0
}
else {
    exit 1
}