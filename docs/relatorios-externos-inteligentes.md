# Relatórios Externos Inteligentes - Sistema de Inventário TI

## 📋 Visão Geral

O sistema agora possui funcionalidades completas de compartilhamento de relatórios externos com foco em segurança e segmentação por unidade, permitindo que gestores e stakeholders acessem dados específicos sem necessidade de login no sistema principal.

## 🔗 Módulo de Geração de Links (Painel Admin)

### Funcionalidades

#### 1. Compartilhamento de Relatórios
- **Localização**: Página "Movimentações" → Botão "Compartilhar Relatório" (apenas Admin)
- **Modal Intuitivo**: Interface completa para configuração de links
- **Geração Automática**: URLs únicas e seguras com tokens UUID

#### 2. Configurações Avançadas
- **Escopo do Relatório**:
  - **Geral**: Todas as unidades/lojas
  - **Por Unidade**: Filtro específico por loja cadastrada
- **Período de Dados**:
  - Últimos 7 dias
  - Últimos 30 dias  
  - Mês atual
- **Segurança**:
  - Data de expiração configurável
  - Senha de acesso opcional
  - Tokens únicos e seguros

#### 3. Geração de URLs
- **Formato**: `/view/report/{token}`
- **Exemplo**: `https://sistema.com/view/report/a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- **Validação**: Tokens únicos com validação de integridade
- **Rastreamento**: Contador de acessos e última visualização

### Como Usar

1. Acesse "Movimentações" no sistema
2. Clique em "Compartilhar Relatório" (apenas Admin)
3. Configure:
   - Nome do relatório
   - Escopo (geral ou por unidade)
   - Período dos dados
   - Data de expiração
   - Senha (opcional)
4. Clique em "Gerar Link"
5. Copie e compartilhe a URL gerada

## 🌐 Interface do Visualizador Público (Guest View)

### Funcionalidades

#### 1. Acesso Sem Login
- **Rota Pública**: Não requer autenticação no sistema
- **Validação Automática**: Verifica token e permissões
- **Proteção por Senha**: Tela de login se configurado

#### 2. Validação de Filtros
- **Segmentação Rigorosa**: Acesso apenas aos dados permitidos
- **Isolamento de Dados**: Loja X não visualiza dados da Loja Y
- **Período Restrito**: Apenas dados do período configurado
- **Limite de Registros**: Máximo 100 movimentações por segurança

#### 3. Conteúdo da Página
- **Header Profissional**:
  - Logo do sistema
  - Nome do relatório
  - Identificação da unidade
- **KPIs Específicos**:
  - Total de Itens Recebidos
  - Itens em Trânsito
  - Total de Movimentações
- **Tabela de Movimentações**:
  - Data e hora
  - Nome do ativo e patrimônio
  - Tipo (Entrada/Saída/Transferência)
  - Colaborador responsável
  - Quantidade

#### 4. Restrições de Segurança
- **Interface Read-Only**: Sem menus de navegação ou edição
- **Dados Limitados**: Apenas informações autorizadas
- **Sem Sidebar**: Layout limpo e focado
- **Expiração Automática**: Links expiram na data configurada

### Estados da Interface

#### Carregamento
- Spinner animado
- Mensagem "Carregando relatório..."

#### Proteção por Senha
- Tela de login dedicada
- Campo de senha com toggle de visibilidade
- Validação em tempo real

#### Erro de Acesso
- Mensagens específicas:
  - "Link não encontrado ou inativo"
  - "Este link expirou"
  - "Senha incorreta"
- Botão para voltar ao início

## 📊 Gestão de Links e Auditoria

### Funcionalidades

#### 1. Página de Gestão
- **Localização**: Sidebar → "Acessos Externos" (apenas Admin)
- **Lista Completa**: Todos os links criados
- **Informações Detalhadas**:
  - Nome do relatório
  - Escopo (geral ou unidade específica)
  - Período configurado
  - Status (ativo/expirado/revogado)
  - Contador de acessos
  - Data de expiração
  - Última visualização

#### 2. Estatísticas Gerais
- **KPIs do Sistema**:
  - Links ativos
  - Total de links criados
  - Total de acessos registrados

#### 3. Ações Disponíveis
- **Copiar Link**: Copia URL para área de transferência
- **Visualizar**: Abre o relatório em nova aba
- **Revogar**: Invalida o link imediatamente
- **Auditoria**: Visualiza histórico de acessos

#### 4. Indicadores Visuais
- **Status com Badges**:
  - 🟢 Ativo: Verde
  - 🟡 Expirado: Amarelo
  - 🔴 Revogado: Vermelho
- **Ícones de Segurança**:
  - 🔒 Protegido por senha
  - 🔓 Acesso livre
- **Escopo Visual**:
  - 🌐 Todas as unidades
  - 🏢 Unidade específica

### Auditoria e Segurança

#### Logs Automáticos
- **Criação de Links**: Usuário, data, configurações
- **Acessos**: IP, data/hora, sucesso/falha
- **Revogações**: Usuário responsável, motivo
- **Tentativas de Acesso**: Senhas incorretas, links expirados

#### Controles de Segurança
- **Tokens UUID**: Impossíveis de adivinhar
- **Expiração Automática**: Links se tornam inválidos
- **Revogação Imediata**: Controle total do administrador
- **Validação Rigorosa**: Verificações em cada acesso

## 🎨 Design e Exportação

### Características do Design

#### 1. Layout Responsivo
- **Mobile First**: Otimizado para dispositivos móveis
- **Breakpoints**: Adaptação para tablet e desktop
- **Touch Friendly**: Botões e elementos adequados para toque
- **Performance**: Carregamento rápido em conexões lentas

#### 2. Interface Profissional
- **Paleta Consistente**: Cores do sistema principal
- **Tipografia Clara**: Legibilidade em todos os tamanhos
- **Espaçamento Adequado**: Layout limpo e organizado
- **Iconografia**: Ícones intuitivos e reconhecíveis

#### 3. Experiência do Usuário
- **Navegação Simples**: Foco no conteúdo principal
- **Feedback Visual**: Estados de loading e erro claros
- **Acessibilidade**: Suporte a leitores de tela
- **Print Friendly**: Otimizado para impressão

### Exportação PDF

#### Funcionalidades
- **Botão "Salvar PDF"**: Disponível em todos os relatórios
- **Layout Otimizado**: Formatação específica para impressão
- **Conteúdo Completo**:
  - Cabeçalho com logo e informações
  - KPIs resumidos
  - Tabela de movimentações (até 30 itens)
  - Rodapé com data de geração
- **Nome Automático**: `relatorio-{nome-do-relatorio}.pdf`

#### Características Técnicas
- **Biblioteca**: jsPDF para geração client-side
- **Formato**: A4 padrão
- **Qualidade**: Alta resolução para impressão
- **Tamanho**: Otimizado para compartilhamento

## 🔧 Implementação Técnica

### Arquitetura do Sistema

#### Backend (Node.js + Express)
```javascript
// Estrutura da tabela de links externos
external_report_links {
  id: INTEGER PRIMARY KEY
  token: TEXT UNIQUE (UUID)
  name: TEXT
  scope: 'general' | 'store'
  store_id: INTEGER (opcional)
  period: '7days' | '30days' | 'current_month'
  password_hash: TEXT (opcional)
  expires_at: DATETIME
  click_count: INTEGER
  is_active: BOOLEAN
  created_by: INTEGER
  created_at: DATETIME
  last_accessed: DATETIME
}
```

#### APIs Implementadas
- `POST /api/external-reports` - Criar link
- `GET /api/external-reports` - Listar links (admin)
- `PATCH /api/external-reports/:id/revoke` - Revogar link
- `GET /api/external-reports/validate/:token` - Validar token
- `GET /api/external-reports/data/:token` - Obter dados do relatório

#### Frontend (React + TypeScript)
- **ShareReportModal**: Modal de criação de links
- **PublicReport**: Página pública de visualização
- **ExternalAccess**: Gestão de links (admin)
- **Roteamento**: Rota pública `/view/report/:token`

### Segurança Implementada

#### Validações
- **Token UUID**: Geração segura com crypto
- **Hash de Senhas**: bcrypt com salt
- **Expiração**: Verificação automática de datas
- **Permissões**: Isolamento rigoroso de dados
- **Rate Limiting**: Proteção contra ataques

#### Controles de Acesso
- **Segmentação**: Dados por unidade isolados
- **Período**: Apenas dados do intervalo configurado
- **Quantidade**: Limite de registros por segurança
- **Auditoria**: Log completo de acessos

## 📈 Benefícios e Casos de Uso

### Para Gestores de Loja
- ✅ **Acesso Rápido**: Visualização sem login no sistema
- ✅ **Dados Específicos**: Apenas da sua unidade
- ✅ **Mobile Friendly**: Acesso via smartphone
- ✅ **Relatórios PDF**: Impressão para reuniões

### Para Administradores
- ✅ **Controle Total**: Criação e revogação de links
- ✅ **Auditoria Completa**: Rastreamento de acessos
- ✅ **Segurança Avançada**: Senhas e expiração
- ✅ **Flexibilidade**: Diferentes escopos e períodos

### Para Stakeholders
- ✅ **Transparência**: Acesso a dados relevantes
- ✅ **Conveniência**: Sem necessidade de contas
- ✅ **Atualização**: Dados sempre atualizados
- ✅ **Profissionalismo**: Interface limpa e organizada

## 🚀 Casos de Uso Práticos

### Cenário 1: Relatório Mensal para Gerente
1. Admin cria link para "Loja Centro" - "Últimos 30 dias"
2. Define senha "gerente123" e expiração em 7 dias
3. Compartilha link via WhatsApp/Email
4. Gerente acessa, insere senha e visualiza dados
5. Baixa PDF para reunião mensal

### Cenário 2: Auditoria Trimestral
1. Admin cria link "Geral" - "Mês Atual"
2. Sem senha, expiração em 24 horas
3. Compartilha com auditor externo
4. Auditor acessa dados de todas as unidades
5. Sistema registra todos os acessos

### Cenário 3: Prestação de Contas
1. Admin cria múltiplos links por unidade
2. Período "Últimos 7 dias" para cada loja
3. Compartilha com respectivos responsáveis
4. Cada um acessa apenas seus dados
5. Relatórios PDF para documentação

## 📊 Métricas de Sucesso

### KPIs Esperados
- **Redução de Solicitações**: 60% menos pedidos de relatórios
- **Agilidade**: Acesso instantâneo aos dados
- **Satisfação**: 95% de aprovação dos gestores
- **Segurança**: Zero vazamentos de dados

### Monitoramento
- Dashboard de uso de links externos
- Relatórios de acessos por período
- Análise de padrões de uso
- Feedback dos usuários

## 🔮 Próximas Melhorias

### Funcionalidades Futuras
1. **Agendamento**: Links com renovação automática
2. **Notificações**: Alertas de novos dados
3. **Customização**: Templates personalizáveis
4. **Analytics**: Dashboards de uso avançados
5. **API Pública**: Integração com sistemas externos

### Integrações Possíveis
1. **WhatsApp Business**: Envio automático de links
2. **Email Marketing**: Relatórios periódicos
3. **Slack/Teams**: Notificações em canais
4. **Power BI**: Conectores de dados

---

**Documentação atualizada em**: Janeiro 2026  
**Versão do Sistema**: 2.2.0  
**Responsável**: Sistema de Inventário TI