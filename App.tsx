
import React, { useState } from 'react';
import UploadStep from './components/UploadStep';
import PromptStep from './components/PromptStep';
import EditorStep from './components/EditorStep';
import { AppState, Scene, Language } from './types';
import { SparklesIcon } from './components/icons/SparklesIcon';

const App: React.FC = () => {
  const [step, setStep] = useState<AppState>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<Language>('English');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleUploadComplete = (vidFile: File, subFile: File | null, lang: Language) => {
    setVideoFile(vidFile);
    setSubtitleFile(subFile);
    setLanguage(lang);
    setVideoUrl(URL.createObjectURL(vidFile));
    setStep('prompt');
  };

  const handleScriptGenerated = (generatedScenes: Scene[]) => {
    setScenes(generatedScenes);
    setStep('editor');
  };

  const handleBackToPrompt = () => {
    setScenes([]);
    setStep('prompt');
  };
  
  const handleRestart = () => {
    setStep('upload');
    setVideoFile(null);
    setSubtitleFile(null);
    setLanguage('English');
    setScenes([]);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
  };


  const renderStep = () => {
    switch (step) {
      case 'upload':
        return <UploadStep onUploadComplete={handleUploadComplete} />;
      case 'prompt':
        return (
          <PromptStep
            videoFile={videoFile!}
            subtitleFile={subtitleFile}
            language={language}
            onScriptGenerated={handleScriptGenerated}
            onBack={handleRestart}
          />
        );
      case 'editor':
        return (
            <EditorStep 
                scenes={scenes} 
                videoFile={videoFile!} 
                videoUrl={videoUrl!} 
                onBack={handleBackToPrompt} 
                onRestart={handleRestart} 
            />
        );
      default:
        return <UploadStep onUploadComplete={handleUploadComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl text-center mb-8">
        <div className="flex items-center justify-center gap-4">
          <SparklesIcon className="w-10 h-10 text-brand-primary" />
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-accent">
            VidPrompt Studio
          </h1>
        </div>
        <p className="mt-2 text-lg text-brand-text-secondary">
          Turn long videos into short, narrated stories with AI.
        </p>
      </header>
      <main className="w-full max-w-6xl">
        {renderStep()}
      </main>
      <footer className="w-full max-w-6xl text-center mt-12 text-sm text-brand-text-secondary">
        <p>Made with ❤️ using open-source AI</p>
      </footer>
    </div>
  );
};

export default App;
