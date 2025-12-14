# 🎵 Gerador de Playlists Spotify com IA (Gemini)

Este é um backend robusto desenvolvido em **Node.js** e **TypeScript** que utiliza Inteligência Artificial (Google Gemini) para criar playlists personalizadas no Spotify baseadas no seu perfil musical.

## 🚀 Tecnologias

-   **Node.js & TypeScript**: Base sólida e tipada.
-   **Clean Architecture**: Código organizado em camadas (Domain, Application, Infra, Presentation).
-   **Spotify Web API**: Para buscar dados do usuário e criar playlists.
-   **Google Gemini 1.5 Flash**: IA para análise de perfil e definição de conceitos criativos.
-   **OAuth 2.0**: Autenticação segura com o Spotify.

---

## 🛠️ Pré-requisitos

1.  **Node.js** instalado (versão 18 ou superior recomendada).
2.  Uma conta no **Spotify**.
3.  Uma conta no **Google AI Studio** (para pegar a chave da API).

---

## ⚙️ Configuração Passo a Passo

### 1. Clonar e Instalar
Abra o terminal na pasta do projeto e instale as dependências:
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo chamado `.env` na raiz do projeto (copie o `.env.example`).
Preencha com suas chaves:

```ini
# No arquivo .env:

# Pegue em: https://developer.spotify.com/dashboard
SPOTIFY_CLIENT_ID=seu_client_id_aqui
SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# Pegue em: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=sua_chave_gemini_aqui

PORT=3000
```
> **Atenção**: No painel do Spotify, não esqueça de adicionar `http://localhost:3000/auth/callback` nas configurações de "Redirect URIs".

---

## ▶️ Como Rodar

### Modo de Desenvolvimento (com auto-reload)
```bash
npx nodemon src/main.ts
```

### Modo de Produção (compilado)
```bash
npm run build
npm start
```

O servidor iniciará em `http://localhost:3000`.

---

## 🎮 Como Usar

### 1. Autenticação
Acesse no seu navegador:
👉 **[http://localhost:3000/auth/login](http://localhost:3000/auth/login)**

Faça login com sua conta do Spotify e aceite as permissões. Você verá uma mensagem de sucesso.

### 2. Gerar Playlist
Agora, peça para a IA criar sua playlist. Você pode usar o **Postman**, **Insomnia** ou o próprio terminal (cURL).

**Método**: `POST`
**URL**: `http://localhost:3000/playlist/generate`

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3000/playlist/generate
```

### O que acontece nos bastidores?
1.  O sistema busca suas músicas e artistas mais ouvidos no Spotify.
2.  Calcula métricas como energia média, humor (valência) e gêneros favoritos.
3.  Envia esses dados para o **Gemini 1.5 Flash**.
4.  A IA retorna um **Conceito** (nome criativo, descrição e filtros matemáticos).
5.  O sistema busca novas músicas no Spotify que se encaixem nesse conceito.
6.  A playlist é criada magicamente na sua conta! ✨

---

## 📂 Estrutura do Projeto (Clean Architecture)

-   `src/domain`: Regras de negócio e Entidades (o coração do app).
-   `src/application`: Casos de uso (a lógica principal, ex: `CreatePlaylist`).
-   `src/infra`: Implementações externas (Spotify API, Gemini Client, Auth).
-   `src/presentation`: Controladores API (Express).

---

## 🐛 Solução de Problemas Comuns

-   **Erro de Autenticação**: Verifique se o `SPOTIFY_CLIENT_ID` e `SECRET` estão corretos e se a Redirect URI foi salva no dashboard do Spotify.
-   **Erro na da IA**: Verifique se sua `GEMINI_API_KEY` é válida e tem cota disponível (o plano gratuito do Gemini é generoso).
-   **Playlist vazia**: Pode acontecer se os critérios da IA forem muito restritivos. Tente gerar novamente.
