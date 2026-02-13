# 🏢 Sistema de Inventário e Controle de Ativos de TI

Sistema completo e profissional para gerenciamento de inventário de ativos de TI com controle avançado de entrada/saída, código de barras, transferências entre unidades, relatórios externos inteligentes e workflow de confirmação. Desenvolvido com React + TypeScript no frontend e Node.js + Express no backend.

## 🌟 Destaques da Versão Atual

- ✅ **Modo Bip Profissional**: Scanner de código de barras otimizado para produtividade
- ✅ **Gestão Multi-Unidades**: Controle de transferências entre lojas/filiais
- ✅ **Relatórios Externos**: Compartilhamento seguro sem necessidade de login
- ✅ **Diferenciação Inteligente**: Ativos únicos vs Insumos consumíveis
- ✅ **QR Codes e Etiquetas**: Geração automática de etiquetas profissionais
- ✅ **Dashboard Analítico**: Métricas em tempo real e alertas inteligentes

## 🚀 Funcionalidades Principais

### 📊 Dashboard Gerencial Inteligente
- **Métricas em Tempo Real**: Total de ativos, disponíveis, em uso, manutenção
- **Alertas de Estoque Baixo**: Sistema inteligente de reposição para insumos
- **Alertas de Transferências Pendentes**: Notificações de itens aguardando confirmação
- **Gráficos Interativos**: Movimentações dos últimos 30 dias com drill-down
- **Alertas de Garantia**: Ativos com garantia vencendo em 90 dias
- **Movimentações Recentes**: Histórico das últimas atividades do sistema
- **KPIs Visuais**: Cards coloridos com indicadores de performance

### 📦 Gestão Avançada de Ativos
- **Cadastro Completo**: Nome, marca/modelo, serial, tag patrimônio, categoria
- **Código de Barras Único**: Campo EAN/Serial para identificação rápida
- **Controle de Status**: Disponível, Em Uso, Manutenção, Descartado, Em Trânsito
- **Tipos de Ativo Diferenciados**:
  - **Únicos**: Patrimoniados (notebooks, monitores, licenças)
  - **Insumos**: Consumíveis com controle de estoque (cabos, periféricos)
- **Controle de Estoque**: Quantidade atual e estoque mínimo para insumos
- **Busca Avançada**: Por tag, serial, nome ou código de barras
- **Filtros Inteligentes**: Por categoria, status, estoque baixo, tipo
- **Informações Adicionais**: Data de compra, valor, garantia, localização

### 🔄 Sistema de Movimentações com Modo Bip
- **Modo Bip Profissional**: Scanner de código de barras keyboard-first
- **Diferenciação Inteligente**: 
  - Ativos únicos: Adição automática (qty=1)
  - Insumos: Modal de quantidade com validação
- **Validações em Tempo Real**: Controle de estoque e disponibilidade
- **Processamento em Lote**: Múltiplos itens em uma operação
- **Foco Automático**: Interface otimizada para produtividade
- **Atalhos de Teclado**: Enter, Escape, +/- para operação rápida
- **Feedback Imediato**: Visual, sonoro e tátil (mobile)
- **Check-out/Check-in**: Controle completo de entrada e saída
- **Histórico Imutável**: Todas as movimentações registradas permanentemente

### 🏪 Sistema de Transferências Multi-Unidades
- **Gestão de Lojas**: Cadastro completo de unidades/filiais
- **Transferências Seguras**: Apenas itens disponíveis podem ser transferidos
- **Status 'Em Trânsito'**: Controle temporário durante transferência
- **Workflow de Confirmação**: Tela dedicada para confirmação de recebimento
- **Scanner de Recebimento**: Confirmação rápida via código de barras
- **Gestão de Divergências**: Registro de problemas no recebimento
- **Auditoria Completa**: Rastreabilidade total do ciclo de transferência
- **Relatórios por Unidade**: Dados específicos de cada loja

### 🏷️ QR Codes e Etiquetas Profissionais
- **Geração Automática**: QR Code + informações do ativo em PDF
- **Scanner Integrado**: Leitura via câmera do dispositivo
- **Transferência Rápida**: Escaneie e transfira em segundos
- **Acesso Direto**: QR Code leva ao histórico completo do ativo
- **Layout Profissional**: Etiquetas padronizadas para impressão
- **Impressão em Lote**: Múltiplas etiquetas por página

### 📊 Relatórios Externos Inteligentes
- **Compartilhamento Seguro**: Links únicos com tokens UUID
- **Segmentação por Unidade**: Dados específicos por loja
- **Controle de Acesso**: Senhas opcionais e expiração automática
- **Interface Pública**: Visualização sem login no sistema
- **Gestão Completa**: Auditoria e revogação de links
- **Export PDF/CSV**: Relatórios otimizados para impressão
- **Configuração Flexível**: Períodos e escopos personalizáveis
- **Auditoria de Acessos**: Log completo de visualizações

### 🔒 Segurança e Controle de Acesso
- **Autenticação JWT**: Login seguro com tokens de 24h
- **Controle de Permissões**: Admin (edição) e Viewer (visualização)
- **Rate Limiting**: Proteção contra ataques (100 req/15min)
- **Validação Rigorosa**: Sanitização e validação em todas as camadas
- **Auditoria Completa**: Log de todas as ações do sistema
- **Helmet Security**: Headers de segurança implementados
- **CORS Configurado**: Controle de origem das requisições

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento rápido
- **React Router** para navegação SPA
- **React Query (TanStack)** para gerenciamento de estado e cache
- **React Hook Form** para formulários performáticos
- **Tailwind CSS** para estilização moderna
- **Lucide React** para iconografia consistente
- **Recharts** para gráficos interativos
- **React Hot Toast** para notificações elegantes
- **Date-fns** para manipulação de datas
- **jsPDF** e **html2canvas** para geração de PDFs
- **QRCode.js** para geração de QR Codes
- **qr-scanner** para leitura de QR Codes via câmera
- **UUID** para tokens seguros

### Backend
- **Node.js** com Express.js
- **SQLite** como banco de dados (produção-ready)
- **JWT (jsonwebtoken)** para autenticação
- **bcryptjs** para hash seguro de senhas
- **Express Rate Limit** para proteção contra ataques
- **Helmet** para headers de segurança
- **CORS** configurado adequadamente
- **UUID** para tokens únicos
- **Dotenv** para variáveis de ambiente

### DevOps e Ferramentas
- **ESLint** e **Prettier** para qualidade de código
- **TypeScript** para tipagem estática
- **Concurrently** para desenvolvimento simultâneo
- **Nodemon** para hot reload do backend

## � Pré-requis itos

- **Node.js 18+** (recomendado LTS)
- **npm** ou **yarn** como gerenciador de pacotes
- **Navegador moderno** com suporte a ES6+ e WebRTC (para scanner)
- **Câmera** (opcional, para scanner QR via navegador)
- **Leitor de código de barras** USB/Bluetooth (opcional, para modo bip)

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/sistema-inventario-ti.git
cd sistema-inventario-ti
```

### 2. Instale as dependências
```bash
# Instalar dependências do backend e frontend automaticamente
npm run install:all

# Ou manualmente:
# Backend
npm install

# Frontend
cd client && npm install && cd ..
```

### 3. Configure as variáveis de ambiente (opcional)
```bash
# Crie o arquivo .env na raiz do projeto
echo "JWT_SECRET=sua-chave-secreta-super-segura-aqui" > .env
echo "PORT=3001" >> .env
echo "NODE_ENV=development" >> .env
```

### 4. Inicie o sistema
```bash
# Desenvolvimento (backend + frontend simultaneamente)
npm run dev

# Ou separadamente:
# Terminal 1: Backend
npm run server:dev

# Terminal 2: Frontend (em outra aba)
npm run client:dev
```

### 5. Acesse o sistema
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Documentação**: Disponível nos arquivos `/docs`

## 👤 Usuários Padrão

O sistema cria automaticamente usuários para teste e demonstração:

### Administrador
- **Usuário**: `admin`
- **Senha**: `admin123`
- **Permissões**: Acesso completo (CRUD de ativos, transferências, relatórios externos)

### Gerência (Viewer)
- **Usuário**: `gerencia`
- **Senha**: `viewer123`
- **Permissões**: Visualização de dashboard, relatórios e movimentações (sem edição)

## 📱 Como Usar o Sistema

### 🏪 Cadastro de Lojas/Unidades
1. Acesse **Lojas** no menu lateral
2. Clique em **"Nova Loja"**
3. Preencha: Nome, Endereço, Cidade (obrigatórios)
4. Adicione: Telefone, Responsável (opcionais)
5. Salve para usar em transferências

### 📦 Cadastro de Ativos
1. Acesse **Ativos** → **"Novo Ativo"**
2. Preencha as informações básicas
3. **Importante**: Adicione o **Código de Barras** para usar o scanner
4. Defina o tipo:
   - **Ativo Único**: Para patrimônio (notebooks, monitores)
   - **Insumo**: Para consumíveis (cabos, periféricos)
5. Para insumos: Configure **Quantidade** e **Estoque Mínimo**

### 🔄 Modo Bip (Scanner de Código de Barras)
1. Acesse **Movimentações** → **"Modo Bip"**
2. Selecione **Entrada** ou **Saída**
3. Escaneie códigos de barras ou digite manualmente
4. **Ativos únicos**: Adição automática (qty=1)
5. **Insumos**: Modal abre para definir quantidade
6. Use atalhos: Enter (confirmar), Escape (cancelar), +/- (ajustar)
7. Clique **"Processar"** para finalizar todas as movimentações

### 🚚 Transferências Entre Unidades
1. Acesse **Transferência** → **"Nova Transferência"**
2. Busque e selecione o produto (apenas disponíveis aparecem)
3. Defina quantidade (automático para únicos, manual para insumos)
4. Escolha a loja de destino
5. Preencha **Colaborador** e **Técnico Responsável**
6. Item vai para status **"Em Trânsito"**

### ✅ Confirmação de Recebimento
1. Acesse **"Confirmar Recebimento"** no menu
2. Use o **Scanner** ou selecione da lista de itens em trânsito
3. Confirme quantidade recebida
4. **Reportar Divergência** se houver problemas
5. Item volta para status **"Disponível"** na nova loja

### 🏷️ Geração de QR Codes e Etiquetas
1. Na lista de ativos, clique no ícone QR
2. PDF é gerado automaticamente com etiquetas
3. Imprima as etiquetas em papel adesivo
4. Cole nos equipamentos para identificação rápida
5. QR Code leva diretamente ao histórico do ativo

### 📊 Relatórios Externos (Compartilhamento)
1. Acesse **"Acessos Externos"** (apenas admin)
2. Clique em **"Novo Link de Compartilhamento"**
3. Configure:
   - Nome do relatório
   - Escopo (geral ou unidade específica)
   - Período (7 dias, 30 dias, mês atual)
   - Data de expiração
   - Senha (opcional)
4. Copie e compartilhe o link gerado
5. Destinatário acessa sem login no sistema

## � Configuurações Avançadas

### 📱 Leitores de Código de Barras
- **USB (Plug & Play)**: Configure para enviar Enter após o código
- **Bluetooth**: Pareie como teclado HID no sistema operacional
- **Aplicativo Mobile**: Use apps que enviam dados via teclado virtual
- **Scanner Web**: Use a câmera do navegador (Chrome/Safari)

### 🎨 Personalização Visual
- Edite `client/src/index.css` para cores personalizadas
- Modifique componentes em `client/src/components/` para layout
- Configure `client/tailwind.config.js` para tema customizado

### 🗄️ Configuração do Banco de Dados
- Modifique `server/database/init.js` para dados iniciais
- Backup automático: `cp database.sqlite backup_$(date +%Y%m%d).sqlite`
- Localização: `database.sqlite` na raiz do projeto

### ⚙️ Configurações do Servidor
- Configure `server/index.js` para portas e CORS
- Ajuste rate limiting em `server/middleware/`
- Modifique JWT expiration em `server/routes/auth.js`

### 🔒 Variáveis de Ambiente
```bash
# .env na raiz do projeto
JWT_SECRET=sua-chave-super-segura-producao
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://seu-dominio.com
```

## 📊 Códigos de Teste para Scanner

Para testar o sistema de código de barras, use estes códigos pré-cadastrados:

### Ativos Únicos
- `7891234567890` - Notebook Dell Inspiron 15
- `7891234567891` - Monitor LG 24" Full HD
- `7891234567892` - Desktop HP ProDesk
- `7891234567893` - Impressora HP LaserJet

### Insumos (Consumíveis)
- `7891234567894` - Cabo HDMI 2m (50 unidades, mín: 10)
- `7891234567895` - Mouse USB Logitech (25 unidades, mín: 5)
- `7891234567896` - Teclado USB Dell (15 unidades, mín: 3)
- `7891234567897` - Cabo de Rede Cat6 (100 unidades, mín: 20)

### Como Testar
1. Acesse **Movimentações** → **Modo Bip**
2. Digite ou escaneie um dos códigos acima
3. Observe o comportamento diferente para únicos vs insumos
4. Teste validações de estoque com saídas de insumos

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Backend + Frontend simultaneamente
npm run server:dev         # Apenas backend (porta 3001)
npm run client:dev         # Apenas frontend (porta 5173)

# Instalação
npm run install:all        # Instalar todas as dependências

# Produção
npm run build              # Build do frontend para produção
npm start                  # Servidor de produção

# Utilitários
npm run lint               # Verificar qualidade do código
npm run format             # Formatar código com Prettier
```

## 📱 Interface Responsiva e Acessibilidade

### Design Responsivo
- **Desktop**: Layout completo com sidebar fixa
- **Tablet**: Layout adaptado com menu colapsável
- **Mobile**: Menu hambúrguer e cards otimizados para touch
- **PWA Ready**: Funciona offline com service workers

### Acessibilidade
- **Navegação por Teclado**: Todos os controles acessíveis via Tab
- **Screen Readers**: Labels semânticos e ARIA attributes
- **Alto Contraste**: Cores com contraste adequado (WCAG 2.1)
- **Foco Visível**: Indicadores claros de foco
- **Atalhos**: Teclas de acesso rápido implementadas

## 🔒 Segurança Implementada

### Autenticação e Autorização
- **JWT Tokens**: Expiração de 24h com refresh automático
- **Bcrypt**: Hash de senhas com salt rounds 10
- **Role-based Access**: Admin vs Viewer permissions
- **Session Management**: Logout automático por inatividade

### Proteções de Rede
- **Rate Limiting**: 100 requests por 15 minutos por IP
- **Helmet**: Headers de segurança (CSP, HSTS, etc.)
- **CORS**: Configurado para origens específicas
- **Input Validation**: Sanitização em frontend e backend

### Auditoria e Logs
- **Audit Trail**: Log de todas as ações críticas
- **Error Logging**: Registro de erros com stack traces
- **Access Logs**: Monitoramento de acessos suspeitos
- **Data Integrity**: Validações de integridade referencial

## 📈 Funcionalidades Avançadas

### Dashboard Inteligente
- **Métricas Calculadas**: Tempo real com cache otimizado
- **Gráficos Interativos**: Drill-down e filtros dinâmicos
- **Alertas Proativos**: Garantia, estoque baixo, transferências
- **Distribuição Visual**: Por categoria, status e localização
- **Exportação**: PDF e CSV com filtros aplicados

### Sistema de Busca
- **Busca Global**: Múltiplos campos simultaneamente
- **Filtros Combinados**: AND/OR logic implementada
- **Paginação Eficiente**: Lazy loading com virtual scrolling
- **Resultados em Tempo Real**: Debounced search com 300ms
- **Histórico de Busca**: Últimas pesquisas salvas

### Relatórios e Analytics
- **Relatórios Dinâmicos**: Filtros flexíveis por período/categoria
- **Exportação Múltipla**: CSV, PDF, Excel formats
- **Agendamento**: Relatórios automáticos por email
- **Dashboards Personalizados**: Widgets configuráveis
- **KPIs Customizados**: Métricas específicas por usuário

## 🚀 Deploy em Produção

### Preparação para Produção
```bash
# 1. Build do frontend
npm run build

# 2. Configurar variáveis de ambiente
NODE_ENV=production
PORT=3001
JWT_SECRET=chave-super-segura-producao-256-bits
CORS_ORIGIN=https://seu-dominio.com
```

### Deploy com PM2 (Recomendado)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start server/index.js --name "inventario-ti"

# Configurar auto-restart
pm2 startup
pm2 save
```

### Deploy com Docker
```dockerfile
# Dockerfile incluído no projeto
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm run install:all && npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `users` - Controle de Usuários
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `stores` - Lojas/Unidades
```sql
CREATE TABLE stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  responsible TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `assets` - Ativos e Insumos
```sql
CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand_model TEXT,
  serial_number TEXT UNIQUE,
  patrimony_tag TEXT UNIQUE,
  category TEXT,
  status TEXT DEFAULT 'Disponível',
  barcode TEXT UNIQUE,
  asset_type TEXT DEFAULT 'unique',
  stock_quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  purchase_date DATE,
  warranty_date DATE,
  value DECIMAL(10,2),
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `movements` - Histórico de Movimentações
```sql
CREATE TABLE movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  user_id INTEGER NOT NULL,
  store_id INTEGER,
  collaborator TEXT,
  technician TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets (id),
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (store_id) REFERENCES stores (id)
);
```

#### `external_report_links` - Links de Relatórios Externos
```sql
CREATE TABLE external_report_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  scope TEXT DEFAULT 'general',
  store_id INTEGER,
  period TEXT DEFAULT '30days',
  password_hash TEXT,
  expires_at DATETIME NOT NULL,
  click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME,
  FOREIGN KEY (store_id) REFERENCES stores (id),
  FOREIGN KEY (created_by) REFERENCES users (id)
);
```

## 🎯 Roadmap e Próximas Funcionalidades

### Versão 2.3 (Q2 2026)
- [ ] **Integração com ERP**: Sincronização bidirecional
- [ ] **Aplicativo Mobile**: React Native para Android/iOS
- [ ] **Notificações Push**: Alertas em tempo real
- [ ] **Backup Automático**: Sincronização com cloud storage

### Versão 2.4 (Q3 2026)
- [ ] **BI Avançado**: Dashboards com Power BI/Tableau
- [ ] **API Pública**: Endpoints para integrações externas
- [ ] **Multi-tenancy**: Suporte a múltiplas empresas
- [ ] **Workflow Engine**: Aprovações customizáveis

### Versão 2.5 (Q4 2026)
- [ ] **Machine Learning**: Previsão de demanda e manutenção
- [ ] **IoT Integration**: Sensores de localização e status
- [ ] **Blockchain**: Auditoria imutável de ativos críticos
- [ ] **AR/VR**: Visualização 3D de layouts e equipamentos

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um **Pull Request**

### Diretrizes de Contribuição
- Siga os padrões de código existentes (ESLint + Prettier)
- Adicione testes para novas funcionalidades
- Documente mudanças no README e arquivos `/docs`
- Use commits semânticos (feat, fix, docs, style, refactor)

### Reportar Bugs
- Use as **Issues** do GitHub
- Inclua passos para reproduzir o problema
- Adicione screenshots se aplicável
- Especifique versão do Node.js e navegador

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

### Resumo da Licença MIT
- ✅ Uso comercial permitido
- ✅ Modificação permitida
- ✅ Distribuição permitida
- ✅ Uso privado permitido
- ❌ Sem garantia
- ❌ Sem responsabilidade do autor

## 📞 Suporte e Contato

### Canais de Suporte
- **GitHub Issues**: Para bugs e solicitações de features
- **Discussions**: Para dúvidas gerais e discussões
- **Wiki**: Documentação detalhada e tutoriais
- **Email**: suporte@inventario-ti.com (se aplicável)

### Documentação Adicional
- 📚 **Guia do Usuário**: `/docs/INSTRUCOES_DE_USO.md`
- 🔧 **Guia Técnico**: `/docs/RELATORIO_AUDITORIA_TECNICA.md`
- 🚀 **Novas Funcionalidades**: `/NOVAS_FUNCIONALIDADES.md`
- 📊 **Relatórios Externos**: `/docs/relatorios-externos-inteligentes.md`

### Status do Projeto
- **Versão Atual**: 2.2.0
- **Status**: ✅ Produção
- **Última Atualização**: Janeiro 2026
- **Próxima Release**: Q2 2026

---

<div align="center">

**🏢 Sistema de Inventário TI**

*Desenvolvido com ❤️ para facilitar o controle de ativos de TI*

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>