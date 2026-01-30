# 📋 Instruções de Uso - Sistema de Inventário TI

## 🚀 Como Iniciar o Sistema

### 1. Primeira Execução
```bash
# Na pasta raiz do projeto
npm run install:all  # Instala todas as dependências
npm run dev          # Inicia backend + frontend
```

### 2. Acessar o Sistema
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 👤 Login no Sistema

### Usuários Pré-configurados:

**Administrador (Acesso Total)**
- Usuário: `admin`
- Senha: `admin123`
- Pode: Criar, editar, deletar ativos e fazer todas as operações

**Gerência (Apenas Visualização)**
- Usuário: `gerencia` 
- Senha: `viewer123`
- Pode: Ver dashboard, relatórios e movimentações (sem editar)

## 📊 Usando o Dashboard

### Métricas Principais
- **Total de Ativos**: Quantidade total cadastrada
- **Disponíveis**: Ativos prontos para uso
- **Em Manutenção**: Ativos sendo reparados
- **Saídas (30 dias)**: Movimentações recentes

### Gráficos
- **Linha do Tempo**: Movimentações dos últimos 30 dias
- **Pizza**: Distribuição por status dos ativos

### Alertas
- **Garantias Vencendo**: Ativos com garantia expirando em 90 dias
- **Movimentações Recentes**: Últimas 5 atividades

## 📦 Gerenciando Ativos

### Criar Novo Ativo (Admin apenas)
1. Ir em **Ativos** → **Novo Ativo**
2. Preencher campos obrigatórios:
   - Nome do ativo
   - Marca/Modelo
   - Número de série (único)
   - Tag de patrimônio (único)
   - Categoria (Hardware/Periférico/Licença)
3. Campos opcionais:
   - Data de compra
   - Valor
   - Garantia
   - Localização
   - Observações

### Buscar Ativos
- **Busca rápida**: Digite tag, serial ou nome
- **Filtros**: Por categoria e status
- **Limpar**: Remove todos os filtros

### Editar/Deletar (Admin apenas)
- Clique nos ícones de edição ou lixeira na lista

## 🔄 Sistema de Movimentações

### Check-out (Saída de Ativo)
1. Clique em **Check-out**
2. Selecione um ativo **Disponível**
3. Informe:
   - Nome do colaborador
   - Destino (opcional)
   - Técnico responsável
   - Observações
4. Status muda automaticamente para **Em Uso**

### Check-in (Devolução)
1. Clique em **Check-in**
2. Selecione um ativo **Em Uso**
3. Informe:
   - Nome do colaborador
   - Técnico responsável
   - Status após devolução
   - Observações
4. Status volta para **Disponível** (ou outro escolhido)

### Manutenção (Admin apenas)
1. Clique em **Manutenção**
2. Selecione ativo **Disponível** ou **Em Uso**
3. Informe responsável e observações
4. Status muda para **Manutenção**

## 📊 Relatórios e Exportação

### Tipos de Relatório
- **Ativos**: Lista completa com todas as informações
- **Movimentações**: Histórico de entradas/saídas

### Filtros Disponíveis
**Para Ativos:**
- Status (Disponível, Em Uso, etc.)
- Categoria (Hardware, Periférico, Licença)

**Para Movimentações:**
- Tipo (Entrada, Saída, Manutenção)
- Período (data inicial e final)

### Formatos de Exportação
- **CSV**: Para análise em Excel/planilhas
- **PDF**: Para documentação oficial

### Como Exportar
1. Ir em **Relatórios**
2. Escolher tipo de relatório
3. Aplicar filtros desejados
4. Clicar em **Baixar CSV** ou **Baixar PDF**

## 🔍 Funcionalidades de Busca

### Busca Rápida de Ativos
- Digite qualquer parte da tag de patrimônio
- Número de série (completo ou parcial)
- Nome do ativo

### Filtros Combinados
- Use múltiplos filtros simultaneamente
- Categoria + Status + Busca de texto

## 📱 Interface Responsiva

### Desktop
- Sidebar fixa com navegação completa
- Tabelas com todas as colunas visíveis

### Mobile/Tablet
- Menu hambúrguer
- Cards otimizados
- Tabelas com scroll horizontal

## ⚠️ Regras Importantes

### Controle de Status
- **Disponível** → **Em Uso** (via Check-out)
- **Em Uso** → **Disponível** (via Check-in)
- **Qualquer** → **Manutenção** (via Manutenção)
- **Manutenção** → **Disponível** (via Check-in)

### Histórico Imutável
- Todas as movimentações são registradas permanentemente
- Não é possível deletar ou alterar movimentações
- Rastreabilidade completa com timestamps

### Campos Únicos
- **Número de Série**: Deve ser único no sistema
- **Tag de Patrimônio**: Deve ser única no sistema

## 🔧 Solução de Problemas

### Sistema não carrega
1. Verificar se ambos os serviços estão rodando:
   - Backend: http://localhost:3001
   - Frontend: http://localhost:5173
2. Reiniciar com `npm run dev`

### Erro de login
- Verificar credenciais:
  - admin/admin123 (administrador)
  - gerencia/viewer123 (visualização)

### Erro ao criar ativo
- Verificar se serial e tag são únicos
- Preencher todos os campos obrigatórios

### Erro ao fazer movimentação
- Verificar se o ativo está no status correto:
  - Check-out: ativo deve estar **Disponível**
  - Check-in: ativo deve estar **Em Uso**

## 📞 Suporte Técnico

### Logs do Sistema
- Backend: Console do terminal onde roda `npm run server:dev`
- Frontend: Console do navegador (F12)

### Reiniciar Sistema
```bash
# Parar processos (Ctrl+C em cada terminal)
# Depois executar:
npm run dev
```

### Backup do Banco
- Arquivo: `server/database.sqlite`
- Fazer cópia de segurança regularmente

---

**💡 Dica**: Mantenha sempre o sistema atualizado e faça backups regulares do banco de dados!