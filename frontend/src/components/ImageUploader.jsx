import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ImageUploader({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(''); // "uploading", "ocr_scanning", "success"
  const [error, setError] = useState(null);
  
  // Camera capture states and refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Stop camera tracks on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Camera capture handlers
  const startCamera = async () => {
    setError(null);
    setIsCameraOpen(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prioritize back camera on mobile devices
      });
      setStream(mediaStream);
      // Wait for element to render in DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setError('카메라 권한을 획득할 수 없습니다. 브라우저 카메라 액세스 설정을 확인해 주세요.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = `camera-capture-${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: 'image/jpeg' });
          
          setSelectedFiles(prev => [...prev, file]);
          const previewUrl = URL.createObjectURL(file);
          setPreviews(prev => [...prev, previewUrl]);
          
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

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
      setTimeout(() => {
        setScanStatus('ocr_scanning');
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
          제품 포장지의 전면 혹은 소비기한 표시 부분을 카메라로 촬영하거나 이미지 파일로 업로드해 주세요.
        </p>
      </div>

      {isCameraOpen ? (
        /* Camera Preview Viewport */
        <div style={{
          position: 'relative',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          background: '#000',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.25rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
        }}>
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            style={{
              width: '100%',
              maxHeight: '350px',
              borderRadius: '0.5rem',
              objectFit: 'cover',
              transform: 'scaleX(1)', // Keep it non-mirrored so packaging text reads correctly
              border: '1px solid var(--glass-border)'
            }}
          />
          <div style={{ display: 'flex', gap: '1.5rem', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              onClick={stopCamera}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
            >
              취소
            </button>
            
            {/* Shutter Capture Button */}
            <button 
              onClick={capturePhoto}
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: '#fff',
                border: '4px solid var(--color-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                transition: 'transform var(--transition-fast)'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{
                width: '2.1rem',
                height: '2.1rem',
                borderRadius: '50%',
                background: 'var(--color-danger)'
              }} />
            </button>
            <div style={{ width: '60px' }} /> {/* Invisible spacer to balance the cancel button */}
          </div>
        </div>
      ) : (
        /* Drag & Drop Zone */
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
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            PNG, JPG, JPEG (최대 10MB)
          </span>

          {/* Integrated Device Camera capture button */}
          <button 
            className="btn btn-secondary"
            onClick={(e) => { e.stopPropagation(); startCamera(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', zIndex: 5, fontSize: '0.85rem' }}
          >
            <Camera size={14} />
            <span>카메라로 촬영하기</span>
          </button>
        </div>
      )}

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
