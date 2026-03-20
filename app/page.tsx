'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const DATES = [
  { value: '2026-03-23', label: 'MAR 23', day: 'MON' },
  { value: '2026-03-24', label: 'MAR 24', day: 'TUE' },
  { value: '2026-03-25', label: 'MAR 25', day: 'WED' },
  { value: '2026-03-26', label: 'MAR 26', day: 'THU' },
];

const SLOT_LABELS: Record<string, string> = {
  '09:30': '9:30 AM',
  '10:00': '10:00 AM',
  '10:30': '10:30 AM',
  '11:00': '11:00 AM',
  '11:30': '11:30 AM',
  '12:00': '12:00 PM',
  '12:30': '12:30 PM',
  '13:00': '1:00 PM',
  '13:30': '1:30 PM',
  '14:00': '2:00 PM',
  '14:30': '2:30 PM',
  '15:00': '3:00 PM',
  '15:30': '3:30 PM',
  '16:00': '4:00 PM',
  '16:30': '4:30 PM',
};

const SLOT_COLORS = [
  '#FFD600', '#FF6B9D', '#4FC3F7', '#69F0AE', '#FFAB40',
  '#CE93D8', '#FF8A65', '#80DEEA', '#AED581', '#F48FB1',
  '#FFE082', '#81D4FA', '#A5D6A7', '#FFAB91', '#B39DDB',
];

interface FormData {
  name: string;
  phone: string;
  jkluId: string;
  rollNumber: string;
  formNumber: string;
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(DATES[0].value);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    jkluId: '',
    rollNumber: '',
    formNumber: '',
  });

  const fetchSlots = useCallback(async () => {
    try {
      setFetching(true);
      const res = await fetch(`${API_URL}/api/slots?date=${selectedDate}`);
      const data = await res.json();
      setBookedSlots(data.bookedSlots || []);
    } catch {
      console.error('Failed to fetch slots');
    } finally {
      setFetching(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Poll every 30s + on tab focus
  useEffect(() => {
    const interval = setInterval(fetchSlots, 30000);
    const handleFocus = () => fetchSlots();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchSlots]);

  const handleSlotClick = (slot: string) => {
    if (bookedSlots.includes(slot)) return;
    setSelectedSlot(slot);
    setShowModal(true);
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    // Validation
    if (!formData.name || !formData.phone || !formData.jkluId || !formData.rollNumber || !formData.formNumber) {
      setError('All fields are required!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedSlot,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Booking failed!');
        // Refresh slots in case someone else booked
        fetchSlots();
        return;
      }

      setSuccess(true);
      setBookedSlots(prev => [...prev, selectedSlot]);
      setFormData({ name: '', phone: '', jkluId: '', rollNumber: '', formNumber: '' });

      setTimeout(() => {
        setShowModal(false);
        setSelectedSlot(null);
        setSuccess(false);
      }, 2500);
    } catch {
      setError('Network error! Try again.');
    } finally {
      setLoading(false);
    }
  };

  const allSlots = Object.keys(SLOT_LABELS);
  const availableSlots = allSlots.filter(s => !bookedSlots.includes(s));

  return (
    <div className="min-h-screen" style={{ padding: '20px' }}>
      {/* Header */}
      <div className="text-center" style={{ marginBottom: '32px', paddingTop: '20px' }}>
        {/* Comic ZAP effect */}
        <div className="animate-wiggle inline-block" style={{ marginBottom: '12px' }}>
          <div
            className="starburst"
            style={{
              width: '100px',
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', color: '#222', fontWeight: 'bold' }}>
              BOOK!
            </span>
          </div>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-comic)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: 'var(--text-primary)',
            letterSpacing: '2px',
            textShadow: '3px 3px 0 var(--accent-yellow), 5px 5px 0 var(--accent-pink)',
            lineHeight: 1.2,
          }}
        >
          ⚡ SLOT BOOKING ⚡
        </h1>
        <div className="speech-bubble inline-block" style={{ marginTop: '16px' }}>
          <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', lineHeight: '1.8' }}>
            Pick your date & time slot!
          </p>
        </div>
      </div>

      {/* Date Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '32px',
        }}
      >
        {DATES.map((d) => (
          <button
            key={d.value}
            className={`date-tab ${selectedDate === d.value ? 'active' : ''}`}
            onClick={() => {
              setSelectedDate(d.value);
              setSelectedSlot(null);
            }}
          >
            <div>{d.day}</div>
            <div style={{ marginTop: '4px' }}>{d.label}</div>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="text-center" style={{ marginBottom: '24px' }}>
        <div
          className="pixel-border-sm inline-block"
          style={{
            background: 'var(--accent-blue)',
            padding: '8px 20px',
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.55rem',
            color: '#fff',
          }}
        >
          {fetching ? '⏳ LOADING...' : `🎮 ${availableSlots.length} / ${allSlots.length} SLOTS FREE`}
        </div>
      </div>

      {/* Slot Grid */}
      <div
        className="halftone"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
          background: 'var(--bg-secondary)',
          border: '4px solid var(--border-color)',
          boxShadow: '6px 6px 0 var(--shadow-color)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '12px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {allSlots.map((slot, i) => {
            const isBooked = bookedSlots.includes(slot);
            const isSelected = selectedSlot === slot;
            return (
              <div
                key={slot}
                className={`slot-card ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''} animate-pop`}
                style={{
                  animationDelay: `${i * 0.04}s`,
                  borderTop: isBooked ? undefined : `5px solid ${SLOT_COLORS[i % SLOT_COLORS.length]}`,
                }}
                onClick={() => !isBooked && handleSlotClick(slot)}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.55rem',
                    marginBottom: '4px',
                    opacity: isBooked ? 0.3 : 1,
                  }}
                >
                  {SLOT_LABELS[slot]}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-comic)',
                    fontSize: '0.85rem',
                    color: isBooked ? '#999' : 'var(--accent-pink)',
                    fontWeight: 'bold',
                  }}
                >
                  {isBooked ? 'BOOKED' : 'OPEN ✨'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className="text-center"
        style={{
          marginTop: '32px',
          paddingBottom: '20px',
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.5rem',
          color: 'var(--text-secondary)',
        }}
      >
        ★ March 23 - 26, 2026 ★ 9:30 AM to 5:00 PM ★
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div
            className="modal-content animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div className="text-center success-pop" style={{ padding: '20px' }}>
                <div
                  className="starburst"
                  style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>YAY!</span>
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-comic)',
                    fontSize: '2rem',
                    color: 'var(--accent-green)',
                    textShadow: '2px 2px 0 #222',
                  }}
                >
                  BOOKED! ✅
                </h2>
                <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', marginTop: '12px', color: '#555' }}>
                  {SLOT_LABELS[selectedSlot!]} on {selectedDate}
                </p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div style={{ marginBottom: '20px' }}>
                  <div
                    className="pixel-border-sm inline-block"
                    style={{
                      background: 'var(--accent-pink)',
                      padding: '6px 14px',
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '0.5rem',
                      color: '#fff',
                      marginBottom: '12px',
                    }}
                  >
                    {selectedSlot && SLOT_LABELS[selectedSlot]} • {selectedDate}
                  </div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-comic)',
                      fontSize: '1.8rem',
                      letterSpacing: '1px',
                    }}
                  >
                    📝 BOOK THIS SLOT!
                  </h2>
                </div>

                {error && (
                  <div
                    className="pixel-border-sm"
                    style={{
                      background: '#FFCDD2',
                      padding: '10px 14px',
                      marginBottom: '16px',
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '0.5rem',
                      color: '#B71C1C',
                    }}
                  >
                    💥 {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label
                        style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '0.5rem',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        NAME
                      </label>
                      <input
                        className="comic-input"
                        type="text"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '0.5rem',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        PHONE NUMBER
                      </label>
                      <input
                        className="comic-input"
                        type="tel"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '0.5rem',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        JKLU ID
                      </label>
                      <input
                        className="comic-input"
                        type="text"
                        placeholder="JKLU ID"
                        value={formData.jkluId}
                        onChange={(e) => setFormData({ ...formData, jkluId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '0.5rem',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        ROLL NUMBER
                      </label>
                      <input
                        className="comic-input"
                        type="text"
                        placeholder="Roll Number"
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '0.5rem',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        FORM NUMBER
                      </label>
                      <input
                        className="comic-input"
                        type="text"
                        placeholder="Form Number"
                        value={formData.formNumber}
                        onChange={(e) => setFormData({ ...formData, formNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="comic-btn"
                      style={{
                        background: '#eee',
                        flex: 1,
                        fontSize: '1rem',
                      }}
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                    >
                      ✗ CANCEL
                    </button>
                    <button
                      type="submit"
                      className="comic-btn"
                      style={{
                        background: 'var(--accent-green)',
                        flex: 1,
                        fontSize: '1rem',
                      }}
                      disabled={loading}
                    >
                      {loading ? '⏳ BOOKING...' : '⚡ BOOK IT!'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
