
import React, { useState, useRef } from 'react';
import { Scene } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { PlayIcon } from './icons/PlayIcon';
import { TrashIcon } from './icons/TrashIcon';
import { AddIcon } from './icons/AddIcon';

interface EditorStepProps {
  scenes: Scene[];
  videoFile: File;
  videoUrl: string;
  onBack: () => void;
  onRestart: () => void;
}

const parseTimeToSeconds = (time: string): number => {
  const parts = time.split(':').map(Number);
  const len = parts.length;
  if (len === 3) { // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (len === 2) { // MM:SS
    return parts[0] * 60 + parts[1];
  }
  if (len === 1) { // SS
    return parts[0];
  }
  return 0;
};

const EditorStep: React.FC<EditorStepProps> = ({ scenes, videoUrl, onBack, onRestart }) => {
  const [editableScenes, setEditableScenes] = useState<Scene[]>(scenes);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUpdateScene = (id: string, field: keyof Omit<Scene, 'id'>, value: string) => {
    setEditableScenes(currentScenes =>
      currentScenes.map(scene =>
        scene.id === id ? { ...scene, [field]: value } : scene
      )
    );
  };

  const handleDeleteScene = (id: string) => {
    setEditableScenes(currentScenes => currentScenes.filter(scene => scene.id !== id));
  };

  const handleAddScene = () => {
    const lastScene = editableScenes[editableScenes.length - 1];
    const newStartTime = lastScene ? lastScene.endTime : '00:00:00';
    const newScene: Scene = {
      id: crypto.randomUUID(),
      startTime: newStartTime,
      endTime: newStartTime,
      narration: 'New narration...'
    };
    setEditableScenes(currentScenes => [...currentScenes, newScene]);
  };

  const playScene = (scene: Scene) => {
    if (videoRef.current) {
        const start = parseTimeToSeconds(scene.startTime);
        const end = parseTimeToSeconds(scene.endTime);
        videoRef.current.currentTime = start;
        videoRef.current.play();

        const stopPlayback = () => {
            if (videoRef.current && videoRef.current.currentTime >= end) {
                videoRef.current.pause();
                videoRef.current.removeEventListener('timeupdate', stopPlayback);
            }
        };
        videoRef.current.addEventListener('timeupdate', stopPlayback);
    }
  };
  
  const handleDownloadSrt = () => {
    const srtContent = editableScenes.map((scene, index) => {
        // SRT format requires HH:MM:SS,ms
        const formatTime = (time: string) => {
            const parts = time.split(':');
            while(parts.length < 3) parts.unshift('00');
            let [hh, mm, ss] = parts;
            if (!ss.includes('.')) ss += '.000';
            return `${hh}:${mm}:${ss.replace('.', ',')}`;
        }
        const start = formatTime(scene.startTime);
        const end = formatTime(scene.endTime);
        return `${index + 1}\n${start} --> ${end}\n${scene.narration}\n`;
    }).join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'narration.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadJson = () => {
    const scenesToExport = editableScenes.map(({ id, ...rest }) => rest);
    const jsonContent = JSON.stringify(scenesToExport, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const handleExport = async () => {
    if (!videoRef.current || isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage("Initializing export... This may take a few moments.");

    const videoElement = videoRef.current;
    
    if (videoElement.readyState < 1) {
        await new Promise(resolve => {
            videoElement.onloadedmetadata = resolve;
        });
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setExportMessage('Error: Could not create canvas for exporting.');
      setIsExporting(false);
      return;
    }
    
    const stream = canvas.captureStream(30);
    let audioContext: AudioContext | null = null;
    let sourceNode: MediaElementAudioSourceNode | null = null;
    
    try {
        audioContext = new AudioContext();
        sourceNode = audioContext.createMediaElementSource(videoElement);
        const destNode = audioContext.createMediaStreamDestination();
        sourceNode.connect(destNode);
        if (destNode.stream.getAudioTracks().length > 0) {
            stream.addTrack(destNode.stream.getAudioTracks()[0]);
        } else {
             setExportMessage("Warning: No audio track found. Export will be silent.");
        }
    } catch (e) {
        console.warn("Could not process audio for export:", e);
        setExportMessage("Warning: Could not process audio. Export will be silent.");
    }

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vidprompt_studio_export.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      setExportMessage('Export complete! Download has started.');
      
      sourceNode?.disconnect();
      audioContext?.close();
      
      setTimeout(() => setExportMessage(''), 5000);
    };

    recorder.onerror = (event) => {
        setIsExporting(false);
        setExportMessage(`An error occurred during export.`);
        console.error("MediaRecorder error:", event);
        sourceNode?.disconnect();
        audioContext?.close();
    };
    
    recorder.start();
    
    const originalMutedState = videoElement.muted;
    videoElement.muted = true;
    
    for (let i = 0; i < editableScenes.length; i++) {
        const scene = editableScenes[i];
        setExportMessage(`Processing scene ${i + 1} of ${editableScenes.length}...`);
        const start = parseTimeToSeconds(scene.startTime);
        const end = parseTimeToSeconds(scene.endTime);

        if (start >= end) {
            console.warn(`Skipping invalid scene ${i+1} with start time ${start} >= end time ${end}.`);
            setExportProgress(Math.round(((i + 1) / editableScenes.length) * 100));
            continue;
        }
        
        await new Promise<void>((resolve) => {
            const onSeeked = () => {
                videoElement.play().then(() => {
                  const processFrame = () => {
                      if (videoElement.currentTime < end && !videoElement.paused) {
                          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                          requestAnimationFrame(processFrame);
                      } else {
                          videoElement.pause();
                          resolve();
                      }
                  };
                  requestAnimationFrame(processFrame);
                }).catch(err => {
                   console.error("Playback error during export:", err);
                   videoElement.pause();
                   resolve();
                });
            };
            videoElement.addEventListener('seeked', onSeeked, { once: true });
            videoElement.currentTime = start;
        });
        
        setExportProgress(Math.round(((i + 1) / editableScenes.length) * 100));
    }

    recorder.stop();
    videoElement.muted = originalMutedState;
  };

  return (
    <div className="bg-brand-surface p-8 rounded-xl shadow-2xl border border-gray-800 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
            <button onClick={onBack} className="text-brand-text-secondary hover:text-brand-text text-sm">&larr; Back to Prompt</button>
            <button onClick={onRestart} className="text-brand-text-secondary hover:text-brand-text text-sm">Start Over &rarr;</button>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-brand-accent">🎞️ Video Editor</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden border border-gray-700">
                <video ref={videoRef} src={videoUrl} controls className="w-full h-full aspect-video"></video>
            </div>
            <div className="space-y-4">
                <button onClick={handleExport} disabled={isExporting} className="w-full bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity duration-300">
                    {isExporting ? `Processing... ${exportProgress}%` : 'Export Trimmed Video'}
                </button>
                {isExporting && (
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-brand-accent h-2.5 rounded-full transition-all duration-300" style={{ width: `${exportProgress}%` }}></div>
                    </div>
                )}
                {exportMessage && <p className="text-center text-sm text-brand-text-secondary mt-2">{exportMessage}</p>}
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleDownloadSrt} className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors">
                        <DownloadIcon className="w-4 h-4" /> .srt
                    </button>
                    <button onClick={handleDownloadJson} className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors">
                        <DownloadIcon className="w-4 h-4" /> .json
                    </button>
                </div>
                 <div className="bg-gray-800 p-4 rounded-lg text-sm text-brand-text-secondary border border-gray-700">
                    <p><strong>Editing Controls:</strong></p>
                    <ul className="list-disc list-inside mt-2">
                        <li>Edit times and narration below.</li>
                        <li>Click ▶️ to preview a scene.</li>
                        <li>Export a trimmed video with your edits.</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-brand-text-secondary">Scene Editor</h3>
            <div className="w-full max-h-[40vh] overflow-y-auto bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4">
                {editableScenes.map((scene) => (
                    <div key={scene.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-4">
                                <input type="text" value={scene.startTime} onChange={e => handleUpdateScene(scene.id, 'startTime', e.target.value)} className="font-mono text-sm bg-gray-700 rounded p-1 w-24 text-center" />
                                <span className="text-gray-500">&rarr;</span>
                                <input type="text" value={scene.endTime} onChange={e => handleUpdateScene(scene.id, 'endTime', e.target.value)} className="font-mono text-sm bg-gray-700 rounded p-1 w-24 text-center" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => playScene(scene)} className="p-2 text-brand-accent hover:text-white hover:bg-brand-accent/20 rounded-full transition-colors"><PlayIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDeleteScene(scene.id)} className="p-2 text-red-500 hover:text-white hover:bg-red-500/20 rounded-full transition-colors"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                        <textarea value={scene.narration} onChange={e => handleUpdateScene(scene.id, 'narration', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-brand-text-secondary text-sm focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition resize-y min-h-[50px]"></textarea>
                    </div>
                ))}
                 <button onClick={handleAddScene} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg p-3 hover:border-brand-primary hover:text-brand-primary transition-colors">
                    <AddIcon className="w-5 h-5" /> Add Scene
                </button>
            </div>
        </div>
    </div>
  );
};

export default EditorStep;
