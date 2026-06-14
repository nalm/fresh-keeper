import React, { useState, useEffect } from 'react';
import { LayoutGrid, Calendar, Sparkles, Upload, RefreshCw } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ImageUploader from './components/ImageUploader';
import InventoryCalendar from './components/InventoryCalendar';
import RecipeRecommender from './components/RecipeRecommender';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Authorization states
  const [isAuthorized, setIsAuthorized] = useState(
    localStorage.getItem('freshkeeper_auth') === 'true'
  );
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (password === '10131702') {
      localStorage.setItem('freshkeeper_auth', 'true');
      setIsAuthorized(true);
      setLoginError('');
      setPassword('');
    } else {
      setLoginError('비밀번호가 일치하지 않습니다. 다시 입력해 주세요.');
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('freshkeeper_auth');
      setIsAuthorized(false);
    }
  };

  // Fetch items from backend
  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error('데이터를 불러오는 중 에러가 발생했습니다.');
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('서버 연결 실패. 백엔드가 실행 중인지 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Update status (active <-> consumed)
  const handleToggleStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('상태 업데이트 실패');
      
      const updated = await response.json();
      setItems(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error(err);
      alert('상태를 수정하는 도중 오류가 발생했습니다.');
    }
  };

  // Delete item
  const handleDeleteItem = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('식재료 삭제 실패');
      
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
      alert('식재료를 삭제하는 도중 오류가 발생했습니다.');
    }
  };

  // Add item manually
  const handleAddItem = async (name, expirationDate) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, expirationDate })
      });
      if (!response.ok) throw new Error('수동 추가 실패');
      
      const newItem = await response.json();
      setItems(prev => [newItem, ...prev]);
    } catch (err) {
      console.error(err);
      alert('식재료를 등록하는 도중 오류가 발생했습니다.');
    }
  };

  // Update item (general updates like name)
  const handleUpdateItem = async (id, updates) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('업데이트 실패');
      
      const updated = await response.json();
      setItems(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error(err);
      alert('식재료 정보를 수정하는 도중 오류가 발생했습니다.');
    }
  };

  // Upload success handler
  const handleUploadSuccess = (newItems) => {
    setItems(prev => [...newItems, ...prev]);
    setActiveTab('dashboard');
  };

  if (!isAuthorized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)',
        color: '#fff',
        padding: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div className="card" style={{
          maxWidth: '400px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
          background: 'rgba(17, 24, 39, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          borderRadius: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          animation: 'slideUp 0.4s ease-out'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.3))' }}>🥦</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FreshKeeper
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              보안 인증이 필요한 서비스입니다.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
              <label htmlFor="gate-password" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>접속 비밀번호</label>
              <input
                id="gate-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  letterSpacing: '0.25em',
                  textAlign: 'center',
                  background: 'rgba(3, 7, 18, 0.5)',
                  border: '1px solid var(--glass-border)'
                }}
                autoFocus
              />
            </div>

            {loginError && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600, margin: 0 }}>
                {loginError}
              </p>
            )}

            <button 
              type="submit" 
              className="btn" 
              style={{ 
                padding: '0.75rem', 
                fontSize: '1rem', 
                justifyContent: 'center',
                background: 'var(--gradient-accent)',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                fontWeight: 700
              }}
            >
              냉장고 입장하기
            </button>
          </form>
          
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            © 2026 FreshKeeper. All rights reserved.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header>
        <div className="logo-container">
          <span className="logo-icon">🥦</span>
          <div>
            <h1 className="logo-text">FreshKeeper</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              AI 냉장고 및 유통기한 지키미
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={fetchItems}
            disabled={loading}
            style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span style={{ fontSize: '0.8rem' }}>새로고침</span>
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleLogout}
            style={{ 
              padding: '0.5rem 0.75rem', 
              display: 'flex', 
              gap: '0.35rem', 
              alignItems: 'center', 
              color: 'var(--color-danger)', 
              borderColor: 'rgba(239, 68, 68, 0.2)', 
              background: 'rgba(239, 68, 68, 0.05)' 
            }}
            title="로그아웃"
          >
            <span>🔒 로그아웃</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutGrid size={16} />
          <span>보관 식재료</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={16} />
          <span>사진 등록</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} />
          <span>유통기한 달력</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          <Sparkles size={16} />
          <span>AI 추천 레시피</span>
        </button>
      </div>

      {/* Network Error Message */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '0.75rem',
          padding: '1rem 1.5rem',
          color: 'var(--color-danger)',
          marginBottom: '2rem',
          textAlign: 'center',
          fontWeight: 600
        }}>
          {error}
        </div>
      )}

      <main>
        {activeTab === 'dashboard' && (
          <Dashboard 
            items={items} 
            onToggleStatus={handleToggleStatus} 
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
          />
        )}
        
        {activeTab === 'upload' && (
          <ImageUploader onUploadSuccess={handleUploadSuccess} />
        )}
        
        {activeTab === 'calendar' && (
          <InventoryCalendar 
            items={items} 
            onToggleStatus={handleToggleStatus}
          />
        )}
        
        {activeTab === 'recipes' && (
          <RecipeRecommender items={items} />
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
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
