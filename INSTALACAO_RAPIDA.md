# 🚀 Guia de Instalação Rápida - Sistema de Inventário TI

## ⚠️ PRÉ-REQUISITOS OBRIGATÓRIOS

Você precisa instalar manualmente (não é possível automatizar):

### 1. Node.js v18+ (LTS)
**Link de Download:** https://nodejs.org/

**Passos:**
1. Acesse o link acima
2. Clique no botão verde "Download Node.js (LTS)"
3. Execute o arquivo `.msi` baixado
4. Durante instalação, marque "Add to PATH"
5. Clique em "Next" até finalizar
6. Reinicie o terminal após instalação

### 2. Git for Windows
**Link de Download:** https://git-scm.com/download/win

**Passos:**
1. Acesse o link acima
2. Download inicia automaticamente
3. Execute o instalador
4. Aceite configurações padrão
5. Escolha "Git from command line and 3rd-party software"
6. Finalize a instalação

---

## ✅ VERIFICAR INSTALAÇÕES

Após instalar Node.js e Git, abra um NOVO terminal e execute:

```bash
node --version
npm --version
git --version
```

Se todos os comandos mostrarem versões, você está pronto!

---

## 🎯 INICIAR O PROJETO

### Passo 1: Instalar Dependências
```bash
cd c:\dev\estoqueti\estoqueti-master
npm run install:all
```

### Passo 2: Criar Arquivo de Configuração (Opcional)
```bash
# Criar .env na raiz do projeto
echo JWT_SECRET=minha-chave-secreta-super-segura-2024 > .env
echo PORT=3001 >> .env
echo NODE_ENV=development >> .env
```

### Passo 3: Iniciar o Sistema
```bash
npm run dev
```

Aguarde alguns segundos até ver:
```
[0] Server running on port 3001
[1] Local: http://localhost:5173
```

### Passo 4: Acessar no Navegador
- **Aplicação:** http://localhost:5173
- **API:** http://localhost:3001

---

## 👤 CREDENCIAIS DE ACESSO

### Administrador (Acesso Total)
- **Usuário:** admin
- **Senha:** admin123

### Gerência (Apenas Visualização)
- **Usuário:** gerencia
- **Senha:** viewer123

---

## 🔧 COMANDOS ÚTEIS

```bash
# Parar o sistema
Ctrl + C (no terminal)

# Reiniciar o sistema
npm run dev

# Instalar dependências novamente
npm run install:all

# Apenas backend
npm run server:dev

# Apenas frontend
npm run client:dev

# Verificar status
npm run health
```

---

## ⚠️ PROBLEMAS COMUNS

### "node não é reconhecido"
- Você não instalou o Node.js ou não reiniciou o terminal
- Solução: Instale Node.js e abra um NOVO terminal

### "git não é reconhecido"
- Você não instalou o Git ou não reiniciou o terminal
- Solução: Instale Git e abra um NOVO terminal

### "Porta já em uso"
```bash
# Verificar o que está usando a porta
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Matar processo (substitua <PID> pelo número mostrado)
taskkill /f /pid <PID>
```

### "Erro ao instalar dependências"
```bash
# Limpar cache do npm
npm cache clean --force

# Tentar novamente
npm run install:all
```

### "Banco de dados corrompido"
```bash
# Deletar banco e recriar
del server\database.sqlite
npm run server:dev
```

---

## 📊 ESTRUTURA DO PROJETO

```
estoqueti-master/
├── client/                 # Frontend (React + TypeScript)
│   ├── src/               # Código fonte
│   ├── public/            # Arquivos estáticos
│   └── package.json       # Dependências frontend
│
├── server/                # Backend (Node.js + Express)
│   ├── routes/            # Rotas da API
│   ├── database/          # SQLite
│   └── middleware/        # Middlewares
│
├── docs/                  # Documentação
├── package.json           # Dependências backend
├── .env                   # Variáveis de ambiente (criar)
└── README.md              # Documentação principal
```

---

## 🌐 PORTAS UTILIZADAS

- **Frontend (Vite):** 5173
- **Backend (Express):** 3001
- **Proxy:** Frontend → Backend (/api → :3001)

---

## 📱 FUNCIONALIDADES PRINCIPAIS

✅ Dashboard com métricas em tempo real
✅ Gestão completa de ativos (CRUD)
✅ Sistema de movimentações (entrada/saída)
✅ Modo Bip (scanner de código de barras)
✅ Transferências entre unidades
✅ QR Codes e etiquetas
✅ Relatórios externos (compartilhamento)
✅ Controle de estoque para insumos
✅ Autenticação JWT
✅ Auditoria completa

---

## 🆘 SUPORTE

Se encontrar problemas:
1. Verifique se Node.js e Git estão instalados
2. Certifique-se de estar na pasta correta do projeto
3. Tente reinstalar dependências: `npm run install:all`
4. Verifique os logs de erro no terminal
5. Consulte a documentação em `/docs`

---

**Desenvolvido com ❤️ para facilitar o controle de ativos de TI**
