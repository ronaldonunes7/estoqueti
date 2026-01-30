# 📋 Documentação - Tela de Movimentação

## 📖 Visão Geral

A **Tela de Movimentação** é o módulo central do Sistema de Inventário TI, responsável por gerenciar todas as operações de entrada, saída e transferência de ativos. Esta interface foi projetada para ser intuitiva, rápida e eficiente, permitindo operações completas em menos de 30 segundos.

---

## 🎯 Objetivos da Tela

### **Primários:**
- Registrar movimentações de ativos de forma rápida e precisa
- Manter histórico imutável de todas as operações
- Controlar estoque de insumos automaticamente
- Facilitar transferências entre lojas/unidades

### **Secundários:**
- Fornecer visibilidade completa do histórico
- Validar regras de negócio em tempo real
- Integrar com sistema de controle de acesso
- Gerar dados para relatórios e dashboard

---

## 🏗️ Arquitetura da Interface

### **Layout Principal**
```
┌─────────────────────────────────────────────────────────┐
│ [Header] Sistema de Inventário TI                       │
├─────────────────────────────────────────────────────────┤
│ [Sidebar]              [Main Content Area]             │
│ • Dashboard            ┌─────────────────────────────┐   │
│ • Ativos              │ NOVA TRANSFERÊNCIA          │   │
│ • Lojas               │                             │   │
│ • → Transferência     │ [Step 1: Selecionar Produto]│   │
│ • Movimentações       │ [Step 2: Definir Quantidade]│   │
│ • Relatórios          │ [Step 3: Escolher Destino] │   │
│                       │ [Step 4: Confirmar]        │   │
│                       └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Funcionalidades Principais

### **1. Nova Transferência (Página Principal)**
**URL:** `/transfer`  
**Permissões:** Todos os usuários autenticados

#### **Fluxo de 4 Etapas:**

##### **📦 Etapa 1: Selecionar Produto**
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 [Buscar produto por nome, serial ou tag...]         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📱 Notebook Dell Latitude 5520        [Único]     │ │
│ │    Dell Latitude 5520                              │ │
│ │    PAT001 - DL5520001                 [Disponível] │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔌 Cabo HDMI 2m                      [Insumo]     │ │
│ │    Cabo HDMI                                       │ │
│ │    Estoque: 50                    ⚠️ Estoque baixo │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- **Busca em tempo real** com debounce de 300ms
- **Filtro automático** por disponibilidade
- **Indicadores visuais** de tipo (Único/Insumo)
- **Status badges** coloridos por estado
- **Alertas de estoque baixo** para insumos

**Validações:**
- Apenas ativos disponíveis ou em uso são exibidos
- Insumos com estoque zero são ocultados
- Ativos em manutenção/descartados são bloqueados

##### **🔢 Etapa 2: Definir Quantidade**
```
┌─────────────────────────────────────────────────────────┐
│ Produto Selecionado: Cabo HDMI 2m                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Quantidade: [  5  ] ← Máximo: 50                   │ │
│ │                                                     │ │

│ │ ℹ️ Estoque atual: 50 unidades                       │ │
│ │ ⚠️ Estoque mínimo: 10 unidades                      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Comportamento por Tipo:**
- **Ativos Únicos:** Quantidade fixada em 1 (campo desabilitado)
- **Insumos:** Input numérico com validação de estoque máximo
- **Validação em tempo real** de quantidade disponível

##### **🏪 Etapa 3: Selecionar Loja de Destino**
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 [Buscar loja por nome ou cidade...]                 │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏬 Shopping Prohospital                            │ │
│ │    Fortaleza - João Silva                          │ │
│ │    Av. Dom Luís, 1200                              │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏬 Shopping Iguatemi                               │ │
│ │    Fortaleza - Maria Santos                        │ │
│ │    Av. Washington Soares, 85                       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- **Lista de lojas cadastradas** com informações completas
- **Busca por nome ou cidade** em tempo real
- **Informações do responsável** visíveis
- **Endereço completo** para identificação

##### **✅ Etapa 4: Confirmar Transferência**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 RESUMO DA TRANSFERÊNCIA                              │
│                                                         │
│ 📦 Cabo HDMI 2m  ────────→  🏬 Shopping Prohospital   │
│    Qtd: 5                      Fortaleza               │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Técnico Responsável: [admin            ]           │ │
│ │ Observações:        [Transferência para...        ]│ │
│ │                     [nova loja do shopping        ]│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Limpar]                    [Confirmar Transferência]  │
└─────────────────────────────────────────────────────────┘
```

**Campos Obrigatórios:**
- **Técnico Responsável:** Pré-preenchido com usuário logado
- **Observações:** Campo opcional para detalhes adicionais

**Validações Finais:**
- Verificação de estoque em tempo real
- Validação de permissões do usuário
- Confirmação de dados antes do envio

---

### **2. Histórico de Movimentações**
**URL:** `/movements`  
**Permissões:** Todos os usuários autenticados

#### **Interface de Listagem:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Filtros: [Tipo: Todos ▼] [Período: Últimos 30 dias]│
├─────────────────────────────────────────────────────────┤
│ ┌─────┬──────────────┬─────────────┬──────────┬────────┐ │
│ │Tipo │ Ativo        │ Colaborador │ Destino  │ Data   │ │
│ ├─────┼──────────────┼─────────────┼──────────┼────────┤ │
│ │🔄   │ Cabo HDMI 2m │ João Silva  │ Shop.    │27/01   │ │
│ │Trans│ Qtd: 5       │             │ Prohosp. │19:30   │ │
│ ├─────┼──────────────┼─────────────┼──────────┼────────┤ │
│ │📤   │ Notebook Dell│ Maria Costa │ Setor TI │27/01   │ │
│ │Saída│ PAT001       │             │          │15:20   │ │
│ └─────┴──────────────┴─────────────┴──────────┴────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- **Filtros por tipo** de movimentação
- **Busca por período** customizável
- **Paginação** para grandes volumes
- **Detalhes expandidos** ao clicar na linha
- **Ícones diferenciados** por tipo de operação

---

## 🔧 Funcionalidades Técnicas

### **Validações de Negócio**

#### **Para Ativos Únicos:**
```typescript
// Regras implementadas
if (asset.asset_type === 'unique') {
  // ✅ Permitido: Disponível, Em Uso
  // ❌ Bloqueado: Manutenção, Descartado
  
  if (asset.status === 'Manutenção' || asset.status === 'Descartado') {
    throw new Error(`Ativo não pode ser transferido. Status: ${asset.status}`);
  }
  
  // Quantidade sempre = 1
  finalQuantity = 1;
}
```

#### **Para Insumos:**
```typescript
// Regras implementadas
if (asset.asset_type === 'consumable') {
  // Verificar estoque disponível
  if (asset.stock_quantity < requestedQuantity) {
    throw new Error(`Estoque insuficiente. Disponível: ${asset.stock_quantity}`);
  }
  
  // Alertar se ficar abaixo do mínimo
  if ((asset.stock_quantity - requestedQuantity) <= asset.min_stock) {
    showWarning('Estoque ficará abaixo do mínimo após esta transferência');
  }
}
```

### **Transações Atômicas**
```sql
-- Todas as operações são executadas em transação
BEGIN TRANSACTION;

-- 1. Atualizar estoque/status do ativo
UPDATE assets SET 
  stock_quantity = stock_quantity - ?, 
  updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;

-- 2. Registrar movimentação (histórico imutável)
INSERT INTO movements (
  asset_id, type, employee_name, destination, store_id, 
  quantity, responsible_technician, observations, created_by
) VALUES (?, 'Transferência', ?, ?, ?, ?, ?, ?, ?);

-- 3. Confirmar ou reverter tudo
COMMIT; -- ou ROLLBACK em caso de erro
```

### **Auditoria e Rastreabilidade**
```json
// Cada movimentação registra:
{
  "id": 123,
  "asset_id": 29,
  "type": "Transferência",
  "employee_name": "Maria Santos",
  "destination": "Shopping Iguatemi",
  "store_id": 6,
  "quantity": 2,
  "responsible_technician": "admin",
  "observations": "Transferência para nova unidade",
  "movement_date": "2026-01-27T19:30:15.000Z",
  "created_by": 1
}
```

---

## 🎨 Design System

### **Cores Semânticas**
```css
/* Status de Ativos */
.status-disponivel { background: #10B981; color: white; }
.status-em-uso     { background: #3B82F6; color: white; }
.status-manutencao { background: #F59E0B; color: white; }
.status-descartado { background: #EF4444; color: white; }

/* Tipos de Movimentação */
.movimento-entrada      { color: #10B981; } /* Verde */
.movimento-saida        { color: #EF4444; } /* Vermelho */
.movimento-transferencia{ color: #3B82F6; } /* Azul */
.movimento-manutencao   { color: #F59E0B; } /* Amarelo */
```

### **Iconografia**
```
📦 Ativos Únicos
🔌 Insumos/Consumíveis
🏪 Lojas/Destinos
📤 Saída
📥 Entrada
🔄 Transferência
🔧 Manutenção
```

### **Estados Interativos**
```css
/* Botões */
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
.btn-disabled { opacity: 0.5; cursor: not-allowed; }

/* Cards de Seleção */
.asset-card:hover { border-color: #3B82F6; background: #F0F9FF; }
.asset-card.selected { border-color: #10B981; background: #ECFDF5; }
```

---

## 📱 Responsividade

### **Desktop (≥1024px)**
- Layout em 4 colunas para etapas
- Sidebar fixa com navegação completa
- Tabelas com todas as colunas visíveis
- Modais centralizados

### **Tablet (768px - 1023px)**
- Layout em 2 colunas adaptativo
- Sidebar colapsável
- Tabelas com scroll horizontal
- Cards otimizados

### **Mobile (≤767px)**
- Layout em coluna única
- Menu hambúrguer
- Cards empilhados verticalmente
- Inputs touch-friendly (min 44px)

---

## ⚡ Performance

### **Otimizações Implementadas**
- **Debounce na busca:** 300ms para evitar requests excessivos
- **Paginação:** Máximo 20 itens por página
- **Cache de lojas:** Dados carregados uma vez por sessão
- **Validação client-side:** Feedback imediato sem roundtrip

### **Métricas de Performance**
- **Tempo de carregamento inicial:** < 2 segundos
- **Tempo de busca:** < 500ms
- **Tempo total de transferência:** < 30 segundos (meta atingida)
- **Responsividade da interface:** < 100ms para interações

---

## 🔒 Segurança

### **Validações de Entrada**
```typescript
// Sanitização automática de inputs
const sanitizedData = {
  asset_id: parseInt(data.asset_id),
  store_id: parseInt(data.store_id),
  quantity: Math.max(1, parseInt(data.quantity)),
  responsible_technician: validator.escape(data.responsible_technician.trim()),
  observations: validator.escape(data.observations?.trim() || '')
};
```

### **Controle de Acesso**
- **Autenticação JWT:** Token obrigatório para todas as operações
- **Autorização por role:** Admin vs Viewer
- **Rate limiting:** Máximo 100 requests por 15 minutos
- **Logs de auditoria:** Todas as ações são registradas

### **Proteção CSRF**
- **Headers de segurança:** Helmet.js configurado
- **CORS restritivo:** Apenas origins autorizados
- **Validação de origem:** Verificação de referer

---

## 📊 Integração com Dashboard

### **Métricas Atualizadas em Tempo Real**
- **Total de transferências:** Contador incrementado
- **Estoque baixo:** Alertas automáticos após movimentação
- **Últimas movimentações:** Lista atualizada instantaneamente
- **Gráficos:** Dados de movimentação incluídos

### **Notificações**
```typescript
// Alertas automáticos
if (newStockLevel <= asset.min_stock) {
  showNotification({
    type: 'warning',
    title: 'Estoque Baixo',
    message: `${asset.name} está com estoque baixo (${newStockLevel} restantes)`
  });
}
```

---

## 🧪 Casos de Uso Práticos

### **Caso 1: Transferência de Insumo**
```
Cenário: Transferir 10 cabos HDMI para Shopping Iguatemi
Usuário: Técnico de TI
Tempo esperado: 15-20 segundos

Passos:
1. Acessar /transfer
2. Buscar "cabo hdmi"
3. Selecionar "Cabo HDMI 2m"
4. Definir quantidade: 10
5. Selecionar "Shopping Iguatemi"
6. Confirmar transferência

Resultado:
- Estoque reduzido de 50 para 40
- Movimentação registrada no histórico
- Dashboard atualizado
- Alerta de estoque baixo (se aplicável)
```

### **Caso 2: Transferência de Ativo Único**
```
Cenário: Transferir notebook para nova loja
Usuário: Administrador
Tempo esperado: 20-25 segundos

Passos:
1. Acessar /transfer
2. Buscar "notebook dell"
3. Selecionar "Notebook Dell Latitude 5520"
4. Quantidade automática: 1
5. Selecionar "North Shopping"
6. Adicionar observações
7. Confirmar transferência

Resultado:
- Status alterado para "Em Uso"
- Localização atualizada
- Histórico de movimentação criado
- Relatórios atualizados
```

### **Caso 3: Consulta de Histórico**
```
Cenário: Verificar movimentações do último mês
Usuário: Gerente (Viewer)
Tempo esperado: 5-10 segundos

Passos:
1. Acessar /movements
2. Filtrar por período: "Últimos 30 dias"
3. Filtrar por tipo: "Transferência"
4. Visualizar detalhes das movimentações

Resultado:
- Lista filtrada de transferências
- Detalhes de cada operação
- Possibilidade de exportar relatório
```

---

## 🚨 Tratamento de Erros

### **Erros de Validação**
```typescript
// Mensagens amigáveis para o usuário
const errorMessages = {
  'INSUFFICIENT_STOCK': 'Estoque insuficiente para esta operação',
  'ASSET_NOT_AVAILABLE': 'Ativo não está disponível para transferência',
  'STORE_NOT_FOUND': 'Loja de destino não encontrada',
  'INVALID_QUANTITY': 'Quantidade deve ser maior que zero',
  'UNAUTHORIZED': 'Você não tem permissão para esta operação'
};
```

### **Recuperação de Erros**
- **Rollback automático:** Transações revertidas em caso de erro
- **Retry automático:** Tentativas automáticas para erros de rede
- **Feedback visual:** Loading states e mensagens de erro claras
- **Logs detalhados:** Para debug e suporte técnico

---

## 📈 Métricas e Analytics

### **KPIs Monitorados**
- **Tempo médio de transferência:** Meta < 30 segundos
- **Taxa de erro:** Meta < 1%
- **Satisfação do usuário:** Feedback via interface
- **Volume de transferências:** Diário/semanal/mensal

### **Relatórios Gerados**
- **Movimentações por período**
- **Ativos mais transferidos**
- **Lojas com maior movimento**
- **Eficiência por técnico**

---

## 🔄 Roadmap de Melhorias

### **Versão 1.1 (Próxima)**
- [ ] Transferências em lote
- [ ] Código de barras/QR Code
- [ ] Notificações push
- [ ] Aprovação de transferências

### **Versão 1.2 (Futuro)**
- [ ] App mobile nativo
- [ ] Integração com ERP
- [ ] IA para previsão de estoque
- [ ] Dashboard avançado

---

## 📞 Suporte e Manutenção

### **Logs de Sistema**
```bash
# Localização dos logs
/logs/movements.log     # Operações de movimentação
/logs/errors.log        # Erros do sistema
/logs/audit.log         # Auditoria de segurança
```

### **Backup e Recuperação**
- **Backup automático:** Diário às 02:00
- **Retenção:** 30 dias de histórico
- **Recuperação:** RTO < 4 horas, RPO < 1 hora

### **Monitoramento**
- **Uptime:** 99.9% SLA
- **Performance:** Alertas automáticos
- **Capacidade:** Monitoramento de recursos

---

*Documentação atualizada em: 27 de Janeiro de 2026*  
*Versão do Sistema: 1.0.0*  
*Próxima revisão: 27 de Fevereiro de 2026*