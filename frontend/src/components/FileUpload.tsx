import React, { useCallback } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

const validateVCF = (file: File): string | null => {
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.vcf') && !fileName.endsWith('.vcf.gz')) {
    return "Invalid format. I can only analyze .vcf or .vcf.gz files.";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "File size exceeds the 5MB limit.";
  }
  return null;
};

interface FileUploadProps {
  file: File | null;
  setFile: (file: File | null) => void;
  error: string | null;
  setError: (err: string | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ file, setFile, error, setError }) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelection(droppedFile);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const validationError = validateVCF(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
    } else {
      setError(null);
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div className="w-full space-y-3">
      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
        Patient Sequence (VCF)
      </label>

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer group
            ${error ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-teal-500 hover:bg-teal-50/30'}
          `}
        >
          <input
            type="file"
            accept=".vcf"
            className="hidden"
            id="vcf-upload"
            onChange={handleFileInput}
          />
          <label htmlFor="vcf-upload" className="cursor-pointer flex flex-col items-center">
            <div className={`p-4 rounded-2xl mb-4 transition-all group-hover:scale-110 ${error ? 'bg-rose-100 text-rose-600 shadow-lg shadow-rose-200/50' : 'bg-white text-teal-600 shadow-xl shadow-slate-200/50 group-hover:shadow-teal-200/50'}`}>
              {error ? <AlertCircle className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            <p className="text-slate-900 font-black text-sm tracking-tight mb-1">
              Select Patient Genome
            </p>
            <p className="text-slate-500 text-[11px] font-medium">
              v4.2 Variant Call Format • Max 5MB
            </p>
          </label>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between border border-white/80 animate-fade-in group hover:bg-white/80 transition-colors cursor-default">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="bg-teal-500 p-2.5 rounded-xl text-white shadow-lg shadow-teal-500/20 group-hover:rotate-6 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm text-slate-900 truncate tracking-tight">{file.name}</p>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB • READY</p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-2 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[11px] font-black text-rose-500 flex items-center gap-2 uppercase tracking-tight ml-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};