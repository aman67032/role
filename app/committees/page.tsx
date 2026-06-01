'use client';

import { useState, useEffect, useCallback } from 'react';

const COMMITTEES = [
  'Discipline Committee',
  'Internal Arrangements Committee',
  'Event &Venue Committee',
  'Hospitality Committee',
  'Food & Accommodation Committee',
  'Photography Committee',
  'Social media',
  'Media Committee',
  'Design Committee',
  'Technical Committee',
  'Feedback & Registration Committee'
] as const;
type CommitteeType = typeof COMMITTEES[number];

interface Booking {
  date: string; // '2026-06-03', '2026-06-04' or '2026-06-05'
  timeSlot: string; // e.g. '11:00'
}

type BookingsMap = Record<CommitteeType, Booking | null>;

const DATES = [
  { value: '2026-06-03', label: 'JUN 03', day: 'WED' },
  { value: '2026-06-04', label: 'JUN 04', day: 'THU' },
  { value: '2026-06-05', label: 'JUN 05', day: 'FRI' },
];

const TIME_SLOT_LABELS: Record<string, string> = {
  '11:00': '11:00 AM - 12:00 PM',
  '12:00': '12:00 PM - 01:00 PM',
  '13:00': '01:00 PM - 02:00 PM',
  '14:00': '02:00 PM - 03:00 PM',
  '15:00': '03:00 PM - 04:00 PM',
  '16:00': '04:00 PM - 05:00 PM',
};

function getTimeSlotsForDate(date: string) {
  if (date === '2026-06-03') {
    return [
      { start: '15:00', label: '03:00 PM - 04:00 PM' },
      { start: '16:00', label: '04:00 PM - 05:00 PM' },
    ];
  }
  return [
    { start: '11:00', label: '11:00 AM - 12:00 PM' },
    { start: '12:00', label: '12:00 PM - 01:00 PM' },
    { start: '13:00', label: '01:00 PM - 02:00 PM' },
    { start: '14:00', label: '02:00 PM - 03:00 PM' },
    { start: '15:00', label: '03:00 PM - 04:00 PM' },
    { start: '16:00', label: '04:00 PM - 05:00 PM' },
  ];
}

const SLOT_COLORS = [
  '#FFD600', '#FF6B9D', '#4FC3F7', '#69F0AE', '#FFAB40',
  '#CE93D8', '#FF8A65', '#80DEEA', '#AED581', '#F48FB1',
  '#FFE082', '#81D4FA',
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CommitteeBookingPage() {
  const [selectedCommittee, setSelectedCommittee] = useState<CommitteeType | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>(DATES[0].value);
  const [bookings, setBookings] = useState<BookingsMap>(() => {
    const emptyBookings: BookingsMap = {} as BookingsMap;
    COMMITTEES.forEach((c) => {
      emptyBookings[c] = null;
    });
    return emptyBookings;
  });

  const [allSlots, setAllSlots] = useState<{ timeSlot: string; slotIndex: number }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // Fetch all bookings for all committee dates in parallel
  const fetchAllBookings = useCallback(async () => {
    try {
      setFetching(true);
      setError('');
      
      const [res1, res2, res3] = await Promise.all([
        fetch(`${API_URL}/api/slots?date=2026-06-03&category=committees`),
        fetch(`${API_URL}/api/slots?date=2026-06-04&category=committees`),
        fetch(`${API_URL}/api/slots?date=2026-06-05&category=committees`)
      ]);
      
      if (!res1.ok || !res2.ok || !res3.ok) {
        throw new Error('API request failed');
      }

      const data1 = await res1.json();
      const data2 = await res2.json();
      const data3 = await res3.json();
      
      const allBooked = [
        ...(data1.bookedSlots || []).map((b: any) => ({ ...b, date: '2026-06-03' })),
        ...(data2.bookedSlots || []).map((b: any) => ({ ...b, date: '2026-06-04' })),
        ...(data3.bookedSlots || []).map((b: any) => ({ ...b, date: '2026-06-05' }))
      ];
      
      const newBookingsMap = {} as BookingsMap;
      COMMITTEES.forEach(c => {
        newBookingsMap[c] = null;
      });
      
      allBooked.forEach((booking: any) => {
        if (booking.name) {
          const committeeName = booking.name as CommitteeType;
          if (COMMITTEES.includes(committeeName)) {
            newBookingsMap[committeeName] = {
              date: booking.date,
              timeSlot: booking.timeSlot
            };
          }
        }
      });
      
      setBookings(newBookingsMap);
      
      // Update local slots array for the currently selected date tab
      const currentData = selectedDate === '2026-06-03' ? data1 : (selectedDate === '2026-06-04' ? data2 : data3);
      setAllSlots(currentData.allSlots || []);
    } catch (e) {
      console.error('Failed to fetch bookings', e);
      setError('Connection to backend API failed. Please ensure the server is running.');
    } finally {
      setFetching(false);
    }
  }, [selectedDate]);

  // Initial and reactive fetching
  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  // Set up polling (every 15 seconds)
  useEffect(() => {
    const interval = setInterval(fetchAllBookings, 15000);
    const handleFocus = () => fetchAllBookings();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchAllBookings]);

  // Get booked slot for a given date and timeSlot
  const getBookingForSlot = useCallback((date: string, timeSlot: string): CommitteeType | null => {
    const entry = Object.entries(bookings).find(
      ([_, booking]) => booking && booking.date === date && booking.timeSlot === timeSlot
    );
    return entry ? (entry[0] as CommitteeType) : null;
  }, [bookings]);

  // Handle slot selection
  const handleSlotClick = (timeSlot: string) => {
    if (!selectedCommittee) {
      alert('Please select a Committee from the dropdown first!');
      return;
    }

    const bookingCommittee = getBookingForSlot(selectedDate, timeSlot);
    if (bookingCommittee && bookingCommittee !== selectedCommittee) {
      return; // disabled / booked by someone else
    }

    setSelectedSlot(timeSlot);
    setShowModal(true);
    setIsSuccess(false);
    setError('');
  };

  // Confirm booking to backend
  const confirmBooking = async () => {
    if (!selectedCommittee || !selectedSlot) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedSlot,
          slotIndex: 0,
          category: 'committees',
          name: selectedCommittee,
          phone: 'N/A',
          jkluId: 'N/A',
          rollNumber: 'N/A',
          formNumber: 'N/A'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to book slot');
      }

      setIsSuccess(true);
      fetchAllBookings(); // update state from backend

      setTimeout(() => {
        setShowModal(false);
        setSelectedSlot(null);
        setIsSuccess(false);
      }, 2000);
    } catch (e: any) {
      setError(e.message || 'Network error occurred. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeCommitteeBooking = selectedCommittee ? bookings[selectedCommittee] : null;
  const currentSlotLabel = selectedSlot ? TIME_SLOT_LABELS[selectedSlot] : '';
  const currentDateLabel = DATES.find(d => d.value === selectedDate)?.label;
  const currentDayLabel = DATES.find(d => d.value === selectedDate)?.day;

  // Calculate booked slots count
  const bookedCount = Object.values(bookings).filter(v => v !== null).length;
  const totalSlotsCount = DATES.reduce((acc, d) => acc + getTimeSlotsForDate(d.value).length, 0);
  const freeSlotsCount = totalSlotsCount - bookedCount;

  return (
    <div style={{ minHeight: '100vh', padding: '16px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px', paddingTop: '16px' }}>
        <h1 style={{
          fontFamily: 'var(--font-comic)',
          fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
          color: 'var(--text-primary)',
          letterSpacing: '2px',
          textShadow: '3px 3px 0 var(--accent-yellow), 5px 5px 0 var(--accent-pink)',
          lineHeight: 1.2,
          marginBottom: '10px'
        }}>
          ⚡ COMMITTEE SLOT BOOKING ⚡
        </h1>

        <div className="speech-bubble" style={{ display: 'inline-block', marginTop: '14px' }}>
          <p style={{ fontFamily: 'var(--font-comic)', fontSize: '16px', lineHeight: '1.4', letterSpacing: '0.5px' }}>
            Book one 1-hour meeting slot for your Committee! Only 1 slot per Committee allowed.
          </p>
        </div>
      </div>

      {error && !showModal && (
        <div className="pixel-border-sm" style={{
          background: '#FFCDD2',
          padding: '12px 18px',
          marginBottom: '20px',
          fontFamily: 'var(--font-comic)',
          fontSize: '15px',
          color: '#B71C1C',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          💥 {error}
        </div>
      )}

      {/* Committee Select dropdown */}
      <div className="pixel-border-sm" style={{
        background: 'var(--bg-secondary)',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '4px 4px 0 var(--shadow-color)'
      }}>
        <label style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          display: 'block'
        }}>
          🎯 ACTIVE COMMITTEE SELECT
        </label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="comic-input"
            style={{
              flex: 1,
              minWidth: '200px',
              fontFamily: 'var(--font-comic)',
              fontWeight: 'bold',
              border: '3px solid var(--border-color)',
              background: '#fff',
              fontSize: '18px'
            }}
            value={selectedCommittee}
            onChange={(e) => {
              setSelectedCommittee(e.target.value as CommitteeType | '');
              setSelectedSlot(null);
            }}
          >
            <option value="">-- SELECT YOUR COMMITTEE --</option>
            {COMMITTEES.map((c) => (
              <option key={c} value={c}>
                {c} {bookings[c] ? `(Booked: ${DATES.find(d => d.value === bookings[c]?.date)?.label} @ ${TIME_SLOT_LABELS[bookings[c]?.timeSlot || ''] || bookings[c]?.timeSlot})` : '(Not Booked)'}
              </option>
            ))}
          </select>
        </div>

        {selectedCommittee && (
          <div style={{
            marginTop: '10px',
            fontFamily: 'var(--font-comic)',
            fontSize: '15px',
            color: activeCommitteeBooking ? '#2E7D32' : '#C62828',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {activeCommitteeBooking ? (
              <span>
                ✅ {selectedCommittee} is booked on{' '}
                <strong>
                  {DATES.find((d) => d.value === activeCommitteeBooking.date)?.label} (
                  {DATES.find((d) => d.value === activeCommitteeBooking.date)?.day})
                </strong>{' '}
                at <strong>{TIME_SLOT_LABELS[activeCommitteeBooking.timeSlot] || activeCommitteeBooking.timeSlot}</strong>.
                Selecting a new slot will automatically reschedule it.
              </span>
            ) : (
              <span>⚠️ {selectedCommittee} does not have any booking yet. Choose an open slot below!</span>
            )}
          </div>
        )}
      </div>

      {/* Date Tabs */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
        {DATES.map((d) => (
          <button
            key={d.value}
            type="button"
            className={`date-tab ${selectedDate === d.value ? 'active' : ''}`}
            onClick={() => { setSelectedDate(d.value); setSelectedSlot(null); }}
          >
            <div style={{ fontWeight: 'bold' }}>{d.day}</div>
            <div style={{ marginTop: '2px' }}>{d.label}</div>
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="pixel-border-sm" style={{
          display: 'inline-block',
          background: 'var(--accent-blue)',
          padding: '10px 22px',
          fontFamily: 'var(--font-pixel)',
          fontSize: '11px',
          color: '#fff',
          lineHeight: '1.5',
        }}>
          {fetching ? '⏳ LOADING SLOTS...' : `📅 ${freeSlotsCount} / ${totalSlotsCount} SLOTS AVAILABLE`}
        </div>
      </div>

      {/* Slot Grid Panel */}
      <div className="halftone" style={{
        padding: '20px',
        background: 'var(--bg-secondary)',
        border: '4px solid var(--border-color)',
        boxShadow: '6px 6px 0 var(--shadow-color)',
        marginBottom: '32px'
      }}>
        {!selectedCommittee && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.85)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-comic)',
            textAlign: 'center',
            padding: '20px',
            backdropFilter: 'blur(1px)'
          }}>
            <span style={{ fontSize: '40px', marginBottom: '10px' }}>👉</span>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              PLEASE SELECT A COMMITTEE FIRST
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Choose a committee from the dropdown above to view and reserve slots.
            </p>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
          position: 'relative',
          zIndex: 1,
        }}>
          {getTimeSlotsForDate(selectedDate).map((slot, i) => {
            const bookedCommittee = getBookingForSlot(selectedDate, slot.start);
            const isBooked = bookedCommittee !== null;
            const isMine = isBooked && bookedCommittee === selectedCommittee;
            const isSelected = selectedSlot === slot.start;

            return (
              <div
                key={slot.start}
                className={`slot-card ${isBooked && !isMine ? 'booked' : ''} ${isSelected || isMine ? 'selected' : ''} animate-pop`}
                style={{
                  animationDelay: `${i * 0.02}s`,
                  borderTop: isBooked && !isMine ? undefined : `5px solid ${SLOT_COLORS[i % SLOT_COLORS.length]}`,
                  background: isMine ? 'var(--accent-green)' : (isSelected ? 'var(--accent-blue)' : undefined),
                  color: isMine ? '#111' : undefined
                }}
                onClick={() => handleSlotClick(slot.start)}
              >
                <div style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '11px',
                  marginBottom: '8px',
                  opacity: isBooked && !isMine ? 0.35 : 1,
                  lineHeight: '1.4',
                  fontWeight: 'bold'
                }}>
                  {slot.label}
                </div>
                
                <div style={{
                  fontFamily: 'var(--font-comic)',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                }}>
                  {isMine ? (
                    <span style={{ color: '#1b5e20' }}>★ YOUR SLOT ★</span>
                  ) : isBooked ? (
                    <span style={{ color: '#b71c1c', fontSize: '14px' }}>{bookedCommittee.toUpperCase()}</span>
                  ) : (
                    <span style={{ color: 'var(--accent-pink)' }}>OPEN ✨</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookings Dashboard Overview */}
      <div className="pixel-border-sm" style={{
        background: '#fff',
        padding: '24px',
        boxShadow: '4px 4px 0 var(--shadow-color)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-comic)', fontSize: '24px', letterSpacing: '1px' }}>
            📊 BOOKING SUMMARY DASHBOARD
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-comic)',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{ borderBottom: '3px solid var(--border-color)', background: '#f5f5f5' }}>
                <th style={{ padding: '10px', borderRight: '1px solid #ddd' }}>Committee</th>
                <th style={{ padding: '10px', borderRight: '1px solid #ddd' }}>Date</th>
                <th style={{ padding: '10px', borderRight: '1px solid #ddd' }}>Time Slot</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {COMMITTEES.map((c) => {
                const booking = bookings[c];
                return (
                  <tr 
                    key={c} 
                    style={{ 
                      borderBottom: '1px solid #eee',
                      background: selectedCommittee === c ? '#e8f5e9' : 'transparent',
                      fontWeight: selectedCommittee === c ? 'bold' : 'normal'
                    }}
                  >
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #eee' }}>{c}</td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #eee' }}>
                      {booking ? DATES.find(d => d.value === booking.date)?.label : '-'}
                    </td>
                    <td style={{ padding: '8px 10px', borderRight: '1px solid #eee' }}>
                      {booking ? (TIME_SLOT_LABELS[booking.timeSlot] || booking.timeSlot) : '-'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {booking ? (
                        <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Booked ✅</span>
                      ) : (
                        <span style={{ color: '#d32f2f' }}>Pending ⏳</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <div style={{
        textAlign: 'center',
        marginTop: '28px',
        paddingBottom: '20px',
        fontFamily: 'var(--font-comic)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        letterSpacing: '0.5px',
      }}>
        ★ Wednesday 3 June – Friday 5 June ★ 11:00 AM to 5:00 PM (Wed: 3:00 PM to 5:00 PM) ★
      </div>

      {/* ========== CONFIRMATION MODAL ========== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal-content animate-pop" onClick={(e) => e.stopPropagation()}>
            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px' }} className="success-pop">
                <div className="starburst" style={{ width: '100px', height: '100px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px' }}>BOOM!</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-comic)', fontSize: '2rem', color: '#2E7D32', textShadow: '2px 2px 0 #222' }}>
                  SUCCESS! 🎉
                </h2>
                <p style={{ fontFamily: 'var(--font-comic)', fontSize: '15px', marginTop: '10px', color: '#555' }}>
                  Committee <strong>{selectedCommittee}</strong> booked for:<br />
                  <strong>{currentDateLabel} ({currentDayLabel})</strong> @ <strong>{currentSlotLabel}</strong>
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '18px' }}>
                  <div className="pixel-border-sm" style={{
                    display: 'inline-block',
                    background: 'var(--accent-pink)',
                    padding: '8px 16px',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '10px',
                    color: '#fff',
                    marginBottom: '10px',
                    lineHeight: '1.5',
                  }}>
                    {currentDateLabel} ({currentDayLabel}) • {currentSlotLabel}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-comic)', fontSize: '1.6rem', letterSpacing: '1px' }}>
                    🗓️ CONFIRM YOUR SLOT!
                  </h2>
                </div>

                {error && (
                  <div className="pixel-border-sm" style={{
                    background: '#FFCDD2',
                    padding: '10px 14px',
                    marginBottom: '14px',
                    fontFamily: 'var(--font-comic)',
                    fontSize: '14px',
                    color: '#B71C1C',
                  }}>
                    💥 {error}
                  </div>
                )}

                <div style={{
                  fontFamily: 'var(--font-comic)',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  marginBottom: '20px',
                  background: 'var(--bg-secondary)',
                  padding: '14px',
                  border: '2px dashed var(--border-color)'
                }}>
                  You are booking this slot for <strong>{selectedCommittee}</strong>.
                  
                  {activeCommitteeBooking && (
                    <div style={{ color: '#b71c1c', marginTop: '10px', fontWeight: 'bold' }}>
                      ⚠️ NOTE: Your existing booking for {selectedCommittee} on{' '}
                      {DATES.find(d => d.value === activeCommitteeBooking.date)?.label} at{' '}
                      {TIME_SLOT_LABELS[activeCommitteeBooking.timeSlot] || activeCommitteeBooking.timeSlot} will be released!
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="comic-btn"
                    style={{ background: '#eee', flex: 1 }}
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    ✗ CANCEL
                  </button>
                  <button
                    type="button"
                    className="comic-btn"
                    style={{ background: 'var(--accent-green)', flex: 1 }}
                    onClick={confirmBooking}
                    disabled={loading}
                  >
                    {loading ? '⏳ ...' : '⚡ CONFIRM'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
