# 📱 Tutorial Completo - Sistema QR Code

## 🎯 **Como Gerar e Usar QR Codes no Sistema**

### **Passo 1: Fazer Login**
1. Acesse: `http://localhost:5173/login`
2. Use as credenciais:
   - **Admin**: `admin` / `admin123`
   - **Gerência**: `gerencia` / `viewer123`

### **Passo 2: Criar uma Transferência**
1. No menu lateral, clique em **"Transferências"**
2. Preencha os dados:
   - Selecione um **Ativo** (produto)
   - Escolha a **Loja de Destino**
   - Adicione **Observações**
   - Informe o **Responsável Técnico**
3. Clique em **"Confirmar Transferência"**

### **Passo 3: Gerar a Etiqueta com QR Code**
Após a transferência ser criada com sucesso:

1. **Aparecerá uma caixa verde** com a mensagem:
   ```
   ✅ Transferência realizada com sucesso!
   [Nome do Produto] → [Loja de Destino]
   ```

2. **Clique no botão azul**:
   ```
   📄 Imprimir Etiqueta de Envio
   ```

3. **Modal será aberto** mostrando:
   - Detalhes do produto
   - Loja de destino
   - Informações da transferência

4. **Clique em "Gerar Etiqueta"**
   - Um PDF será baixado automaticamente
   - O PDF contém o QR Code centralizado

### **Passo 4: Usar o QR Code**
1. **Abra o PDF baixado**
2. **No menu lateral**, clique em **"Scanner QR"** (tem destaque azul)
3. **Clique em "📱 Escanear QR Code"**
4. **Permita acesso à câmera**
5. **Aponte a câmera para o QR Code do PDF**
6. **O sistema detectará automaticamente** e preencherá os dados

---

## 🔍 **Onde Encontrar os QR Codes**

### **Opção 1: Menu "Scanner QR"**
- **Localização**: Menu lateral esquerdo
- **Aparência**: Destaque azul com badge "Novo"
- **Função**: Escanear QR Codes de etiquetas

### **Opção 2: Página de Teste**
- **URL**: `http://localhost:5173/test-qr`
- **Função**: Testar o scanner com QR Code de exemplo

### **Opção 3: Movimentações**
- **Menu**: "Movimentações"
- **Função**: Ver histórico de transferências criadas

---

## 🛠️ **Troubleshooting**

### **Problema: Não vejo o botão "Imprimir Etiqueta"**
**Solução**: 
1. Certifique-se de que a transferência foi criada com sucesso
2. O botão aparece apenas APÓS a confirmação da transferência
3. Procure pela caixa verde de sucesso

### **Problema: Scanner não funciona**
**Solução**:
1. Permita acesso à câmera quando solicitado
2. Use HTTPS ou localhost (necessário para câmera)
3. Teste na página: `http://localhost:5173/test-qr`

### **Problema: QR Code não é detectado**
**Solução**:
1. Certifique-se de que há boa iluminação
2. Mantenha o QR Code dentro da área destacada
3. Aguarde alguns segundos para detecção

---

## 📋 **Fluxo Completo de Teste**

### **1. Preparação**
```bash
# Certifique-se de que o sistema está rodando
npm run dev
```

### **2. Criar Transferência**
1. Login → Transferências
2. Selecionar produto e destino
3. Confirmar transferência
4. Clicar em "📄 Imprimir Etiqueta de Envio"
5. Baixar PDF com QR Code

### **3. Confirmar Recebimento**
1. Menu → Scanner QR
2. Escanear QR Code do PDF
3. Preencher observações
4. Confirmar recebimento

---

## 🎯 **URLs Importantes**

- **Login**: `http://localhost:5173/login`
- **Transferências**: `http://localhost:5173/transfer`
- **Scanner QR**: `http://localhost:5173/confirmar-recebimento`
- **Teste QR**: `http://localhost:5173/test-qr`
- **Movimentações**: `http://localhost:5173/movements`

---

## ⚡ **Dicas Rápidas**

1. **O QR Code é gerado automaticamente** quando você clica em "Gerar Etiqueta"
2. **O PDF é baixado na pasta Downloads** do seu navegador
3. **O Scanner funciona melhor em dispositivos móveis**
4. **Use boa iluminação** para melhor detecção
5. **O QR Code contém a URL** para confirmação de recebimento

---

**🎉 Agora você sabe como usar todo o sistema de QR Code!**