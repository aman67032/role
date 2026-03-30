'use client';

import { useState, useEffect, useCallback } from 'react';
import VolunteerLoader from '@/components/VolunteerLoader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const VOLUNTEER_DATES: { value: string, label: string, day: string, blocked?: boolean }[] = [
  { value: '2026-03-28', label: 'MAR 28', day: 'SAT', blocked: true },
  { value: '2026-03-30', label: 'MAR 30', day: 'MON', blocked: true },
  { value: '2026-04-01', label: 'APR 01', day: 'WED', blocked: true },
  { value: '2026-04-02', label: 'APR 02', day: 'THU', blocked: true },
  { value: '2026-04-03', label: 'APR 03', day: 'FRI' ,blocked: true},
  { value: '2026-04-04', label: 'APR 04', day: 'SAT',blocked: true },
  { value: '2026-04-06', label: 'APR 06', day: 'MON' ,blocked: true},
];

const SLOT_LABELS: Record<string, string> = {
  '09:30': '9:30 AM', '09:45': '9:45 AM', '10:00': '10:00 AM', '10:15': '10:15 AM', '10:30': '10:30 AM', '10:45': '10:45 AM',
  '11:00': '11:00 AM', '11:15': '11:15 AM', '11:30': '11:30 AM', '11:45': '11:45 AM',
  '12:00': '12:00 PM', '12:15': '12:15 PM', '12:30': '12:30 PM', '12:45': '12:45 PM',
  '13:00': '1:00 PM', '13:15': '1:15 PM', '13:30': '1:30 PM', '13:45': '1:45 PM',
  '14:00': '2:00 PM', '14:15': '2:15 PM', '14:30': '2:30 PM', '14:45': '2:45 PM',
  '15:00': '3:00 PM', '15:15': '3:15 PM', '15:30': '3:30 PM', '15:45': '3:45 PM',
  '16:00': '4:00 PM', '16:15': '4:15 PM', '16:30': '4:30 PM', '16:45': '4:45 PM',
  '17:00': '5:00 PM', '17:15': '5:15 PM',
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

interface Slot {
  timeSlot: string;
  slotIndex: number;
}

export default function VolunteerPage() {
  const category = 'volunteers';
  const [selectedDate, setSelectedDate] = useState(VOLUNTEER_DATES[0].value);
  const [bookedSlots, setBookedSlots] = useState<{timeSlot: string, slotIndex: number}[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '', phone: '', jkluId: '', rollNumber: '', formNumber: '',
  });

  const fetchSlots = useCallback(async () => {
    try {
      setFetching(true);
      const res = await fetch(`${API_URL}/api/slots?date=${selectedDate}&category=${category}`);
      const data = await res.json();
      setBookedSlots(data.bookedSlots || []);
      setAllSlots(data.allSlots || []);
    } catch {
      console.error('Failed to fetch slots');
    } finally {
      setFetching(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSlots();
    // Minimum 5 seconds loading for the initial mount
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [fetchSlots]);

  useEffect(() => {
    if (!fetching && minLoadingComplete) {
      setInitialLoading(false);
    }
  }, [fetching, minLoadingComplete]);

  useEffect(() => {
    // 15 seconds polling
    const interval = setInterval(fetchSlots, 15000); 
    const handleFocus = () => fetchSlots();
    window.addEventListener('focus', handleFocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', handleFocus); };
  }, [fetchSlots]);

  const handleSlotClick = (slot: Slot) => {
    const isBooked = bookedSlots.some(b => b.timeSlot === slot.timeSlot && b.slotIndex === slot.slotIndex);
    if (isBooked) return;
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
        body: JSON.stringify({ 
          date: selectedDate, 
          timeSlot: selectedSlot.timeSlot, 
          slotIndex: selectedSlot.slotIndex,
          category,
          ...formData 
        }),
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

  const availableSlots = allSlots.filter(s => !bookedSlots.some(b => b.timeSlot === s.timeSlot && b.slotIndex === s.slotIndex));
  const isSelectedDateBlocked = VOLUNTEER_DATES.find(d => d.value === selectedDate)?.blocked;

  if (initialLoading) {
    return <VolunteerLoader />;
  }

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
          ✨ VOLUNTEER BOOKING ✨
        </h1>

        <div className="speech-bubble" style={{ display: 'inline-block', marginTop: '14px' }}>
          <p style={{ fontFamily: 'var(--font-comic)', fontSize: '16px', lineHeight: '1.4', letterSpacing: '0.5px' }}>
            Book your volunteer time slot!
          </p>
        </div>
      </div>

      {/* Date Tabs */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
        {VOLUNTEER_DATES.map((d) => (
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
          background: 'var(--accent-pink)',
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
        {isSelectedDateBlocked ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            fontFamily: 'var(--font-comic)',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{
              fontSize: '3.5rem',
              marginBottom: '15px',
              filter: 'drop-shadow(3px 3px 0 #222)'
            }}>
              🔒
            </div>
            <h3 style={{
              fontSize: '2rem',
              color: 'var(--accent-pink)',
              textShadow: '2px 2px 0 var(--border-color)',
              marginBottom: '12px',
              letterSpacing: '1px'
            }}>
              BOOKING CLOSED
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '400px',
              margin: '0 auto',
              lineHeight: '1.4'
            }}>
              Slots for this date are currently unavailable for booking. Please check other dates!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '10px',
            position: 'relative',
            zIndex: 1,
          }}>
            {allSlots.map((slot, i) => {
              const isBooked = bookedSlots.some(b => b.timeSlot === slot.timeSlot && b.slotIndex === slot.slotIndex);
              const isSelected = selectedSlot?.timeSlot === slot.timeSlot && selectedSlot?.slotIndex === slot.slotIndex;
              return (
                <div
                  key={`${slot.timeSlot}-${slot.slotIndex}`}
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
                    {SLOT_LABELS[slot.timeSlot]}
                    {slot.slotIndex > 0 && ` (${slot.slotIndex + 1})`}
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
        )}
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
        ★ March 28 – April 6, 2026 ★ 9:30 AM to 5:15 PM ★
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
                   {selectedSlot && SLOT_LABELS[selectedSlot.timeSlot]} on {selectedDate}
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
                    {selectedSlot && SLOT_LABELS[selectedSlot.timeSlot]} {selectedSlot && selectedSlot.slotIndex > 0 && `(${selectedSlot.slotIndex + 1})`} • {selectedDate}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-comic)', fontSize: '1.6rem', letterSpacing: '1px' }}>
                    📝 BOOK VOLUNTEER SLOT!
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
