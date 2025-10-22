import React, { useState, useRef } from 'react';
import { Language } from '../types';
import { VideoIcon } from './icons/VideoIcon';
import { SubtitleIcon } from './icons/SubtitleIcon';

interface UploadStepProps {
  onUploadComplete: (videoFile: File, subtitleFile: File | null, language: Language) => void;
}

const FileInput: React.FC<{ 
  id: string, 
  label: string, 
  accept: string, 
  file: File | null, 
  onFileChange: (file: File) => void,
  Icon: React.ElementType,
  optional?: boolean
}> = ({ id, label, accept, file, onFileChange, Icon, optional }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1">
      <label htmlFor={id} className="block text-sm font-medium text-brand-text-secondary mb-2">
        {label} {optional && '(optional)'}
      </label>
      <button
        type="button"
        // FIX: Corrected "Property 'click' does not exist on type 'HTMLInputElement'" error on line 29.
        // Casting to HTMLElement allows access to the click() method, which might be missing from a minimal HTMLInputElement type definition.
        onClick={() => (inputRef.current as HTMLElement)?.click()}
        className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-brand-primary transition-colors duration-300 bg-brand-surface/50"
      >
        <Icon className="w-12 h-12 text-gray-500 mb-3" />
        <span className="text-sm font-semibold text-brand-text">
          {file ? file.name : 'Click to upload'}
        </span>
        <span className="text-xs text-brand-text-secondary mt-1">
          {accept.split(',').join(', ')}
        </span>
      </button>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        // FIX: Corrected "Property 'files' does not exist on type 'EventTarget & HTMLInputElement'" error on line 46.
        // The event target is cast to HTMLInputElement to safely access its 'files' property.
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files[0]) {
            onFileChange(target.files[0]);
          }
        }}
      />
    </div>
  );
};

const UploadStep: React.FC<UploadStepProps> = ({ onUploadComplete }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<Language>('English');
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    if (!videoFile) {
      setError('Please upload a video file to continue.');
      return;
    }
    setError('');
    onUploadComplete(videoFile, subtitleFile, language);
  };

  return (
    <div className="bg-brand-surface p-8 rounded-xl shadow-2xl border border-gray-800 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-6 mb-6">
        <FileInput 
          id="video-upload"
          label="Upload Video"
          accept=".mp4,.mkv,.mov,.webm"
          file={videoFile}
          onFileChange={setVideoFile}
          Icon={VideoIcon}
        />
        <FileInput 
          id="subtitle-upload"
          label="Upload Subtitles"
          accept=".srt,.vtt"
          file={subtitleFile}
          onFileChange={setSubtitleFile}
          Icon={SubtitleIcon}
          optional
        />
      </div>
      <div className="mb-6">
        <label htmlFor="language" className="block text-sm font-medium text-brand-text-secondary mb-2">
          Narration Language
        </label>
        <select
          id="language"
          value={language}
          // FIX: Corrected "Property 'value' does not exist on type 'EventTarget & HTMLSelectElement'" error on line 95.
          // The event target is cast to HTMLSelectElement to access its 'value' property.
          onChange={(e) => setLanguage((e.target as HTMLSelectElement).value as Language)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
        >
          <option>English</option>
          <option>Telugu</option>
          <option>Mixed</option>
        </select>
      </div>
      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!videoFile}
        className="w-full bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-300 text-lg"
      >
        Next →
      </button>
    </div>
  );
};

export default UploadStep;
