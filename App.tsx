import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateTryOnImage } from './services/geminiService';
import { UploadedImage, AppState } from './types';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [tempKeyInput, setTempKeyInput] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [userPhoto, setUserPhoto] = useState<UploadedImage | null>(null);
  const [clothingPhoto, setClothingPhoto] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Carrega chave salva no LocalStorage ou variável de ambiente (Vite)
    const savedKey = localStorage.getItem('gemini_api_key');
    const envKey = (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : '';

    if (savedKey) {
      setApiKey(savedKey);
      setTempKeyInput(savedKey);
    } else if (envKey) {
      setApiKey(envKey);
      setTempKeyInput(envKey);
    }
  }, []);

  const handleSaveKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = tempKeyInput.trim();
    if (!cleanKey) {
      setKeyError('Por favor, informe uma chave de API válida.');
      return;
    }
    localStorage.setItem('gemini_api_key', cleanKey);
    setApiKey(cleanKey);
    setKeyError(null);
    setShowKeyModal(false);
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setTempKeyInput('');
    setShowKeyModal(false);
  };

  const handleOpenKeyModal = () => {
    setTempKeyInput(apiKey);
    setKeyError(null);
    setShowKeyModal(true);
  };

  const handleGenerate = async () => {
    if (!userPhoto || !clothingPhoto) return;

    if (!apiKey) {
      handleOpenKeyModal();
      return;
    }

    setAppState(AppState.GENERATING);
    setErrorMessage(null);
    setResultImage(null);

    try {
      const generatedImage = await generateTryOnImage(userPhoto, clothingPhoto, prompt, apiKey);
      setResultImage(generatedImage);
      setAppState(AppState.SUCCESS);
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
        setErrorMessage(
          'O modelo de geração de imagem do Gemini (Gemini 3 Pro) exige um projeto com faturamento (Billing) ativado no Google AI Studio. No plano sem cartão cadastrado, o Google define cota zero para geração de imagens. Ative o faturamento no Google AI Studio (novas contas recebem US$ 300 em créditos de teste).'
        );
      } else if (error.message === 'AUTH_REQUIRED' || msg.includes('API_KEY')) {
        setErrorMessage('Sua chave de API do Gemini parece ser inválida ou expirou. Por favor, atualize sua chave.');
      } else {
        setErrorMessage(msg || 'Algo deu errado. Tente fotos com fundo mais simples.');
      }
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setUserPhoto(null);
    setClothingPhoto(null);
    setPrompt('');
    setResultImage(null);
    setAppState(AppState.IDLE);
    setErrorMessage(null);
  };

  const isReady = userPhoto && clothingPhoto;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                Virtual Try-On Pro
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenKeyModal}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                apiKey
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {apiKey ? 'Chave Conectada' : 'Inserir Chave Gemini'}
            </button>
            <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              Gemini 3 Pro
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Passo 1: Upload</h2>
              <p className="text-slate-500 text-sm mb-6">Envie sua foto e a peça de roupa.</p>
              
              <div className="space-y-6">
                <ImageUploader 
                  id="user-photo" 
                  label="1. Sua Foto (Corpo Inteiro é melhor)" 
                  image={userPhoto} 
                  onImageChange={setUserPhoto} 
                />
                
                <div className="flex items-center justify-center -my-3 z-10 relative">
                  <div className="bg-slate-100 p-1.5 rounded-full border border-slate-200 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </div>

                <ImageUploader 
                  id="clothing-photo" 
                  label="2. Foto da Roupa (Fundo limpo)" 
                  image={clothingPhoto} 
                  onImageChange={setClothingPhoto} 
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">
                Instruções Extras (Opcional)
              </label>
              <textarea
                id="prompt"
                rows={3}
                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none text-sm p-3 border"
                placeholder="Ex: Deixe a camiseta por dentro da calça, mude o fundo para um escritório..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!isReady || appState === AppState.GENERATING}
              className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-white font-semibold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                !isReady || appState === AppState.GENERATING
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-500/25'
              }`}
            >
              {appState === AppState.GENERATING ? (
                <span>Processando Alta Qualidade...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9.315 2.004a.75.75 0 0 1 .722 0l12 6.666a.75.75 0 0 1 0 1.309l-12 6.667a.75.75 0 0 1-.722 0l-12-6.667a.75.75 0 0 1 0-1.309l12-6.666Zm.82 13.921V9.524l5.166 2.87-5.166 3.53Zm-1.5 0L3.469 12.394l5.166-2.87v6.401Zm1.5-8.23-5.165 2.87-5.166-2.87 5.166-2.87 5.166-2.87Z" clipRule="evenodd" />
                  </svg>
                  <span>Gerar Provador Virtual</span>
                </>
              )}
            </button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7">
            <div className="h-full min-h-[500px] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col relative">
              <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Resultado</h3>
                {appState === AppState.SUCCESS && (
                  <button 
                    onClick={handleReset}
                    className="text-sm text-slate-500 hover:text-slate-800 font-medium px-3 py-1 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Começar de novo
                  </button>
                )}
              </div>
              
              <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/30">
                {appState === AppState.IDLE && (
                  <div className="text-center max-w-sm mx-auto p-8 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                    <h4 className="text-slate-900 font-medium mb-1">Nenhum resultado ainda</h4>
                    <p className="text-slate-500 text-sm">Suba suas fotos e veja a mágica acontecer com IA de última geração.</p>
                  </div>
                )}

                {appState === AppState.GENERATING && (
                  <LoadingSpinner />
                )}

                {appState === AppState.ERROR && (
                  <div className="text-center p-8 max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                    </div>
                    <h4 className="text-red-700 font-medium mb-2">Erro na Geração</h4>
                    <p className="text-red-600/80 text-sm mb-6">{errorMessage}</p>
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={handleOpenKeyModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow"
                      >
                        Verificar Chave
                      </button>
                      <button 
                        onClick={handleGenerate}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  </div>
                )}

                {appState === AppState.SUCCESS && resultImage && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center group">
                    <img 
                      src={resultImage} 
                      alt="Generated Try-On" 
                      className="max-h-[600px] w-auto max-w-full rounded-lg shadow-md object-contain"
                    />
                    <div className="absolute bottom-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <a 
                        href={resultImage} 
                        download="meu-look-ai.png"
                        className="px-6 py-3 bg-white/90 backdrop-blur text-indigo-600 rounded-full font-bold shadow-xl hover:bg-white flex items-center gap-2 border border-indigo-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3.25-3.25m3.25 3.25 3.25-3.25M12 12.75V3.75" />
                        </svg>
                        Baixar Resultado
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal / Overlay para Configuração de Chave de API */}
      {(!apiKey || showKeyModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-100">
            {apiKey && (
              <button 
                onClick={() => setShowKeyModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 1 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-900 text-center mb-1">
              {apiKey ? 'Configurar Chave Gemini' : 'Bem-vindo ao Provador AI'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm text-center mb-6">
              Para processar as imagens com o modelo de alta precisão do Google Gemini, você precisa informar sua chave de API gratuita.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Sua Chave de API (Gemini)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={tempKeyInput}
                    onChange={(e) => setTempKeyInput(e.target.value)}
                    placeholder="Cole sua chave (AQ... ou AIza...)"
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
                {keyError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{keyError}</p>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Como obter sua chave gratuita:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-500">
                  <li>Acesse o <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-medium hover:text-indigo-700">Google AI Studio</a></li>
                  <li>Faça login com sua conta Google</li>
                  <li>Clique em <strong>"Create API key"</strong> e copie a chave gerada</li>
                </ol>
                <p className="text-[11px] text-slate-400 pt-1">
                  🔒 Sua chave é salva exclusivamente no seu próprio navegador e nunca é armazenada em servidores externos.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-indigo-500/25 text-sm"
                >
                  {apiKey ? 'Salvar e Atualizar' : 'Salvar e Começar'}
                </button>

                {apiKey && (
                  <button
                    type="button"
                    onClick={handleRemoveKey}
                    className="w-full py-2.5 bg-transparent hover:bg-red-50 text-red-600 rounded-xl transition-colors text-xs font-semibold"
                  >
                    Remover Chave Salva
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
