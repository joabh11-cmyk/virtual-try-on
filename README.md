# 👗 Virtual Try-On Pro (Provador Virtual com IA)

> Experimente qualquer peça de roupa em qualquer pessoa utilizando o poder dos modelos de inteligência artificial de última geração do **Google Gemini**.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/joabh11-cmyk/virtual-try-on)
![React 19](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-6-purple?logo=vite)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-3_Pro-orange?logo=google)
![Netlify](https://img.shields.io/badge/Netlify-Ready-00C7B7?logo=netlify)

---

## ✨ O que é este projeto?

O **Virtual Try-On Pro** é uma aplicação web moderna que permite a qualquer pessoa:
1. Enviar uma foto sua (de corpo inteiro ou meio corpo).
2. Enviar a foto de uma peça de roupa (camiseta, calça, vestido, casaco, etc.).
3. Gerar instantaneamente uma nova imagem foto-realista da pessoa vestindo aquela roupa, preservando a identidade, postura, sombras e iluminação natural.

Toda a geração acontece de ponta a ponta com privacidade: **as imagens não são armazenadas em servidores** e o visitante utiliza sua própria chave gratuita da API Gemini (salva exclusivamente no próprio navegador).

---

## 🔑 Passo 1: Como obter sua chave gratuita do Google Gemini

Para usar o aplicativo, você precisa de uma chave de API do Google Gemini. O Google oferece uma cota **100% gratuita** para uso pessoal e testes:

1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Faça login com sua conta do Google.
3. Clique no botão azul **"Create API key"** (Criar chave de API).
4. Selecione ou crie um projeto e copie a chave gerada (ela começa com `AIzaSy...`).
5. Cole essa chave diretamente na tela inicial do Virtual Try-On quando solicitado.

---

## 🚀 Passo 2: Como Publicar no Netlify (Grátis e em 3 Minutos)

Este repositório já está configurado com o arquivo `netlify.toml` para que o deploy funcione de primeira, sem precisar de configurações complicadas de servidor.

### Opção A — Clique no Botão de Deploy (Mais Rápido):
Clique no botão abaixo para iniciar a importação direta no seu Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/joabh11-cmyk/virtual-try-on)

### Opção B — Manualmente pelo Painel do Netlify:
1. Crie uma conta gratuita em [netlify.com](https://www.netlify.com).
2. No painel inicial, clique em **"Add new site"** e selecione **"Import an existing project"**.
3. Escolha **GitHub** e dê permissão para acessar o repositório `virtual-try-on`.
4. As configurações de Build serão detectadas automaticamente:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Clique em **"Deploy virtual-try-on"**.
6. Em menos de 1 minuto, o Netlify gerará uma URL pública (exemplo: `https://seu-projeto.netlify.app`) pronta para você compartilhar ou usar!

---

## 💻 Passo 3: Como Rodar no seu Computador (Localhost)

Se você preferir executar o projeto no seu computador:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/joabh11-cmyk/virtual-try-on.git
   cd virtual-try-on
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. Abra `http://localhost:3000` no seu navegador e cole sua chave do Gemini.

---

## 🛠️ Suporte VIP e Serviço de Instalação Profissional

> 💡 **Achou complicado? Não quer perder tempo ou precisa do sistema personalizado para a sua loja ou marca?**

Se você teve qualquer dificuldade para instalar, precisa de ajuda ou quer o aplicativo configurado de forma profissional com:
- ✅ **Instalação completa e deploy no ar** sem você precisar tocar em código
- ✅ **Configuração de domínio próprio** (ex: `provador.sualoja.com.br`)
- ✅ **Personalização de logo, cores e identidade visual** da sua marca
- ✅ **Integração com e-commerce ou catálogo**
- ✅ **Suporte prioritário e consultoria**

📲 **Fale diretamente comigo para contratar a instalação:**
- **Instagram:** [@joabh11](https://instagram.com) *(envie um direct com a mensagem: "Quero ajuda com o Virtual Try-On")*
- **E-mail:** [joabh11@hotmail.com](mailto:joabh11@hotmail.com)

---

## ⚙️ Tecnologias Utilizadas

- **React 19** com TypeScript
- **Vite** para build ultrarrápido
- **Tailwind CSS** para design responsivo e moderno
- **Google GenAI SDK** (`@google/genai`) com modelo multimodal Gemini 3 Pro
- **Netlify** para hospedagem e CDN global

---

## 📄 Licença

Este projeto é disponibilizado para estudo, uso pessoal e demonstração comercial. Sinta-se livre para usar e compartilhar com os devidos créditos!
