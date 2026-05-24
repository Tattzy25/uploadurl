import React, { useState, useRef } from 'react';
import { Upload, Check, Loader2, Copy } from 'lucide-react';

export default function App({ uploadUrl }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (fileToUpload) => {
    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setResult(data.url);
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white border border-black p-8 rounded-2xl shadow-sm">
        
        {/* Upload Zone */}
        {!uploading && (
          <div
            onClick={() => !result && fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed border-black/20 hover:border-black transition-all rounded-xl py-12 flex flex-col items-center justify-center gap-3 ${result ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Upload className="w-5 h-5 text-black/50" />
            <span className="text-sm font-medium text-black">Upload File</span>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
          </div>
        )}

        {/* Loading State */}
        {uploading && (
          <div className="py-16 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-black/20 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
          </div>
        )}

        {/* Result Area */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="bg-neutral-100 p-3 rounded-lg border border-black/10 flex items-center justify-between gap-2">
            <span className="truncate font-mono text-[11px] text-neutral-600 flex-1">
              {result ? result : `${uploadUrl}/pending-upload...`}
            </span>
            
            <button 
              onClick={handleCopy}
              disabled={!result}
              className={`p-2 rounded-md transition-colors ${!result ? 'text-neutral-300 cursor-not-allowed' : 'text-black hover:bg-black/5'}`}
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {result && (
            <button 
              onClick={() => setResult(null)} 
              className="w-full text-[11px] text-neutral-400 hover:text-black transition-colors py-1"
            >
              Upload another file
            </button>
          )}
        </div>

        {error && (
          <div className="text-center py-4">
            <p className="text-xs text-red-600 font-medium mb-2">{error}</p>
            <button onClick={() => setError(null)} className="text-xs underline text-neutral-500">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}