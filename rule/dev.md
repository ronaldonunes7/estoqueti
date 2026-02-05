# 🏗️ Guia de Desenvolvimento - Sistema de Inventário TI

## 📋 Visão Geral do Projeto

### Arquitetura
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **Padrão**: Clean Architecture com separação de responsabilidades
- **Autenticação**: JWT com refresh tokens
- **Estado**: React Query para server state, Context API para client state

### 🚀 Pré-requisitos Verificados
- ✅ **Node.js**: v22.22.0 (LTS recomendado)
- ✅ **npm**: v10.9.4
- ✅ **Git**: v2.53.0.windows.1
- ✅ **Git Bash**: Terminal padrão configurado
- ✅ **Dependências Backend**: Todas instaladas
- ✅ **Dependências Frontend**: Todas instaladas

### 🛠️ Ambiente de Desenvolvimento Configurado
- **Sistema Operacional**: Windows
- **Terminal**: Git Bash (configurado como padrão)
- **Estrutura do Projeto**: Verificada e funcional
- **Banco de Dados**: SQLite inicializado corretamente
- **Servidor**: Rodando na porta 3001
- **Frontend**: Rodando na porta 5173

---

## 🚀 Comandos de Desenvolvimento (Windows + Git Bash)

### Inicialização do Projeto
```bash
# Clonar o repositório
git clone <repository-url>
cd estoqueti

# Instalar dependências (backend + frontend)
npm run install:all

# Ou instalar separadamente:
npm install                    # Backend
cd client && npm install      # Frontend
```

### Desenvolvimento Local
```bash
# Iniciar desenvolvimento (backend + frontend simultaneamente)
npm run dev

# Ou iniciar separadamente:
npm run server:dev    # Backend apenas (porta 3001)
npm run client:dev    # Frontend apenas (porta 5173)
```

### Scripts Úteis
```bash
# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Verificar dependências
npm list --depth=0
cd client && npm list --depth=0

# Linting e formatação
npm run lint
npm run lint:fix
```

### Gerenciamento do Banco de Dados
```bash
# Backup do banco
cp server/database.sqlite "backups/database-$(date +%Y%m%d-%H%M%S).sqlite"

# Reset do banco (desenvolvimento)
rm server/database.sqlite
touch server/database/.reset_flag
npm run server:dev  # Recria automaticamente
```

## ✅ Status Atual do Sistema

### 🔧 Correções Implementadas
1. **Tabela movements**: Corrigida criação com todas as colunas (store_id, quantity)
2. **Constraint de status**: Atualizada para incluir 'Em Trânsito'
3. **Inicialização do banco**: Simplificada e mais robusta
4. **Remoção de código duplicado**: Eliminadas tentativas redundantes de ALTER TABLE
5. **Tratamento de erros**: Melhorado para desenvolvimento
6. **Configuração de portas**: Verificada e funcionando corretamente

### 🚀 Sistema Funcionando
- **Banco de Dados**: ✅ Inicializado e funcionando
- **Tabela movements**: ✅ Criada com todas as colunas necessárias
- **Tabela assets**: ✅ Atualizada com suporte a 'Em Trânsito'
- **Usuários Padrão**: ✅ Criados (admin/admin123, gerencia/viewer123)
- **Backend API**: ✅ Rodando na porta 3001 (http://localhost:3001)
- **Frontend Vite**: ✅ Rodando na porta 5173 (http://localhost:5173)
- **Proxy Configuration**: ✅ Frontend → Backend (/api → :3001)
- **Rotas de Desenvolvimento**: ✅ Habilitadas
- **Logs Estruturados**: ✅ Funcionando

### 🌐 URLs de Acesso
- **Aplicação Principal**: http://localhost:5173
- **API Backend**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **Documentação**: Disponível nos arquivos `/docs`

---

### 🌐 Arquitetura de Portas

#### Configuração Padrão
- **Frontend (Vite)**: Porta 5173
  - Servidor de desenvolvimento React
  - Proxy automático para API (/api → localhost:3001)
  - Hot Module Replacement (HMR) ativo
  
- **Backend (Express)**: Porta 3001
  - API REST completa
  - Banco de dados SQLite
  - Middleware de segurança ativo

#### Proxy Configuration (Vite)
```typescript
// client/vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

#### CORS Configuration (Express)
```javascript
// server/index.js
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false 
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
```

---

#### 1. Design Tokens
```typescript
// tokens/colors.ts
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a'
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b', 
    error: '#ef4444',
    info: '#3b82f6'
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    900: '#111827'
  }
}
```

#### 2. Tipografia Hierárquica
```css
/* Escala tipográfica baseada em 1.25 (Major Third) */
.text-xs { font-size: 0.75rem; }    /* 12px */
.text-sm { font-size: 0.875rem; }   /* 14px */
.text-base { font-size: 1rem; }     /* 16px */
.text-lg { font-size: 1.125rem; }   /* 18px */
.text-xl { font-size: 1.25rem; }    /* 20px */
.text-2xl { font-size: 1.5rem; }    /* 24px */
.text-3xl { font-size: 1.875rem; }  /* 30px */
```

#### 3. Espaçamento Consistente
```typescript
// Usar múltiplos de 4px (0.25rem)
const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px  
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem'   // 48px
}
```

### Componentes Premium

#### 1. Sistema de Componentes Atômicos
```
atoms/
├── Button/
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   ├── Button.test.tsx
│   └── index.ts
├── Input/
├── Badge/
└── Icon/

molecules/
├── SearchBox/
├── DataCard/
└── FormField/

organisms/
├── DataTable/
├── Navigation/
└── Dashboard/

templates/
├── PageLayout/
└── AuthLayout/
```

#### 2. Exemplo de Componente Premium
```typescript
// components/atoms/Button/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm', 
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" size={size} />}
      {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}
```

---

## 🏛️ Arquitetura Backend Premium

### 1. Estrutura de Pastas Enterprise
```
server/
├── src/
│   ├── controllers/     # Camada de apresentação
│   ├── services/        # Lógica de negócio
│   ├── repositories/    # Acesso a dados
│   ├── models/          # Entidades de domínio
│   ├── middleware/      # Middlewares customizados
│   ├── validators/      # Validação de entrada
│   ├── utils/           # Utilitários
│   ├── config/          # Configurações
│   └── types/           # Tipos TypeScript
├── tests/
├── docs/
└── migrations/
```

### 2. Padrão Repository + Service
```typescript
// repositories/AssetRepository.ts
export interface IAssetRepository {
  findAll(filters: AssetFilters): Promise<PaginatedResult<Asset>>
  findById(id: string): Promise<Asset | null>
  create(asset: CreateAssetDto): Promise<Asset>
  update(id: string, asset: UpdateAssetDto): Promise<Asset>
  delete(id: string): Promise<void>
}

export class AssetRepository implements IAssetRepository {
  constructor(private db: Database) {}
  
  async findAll(filters: AssetFilters): Promise<PaginatedResult<Asset>> {
    // Implementação com query builder para evitar SQL injection
    const query = this.buildQuery(filters)
    const [assets, total] = await Promise.all([
      this.db.query(query.sql, query.params),
      this.db.query(query.countSql, query.params)
    ])
    
    return {
      data: assets.map(row => this.mapToEntity(row)),
      pagination: this.buildPagination(total[0].count, filters)
    }
  }
}

// services/AssetService.ts
export class AssetService {
  constructor(
    private assetRepository: IAssetRepository,
    private movementService: IMovementService,
    private logger: ILogger
  ) {}
  
  async createAsset(dto: CreateAssetDto): Promise<Asset> {
    // Validação de negócio
    await this.validateUniqueConstraints(dto)
    
    // Log da operação
    this.logger.info('Creating asset', { dto })
    
    try {
      const asset = await this.assetRepository.create(dto)
      
      // Event sourcing
      await this.movementService.recordCreation(asset)
      
      return asset
    } catch (error) {
      this.logger.error('Failed to create asset', { dto, error })
      throw new BusinessError('Failed to create asset')
    }
  }
}
```

### 3. Validação Robusta com Zod
```typescript
// validators/assetValidators.ts
import { z } from 'zod'

export const createAssetSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nome contém caracteres inválidos'),
    
  serialNumber: z.string()
    .min(1, 'Número de série é obrigatório')
    .max(50, 'Número de série deve ter no máximo 50 caracteres')
    .regex(/^[A-Z0-9\-]+$/, 'Formato de serial inválido'),
    
  patrimonyTag: z.string()
    .min(1, 'Tag de patrimônio é obrigatória')
    .regex(/^PAT\d{3,6}$/, 'Tag deve seguir o padrão PAT000'),
    
  category: z.enum(['Hardware', 'Periférico', 'Licença']),
  
  purchaseValue: z.number()
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor muito alto')
    .optional(),
    
  warrantyExpiry: z.date()
    .min(new Date(), 'Data de garantia deve ser futura')
    .optional()
})

export type CreateAssetDto = z.infer<typeof createAssetSchema>
```

---

## 🔒 Segurança Premium (OWASP)

### 1. Autenticação Robusta
```typescript
// services/AuthService.ts
export class AuthService {
  private readonly JWT_ACCESS_EXPIRY = '15m'
  private readonly JWT_REFRESH_EXPIRY = '7d'
  private readonly MAX_LOGIN_ATTEMPTS = 5
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 min
  
  async login(credentials: LoginDto): Promise<AuthResult> {
    // Rate limiting por IP
    await this.checkRateLimit(credentials.ip)
    
    // Verificar tentativas de login
    await this.checkLoginAttempts(credentials.username)
    
    // Validar credenciais
    const user = await this.validateCredentials(credentials)
    
    // Gerar tokens
    const tokens = await this.generateTokenPair(user)
    
    // Log de auditoria
    this.auditLogger.info('User login', {
      userId: user.id,
      ip: credentials.ip,
      userAgent: credentials.userAgent
    })
    
    return { user, tokens }
  }
  
  private async generateTokenPair(user: User): Promise<TokenPair> {
    const payload = { 
      sub: user.id, 
      role: user.role,
      iat: Date.now() 
    }
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.sign(payload, { expiresIn: this.JWT_ACCESS_EXPIRY }),
      this.jwtService.sign(payload, { expiresIn: this.JWT_REFRESH_EXPIRY })
    ])
    
    // Armazenar refresh token hasheado
    await this.tokenRepository.store(user.id, await bcrypt.hash(refreshToken, 12))
    
    return { accessToken, refreshToken }
  }
}
```

### 2. Middleware de Segurança
```typescript
// middleware/security.ts
export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      }
    }
  }),
  
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: 'Muitas tentativas, tente novamente em 15 minutos',
    standardHeaders: true,
    legacyHeaders: false
  }),
  
  // Sanitização de inputs
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      req.body = sanitizeObject(req.body)
    }
    if (req.query) {
      req.query = sanitizeObject(req.query)
    }
    next()
  }
]

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return validator.escape(obj.trim())
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[validator.escape(key)] = sanitizeObject(value)
    }
    return sanitized
  }
  return obj
}
```

---

## ⚡ Performance & Otimização

### 1. Cache Strategy
```typescript
// services/CacheService.ts
export class CacheService {
  constructor(private redis: Redis) {}
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key)
    return cached ? JSON.parse(cached) : null
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}

// Decorator para cache automático
export function Cacheable(ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
      
      let result = await this.cacheService.get(cacheKey)
      if (!result) {
        result = await method.apply(this, args)
        await this.cacheService.set(cacheKey, result, ttl)
      }
      
      return result
    }
  }
}
```

### 2. Database Optimization
```typescript
// repositories/BaseRepository.ts
export abstract class BaseRepository<T> {
  constructor(protected db: Database) {}
  
  // Query builder para evitar N+1
  protected buildIncludeQuery(includes: string[]): string {
    const joins = includes.map(include => {
      switch (include) {
        case 'movements':
          return 'LEFT JOIN movements m ON m.asset_id = a.id'
        case 'user':
          return 'LEFT JOIN users u ON u.id = a.created_by'
        default:
          return ''
      }
    }).filter(Boolean)
    
    return joins.join(' ')
  }
  
  // Paginação otimizada
  protected buildPaginationQuery(page: number, limit: number): string {
    const offset = (page - 1) * limit
    return `LIMIT ${limit} OFFSET ${offset}`
  }
  
  // Índices sugeridos
  protected async createIndexes(): Promise<void> {
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
      CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
      CREATE INDEX IF NOT EXISTS idx_movements_asset_id ON movements(asset_id);
      CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(movement_date);
    `)
  }
}
```

---

## 🔧 Troubleshooting (Windows)

### Problemas Comuns e Soluções

#### 1. Node.js não encontrado
```bash
# Verificar se Node.js está instalado
node --version
npm --version

# Se não estiver instalado, baixar de: https://nodejs.org/
# Escolher versão LTS (Long Term Support)
```

#### 2. Erro "EBUSY: resource busy or locked"
```bash
# Parar todos os processos Node.js
taskkill /f /im node.exe

# Ou usar Ctrl+C no terminal e aguardar
# Depois reiniciar: npm run dev
```

#### 3. Verificação de Portas e Serviços
```bash
# Verificar se as portas estão sendo usadas
netstat -ano | findstr :3001  # Backend
netstat -ano | findstr :5173  # Frontend

# Testar conectividade dos serviços
curl -s http://localhost:3001/health  # API Health Check
curl -s -I http://localhost:5173      # Frontend Status

# Verificar se ambos os serviços estão rodando
# Deve mostrar [0] para backend e [1] para frontend nos logs
npm run dev
```

#### 4. Porta já em uso
```bash
# Verificar processos usando as portas
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Matar processo específico (substitua PID)
taskkill /f /pid <PID>
```

#### 4. Problemas com SQLite
```bash
# Verificar se o banco existe
ls -la server/database.sqlite

# Se corrompido, resetar:
rm server/database.sqlite
touch server/database/.reset_flag
npm run server:dev
```

#### 5. Dependências desatualizadas
```bash
# Verificar dependências desatualizadas
npm outdated
cd client && npm outdated

# Atualizar (cuidado com breaking changes)
npm update
cd client && npm update
```

#### 6. Problemas de permissão (Windows)
```bash
# Executar Git Bash como Administrador se necessário
# Ou verificar permissões da pasta do projeto
```

### 🚨 Logs de Erro Importantes

#### Backend (Porta 3001)
- **"SQLITE_ERROR: no such table"** → Banco precisa ser resetado
- **"EADDRINUSE"** → Porta já em uso
- **"MODULE_NOT_FOUND"** → Dependência faltando

#### Frontend (Porta 5173)
- **"Failed to resolve import"** → Dependência não instalada
- **"Network Error"** → Backend não está rodando
- **"CORS Error"** → Configuração de CORS no backend

---

### 1. Checklist de Funcionalidades Críticas
```markdown
## Autenticação
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas
- [ ] Logout funcional
- [ ] Redirecionamento após expiração do token

## Gestão de Ativos
- [ ] Criar ativo com dados válidos
- [ ] Validação de campos obrigatórios
- [ ] Validação de unicidade (serial/tag)
- [ ] Edição de ativo existente
- [ ] Busca por tag/serial/nome
- [ ] Filtros por categoria/status

## Movimentações
- [ ] Check-out (Disponível → Em Uso)
- [ ] Check-in (Em Uso → Disponível)
- [ ] Registro de manutenção
- [ ] Histórico de movimentações
- [ ] Validação de status correto

## Dashboard
- [ ] Métricas atualizadas
- [ ] Gráficos carregando
- [ ] Alertas de garantia
- [ ] Movimentações recentes

## Relatórios
- [ ] Exportação CSV funcional
- [ ] Exportação PDF funcional
- [ ] Filtros aplicados corretamente
- [ ] Download de arquivos
```

### 2. Cenários de Teste Manuais
```typescript
// Cenários críticos para validação manual

// 1. Fluxo Completo de Ativo
/*
1. Login como admin
2. Criar novo ativo (Hardware)
3. Fazer check-out para colaborador
4. Verificar status "Em Uso" no dashboard
5. Fazer check-in
6. Verificar status "Disponível"
7. Gerar relatório com o ativo
*/

// 2. Validação de Segurança
/*
1. Tentar acessar sem login → Redirect para /login
2. Login como viewer → Não deve ver botões de edição
3. Tentar acessar API sem token → 401 Unauthorized
4. Token expirado → Redirect para login
*/

// 3. Validação de Dados
/*
1. Criar ativo com serial duplicado → Erro
2. Criar ativo com tag duplicada → Erro
3. Check-out de ativo já em uso → Erro
4. Check-in de ativo disponível → Erro
*/
```

### 3. Ferramentas de Apoio para Testes Manuais
```typescript
// utils/testHelpers.ts - Helpers para facilitar testes manuais
export const testData = {
  validAsset: {
    name: 'Test Laptop Dell',
    brand_model: 'Dell Inspiron 15',
    serial_number: `TEST${Date.now()}`,
    patrimony_tag: `PAT${Date.now()}`,
    category: 'Hardware' as const
  },
  
  validMovement: {
    employee_name: 'João Silva',
    destination: 'Setor TI',
    responsible_technician: 'Admin Test',
    observations: 'Teste de movimentação'
  }
}

// Função para limpar dados de teste
export const cleanupTestData = async () => {
  // Remover ativos de teste criados
  await api.delete('/assets/cleanup-test-data')
}

// Função para criar dados de teste em massa
export const seedTestData = async () => {
  const assets = Array.from({ length: 10 }, (_, i) => ({
    ...testData.validAsset,
    name: `Test Asset ${i + 1}`,
    serial_number: `TEST${i + 1}${Date.now()}`,
    patrimony_tag: `PAT${i + 1}${Date.now()}`
  }))
  
  for (const asset of assets) {
    await api.post('/assets', asset)
  }
}
```

---

## 📊 Monitoring & Observability

### 1. Logging Estruturado
```typescript
// utils/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'inventory-system' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})
```

### 2. Métricas de Performance
```typescript
// middleware/metrics.ts
import { Request, Response, NextFunction } from 'express'
import { performance } from 'perf_hooks'

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now()
  
  res.on('finish', () => {
    const duration = performance.now() - start
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    })
    
    // Enviar métricas para sistema de monitoramento
    metrics.histogram('http_request_duration', duration, {
      method: req.method,
      route: req.route?.path || req.url,
      status_code: res.statusCode.toString()
    })
  })
  
  next()
}
```

---

## 🚀 Deployment Local

### 1. Scripts de Deploy Simplificados
```json
// package.json - Scripts úteis
{
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "build": "cd client && npm run build",
    "start": "node server/index.js",
    "backup:db": "cp server/database.sqlite backups/database-$(date +%Y%m%d-%H%M%S).sqlite",
    "restore:db": "cp backups/$1 server/database.sqlite",
    "reset:db": "rm server/database.sqlite && npm run server:dev",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix"
  }
}
```

### 2. Checklist de Deploy Manual
```markdown
## Pré-Deploy
- [ ] Backup do banco de dados atual
- [ ] Verificar se todas as dependências estão instaladas
- [ ] Executar lint e corrigir erros
- [ ] Testar funcionalidades críticas localmente
- [ ] Verificar logs de erro no console

## Deploy
- [ ] Parar aplicação atual
- [ ] Fazer pull das mudanças
- [ ] Instalar novas dependências (se houver)
- [ ] Executar build do frontend
- [ ] Iniciar aplicação
- [ ] Verificar se serviços estão rodando

## Pós-Deploy
- [ ] Testar login e funcionalidades principais
- [ ] Verificar logs de erro
- [ ] Confirmar que dashboard carrega corretamente
- [ ] Testar uma movimentação completa
- [ ] Verificar exportação de relatórios
```

### 3. Scripts de Manutenção
```bash
#!/bin/bash
# scripts/backup.sh
echo "🔄 Fazendo backup do banco de dados..."
mkdir -p backups
cp server/database.sqlite "backups/database-$(date +%Y%m%d-%H%M%S).sqlite"
echo "✅ Backup concluído!"

# scripts/deploy.sh
#!/bin/bash
echo "🚀 Iniciando deploy..."

# Backup
./scripts/backup.sh

# Parar processos
echo "⏹️ Parando aplicação..."
pkill -f "npm run dev" || true

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm install
cd client && npm install && cd ..

# Build
echo "🔨 Fazendo build..."
npm run build

# Iniciar
echo "▶️ Iniciando aplicação..."
npm run dev

echo "✅ Deploy concluído!"
```

---

## 📝 Code Standards

### 1. ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:security/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off",
    "security/detect-object-injection": "error",
    "complexity": ["error", 10],
    "max-lines-per-function": ["error", 50]
  }
}
```

### 2. Prettier Configuration
```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## 🎯 Performance Targets

### Frontend
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 500KB gzipped

### Backend
- **Response Time**: < 200ms (95th percentile)
- **Throughput**: > 1000 req/s
- **Error Rate**: < 0.1%
- **Database Query Time**: < 50ms (95th percentile)

---

## 🔄 Git Workflow

### Branch Strategy
```
main (production)
├── develop (staging)
├── feature/INV-123-asset-search
├── hotfix/INV-456-security-patch
└── release/v1.2.0
```

### Commit Convention
```
feat(assets): add advanced search functionality
fix(auth): resolve JWT token expiration issue
docs(api): update authentication endpoints
test(movements): add unit tests for checkout flow
refactor(db): optimize asset queries
```

### 📤 Regra Obrigatória: Atualização do Repositório Remoto

**IMPORTANTE**: Após finalização de correções e/ou novas funcionalidades, é **OBRIGATÓRIO** atualizar o repositório remoto.

#### Fluxo de Atualização
```bash
# 1. Verificar status dos arquivos
git status

# 2. Adicionar arquivos modificados
git add .

# 3. Commit com mensagem descritiva seguindo convenção
git commit -m "feat(inventory): implementar nova funcionalidade X"
# ou
git commit -m "fix(database): corrigir problema Y"

# 4. Atualizar repositório remoto
git push origin main
# ou para branch específica
git push origin feature/nome-da-feature
```

#### Checklist Pré-Push
- [ ] Testar funcionalidades localmente
- [ ] Verificar se não há erros no console
- [ ] Confirmar que build está funcionando
- [ ] Executar `npm run lint` e corrigir erros
- [ ] Verificar se banco de dados está funcionando
- [ ] Commit com mensagem clara e descritiva

#### Mensagens de Commit Recomendadas
```bash
# Para correções
git commit -m "fix(auth): corrigir validação de token JWT"
git commit -m "fix(database): resolver problema de inicialização"

# Para novas funcionalidades  
git commit -m "feat(assets): adicionar busca avançada de ativos"
git commit -m "feat(reports): implementar exportação PDF"

# Para melhorias
git commit -m "refactor(api): otimizar queries do dashboard"
git commit -m "style(ui): melhorar responsividade da tabela"

# Para documentação
git commit -m "docs(readme): atualizar instruções de instalação"
```

#### ⚠️ Regras Importantes
- **NUNCA** fazer push sem testar localmente
- **SEMPRE** usar mensagens de commit descritivas
- **OBRIGATÓRIO** fazer backup do banco antes de mudanças críticas
- **RECOMENDADO** fazer pull antes de push para evitar conflitos

```bash
# Fluxo completo recomendado
git pull origin main          # Atualizar com mudanças remotas
git add .                     # Adicionar mudanças
git commit -m "mensagem"      # Commit local
git push origin main          # Enviar para repositório remoto
```

---

## 📚 Documentation Standards

### API Documentation
- **OpenAPI 3.0** specification
- **Postman Collections** para testes
- **Changelog** detalhado para cada release
- **Architecture Decision Records (ADRs)**

### Code Documentation
```typescript
/**
 * Creates a new asset in the inventory system
 * 
 * @param dto - Asset creation data transfer object
 * @returns Promise resolving to the created asset
 * 
 * @throws {ValidationError} When input data is invalid
 * @throws {ConflictError} When serial number or patrimony tag already exists
 * @throws {BusinessError} When business rules are violated
 * 
 * @example
 * ```typescript
 * const asset = await assetService.createAsset({
 *   name: 'Dell Laptop',
 *   serialNumber: 'DL001',
 *   patrimonyTag: 'PAT001',
 *   category: 'Hardware'
 * })
 * ```
 */
async createAsset(dto: CreateAssetDto): Promise<Asset> {
  // Implementation
}
```

---

## ⚠️ Alertas Críticos

### Nunca Faça
- ❌ Hardcode secrets no código
- ❌ SQL queries concatenadas (SQL injection)
- ❌ Componentes com mais de 300 linhas
- ❌ Funções com mais de 50 linhas
- ❌ Commits diretos na main
- ❌ Deploy sem testes
- ❌ Logs com dados sensíveis

### Sempre Faça
- ✅ Validação de entrada em todas as camadas
- ✅ Testes automatizados para novas features
- ✅ Code review obrigatório
- ✅ Documentação atualizada
- ✅ Monitoramento de performance
- ✅ Backup regular do banco
- ✅ Versionamento semântico

---

*Este guia deve ser revisado trimestralmente e atualizado conforme evolução do projeto e novas best practices da indústria.*