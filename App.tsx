
import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateTryOnImage } from './services/geminiService';
import { UploadedImage, AppState } from './types';

// Fix: Define AIStudio interface and augment Window global with correct modifiers and type name
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [userPhoto, setUserPhoto] = useState<UploadedImage | null>(null);
  const [clothingPhoto, setClothingPhoto] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);
    } catch (e) {
      console.error("Error checking API key", e);
    }
  };

  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    setIsKeySelected(true); // Assume success per instructions
  };

  const handleGenerate = async () => {
    if (!userPhoto || !clothingPhoto) return;

    setAppState(AppState.GENERATING);
    setErrorMessage(null);
    setResultImage(null);

    try {
      const generatedImage = await generateTryOnImage(userPhoto, clothingPhoto, prompt);
      setResultImage(generatedImage);
      setAppState(AppState.SUCCESS);
    } catch (error: any) {
      if (error.message === "AUTH_REQUIRED") {
        setErrorMessage("Sua sessão de chave de API expirou ou é inválida. Por favor, reconecte.");
        setIsKeySelected(false);
      } else {
        setErrorMessage(error.message || "Algo deu errado. Tente fotos com fundo mais simples.");
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

  if (!isKeySelected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 1 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo ao Provador AI</h1>
          <p className="text-slate-600 mb-8">
            Para usar o modelo de alta qualidade <strong>Gemini 3 Pro</strong>, você precisa conectar sua própria chave de API.
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30"
          >
            Conectar Chave de API
          </button>
          <p className="mt-4 text-xs text-slate-400">
            Certifique-se de usar um projeto com <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-indigo-500">faturamento ativado</a>.
          </p>
        </div>
      </div>
    );
  }

  const isReady = userPhoto && clothingPhoto;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Virtual Try-On Pro
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSelectKey}
              className="text-xs font-medium px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 rounded-full transition-colors"
            >
              Alterar Chave
            </button>
            <span className="text-xs font-medium px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              Gemini 3 Pro
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
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
                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none text-sm"
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
                    <button 
                      onClick={handleGenerate}
                      className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Tentar Novamente
                    </button>
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
    </div>
  );
};

export default App;
