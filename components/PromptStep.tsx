import React, { useState } from 'react';
import { Language, Scene } from '../types';
import { generateScriptAndTimestamps } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface PromptStepProps {
  videoFile: File;
  subtitleFile: File | null;
  language: Language;
  onScriptGenerated: (scenes: Scene[]) => void;
  onBack: () => void;
}

const PromptStep: React.FC<PromptStepProps> = ({ videoFile, language, onScriptGenerated, onBack }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [suggestedScenes, setSuggestedScenes] = useState<Scene[] | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuggestedScenes(null);
    try {
      const scenes = await generateScriptAndTimestamps(prompt, language, videoFile.name);
      setSuggestedScenes(scenes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProceed = () => {
    if(suggestedScenes){
        onScriptGenerated(suggestedScenes);
    }
  };

  return (
    <div className="bg-brand-surface p-8 rounded-xl shadow-2xl border border-gray-800 animate-fade-in">
        <button onClick={onBack} className="text-brand-text-secondary hover:text-brand-text mb-4 text-sm">&larr; Back to Upload</button>
        <h2 className="text-2xl font-bold mb-4 text-brand-accent">✍️ Prompt Input</h2>
        <p className="text-brand-text-secondary mb-4">Describe the video you want to create. Be specific about the tone, key scenes, and narration style.</p>
        <textarea
            value={prompt}
            // FIX: Corrected "Property 'value' does not exist on type 'EventTarget & HTMLTextAreaElement'" error on line 52.
            // The event target is cast to HTMLTextAreaElement to access its 'value' property.
            onChange={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
            placeholder="e.g., 'Create an emotional Telugu-English story summary focusing on the main character's journey. Cut to key dramatic moments.'"
            className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg p-4 text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition mb-4 resize-none"
            disabled={isLoading}
        />
        <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity duration-300 text-lg"
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                </>
            ) : (
                <> <SparklesIcon className="w-5 h-5"/> Generate Script & Timeframes</>
            )}
        </button>
        
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

        {suggestedScenes && (
            <div className="mt-8 animate-fade-in">
                <h3 className="text-xl font-bold mb-4 text-brand-accent">Suggested Scenes</h3>
                <div className="max-h-60 overflow-y-auto bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-3">
                    {suggestedScenes.map((scene, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-md">
                            <p className="font-mono text-sm text-brand-primary">{scene.startTime} &rarr; {scene.endTime}</p>
                            <p className="text-brand-text-secondary text-sm mt-1">"{scene.narration}"</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-6">
                    <button onClick={handleGenerate} className="flex-1 text-center py-2 px-4 border border-brand-primary text-brand-primary rounded-lg hover:bg-brand-primary/10 transition-colors">
                        Re-generate
                    </button>
                    <button onClick={handleProceed} className="flex-1 text-center py-2 px-4 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                        Proceed &rarr; Video Editor
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default PromptStep;
