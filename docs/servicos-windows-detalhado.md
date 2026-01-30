# 🔧 Serviços Windows - Sistema de Inventário TI

## 📋 Visão Geral dos Serviços

O Sistema de Inventário TI **não cria um serviço Windows tradicional**. Em vez disso, utiliza o **PM2** (Process Manager 2) que atua como um gerenciador de processos avançado.

## 🚀 Como Funciona o PM2 no Windows

### **1. PM2 Runtime**
```
Nome: PM2 Runtime
Tipo: Processo gerenciado pelo sistema
Localização: Executado via npm global
Comando: pm2 start ecosystem.config.js --env production
```

### **2. Integração com Windows Startup**
O comando `pm2-startup install` configura:

- **Registro no Windows**: Adiciona entrada no registro para inicialização
- **Script de Inicialização**: Cria script que roda no boot
- **Usuário Atual**: Executa sob o contexto do usuário que instalou

### **3. Processos Criados**

#### **Processo Principal: inventario-ti-api**
```
Nome do Processo: inventario-ti-api
Comando: node server/index.js
Modo: Cluster (múltiplas instâncias)
Instâncias: Automático (baseado nos cores da CPU)
Porta: 3001
```

#### **Processo PM2 Daemon**
```
Nome: PM2 God Daemon
Função: Monitora e gerencia os processos da aplicação
Auto-restart: Sim
Monitoramento: CPU, Memória, Uptime
```

## 🔍 Verificar Serviços Ativos

### **Via PM2**
```powershell
# Ver todos os processos PM2
pm2 status

# Ver detalhes de um processo específico
pm2 show inventario-ti-api

# Ver logs em tempo real
pm2 logs

# Ver monitoramento
pm2 monit
```

### **Via Task Manager (Gerenciador de Tarefas)**
```
Processos visíveis:
- node.exe (múltiplas instâncias)
- PM2: God Daemon
```

### **Via PowerShell**
```powershell
# Ver processos Node.js
Get-Process -Name "node" | Format-Table

# Ver processos PM2
Get-Process | Where-Object {$_.ProcessName -like "*pm2*"}

# Ver portas em uso
netstat -an | findstr :3001
```

## ⚙️ Configuração de Inicialização Automática

### **O que o `pm2-startup install` faz:**

1. **Cria entrada no Registro do Windows**
2. **Configura script de inicialização**
3. **Define dependências de sistema**
4. **Configura recuperação automática**

### **Localização no Sistema:**
```
Registro: HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
Entrada: PM2
Valor: Caminho para script de inicialização do PM2
```

## 🔄 Alternativa: Criar Serviço Windows Real

Se você quiser criar um **serviço Windows tradicional**, pode usar:

### **Opção 1: NSSM (Non-Sucking Service Manager)**
```powershell
# Instalar NSSM
# Baixar de: https://nssm.cc/download

# Criar serviço
nssm install "InventarioTI" "C:\Program Files\nodejs\node.exe"
nssm set "InventarioTI" AppParameters "C:\apps\inventario-ti\server\index.js"
nssm set "InventarioTI" AppDirectory "C:\apps\inventario-ti"
nssm set "InventarioTI" DisplayName "Sistema de Inventário TI"
nssm set "InventarioTI" Description "API do Sistema de Inventário de Ativos de TI"

# Iniciar serviço
nssm start "InventarioTI"
```

### **Opção 2: node-windows**
```javascript
// Instalar: npm install -g node-windows
var Service = require('node-windows').Service;

var svc = new Service({
  name: 'Sistema de Inventário TI',
  description: 'API do Sistema de Inventário de Ativos de TI',
  script: 'C:\\apps\\inventario-ti\\server\\index.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

svc.on('install', function(){
  svc.start();
});

svc.install();
```

## 📊 Comparação: PM2 vs Serviço Windows

| Aspecto | PM2 | Serviço Windows |
|---------|-----|-----------------|
| **Facilidade** | ✅ Muito fácil | ⚠️ Mais complexo |
| **Cluster Mode** | ✅ Nativo | ❌ Manual |
| **Hot Reload** | ✅ Sim | ❌ Não |
| **Logs** | ✅ Avançados | ⚠️ Básicos |
| **Monitoramento** | ✅ Completo | ⚠️ Limitado |
| **Integração Windows** | ⚠️ Via startup | ✅ Nativo |
| **Recuperação** | ✅ Automática | ✅ Configurável |

## 🛠️ Scripts para Gerenciar Serviços

### **Script para Verificar Status**
```powershell
# Verificar se PM2 está rodando
function Test-PM2Service {
    try {
        $pm2Status = pm2 status --no-color 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PM2 está rodando" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ PM2 não está rodando" -ForegroundColor Red
        return $false
    }
}

# Verificar se a API está respondendo
function Test-APIService {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
        Write-Host "✅ API está respondendo: $($response.message)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ API não está respondendo" -ForegroundColor Red
        return $false
    }
}

# Executar verificações
Test-PM2Service
Test-APIService
```

### **Script para Reinstalar Inicialização**
```powershell
# Remover configuração atual
pm2 unstartup
pm2 kill

# Reinstalar
pm2-startup install
pm2 start ecosystem.config.js --env production
pm2 save

Write-Host "✅ Inicialização automática reconfigurada" -ForegroundColor Green
```

## 🔍 Troubleshooting de Serviços

### **Problema: PM2 não inicia com Windows**
```powershell
# Verificar se está configurado
pm2 startup

# Reconfigurar
pm2 unstartup
pm2-startup install
pm2 save
```

### **Problema: Processo não reinicia automaticamente**
```powershell
# Verificar configuração
pm2 show inventario-ti-api

# Reconfigurar auto-restart
pm2 stop inventario-ti-api
pm2 start ecosystem.config.js --env production
```

### **Problema: Múltiplas instâncias não funcionam**
```powershell
# Verificar modo cluster
pm2 show inventario-ti-api | findstr "exec_mode"

# Deve mostrar: exec_mode: cluster_mode
```

## 📋 Checklist de Verificação de Serviços

### **Verificações Básicas**
- [ ] PM2 instalado globalmente: `pm2 --version`
- [ ] Processo rodando: `pm2 status`
- [ ] API respondendo: `curl http://localhost:3001/health`
- [ ] Inicialização configurada: `pm2 startup`
- [ ] Configuração salva: `pm2 save`

### **Verificações Avançadas**
- [ ] Modo cluster ativo: `pm2 show inventario-ti-api`
- [ ] Logs sendo gerados: `pm2 logs --lines 10`
- [ ] Monitoramento funcionando: `pm2 monit`
- [ ] Auto-restart configurado: Verificar `autorestart: true`
- [ ] Limite de memória: Verificar `max_memory_restart`

## 🎯 Resumo

**O Sistema de Inventário TI usa PM2, não um serviço Windows tradicional:**

1. **PM2 gerencia** os processos Node.js
2. **Inicialização automática** via registro do Windows
3. **Cluster mode** para alta performance
4. **Monitoramento** e logs avançados
5. **Auto-restart** em caso de falha

**Vantagens do PM2:**
- ✅ Mais fácil de configurar
- ✅ Melhor para aplicações Node.js
- ✅ Recursos avançados (cluster, logs, monitoramento)
- ✅ Hot reload e zero-downtime deploys

**Se precisar de um serviço Windows real**, use NSSM ou node-windows, mas o PM2 é a solução recomendada para aplicações Node.js.