import React, { useState } from 'react';
import { Search, Plus, Trash2, CheckSquare, Square, RefreshCw, Calendar, Tag, AlertTriangle, Edit2, Check, X } from 'lucide-react';

export default function Dashboard({ items, onToggleStatus, onDeleteItem, onAddItem, onUpdateItem }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('active'); // 'all', 'active', 'consumed'
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualDate, setManualDate] = useState('');

  // Inline editing states
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleEditClick = (id, name) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveClick = async (id) => {
    if (!editingName.trim()) return;
    await onUpdateItem(id, { name: editingName });
    setEditingId(null);
    setEditingName('');
  };

  // Fixed today date based on prompt metadata (2026-06-14)
  const today = new Date('2026-06-14');

  const getRemainingDays = (dateStr) => {
    const expDate = new Date(dateStr);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationBadge = (dateStr, isConsumed) => {
    if (isConsumed) {
      return <span className="badge badge-consumed">사용 완료</span>;
    }

    const diffDays = getRemainingDays(dateStr);

    if (diffDays < 0) {
      return <span className="badge badge-danger">기한 초과 (D+{-diffDays})</span>;
    } else if (diffDays === 0) {
      return <span className="badge badge-danger">오늘 만료 (D-Day)</span>;
    } else if (diffDays <= 3) {
      return <span className="badge badge-danger">임박 (D-{diffDays})</span>;
    } else if (diffDays <= 7) {
      return <span className="badge badge-warning">주의 (D-{diffDays})</span>;
    } else {
      return <span className="badge badge-success">여유 (D-{diffDays})</span>;
    }
  };

  const getExpirationClass = (dateStr, isConsumed) => {
    if (isConsumed) return 'item-consumed';
    const diffDays = getRemainingDays(dateStr);
    if (diffDays <= 3) return 'item-critical';
    if (diffDays <= 7) return 'item-warning';
    return 'item-safe';
  };

  // Stats calculation
  const activeItems = items.filter(item => item.status === 'active');
  const consumedCount = items.filter(item => item.status === 'consumed').length;
  
  const criticalCount = activeItems.filter(item => {
    const diff = getRemainingDays(item.expirationDate);
    return diff <= 3;
  }).length;

  const warningCount = activeItems.filter(item => {
    const diff = getRemainingDays(item.expirationDate);
    return diff > 3 && diff <= 7;
  }).length;

  const safeCount = activeItems.filter(item => {
    const diff = getRemainingDays(item.expirationDate);
    return diff > 7;
  }).length;

  // Filter and search
  const filteredItems = items
    .filter(item => {
      if (filterStatus === 'active') return item.status === 'active';
      if (filterStatus === 'consumed') return item.status === 'consumed';
      return true; // 'all'
    })
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // Sort: consumed items go to the bottom. Active items sorted by expiration date (ascending)
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      return new Date(a.expirationDate) - new Date(b.expirationDate);
    });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualName || !manualDate) return;
    onAddItem(manualName, manualDate);
    setManualName('');
    setManualDate('');
    setShowAddForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Stats Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '2rem' }}>📦</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>보관 중인 식재료</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeItems.length}개</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--color-danger)' }}>
          <div style={{ fontSize: '2rem' }}>🚨</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>임박/초과 (3일 이내)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)' }}>{criticalCount}개</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>주의 (7일 이내)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)' }}>{warningCount}개</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ fontSize: '2rem' }}>✅</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>사용 완료 식재료</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-secondary)' }}>{consumedCount}개</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card">
        {/* Header Controls */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '1rem'
        }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`tab-btn ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              보관 중 ({activeItems.length})
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'consumed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('consumed')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              사용 완료 ({consumedCount})
            </button>
            <button 
              className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              전체 ({items.length})
            </button>
          </div>

          {/* Search and Add buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexGrow: 1, justifyContent: 'flex-end', maxWidth: '500px' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input 
                type="text" 
                placeholder="식재료 검색..." 
                className="input-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.25rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            </div>

            <button 
              className="btn"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Plus size={16} />
              <span>직접 등록</span>
            </button>
          </div>
        </div>

        {/* Manual Add Form */}
        {showAddForm && (
          <form 
            onSubmit={handleManualSubmit}
            style={{
              background: 'var(--bg-tertiary)',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'flex-end',
              marginBottom: '1.5rem',
              animation: 'slideUp 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 2, minWidth: '200px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>제품명 / 식재료명</label>
              <input 
                type="text" 
                placeholder="예: 오뚜기 핫도그, 계란, 우유" 
                className="input-field"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1, minWidth: '150px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>유통/소비기한</label>
              <input 
                type="date" 
                className="input-field"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn">등록</button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowAddForm(false)}
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* Inventory Table/List */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🥗</div>
            <p style={{ fontWeight: 600 }}>표시할 식재료가 없습니다.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              {searchQuery ? '검색어를 변경해 보세요.' : '상단의 사진 업로드 또는 직접 등록 버튼으로 등록해 보세요.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredItems.map(item => {
              const remaining = getRemainingDays(item.expirationDate);
              const expClass = getExpirationClass(item.expirationDate, item.status === 'consumed');
              
              return (
                <div 
                  key={item.id}
                  className={`inventory-item ${expClass}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--glass-border)',
                    transition: 'all var(--transition-fast)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1 }}>
                    {/* Status Checkbox */}
                    <button 
                      onClick={() => onToggleStatus(item.id, item.status === 'active' ? 'consumed' : 'active')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: item.status === 'consumed' ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      {item.status === 'consumed' ? (
                        <CheckSquare size={20} style={{ color: 'var(--color-text-muted)' }} />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>

                    {/* Thumbnail Image (if uploaded) */}
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.375rem',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      border: '1px solid var(--glass-border)',
                      flexShrink: 0
                    }}>
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        item.status === 'consumed' ? '🍽️' : '🥦'
                      )}
                    </div>

                    {/* Name & Date */}
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      {editingId === item.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="input-field"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', width: '100%', maxWidth: '200px' }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveClick(item.id);
                              if (e.key === 'Escape') handleCancelClick();
                            }}
                          />
                          <button 
                            className="btn" 
                            onClick={() => handleSaveClick(item.id)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minHeight: '32px' }}
                          >
                            저장
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            onClick={handleCancelClick}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minHeight: '32px' }}
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ 
                            fontWeight: 700, 
                            color: item.status === 'consumed' ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                            textDecoration: item.status === 'consumed' ? 'line-through' : 'none'
                          }}>
                            {item.name}
                          </span>
                          
                          {item.status !== 'consumed' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditClick(item.id, item.name); }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.2rem',
                                borderRadius: '0.25rem',
                                transition: 'all var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                              title="이름 수정"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                        <Calendar size={12} />
                        {item.expirationDate} 까지
                      </span>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {getExpirationBadge(item.expirationDate, item.status === 'consumed')}
                    
                    <button 
                      onClick={() => onDeleteItem(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        transition: 'all var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded Component Specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .inventory-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
          transform: translateX(4px);
        }
        
        .item-critical {
          border-left: 3px solid var(--color-danger) !important;
        }
        
        .item-warning {
          border-left: 3px solid var(--color-warning) !important;
        }
        
        .item-safe {
          border-left: 3px solid rgba(255, 255, 255, 0.05) !important;
        }
        
        .item-consumed {
          opacity: 0.6;
          border-left: 3px solid var(--color-consumed) !important;
        }
      `}} />
    </div>
  );
}
