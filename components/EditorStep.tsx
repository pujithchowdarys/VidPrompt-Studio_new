import React, { useState, useEffect } from 'react';
import { Scene } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

interface EditorStepProps {
  scenes: Scene[];
  videoFile: File;
  videoUrl: string;
  onBack: () => void;
  onRestart: () => void;
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const parseTimeToSeconds = (time: string): number => {
  const parts = time.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

const EditorStep: React.FC<EditorStepProps> = ({ scenes, videoUrl, onBack, onRestart }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadReady, setDownloadReady] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    const total = scenes.reduce((acc, scene) => {
        const start = parseTimeToSeconds(scene.startTime);
        const end = parseTimeToSeconds(scene.endTime);
        return acc + (end-start);
    }, 0);
    setTotalDuration(total);
  }, [scenes]);

  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setDownloadReady(false);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setDownloadReady(true);
          return 100;
        }
        return next;
      });
    }, 300);
  };
  
  const handleDownload = () => {
    // In a real app, this would trigger a download of the processed video file.
    // Here we just simulate it.
    // FIX: Corrected "Cannot find name 'alert'" error on line 66.
    // Accessing alert via window.alert makes it compatible with environments where DOM globals are not automatically available.
    window.alert("Downloading your masterpiece!");
  };

  return (
    <div className="bg-brand-surface p-8 rounded-xl shadow-2xl border border-gray-800 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
            <button onClick={onBack} className="text-brand-text-secondary hover:text-brand-text text-sm">&larr; Edit Scenes</button>
            <button onClick={onRestart} className="text-brand-text-secondary hover:text-brand-text text-sm">Start Over &rarr;</button>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-brand-accent">🎞️ Video Editor</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden border border-gray-700">
                <video src={videoUrl} controls className="w-full h-full aspect-video"></video>
            </div>
            <div className="space-y-4">
                <button onClick={handleExport} disabled={isExporting || downloadReady} className="w-full bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity duration-300">
                    {isExporting ? `Exporting... ${exportProgress}%` : 'Export Video'}
                </button>
                {isExporting && (
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-brand-accent h-2.5 rounded-full" style={{ width: `${exportProgress}%` }}></div>
                    </div>
                )}
                {downloadReady && (
                    <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors animate-fade-in">
                        <DownloadIcon className="w-5 h-5" /> Download MP4
                    </button>
                )}
                 <div className="bg-gray-800 p-4 rounded-lg text-sm text-brand-text-secondary border border-gray-700">
                    <p><strong>Controls:</strong></p>
                    <ul className="list-disc list-inside mt-2">
                        <li>Add Subtitles</li>
                        <li>Add Music</li>
                        <li>Adjust Timing</li>
                    </ul>
                    <p className="mt-2 text-xs italic">(UI for these features is representational)</p>
                </div>
            </div>
        </div>
        
        <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-brand-text-secondary">Timeline</h3>
            <div className="w-full bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3">
                {/* Scene Track */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-brand-accent">🎬 Video Scenes</p>
                    <div className="relative w-full h-12 bg-gray-800 rounded-md flex">
                        {scenes.map((scene, index) => {
                             const start = parseTimeToSeconds(scene.startTime);
                             const end = parseTimeToSeconds(scene.endTime);
                             const duration = end - start;
                             const width = `${(duration / totalDuration) * 100}%`;
                             return (
                                <div key={index} className="h-full bg-brand-primary/70 border-r-2 border-brand-surface rounded-sm hover:bg-brand-primary group relative" style={{width}}>
                                   <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max p-2 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <p className="font-bold">{scene.startTime} - {scene.endTime}</p>
                                        <p className="mt-1">{scene.narration}</p>
                                   </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                 {/* Narration Track */}
                 <div className="space-y-2">
                    <p className="text-xs font-semibold text-brand-accent">🎙️ Narration Track</p>
                    <div className="relative w-full h-12 bg-gray-800 rounded-md flex items-center px-2">
                        <div className="w-full h-1 bg-brand-accent/50 rounded-full"></div>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default EditorStep;
