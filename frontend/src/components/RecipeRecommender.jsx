import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Clock, Flame, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function RecipeRecommender({ items }) {
  const activeItems = items.filter(item => item.status === 'active');
  
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [expandedRecipeIndex, setExpandedRecipeIndex] = useState(null);

  // Automatically select ingredients expiring within 3 days
  useEffect(() => {
    const today = new Date('2026-06-14');
    const imminent = activeItems.filter(item => {
      const expDate = new Date(item.expirationDate);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    }).map(item => item.name);
    
    // De-duplicate names
    const uniqueImminent = Array.from(new Set(imminent));
    setSelectedIngredients(uniqueImminent);
  }, [items]);

  const handleCheckboxChange = (name) => {
    setSelectedIngredients(prev => {
      if (prev.includes(name)) {
        return prev.filter(item => item !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIngredients.length === activeItems.length) {
      setSelectedIngredients([]);
    } else {
      const allNames = Array.from(new Set(activeItems.map(item => item.name)));
      setSelectedIngredients(allNames);
    }
  };

  const fetchRecipes = async () => {
    if (selectedIngredients.length === 0) return;

    setLoading(true);
    setError(null);
    setRecipes([]);
    setExpandedRecipeIndex(null);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients: selectedIngredients }),
      });

      if (!response.ok) {
        throw new Error('레시피를 생성하는 도중 문제가 발생했습니다.');
      }

      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      console.error(err);
      setError(err.message || '레시피 생성 실패.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index) => {
    if (expandedRecipeIndex === index) {
      setExpandedRecipeIndex(null);
    } else {
      setExpandedRecipeIndex(index);
    }
  };

  return (
    <div className="grid-dashboard animate-fade-in">
      
      {/* Left panel: Ingredient Selector */}
      <div className="card" style={{ height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--color-secondary)' }} />
            <span>AI 맞춤 레시피 추천</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            요리에 활용할 냉장고 속 재료들을 선택해 보세요. AI가 최적의 요리 조합을 제안합니다.
          </p>
        </div>

        {activeItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-secondary)' }}>
            <p style={{ fontWeight: 600 }}>선택할 수 있는 재료가 없습니다.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              먼저 대시보드 탭에서 식재료를 등록해 주세요.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                식재료 선택 ({selectedIngredients.length}/{Array.from(new Set(activeItems.map(item => item.name))).length})
              </span>
              <button 
                className="btn btn-secondary" 
                onClick={handleSelectAll}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                {selectedIngredients.length === activeItems.length ? '선택 해제' : '전체 선택'}
              </button>
            </div>

            {/* List of active unique items */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '0.25rem'
            }}>
              {Array.from(new Set(activeItems.map(item => item.name))).map((name, idx) => {
                const isSelected = selectedIngredients.includes(name);
                
                // Check if this item is expiring soon
                const today = new Date('2026-06-14');
                const matchingItems = activeItems.filter(item => item.name === name);
                const hasImminent = matchingItems.some(item => {
                  const diff = Math.ceil((new Date(item.expirationDate) - today) / (1000 * 60 * 60 * 24));
                  return diff <= 3;
                });

                return (
                  <div
                    key={idx}
                    onClick={() => handleCheckboxChange(name)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '9999px',
                      background: isSelected ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${hasImminent ? 'var(--color-danger)' : isSelected ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all var(--transition-fast)',
                      userSelect: 'none',
                      color: isSelected ? '#fff' : 'var(--color-text-primary)'
                    }}
                    className="ingredient-pill"
                  >
                    <span>{name}</span>
                    {hasImminent && !isSelected && (
                      <span style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: 'var(--color-danger)',
                        boxShadow: '0 0 5px var(--color-danger)'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              className="btn"
              onClick={fetchRecipes}
              disabled={selectedIngredients.length === 0 || loading}
              style={{
                width: '100%',
                background: selectedIngredients.length === 0 ? 'var(--color-consumed)' : 'var(--gradient-accent)',
                cursor: selectedIngredients.length === 0 || loading ? 'not-allowed' : 'pointer',
                opacity: selectedIngredients.length === 0 ? 0.5 : 1,
                boxShadow: selectedIngredients.length === 0 ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>AI 요리사 조리법 생각 중...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>AI 추천 레시피 받기</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Right panel: Recipe Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading && (
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
            gap: '1.5rem',
            background: 'var(--glass-bg)',
            height: '100%'
          }}>
            <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-secondary)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>레시피 레시피 탐색 중...</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', maxWidth: '350px' }}>
                선택하신 재료 ({selectedIngredients.join(', ')})를 기반으로 최고의 한 끼 식사가 가능한 3가지 요리를 작명하고 분석하고 있습니다.
              </p>
            </div>
          </div>
        )}

        {!loading && recipes.length === 0 && !error && (
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            height: '100%',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '3rem' }}>🍳</span>
            <p style={{ fontWeight: 600 }}>추천된 레시피가 없습니다.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              왼쪽 패널에서 재료를 선택하고 레시피 추천 버튼을 클릭해 보세요.
            </p>
          </div>
        )}

        {error && (
          <div className="card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--color-danger)',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <span>❌ 에러가 발생했습니다: {error}</span>
          </div>
        )}

        {/* Recipe Cards List */}
        {!loading && recipes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recipes.map((recipe, index) => {
              const isExpanded = expandedRecipeIndex === index;
              return (
                <div 
                  key={index}
                  className="card recipe-card"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)'
                  }}
                  onClick={() => toggleExpand(index)}
                >
                  {/* Card Header Summary */}
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{recipe.title}</h3>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.65rem' }}>
                            <Clock size={10} />
                            {recipe.time}
                          </span>
                          <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.65rem' }}>
                            <Flame size={10} />
                            난이도: {recipe.difficulty}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', paddingRight: '1rem' }}>
                        {recipe.description}
                      </p>
                    </div>

                    <div style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Expanded Recipe Content */}
                  {isExpanded && (
                    <div style={{ 
                      padding: '0 1.5rem 1.5rem 1.5rem', 
                      borderTop: '1px solid var(--glass-border)',
                      background: 'rgba(255, 255, 255, 0.01)',
                      animation: 'slideUp 0.2s ease-out'
                    }} onClick={(e) => e.stopPropagation() /* prevent collapse when clicking contents */}>
                      
                      {/* Ingredients */}
                      <div style={{ marginTop: '1.25rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
                          🛒 필요 재료
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {recipe.ingredients.map((ing, idx) => (
                            <span 
                              key={idx} 
                              style={{ 
                                fontSize: '0.75rem', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                border: '1px solid var(--glass-border)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem'
                              }}
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div style={{ marginTop: '1.25rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                          👩‍🍳 조리 순서
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {recipe.instructions.map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                              <span style={{ 
                                width: '1.25rem', 
                                height: '1.25rem', 
                                borderRadius: '50%', 
                                background: 'rgba(99, 102, 241, 0.15)', 
                                color: 'var(--color-primary)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '0.7rem', 
                                fontWeight: 800,
                                flexShrink: 0,
                                marginTop: '0.15rem'
                              }}>
                                {idx + 1}
                              </span>
                              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .ingredient-pill:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        
        .recipe-card:hover {
          border-color: rgba(6, 182, 212, 0.3) !important;
          background: rgba(255, 255, 255, 0.03) !important;
        }
      `}} />
    </div>
  );
}
