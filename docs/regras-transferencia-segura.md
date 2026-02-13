# 🔒 Regras de Negócio - Transferência Segura de Ativos

## 📋 Visão Geral

Implementação de travas de segurança para garantir que apenas itens disponíveis e em condições adequadas possam ser transferidos entre lojas/unidades.

## 🛡️ Regras Implementadas

### **1. Filtro no Seletor de Produtos ✅**

#### **Ativos Únicos:**
- ✅ **Status Obrigatório**: Apenas 'Disponível'
- ❌ **Bloqueados**: 'Em Uso', 'Manutenção', 'Descartado'

#### **Insumos:**
- ✅ **Estoque Obrigatório**: `stock_quantity > 0`
- ❌ **Bloqueados**: Itens com estoque zerado

#### **Implementação Frontend:**
```typescript
const getAvailableAssets = () => {
  return assetsData.assets.filter((asset: Asset) => {
    if (asset.asset_type === 'unique') {
      // APENAS itens disponíveis
      return asset.status === 'Disponível'
    } else {
      // APENAS itens com estoque
      return asset.stock_quantity > 0
    }
  })
}
```

### **2. Validação no Modo Bip ✅**

#### **Validação Customizada:**
```typescript
const canAssetBeTransferred = (asset: Asset) => {
  if (asset.asset_type === 'unique') {
    if (asset.status !== 'Disponível') {
      return {
        canTransfer: false,
        reason: `O item está com status '${asset.status}' e não pode ser transferido.`
      }
    }
  } else {
    if (asset.stock_quantity <= 0) {
      return {
        canTransfer: false,
        reason: `O item não possui estoque disponível.`
      }
    }
  }
  return { canTransfer: true }
}
```

#### **Feedback de Erro:**
- 🚫 **Toast Destacado**: "ERRO: O item [Nome] está com status '[Status]' e não pode ser transferido"
- ⏱️ **Duração**: 5-6 segundos para leitura completa
- 🔊 **Ícone**: Emoji de bloqueio para destaque visual

### **3. Informação de Apoio (UX) ✅**

#### **Helper Text Implementado:**
```jsx
<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-blue-700 flex items-center">
    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
    <span>
      <strong>Exibindo apenas itens prontos para saída:</strong> 
      Ativos únicos com status 'Disponível' e insumos com estoque disponível.
    </span>
  </p>
</div>
```

#### **Características:**
- ✅ **Posicionamento**: Logo abaixo do campo de busca
- ✅ **Cor**: Azul informativo (não alarmante)
- ✅ **Ícone**: AlertCircle para chamar atenção
- ✅ **Texto Claro**: Explica exatamente o que está sendo filtrado

### **4. Consistência na API/Banco de Dados ✅**

#### **Validação Backend Rigorosa:**
```javascript
// Ativos únicos: APENAS status 'Disponível'
if (asset.asset_type === 'unique') {
  if (asset.status !== 'Disponível') {
    return res.status(400).json({ 
      message: `Ativo único não pode ser transferido. Status atual: '${asset.status}'. Apenas itens com status 'Disponível' podem ser transferidos.` 
    });
  }
}

// Insumos: verificar estoque disponível
if (asset.asset_type === 'consumable') {
  if (asset.stock_quantity <= 0) {
    return res.status(400).json({ 
      message: `Insumo não possui estoque disponível. Estoque atual: ${asset.stock_quantity}` 
    });
  }
}
```

#### **Proteção Contra Concorrência:**
- ✅ **Transação**: Uso de `BEGIN TRANSACTION` e `ROLLBACK`
- ✅ **Verificação em Tempo Real**: Status verificado no momento da transferência
- ✅ **Mensagens Específicas**: Erros detalhados para cada situação

## 🎯 Cenários de Uso

### **Cenário 1: Ativo Disponível ✅**
```
1. Usuário busca "Notebook Dell"
2. Sistema mostra apenas notebooks com status 'Disponível'
3. Usuário seleciona → Transferência permitida
4. Backend valida novamente → Sucesso
```

### **Cenário 2: Ativo Em Uso ❌**
```
1. Usuário escaneia QR de notebook em uso
2. Sistema valida: status = 'Em Uso'
3. Toast de erro: "ERRO: O item Notebook Dell está com status 'Em Uso' e não pode ser transferido"
4. Item não é adicionado à transferência
```

### **Cenário 3: Insumo Sem Estoque ❌**
```
1. Usuário busca "Cabo HDMI"
2. Sistema filtra: apenas cabos com stock_quantity > 0
3. Se tentar escanear cabo sem estoque → Erro
4. Toast: "ERRO: O item não possui estoque disponível"
```

### **Cenário 4: Concorrência ❌**
```
1. Técnico A inicia transferência de Monitor LG
2. Técnico B tenta transferir o mesmo monitor
3. Backend valida: status mudou para 'Em Uso'
4. Erro: "Ativo não pode ser transferido. Status atual: 'Em Uso'"
```

## 🔍 Validações Implementadas

### **Frontend (Primeira Linha de Defesa):**
- ✅ **Filtro de Lista**: Apenas itens válidos aparecem
- ✅ **Validação na Seleção**: Verificação ao selecionar item
- ✅ **Validação no QR**: Verificação ao escanear código
- ✅ **Feedback Imediato**: Toasts informativos

### **Backend (Segurança Final):**
- ✅ **Validação Rigorosa**: Verificação completa antes de salvar
- ✅ **Transações**: Proteção contra concorrência
- ✅ **Mensagens Detalhadas**: Erros específicos para cada caso
- ✅ **Log de Auditoria**: Registro de tentativas bloqueadas

## 📊 Status Permitidos vs Bloqueados

### **Ativos Únicos:**
| Status | Transferência | Motivo |
|--------|---------------|--------|
| ✅ Disponível | Permitida | Item livre para uso |
| ❌ Em Uso | Bloqueada | Já está sendo utilizado |
| ❌ Manutenção | Bloqueada | Não está operacional |
| ❌ Descartado | Bloqueada | Item inutilizável |

### **Insumos:**
| Condição | Transferência | Motivo |
|----------|---------------|--------|
| ✅ Estoque > 0 | Permitida | Há unidades disponíveis |
| ❌ Estoque = 0 | Bloqueada | Sem unidades para transferir |

## 🚀 Benefícios Alcançados

### **🔒 Segurança:**
- **Zero transferências inválidas**: Validação dupla (frontend + backend)
- **Proteção contra concorrência**: Transações atômicas
- **Auditoria completa**: Logs de todas as tentativas

### **👥 Experiência do Usuário:**
- **Feedback claro**: Usuário sempre sabe por que algo foi bloqueado
- **Interface limpa**: Apenas opções válidas são exibidas
- **Orientação visual**: Helper text explica os critérios

### **⚡ Eficiência Operacional:**
- **Menos erros**: Validações previnem problemas
- **Processo confiável**: Apenas transferências válidas são processadas
- **Rastreabilidade**: Histórico completo de validações

## 🧪 Como Testar

### **Teste 1: Filtro de Lista**
1. Acesse "Nova Transferência"
2. Busque por produtos
3. Verifique se apenas itens 'Disponível' (únicos) e com estoque (insumos) aparecem

### **Teste 2: Validação de QR**
1. Escaneie QR de item 'Em Uso'
2. Verifique toast de erro
3. Confirme que item não foi adicionado

### **Teste 3: Validação Backend**
1. Tente transferir item via API diretamente
2. Mude status do item durante a transferência
3. Verifique se backend bloqueia a operação

---

**🛡️ O sistema agora garante que apenas itens adequados sejam transferidos, com validações robustas em todas as camadas!**