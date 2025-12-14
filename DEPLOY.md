# Recomenfy Backend - Deploy na Vercel

## 🚀 Deploy Rápido

### 1. Instalar Vercel CLI (opcional)
```bash
npm i -g vercel
```

### 2. Deploy via CLI
```bash
cd back
vercel
```

Ou simplesmente conecte seu repositório GitHub na [Vercel Dashboard](https://vercel.com).

## ⚙️ Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel da Vercel:

### Spotify
- `SPOTIFY_CLIENT_ID` - Client ID do Spotify Developer
- `SPOTIFY_CLIENT_SECRET` - Client Secret do Spotify
- `SPOTIFY_REDIRECT_URI` - URL de callback (ex: `https://seu-app.vercel.app/auth/callback`)

### Google Gemini
- `GEMINI_API_KEY` - API Key do Google Gemini

### Supabase
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_ANON_KEY` - Anon/Public Key
- `SUPABASE_SERVICE_KEY` - Service Role Key (privada)

### JWT
- `JWT_SECRET` - String secreta para assinar tokens (gere uma aleatória)

### Outros
- `NODE_ENV` - `production`
- `PORT` - `3000` (opcional)

## 📝 Checklist de Deploy

- [ ] Criar aplicativo no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- [ ] Adicionar URL de callback do Spotify (ex: `https://seu-backend.vercel.app/auth/callback`)
- [ ] Criar projeto no [Supabase](https://supabase.com)
- [ ] Executar SQL do arquivo `database/schema.sql` no Supabase
- [ ] Obter API Key do [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Configurar todas as variáveis de ambiente na Vercel
- [ ] Fazer deploy do backend
- [ ] Atualizar `NEXT_PUBLIC_API_URL` no frontend com a URL do backend

## 🔧 Estrutura para Vercel

O projeto está configurado com:
- ✅ `vercel.json` - Configuração de rotas e build
- ✅ `main.ts` exporta o app Express
- ✅ TypeScript compilado automaticamente
- ✅ Serverless functions prontas

## 🌐 URLs Importantes

Após o deploy, você terá:
- **API Base**: `https://seu-backend.vercel.app`
- **Login**: `https://seu-backend.vercel.app/auth/login`
- **Callback**: `https://seu-backend.vercel.app/auth/callback`

## ⚠️ Importante

1. **CORS**: O backend já está configurado com CORS aberto. Em produção, considere restringir para apenas seu domínio frontend.

2. **Spotify Redirect URI**: Deve ser EXATAMENTE igual ao configurado no Spotify Developer Dashboard.

3. **Supabase Service Key**: Mantenha essa chave PRIVADA, nunca exponha no frontend.

4. **JWT Secret**: Use uma string longa e aleatória. Exemplo:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## 🐛 Troubleshooting

### Erro 404 nas rotas
- Verifique se o `vercel.json` está na raiz do projeto
- Confirme que todas as rotas estão redirecionando para `src/main.ts`

### Erro de CORS
- Adicione o domínio do frontend nas configurações de CORS
- Verifique se o frontend está usando a URL correta da API

### Erro de autenticação Spotify
- Confirme que o `SPOTIFY_REDIRECT_URI` está correto
- Verifique se a URL está cadastrada no Spotify Developer Dashboard

### Erro de conexão Supabase
- Verifique se todas as variáveis `SUPABASE_*` estão corretas
- Confirme que o SQL schema foi executado no Supabase
