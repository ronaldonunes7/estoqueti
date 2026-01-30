# 🚀 Guia de Deploy - Windows Server

## Sistema de Inventário TI - Ambiente de Produção

Este guia fornece instruções completas para instalar e configurar o Sistema de Inventário TI em um Windows Server do zero.

---

## 📋 Pré-requisitos

### Hardware Mínimo Recomendado
- **CPU**: 2 cores (4+ recomendado)
- **RAM**: 4 GB (8+ GB recomendado)
- **Disco**: 20 GB livres (SSD recomendado)
- **Rede**: Conexão estável com internet

### Software Necessário
- **Windows Server 2016** ou superior (ou Windows 10/11 Pro)
- **Node.js 18.x LTS** ou superior
- **PowerShell 5.1** ou superior
- **Acesso de Administrador**

---

## 🎯 Instalação Rápida (Automatizada)

### Passo 1: Baixar Node.js
1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (18.x ou superior)
3. Execute o instalador como **Administrador**
4. Marque a opção **"Add to PATH"**
5. Reinicie o servidor após a instalação

### Passo 2: Preparar o Projeto
```powershell
# Abrir PowerShell como Administrador
# Navegar para o diretório do projeto
cd C:\caminho\para\o\projeto

# Executar script de instalação automatizada
.\setup-windows.ps1
```

### Passo 3: Configurar Segurança
```powershell
# Editar arquivo de ambiente
notepad .env

# Alterar a JWT_SECRET para uma chave segura
JWT_SECRET=sua-chave-super-segura-unica-producao-2026
```

### Passo 4: Configurar Firewall
```powershell
# Abrir porta 3001 no firewall
New-NetFirewallRule -DisplayName "Inventario TI API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### Passo 5: Verificar Instalação
```powershell
# Verificar status
pm2 status

# Testar API
curl http://localhost:3001/health
```

---

## 🔧 Instalação Manual (Passo a Passo)

### 1. Instalar Node.js e NPM

```powershell
# Verificar se Node.js está instalado
node --version
npm --version

# Se não estiver instalado, baixar de: https://nodejs.org/
```

### 2. Instalar PM2 Globalmente

```powershell
# Instalar PM2 e dependências
npm install -g pm2 pm2-windows-startup

# Configurar PM2 para iniciar com Windows
pm2-startup install
```

### 3. Preparar Diretórios

```powershell
# Criar estrutura de diretórios
New-Item -ItemType Directory -Path "C:\apps\inventario-ti" -Force
New-Item -ItemType Directory -Path "C:\logs\inventario-ti" -Force
New-Item -ItemType Directory -Path "C:\backup\inventario-ti" -Force

# Copiar arquivos do projeto
Copy-Item -Path ".\*" -Destination "C:\apps\inventario-ti" -Recurse -Force
Set-Location "C:\apps\inventario-ti"
```

### 4. Instalar Dependências

```powershell
# Instalar dependências do backend
npm install --production

# Instalar dependências do frontend
cd client
npm install
cd ..
```

### 5. Build do Projeto

```powershell
# Build do frontend
cd client
npm run build
cd ..
```

### 6. Configurar Ambiente

```powershell
# Copiar arquivo de ambiente
Copy-Item ".env.production" ".env"

# Editar configurações (IMPORTANTE!)
notepad .env
```

**Configurações obrigatórias no .env:**
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=SUA-CHAVE-SUPER-SEGURA-AQUI
```

### 7. Iniciar com PM2

```powershell
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Verificar status
pm2 status
```

### 8. Configurar Logs

```powershell
# Executar script de configuração de logs
.\scripts\setup-logging.ps1
```

---

## 🔒 Configurações de Segurança

### Firewall do Windows

```powershell
# Abrir porta da API (3001)
New-NetFirewallRule -DisplayName "Inventario TI - API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow

# Se usar frontend separado (5173)
New-NetFirewallRule -DisplayName "Inventario TI - Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

### Configurações Avançadas de Segurança

```powershell
# Configurar política de execução do PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine

# Configurar usuário de serviço (opcional)
# Criar usuário específico para o serviço
$password = ConvertTo-SecureString "SenhaSegura123!" -AsPlainText -Force
New-LocalUser -Name "InventarioTI" -Password $password -Description "Usuario do Sistema de Inventario TI"
Add-LocalGroupMember -Group "Users" -Member "InventarioTI"
```

---

## 📊 Monitoramento e Manutenção

### Scripts de Manutenção Disponíveis

```powershell
# Ver status completo do sistema
.\scripts\maintenance.ps1 -Action status

# Fazer backup do banco de dados
.\scripts\maintenance.ps1 -Action backup

# Reiniciar serviços
.\scripts\maintenance.ps1 -Action restart

# Verificar saúde do sistema
.\scripts\maintenance.ps1 -Action health

# Monitoramento contínuo
.\scripts\maintenance.ps1 -Action monitor
```

### Comandos PM2 Úteis

```powershell
# Ver status dos processos
pm2 status

# Ver logs em tempo real
pm2 logs

# Reiniciar aplicação
pm2 restart inventario-ti-api

# Parar aplicação
pm2 stop inventario-ti-api

# Ver informações detalhadas
pm2 show inventario-ti-api

# Ver monitoramento
pm2 monit
```

---

## 🗂️ Estrutura de Arquivos em Produção

```
C:\apps\inventario-ti\
├── server/                 # Código do backend
├── client/                 # Código do frontend
│   └── dist/              # Build do frontend
├── database.sqlite        # Banco de dados SQLite
├── ecosystem.config.js    # Configuração do PM2
├── .env                   # Variáveis de ambiente
├── package.json           # Dependências do backend
└── scripts/               # Scripts de manutenção
    ├── maintenance.ps1    # Script principal de manutenção
    └── setup-logging.ps1  # Configuração de logs

C:\logs\inventario-ti\
├── api/                   # Logs da API
├── system/                # Logs do sistema
├── archive/               # Logs arquivados
└── *.log                  # Arquivos de log

C:\backup\inventario-ti\
└── database/              # Backups do banco de dados
```

---

## 🔄 Backup e Restauração

### Backup Automático

O sistema está configurado para fazer backup automático:
- **Frequência**: Diário às 02:00
- **Retenção**: 30 backups
- **Localização**: `C:\backup\inventario-ti\database\`

### Backup Manual

```powershell
# Fazer backup imediato
.\scripts\maintenance.ps1 -Action backup

# Ou executar script direto
.\backup-database.ps1
```

### Restauração

```powershell
# Restaurar backup (interativo)
.\scripts\maintenance.ps1 -Action restore

# Seguir as instruções na tela para selecionar o backup
```

---

## 🚨 Solução de Problemas

### Problema: API não responde

```powershell
# Verificar status dos processos
pm2 status

# Ver logs de erro
pm2 logs --err

# Reiniciar serviços
pm2 restart all

# Verificar porta
netstat -an | findstr :3001
```

### Problema: Erro de permissão

```powershell
# Verificar se está executando como administrador
whoami /groups | findstr "S-1-16-12288"

# Executar PowerShell como administrador
# Verificar política de execução
Get-ExecutionPolicy
Set-ExecutionPolicy RemoteSigned
```

### Problema: Banco de dados corrompido

```powershell
# Parar serviços
pm2 stop all

# Restaurar último backup
.\scripts\maintenance.ps1 -Action restore

# Ou copiar backup manualmente
Copy-Item "C:\backup\inventario-ti\database\database_YYYY-MM-DD_HH-mm-ss.sqlite" "C:\apps\inventario-ti\database.sqlite"

# Reiniciar serviços
pm2 start all
```

### Problema: Logs muito grandes

```powershell
# Limpar logs manualmente
.\scripts\maintenance.ps1 -Action cleanup

# Ou executar script de limpeza
C:\logs\inventario-ti\cleanup-logs.ps1
```

---

## 📈 Otimização de Performance

### Configurações de Produção

1. **Cluster Mode**: O PM2 está configurado para usar todos os cores disponíveis
2. **Memory Limit**: Reinicialização automática se usar mais de 1GB
3. **Log Rotation**: Logs são rotacionados automaticamente
4. **Auto Restart**: Reinicialização automática em caso de crash

### Monitoramento de Performance

```powershell
# Ver uso de recursos
pm2 monit

# Ver estatísticas detalhadas
pm2 show inventario-ti-api

# Monitoramento do sistema
.\scripts\maintenance.ps1 -Action monitor
```

---

## 🔐 Configurações de Produção Recomendadas

### Variáveis de Ambiente Críticas

```env
# OBRIGATÓRIO: Alterar em produção
JWT_SECRET=chave-super-segura-unica-256-bits-producao

# Configurações de performance
NODE_ENV=production
MAX_MEMORY_RESTART=1024
CLUSTER_INSTANCES=max

# Configurações de segurança
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de logs
LOG_LEVEL=info
LOG_DIR=C:\logs\inventario-ti
```

### Configurações de Rede

```powershell
# Configurar proxy reverso (opcional - IIS/Nginx)
# Configurar SSL/TLS (recomendado para produção)
# Configurar domínio personalizado
```

---

## 📞 Suporte e Manutenção

### Contatos de Emergência
- **Suporte Técnico**: [seu-email@empresa.com]
- **Documentação**: Consulte os arquivos em `/docs`
- **Logs**: Sempre verificar em `C:\logs\inventario-ti`

### Manutenção Preventiva Recomendada

- **Diária**: Verificar logs e status dos serviços
- **Semanal**: Executar verificação de saúde do sistema
- **Mensal**: Revisar backups e limpar logs antigos
- **Trimestral**: Atualizar dependências e sistema operacional

---

## ✅ Checklist de Deploy

### Pré-Deploy
- [ ] Windows Server atualizado
- [ ] Node.js 18+ instalado
- [ ] Acesso de administrador confirmado
- [ ] Firewall configurado
- [ ] Antivírus configurado (exceções)

### Durante Deploy
- [ ] Script de instalação executado
- [ ] JWT_SECRET alterado
- [ ] Serviços iniciados com PM2
- [ ] API respondendo (http://localhost:3001/health)
- [ ] Logs sendo gerados
- [ ] Backup automático configurado

### Pós-Deploy
- [ ] Teste completo das funcionalidades
- [ ] Monitoramento configurado
- [ ] Documentação atualizada
- [ ] Equipe treinada
- [ ] Plano de contingência definido

---

**🎉 Sistema de Inventário TI - Deploy Concluído!**

Para suporte adicional, consulte a documentação técnica em `/docs` ou execute:
```powershell
.\scripts\maintenance.ps1 -Action help
```