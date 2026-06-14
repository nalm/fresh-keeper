import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ImageUploader({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(''); // "uploading", "ocr_scanning", "success"
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = (files) => {
    const fileList = Array.from(files);
    const validImageFiles = fileList.filter(file => file.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      setError("이미지 파일만 선택해 주세요.");
      return;
    }

    setError(null);
    setSelectedFiles(prev => [...prev, ...validImageFiles]);

    const newPreviews = validImageFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setError(null);
    setScanStatus('uploading');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      // Simulate step-by-step progress for premium UX
      setTimeout(() => {
        setScanStatus('ocr_scanning'); // Switching text to "Extracting name & expiration dates..."
      }, 1500);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('서버 업로드 및 분석에 실패했습니다.');
      }

      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        console.warn('Some files had errors:', data.errors);
      }

      setScanStatus('success');
      setTimeout(() => {
        onUploadSuccess(data.addedItems);
        // Reset state
        setSelectedFiles([]);
        setPreviews([]);
        setLoading(false);
        setScanStatus('');
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.message || '업로드 중 에러가 발생했습니다.');
      setLoading(false);
      setScanStatus('');
    }
  };

  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>제품 사진 등록</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          제품 포장지의 전면 혹은 소비기한 표시 부분을 촬영해 올려주세요. 복수 등록이 가능합니다.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        style={{
          border: '2px dashed ' + (dragActive ? 'var(--color-secondary)' : 'var(--glass-border)'),
          borderRadius: '0.75rem',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragActive ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.01)',
          transition: 'all var(--transition-fast)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
        
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary)',
          marginBottom: '0.25rem'
        }}>
          <Upload size={24} />
        </div>

        <div>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>사진 드래그 앤 드롭</span>
          <span style={{ color: 'var(--color-text-secondary)' }}> 또는 </span>
          <span style={{ fontWeight: 600, color: 'var(--color-secondary)', textDecoration: 'underline' }}>컴퓨터에서 선택</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>PNG, JPG, JPEG (최대 10MB)</span>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Previews & Upload Button */}
      {previews.length > 0 && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
            gap: '0.75rem' 
          }}>
            {previews.map((preview, index) => (
              <div 
                key={index} 
                style={{ 
                  position: 'relative', 
                  aspectRatio: '1', 
                  borderRadius: '0.5rem', 
                  overflow: 'hidden',
                  border: '1px solid var(--glass-border)' 
                }}
              >
                <img 
                  src={preview} 
                  alt={`preview-${index}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button 
            className="btn" 
            onClick={handleUploadSubmit}
            style={{ width: '100%', gap: '0.5rem' }}
          >
            <Sparkles size={18} />
            <span>선택한 이미지에서 유통기한 분석하기</span>
          </button>
        </div>
      )}

      {/* Scanning Overlay/Modal */}
      {loading && (
        <div style={{
          position: 'relative',
          padding: '2rem 1.5rem',
          background: 'var(--bg-tertiary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          textAlign: 'center',
          overflow: 'hidden'
        }}>
          {/* Neon Scanner Sweep Line Effect */}
          {scanStatus === 'ocr_scanning' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0) 0%, rgba(6, 182, 212, 1) 50%, rgba(6, 182, 212, 0) 100%)',
              boxShadow: '0 0 15px var(--color-secondary)',
              animation: 'scan-anim 2s infinite ease-in-out',
              zIndex: 10
            }} />
          )}

          {scanStatus === 'uploading' && (
            <>
              <Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} size={36} />
              <div>
                <p style={{ fontWeight: 600 }}>이미지 전송 중...</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  사진 파일을 업로드 서버로 안전하게 업로드하고 있습니다.
                </p>
              </div>
            </>
          )}

          {scanStatus === 'ocr_scanning' && (
            <>
              <Sparkles style={{ color: 'var(--color-secondary)', animation: 'pulse-slow 1.5s infinite' }} size={36} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>AI 텍스트 및 유통기한 추출 중...</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Gemini API가 포장 사진에서 유통기한 날짜와 상품명을 정확하게 해독하고 있습니다.
                </p>
              </div>
            </>
          )}

          {scanStatus === 'success' && (
            <>
              <CheckCircle2 style={{ color: 'var(--color-success)' }} size={36} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--color-success)' }}>추출 및 저장 완료!</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  식재료 목록이 성공적으로 업데이트되었습니다.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Embedded scanning CSS keyframe */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan-anim {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
