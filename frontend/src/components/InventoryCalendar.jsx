import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export default function InventoryCalendar({ items, onToggleStatus }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (5 = June)

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  // Helper: Get remaining days from dynamically calculated today
  const getTodayStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayStr();

  const getRemainingDays = (dateStr) => {
    const today = new Date(todayStr);
    const expDate = new Date(dateStr);
    const diffTime = expDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateStr(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateStr(null);
  };

  // Generate calendar days
  const firstDayIndex = new Date(year, month, 1).getDay(); // Weekday of 1st day (0 = Sun)
  const totalDays = new Date(year, month + 1, 0).getDate(); // Total days in current month
  const prevTotalDays = new Date(year, month, 0).getDate(); // Total days in previous month

  const calendarCells = [];

  // 1. Previous month days (prefix)
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevTotalDays - i;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthMonth = month === 0 ? 11 : month - 1;
    const dateStr = `${prevMonthYear}-${String(prevMonthMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
    calendarCells.push({ day: prevDay, isCurrentMonth: false, dateStr });
  }

  // 2. Current month days
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({ day: i, isCurrentMonth: true, dateStr });
  }

  // 3. Next month days (suffix to complete 42 cells)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonthMonth = month === 11 ? 0 : month + 1;
    const dateStr = `${nextMonthYear}-${String(nextMonthMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({ day: i, isCurrentMonth: false, dateStr });
  }

  // Find items expiring on a specific date
  const getItemsForDate = (dateStr) => {
    return items.filter(item => item.expirationDate === dateStr);
  };

  const selectedItems = selectedDateStr ? getItemsForDate(selectedDateStr) : [];

  return (
    <div className="grid-dashboard animate-fade-in">
      
      {/* Calendar Grid Card */}
      <div className="card">
        {/* Calendar Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📅 유통기한 달력</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>(기준일: {todayStr})</span>
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{year}년 {monthNames[month]}</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontWeight: 700,
          color: 'var(--color-text-secondary)',
          fontSize: '0.85rem',
          marginBottom: '0.5rem'
        }}>
          {daysOfWeek.map((day, idx) => (
            <div key={idx} style={{ color: idx === 0 ? 'var(--color-danger)' : idx === 6 ? 'var(--color-secondary)' : 'inherit' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          background: 'var(--glass-border)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          border: '1px solid var(--glass-border)'
        }}>
          {calendarCells.map((cell, idx) => {
            const dayItems = getItemsForDate(cell.dateStr);
            const activeDayItems = dayItems.filter(item => item.status === 'active');
            const hasActiveItems = activeDayItems.length > 0;
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDateStr;

            // Determine if there are critical items expiring on this day
            let urgencyClass = '';
            if (hasActiveItems) {
              const remaining = getRemainingDays(cell.dateStr);
              if (remaining < 0) urgencyClass = 'cal-expired';
              else if (remaining <= 3) urgencyClass = 'cal-critical';
              else if (remaining <= 7) urgencyClass = 'cal-warning';
              else urgencyClass = 'cal-safe';
            }

            return (
              <div
                key={idx}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                style={{
                  background: isSelected 
                    ? 'rgba(99, 102, 241, 0.15)' 
                    : cell.isCurrentMonth 
                      ? 'var(--bg-secondary)' 
                      : 'var(--bg-primary)',
                  minHeight: '80px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isSelected 
                    ? '1px solid var(--color-primary)' 
                    : isToday 
                      ? '1px solid var(--color-secondary)' 
                      : '1px solid transparent',
                  opacity: cell.isCurrentMonth ? 1 : 0.4,
                  transition: 'all var(--transition-fast)'
                }}
                className={`calendar-cell ${urgencyClass}`}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  fontWeight: isToday ? 800 : 500,
                }}>
                  <span style={{ 
                    color: isToday ? 'var(--color-secondary)' : 'inherit',
                    background: isToday ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    padding: isToday ? '0.1rem 0.3rem' : 0,
                    borderRadius: '0.25rem'
                  }}>
                    {cell.day}
                  </span>
                  
                  {isToday && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-secondary)', fontWeight: 700 }}>오늘</span>
                  )}
                </div>

                {/* Items preview inside cells */}
                <div className="calendar-items-preview">
                  {dayItems.slice(0, 2).map((item, i) => (
                    <div
                      key={item.id}
                      style={{
                        fontSize: '0.65rem',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        background: item.status === 'consumed' 
                          ? 'rgba(75, 85, 99, 0.15)' 
                          : getRemainingDays(item.expirationDate) <= 3 
                            ? 'rgba(239, 68, 68, 0.15)' 
                            : 'rgba(16, 185, 129, 0.15)',
                        color: item.status === 'consumed' 
                          ? 'var(--color-text-secondary)' 
                          : getRemainingDays(item.expirationDate) <= 3 
                            ? 'var(--color-danger)' 
                            : 'var(--color-success)',
                        border: '1px solid ' + (
                          item.status === 'consumed'
                            ? 'rgba(75, 85, 99, 0.3)'
                            : getRemainingDays(item.expirationDate) <= 3
                              ? 'rgba(239, 68, 68, 0.3)'
                              : 'rgba(16, 185, 129, 0.3)'
                        ),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.name}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', textAlign: 'right', fontWeight: 600 }}>
                      +{dayItems.length - 2}개 더
                    </div>
                  )}
                </div>

                {/* Mobile dot indicator */}
                <div className="calendar-dots-preview">
                  {dayItems.map((item) => {
                    let dotColor = 'var(--color-success)';
                    if (item.status === 'consumed') {
                      dotColor = 'rgba(75, 85, 99, 0.4)';
                    } else {
                      const remaining = getRemainingDays(item.expirationDate);
                      if (remaining < 0) dotColor = 'var(--color-danger)';
                      else if (remaining <= 3) dotColor = 'var(--color-danger)';
                      else if (remaining <= 7) dotColor = 'var(--color-warning)';
                    }
                    return (
                      <span
                        key={item.id}
                        className="calendar-dot"
                        style={{ backgroundColor: dotColor }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expiration detail sidebar (opens when day clicked) */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
          일자별 상세 현황
        </h3>

        {!selectedDateStr ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            gap: '0.75rem'
          }}>
            <Info size={24} style={{ color: 'var(--color-primary)' }} />
            <p style={{ fontSize: '0.9rem' }}>달력에서 특정 날짜를 클릭하시면 해당 날짜의 만료 예정 식재료 상세 정보를 볼 수 있습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
              📅 {selectedDateStr} 만료 예정
            </div>
            
            {selectedItems.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
                이 날짜에 만료되는 식재료가 없습니다.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedItems.map(item => {
                  const remaining = getRemainingDays(item.expirationDate);
                  return (
                    <div 
                      key={item.id}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, textDecoration: item.status === 'consumed' ? 'line-through' : 'none' }}>
                          {item.name}
                        </span>
                        {item.status === 'consumed' ? (
                          <span className="badge badge-consumed">사용 완료</span>
                        ) : remaining < 0 ? (
                          <span className="badge badge-danger">초과 D+{-remaining}</span>
                        ) : (
                          <span className="badge badge-warning">D-{remaining}</span>
                        )}
                      </div>

                      <button 
                        className="btn btn-secondary"
                        onClick={() => onToggleStatus(item.id, item.status === 'active' ? 'consumed' : 'active')}
                        style={{
                          width: '100%',
                          padding: '0.35rem',
                          fontSize: '0.8rem',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {item.status === 'consumed' ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>보관 중으로 되돌리기</span>
                          </>
                        ) : (
                          <>
                            <span>🍽️ 사용 완료로 변경</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .calendar-cell:hover {
          filter: brightness(1.15);
          box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.05);
        }
        .cal-expired {
          border-top: 3.5px solid var(--color-danger) !important;
        }
        .cal-critical {
          border-top: 3.5px solid var(--color-danger) !important;
        }
        .cal-warning {
          border-top: 3.5px solid var(--color-warning) !important;
        }
        .cal-safe {
          border-top: 3.5px solid var(--color-success) !important;
        }
      `}} />
    </div>
  );
}
