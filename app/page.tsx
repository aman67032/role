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
  '09:30': '9:30 AM', '10:00': '10:00 AM', '10:30': '10:30 AM',
  '11:00': '11:00 AM', '11:30': '11:30 AM', '12:00': '12:00 PM',
  '12:30': '12:30 PM', '13:00': '1:00 PM', '13:30': '1:30 PM',
  '14:00': '2:00 PM', '14:30': '2:30 PM', '15:00': '3:00 PM',
  '15:30': '3:30 PM', '16:00': '4:00 PM', '16:30': '4:30 PM',
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
    name: '', phone: '', jkluId: '', rollNumber: '', formNumber: '',
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

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  useEffect(() => {
    // 15 seconds polling prevents server overload while keeping data relatively fresh
    const interval = setInterval(fetchSlots, 15000); 
    // Instantly refresh when the user switches back to this tab
    const handleFocus = () => fetchSlots();
    window.addEventListener('focus', handleFocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', handleFocus); };
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
        body: JSON.stringify({ date: selectedDate, timeSlot: selectedSlot, ...formData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Booking failed!');
        fetchSlots();
        return;
      }
      setSuccess(true);
      setBookedSlots(prev => [...prev, selectedSlot]);
      setFormData({ name: '', phone: '', jkluId: '', rollNumber: '', formNumber: '' });
      setTimeout(() => { setShowModal(false); setSelectedSlot(null); setSuccess(false); }, 2500);
    } catch {
      setError('Network error! Try again.');
    } finally {
      setLoading(false);
    }
  };

  const allSlots = Object.keys(SLOT_LABELS);
  const availableSlots = allSlots.filter(s => !bookedSlots.includes(s));

  return (
    <div style={{ minHeight: '100vh', padding: '16px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px', paddingTop: '16px' }}>
        

        <h1 style={{
          fontFamily: 'var(--font-comic)',
          fontSize: 'clamp(1.8rem, 6vw, 3.5rem)',
          color: 'var(--text-primary)',
          letterSpacing: '2px',
          textShadow: '3px 3px 0 var(--accent-yellow), 5px 5px 0 var(--accent-pink)',
          lineHeight: 1.2,
        }}>
          ⚡ SLOT BOOKING ⚡
        </h1>

        <div className="speech-bubble" style={{ display: 'inline-block', marginTop: '14px' }}>
          <p style={{ fontFamily: 'var(--font-comic)', fontSize: '16px', lineHeight: '1.4', letterSpacing: '0.5px' }}>
            Pick your date &amp; time slot!
          </p>
        </div>
      </div>

      {/* Date Tabs */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
        {DATES.map((d) => (
          <button
            key={d.value}
            className={`date-tab ${selectedDate === d.value ? 'active' : ''}`}
            onClick={() => { setSelectedDate(d.value); setSelectedSlot(null); }}
          >
            <div style={{ fontWeight: 'bold' }}>{d.day}</div>
            <div style={{ marginTop: '2px' }}>{d.label}</div>
          </button>
        ))}
      </div>

      {/* Stats */}
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
          {fetching ? '⏳ LOADING...' : `🎮 ${availableSlots.length} / ${allSlots.length} SLOTS FREE`}
        </div>
      </div>

      {/* Slot Grid */}
      <div className="halftone" style={{
        padding: '20px',
        background: 'var(--bg-secondary)',
        border: '4px solid var(--border-color)',
        boxShadow: '6px 6px 0 var(--shadow-color)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '10px',
          position: 'relative',
          zIndex: 1,
        }}>
          {allSlots.map((slot, i) => {
            const isBooked = bookedSlots.includes(slot);
            const isSelected = selectedSlot === slot;
            return (
              <div
                key={slot}
                className={`slot-card ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''} animate-pop`}
                style={{
                  animationDelay: `${i * 0.03}s`,
                  borderTop: isBooked ? undefined : `5px solid ${SLOT_COLORS[i % SLOT_COLORS.length]}`,
                }}
                onClick={() => !isBooked && handleSlotClick(slot)}
              >
                <div style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '11px',
                  marginBottom: '6px',
                  opacity: isBooked ? 0.3 : 1,
                  lineHeight: '1.4',
                }}>
                  {SLOT_LABELS[slot]}
                </div>
                <div style={{
                  fontFamily: 'var(--font-comic)',
                  fontSize: '16px',
                  color: isBooked ? '#999' : 'var(--accent-pink)',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                }}>
                  {isBooked ? 'BOOKED' : 'OPEN ✨'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '28px',
        paddingBottom: '20px',
        fontFamily: 'var(--font-comic)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        letterSpacing: '0.5px',
      }}>
        ★ March 23 – 26, 2026 ★ 9:30 AM to 5:00 PM ★
      </div>

      {/* ========== BOOKING MODAL ========== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal-content animate-pop" onClick={(e) => e.stopPropagation()}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '16px' }} className="success-pop">
                <div className="starburst" style={{ width: '100px', height: '100px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px' }}>YAY!</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-comic)', fontSize: '2rem', color: '#2E7D32', textShadow: '2px 2px 0 #222' }}>
                  BOOKED! ✅
                </h2>
                <p style={{ fontFamily: 'var(--font-comic)', fontSize: '15px', marginTop: '10px', color: '#555' }}>
                  {SLOT_LABELS[selectedSlot!]} on {selectedDate}
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
                    {selectedSlot && SLOT_LABELS[selectedSlot]} • {selectedDate}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-comic)', fontSize: '1.6rem', letterSpacing: '1px' }}>
                    📝 BOOK THIS SLOT!
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

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { key: 'name', label: 'NAME', placeholder: 'Your Name', type: 'text' },
                      { key: 'phone', label: 'PHONE NUMBER', placeholder: 'Phone Number', type: 'tel' },
                      { key: 'jkluId', label: 'JKLU ID', placeholder: 'JKLU ID', type: 'text' },
                      { key: 'rollNumber', label: 'ROLL NUMBER', placeholder: 'Roll Number', type: 'text' },
                      { key: 'formNumber', label: 'FORM NUMBER', placeholder: 'Form Number', type: 'text' },
                    ].map((field) => (
                      <div key={field.key}>
                        <label style={{
                          fontFamily: 'var(--font-comic)',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          display: 'block',
                          marginBottom: '4px',
                          letterSpacing: '1px',
                        }}>
                          {field.label}
                        </label>
                        <input
                          className="comic-input"
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.key as keyof FormData]}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
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
                      type="submit"
                      className="comic-btn"
                      style={{ background: 'var(--accent-green)', flex: 1 }}
                      disabled={loading}
                    >
                      {loading ? '⏳ ...' : '⚡ BOOK IT!'}
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
