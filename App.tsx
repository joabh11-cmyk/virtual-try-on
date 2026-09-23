import React, { useState, useEffect, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateTryOnImage } from './services/geminiService';
import { saveLookToHistory, getLooksFromHistory, deleteLookFromHistory, SavedLook } from './services/historyStorage';
import { UploadedImage, AppState } from './types';

const App: React.FC = () => {
  // Configurações de API
  const [apiKey, setApiKey] = useState<string>('');
  const [tempKeyInput, setTempKeyInput] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Configurações White-Label (Marca da Loja)
  const [storeName, setStoreName] = useState<string>('Virtual Try-On Pro');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [tempStoreName, setTempStoreName] = useState<string>('Virtual Try-On Pro');
  const [tempStoreLogo, setTempStoreLogo] = useState<string | null>(null);
  const [showBrandingModal, setShowBrandingModal] = useState<boolean>(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Histórico de Looks (IndexedDB)
  const [history, setHistory] = useState<SavedLook[]>([]);

  // Modal WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [clientPhone, setClientPhone] = useState<string>('');
  const [whatsappMsg, setWhatsappMsg] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Estado do Aplicativo de Prova
  const [userPhoto, setUserPhoto] = useState<UploadedImage | null>(null);
  const [clothingPhoto, setClothingPhoto] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Carrega chave da API do LocalStorage ou variável de ambiente
    const savedKey = localStorage.getItem('gemini_api_key');
    const envKey = (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : '';

    if (savedKey) {
      setApiKey(savedKey);
      setTempKeyInput(savedKey);
    } else if (envKey) {
      setApiKey(envKey);
      setTempKeyInput(envKey);
    }

    // 2. Carrega personalização White-Label da loja
    const savedStoreName = localStorage.getItem('vto_store_name');
    if (savedStoreName) {
      setStoreName(savedStoreName);
      setTempStoreName(savedStoreName);
    }

    const savedStoreLogo = localStorage.getItem('vto_store_logo');
    if (savedStoreLogo) {
      setStoreLogo(savedStoreLogo);
      setTempStoreLogo(savedStoreLogo);
    }

    // 3. Carrega Histórico do IndexedDB
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const saved = await getLooksFromHistory();
    setHistory(saved);
  };

  // --- Handlers de Chave de API ---
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

  // --- Handlers de White-Label (Personalização de Marca) ---
  const handleOpenBrandingModal = () => {
    setTempStoreName(storeName);
    setTempStoreLogo(storeLogo);
    setShowBrandingModal(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Por favor, selecione uma imagem de até 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempStoreLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTempLogo = () => {
    setTempStoreLogo(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = tempStoreName.trim() || 'Virtual Try-On Pro';
    setStoreName(finalName);
    localStorage.setItem('vto_store_name', finalName);

    if (tempStoreLogo) {
      setStoreLogo(tempStoreLogo);
      localStorage.setItem('vto_store_logo', tempStoreLogo);
    } else {
      setStoreLogo(null);
      localStorage.removeItem('vto_store_logo');
    }

    setShowBrandingModal(false);
  };

  const handleResetBranding = () => {
    const defaultName = 'Virtual Try-On Pro';
    setStoreName(defaultName);
    setStoreLogo(null);
    setTempStoreName(defaultName);
    setTempStoreLogo(null);
    localStorage.removeItem('vto_store_name');
    localStorage.removeItem('vto_store_logo');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
    setShowBrandingModal(false);
  };

  // --- Handlers de Histórico ---
  const handleSelectHistoryLook = (look: SavedLook) => {
    setResultImage(look.image);
    setAppState(AppState.SUCCESS);
  };

  const handleDeleteHistoryLook = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteLookFromHistory(id);
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // --- Handlers de Envio por WhatsApp ---
  const handleOpenWhatsAppModal = () => {
    setWhatsappMsg(`Olá! Aqui está o resultado do seu look no Provador Virtual da ${storeName}! ✨ O que achou?`);
    setPhoneError(null);
    setShowWhatsAppModal(true);
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = clientPhone.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 8) {
      setPhoneError('Por favor, informe o DDD e número válido (ex: 11999998888).');
      return;
    }

    // Se informou DDD sem código do país (ex: 10 ou 11 dígitos no Brasil), adiciona 55
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }

    // Tenta compartilhamento nativo no celular (com anexo de arquivo)
    if (resultImage && typeof navigator !== 'undefined' && 'canShare' in navigator) {
      try {
        const res = await fetch(resultImage);
        const blob = await res.blob();
        const file = new File([blob], `${storeName.toLowerCase().replace(/\s+/g, '-')}-look.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Seu Look - ${storeName}`,
            text: whatsappMsg,
            files: [file]
          });
          setShowWhatsAppModal(false);
          return;
        }
      } catch (err) {
        console.log('Navegador não suportou share nativo com arquivo, usando link wa.me', err);
      }
    }

    // No desktop: baixa a imagem automaticamente para facilitar anexar no WhatsApp Web
    try {
      const downloadLink = document.createElement('a');
      downloadLink.href = resultImage!;
      downloadLink.download = `${storeName.toLowerCase().replace(/\s+/g, '-')}-look.png`;
      downloadLink.click();
    } catch (e) {
      console.error(e);
    }

    // Abre o WhatsApp Web / App diretamente na conversa com o número do cliente
    const encodedText = encodeURIComponent(`${whatsappMsg}\n\n(A imagem do look foi baixada e está pronta para você anexar na conversa!)`);
    const whatsappUrl = `https://wa.me/${cleaned}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    setShowWhatsAppModal(false);
  };

  // --- Geração do Provador Virtual ---
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

      // Salva no histórico do IndexedDB
      const newLook: SavedLook = {
        id: Date.now().toString(),
        image: generatedImage,
        date: Date.now(),
        prompt: prompt || undefined,
        storeName: storeName
      };
      await saveLookToHistory(newLook);
      setHistory(prev => [newLook, ...prev]);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 flex flex-col justify-between">
      <div>
        {/* Header White-Label */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            {/* Logo e Nome da Loja */}
            <div className="flex items-center gap-3">
              {storeLogo ? (
                <div className="h-11 max-w-[140px] sm:max-w-[180px] flex items-center justify-center overflow-hidden">
                  <img
                    src={storeLogo}
                    alt={storeName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl text-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-950 leading-tight">
                  {storeName}
                </h1>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  by <strong className="text-slate-600 font-semibold hover:text-indigo-600 transition-colors">BespokeTech</strong>
                </span>
              </div>
            </div>

            {/* Ações do Topo */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botão Personalizar Loja */}
              <button
                onClick={handleOpenBrandingModal}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs"
                title="Personalizar nome e logotipo da sua loja"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.39m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                </svg>
                <span className="hidden sm:inline">Personalizar Loja</span>
                <span className="sm:hidden">Marca</span>
              </button>

              {/* Indicador de Status da Chave de API (Verde se conectada, Vermelho se não) */}
              <button
                onClick={handleOpenKeyModal}
                className={`w-8 h-8 rounded-full transition-all flex items-center justify-center shadow-2xs ${
                  apiKey
                    ? 'bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-600'
                    : 'bg-red-50 border border-red-300 hover:bg-red-100 text-red-600'
                }`}
                title={apiKey ? 'Chave de API conectada (Clique para alterar)' : 'Chave de API não conectada (Clique para inserir)'}
                aria-label={apiKey ? 'Chave conectada' : 'Chave não conectada'}
              >
                <span className={`w-3 h-3 rounded-full ${apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Controls Column */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Passo 1: Upload</h2>
                <p className="text-slate-500 text-sm mb-6">Envie sua foto e a peça de roupa da loja.</p>
                
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

              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100">
                <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">
                  Instruções Extras (Opcional)
                </label>
                <textarea
                  id="prompt"
                  rows={3}
                  className="w-full rounded-xl border-slate-200 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 resize-none text-sm p-3 border"
                  placeholder="Ex: Deixe a camiseta por dentro da calça, mude o fundo para uma passarela..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!isReady || appState === AppState.GENERATING}
                className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-white font-semibold shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
                  !isReady || appState === AppState.GENERATING
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-500/25'
                }`}
              >
                {appState === AppState.GENERATING ? (
                  <span>Processando Provador com IA...</span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M9.315 2.004a.75.75 0 0 1 .722 0l12 6.666a.75.75 0 0 1 0 1.309l-12 6.667a.75.75 0 0 1-.722 0l-12-6.667a.75.75 0 0 1 0-1.309l12-6.666Zm.82 13.921V9.524l5.166 2.87-5.166 3.53Zm-1.5 0L3.469 12.394l5.166-2.87v6.401Zm1.5-8.23-5.165 2.87-5.166-2.87 5.166-2.87 5.166-2.87Z" clipRule="evenodd" />
                    </svg>
                    <span>Experimentar Look Virtual</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="h-full min-h-[500px] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col relative">
                <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">Resultado do Look</h3>
                  {appState === AppState.SUCCESS && (
                    <button 
                      onClick={handleReset}
                      className="text-sm text-slate-500 hover:text-slate-800 font-medium px-3 py-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Novo Look
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
                      <p className="text-slate-500 text-sm">Suba a sua foto e a peça de roupa para ver a mágica do provador virtual.</p>
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
                      <p className="text-red-600/80 text-sm mb-6 leading-relaxed">{errorMessage}</p>
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
                        alt="Resultado Provador Virtual" 
                        className="max-h-[580px] w-auto max-w-full rounded-lg shadow-md object-contain"
                      />
                      {/* Botões de Ação no Resultado */}
                      <div className="absolute bottom-5 flex flex-wrap gap-2.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 px-2 justify-center">
                        {/* Botão Baixar */}
                        <a 
                          href={resultImage} 
                          download={`${storeName.toLowerCase().replace(/\s+/g, '-')}-look.png`}
                          className="px-5 py-2.5 bg-white/95 backdrop-blur text-slate-700 rounded-full font-semibold shadow-lg hover:bg-white hover:text-indigo-600 flex items-center gap-2 border border-slate-200 text-xs sm:text-sm transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3.25-3.25m3.25 3.25 3.25-3.25M12 12.75V3.75" />
                          </svg>
                          Baixar Look
                        </a>

                        {/* Botão WhatsApp */}
                        <button 
                          onClick={handleOpenWhatsAppModal}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold shadow-lg shadow-emerald-600/25 flex items-center gap-2 text-xs sm:text-sm transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                          </svg>
                          Enviar pelo WhatsApp
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Galeria de Histórico de Looks (IndexedDB) */}
              {history.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800">Histórico de Looks ({history.length})</h4>
                    </div>
                    <span className="text-[11px] text-slate-400">Clique para carregar</span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectHistoryLook(item)}
                        className={`relative shrink-0 w-22 h-30 rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                          resultImage === item.image
                            ? 'border-indigo-600 shadow-md ring-2 ring-indigo-200 scale-102'
                            : 'border-slate-200 hover:border-indigo-400 hover:shadow-xs'
                        }`}
                        title="Clique para visualizar este look"
                      >
                        <img src={item.image} alt="Look anterior" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => handleDeleteHistoryLook(e, item.id)}
                          className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                          title="Excluir do histórico"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                          <span className="text-[9px] text-white/95 block truncate">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Footer Discreto - By BespokeTech */}
      <footer className="mt-16 py-6 border-t border-slate-200/80 bg-white/60 backdrop-blur-sm text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {storeName} • Todos os direitos reservados</p>
          <p className="flex items-center gap-2 text-slate-400">
            <span>Tecnologia White-Label de Provador AI</span>
            <span>•</span>
            <span className="font-semibold text-slate-600">by BespokeTech</span>
          </p>
        </div>
      </footer>

      {/* Modal: Enviar pelo WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-100">
            <button 
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-900 text-center mb-1">
              Enviar Look por WhatsApp
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm text-center mb-6">
              Envie o resultado do look diretamente para o WhatsApp do seu cliente!
            </p>

            <form onSubmit={handleSendWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Número do WhatsApp do Cliente
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-8888 ou 11999998888"
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{phoneError}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Informe DDD + Número (ex: 11999998888). O código do país (55) é adicionado automaticamente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Mensagem de Acompanhamento
                </label>
                <textarea
                  rows={3}
                  value={whatsappMsg}
                  onChange={(e) => setWhatsappMsg(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-emerald-600/25 text-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326z"/>
                  </svg>
                  <span>Abrir WhatsApp e Enviar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal White-Label: Personalizar Marca da Loja */}
      {showBrandingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-100">
            <button 
              onClick={() => setShowBrandingModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.39m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-900 text-center mb-1">
              Personalizar Marca da Loja
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm text-center mb-6">
              Configure o nome e logotipo da sua loja. O aplicativo fica com a cara da sua marca!
            </p>

            <form onSubmit={handleSaveBranding} className="space-y-5">
              {/* Nome da Loja */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Nome da sua Loja ou Marca
                </label>
                <input
                  type="text"
                  value={tempStoreName}
                  onChange={(e) => setTempStoreName(e.target.value)}
                  placeholder="Ex: Boutique Elegance, Moda VIP..."
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  maxLength={50}
                />
              </div>

              {/* Logotipo da Loja */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Logotipo da Loja (Opcional)
                </label>

                {tempStoreLogo ? (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-16 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1 overflow-hidden">
                      <img src={tempStoreLogo} alt="Preview Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-700">Logo carregado</p>
                      <button
                        type="button"
                        onClick={handleRemoveTempLogo}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold"
                      >
                        Remover logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload-input"
                    />
                    <label
                      htmlFor="logo-upload-input"
                      className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400 mb-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                      </svg>
                      <span className="text-xs font-medium text-indigo-600">Subir imagem do Logo</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG ou SVG (até 2MB)</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-indigo-500/25 text-sm"
                >
                  Salvar Personalização
                </button>

                {(storeName !== 'Virtual Try-On Pro' || storeLogo) && (
                  <button
                    type="button"
                    onClick={handleResetBranding}
                    className="w-full py-2 bg-transparent hover:bg-slate-100 text-slate-600 rounded-xl transition-colors text-xs font-semibold"
                  >
                    Restaurar Marca Padrão
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Configuração de Chave de API */}
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
