'use client';

import { useState, useEffect, useMemo } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Booking {
  _id: string;
  date: string;
  timeSlot: string;
  name: string;
  phone: string;
  jkluId: string;
  rollNumber: string;
  formNumber: string;
  createdAt: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetchError, setFetchError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      fetchBookings(token);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
        fetchBookings(data.token);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch {
      setLoginError('Network error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setBookings([]);
    setUsername('');
    setPassword('');
    setSelectedDate('');
  };

  const fetchBookings = async (token: string) => {
    setFetchError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data: Booking[] = await res.json();
      setBookings(data);
      
      const uniqueDates = Array.from(new Set(data.map(b => b.date))).sort();
      if (uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[0]);
      }
    } catch {
      setFetchError('Session expired. Please log in again.');
      localStorage.removeItem('adminToken');
      setIsLoggedIn(false);
    }
  };

  const uniqueDates = useMemo(() => Array.from(new Set(bookings.map(b => b.date))).sort(), [bookings]);

  const displayedBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === selectedDate)
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [bookings, selectedDate]);

  // ---------- LOGIN VIEW ----------
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'var(--bg-primary)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="modal-content animate-pop" style={{ maxWidth: '420px', width: '100%', padding: '32px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '2.5rem', letterSpacing: '1px', color: 'var(--text-primary)', textShadow: '2px 2px 0 var(--accent-blue)', margin: 0, lineHeight: 1.2, fontWeight: '900' }}>
              🕵️ SECURE PORTAL
            </h2>
            <p style={{ marginTop: '8px', fontSize: '1rem', color: '#555', fontWeight: 'bold' }}>Authorized Personnel Only</p>
          </div>
          
          {loginError && (
            <div className="pixel-border-sm animate-wiggle" style={{ background: '#FF5252', padding: '12px', marginBottom: '20px', color: '#FFF', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>
              💥 {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontWeight: '800', display: 'block', marginBottom: '6px', fontSize: '0.95rem' }}>
                ID NUMBER 🆔
              </label>
              <input
                type="text"
                className="comic-input"
                placeholder="Enter ID..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ padding: '14px', fontSize: '1.2rem', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: '600' }}
              />
            </div>
            <div>
              <label style={{ fontWeight: '800', display: 'block', marginBottom: '6px', fontSize: '0.95rem' }}>
                TOP SECRET PASS 🔑
              </label>
              <input
                type="password"
                className="comic-input"
                placeholder="Enter pass..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '14px', fontSize: '1.2rem', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: '600' }}
              />
            </div>
            <button type="submit" className="comic-btn" disabled={loading} style={{ background: 'var(--accent-purple)', marginTop: '12px', width: '100%', fontSize: '1.2rem', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: '900' }}>
              {loading ? '⏳ HACKING IN...' : '🔓 ENTER MAINFRAME'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD VIEW ----------
  return (
    <div style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px', padding: '24px', background: 'var(--bg-card)', border: '4px solid var(--border-color)', boxShadow: '6px 6px 0 var(--shadow-color)', borderRadius: '8px' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', letterSpacing: '1px', textShadow: '2px 2px 0 var(--accent-pink)', margin: 0, fontWeight: '900' }}>
          🎮 COMMAND CENTER
        </h1>
        <button className="comic-btn" onClick={handleLogout} style={{ padding: '10px 20px', fontSize: '14px', background: '#FF5252', color: '#fff', border: '3px solid #111', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: '800' }}>
          🚪 EVACUATE
        </button>
      </div>

      {fetchError && (
        <div className="pixel-border" style={{ background: '#FFCDD2', padding: '20px', marginBottom: '24px', color: '#B71C1C', fontWeight: '800' }}>
          {fetchError}
        </div>
      )}

      {/* Date Tabs (Pagination) */}
      {uniqueDates.length > 0 && (
        <div style={{ padding: '16px', background: 'var(--bg-secondary)', border: '4px solid var(--border-color)', boxShadow: '6px 6px 0 var(--shadow-color)', display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '32px' }}>
          {uniqueDates.map(date => (
            <button
              key={date}
              className={`date-tab ${selectedDate === date ? 'active' : ''}`}
              onClick={() => setSelectedDate(date)}
              style={{ fontSize: '16px', padding: '12px 24px', flexShrink: 0, fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: '800' }}
            >
              🗓️ {date}
            </button>
          ))}
        </div>
      )}

      {/* Bookings Ticket Grid */}
      {selectedDate && (
        <div style={{ position: 'relative' }}>
          <div style={{ background: 'var(--bg-card)', display: 'inline-block', padding: '10px 18px', border: '3px solid var(--border-color)', boxShadow: '4px 4px 0 var(--shadow-color)', marginBottom: '24px', fontWeight: '800', fontSize: '1.1rem' }}>
            TOTAL SECURED SLOTS: <span style={{ color: 'var(--accent-blue)', fontSize: '1.4rem', fontWeight: '900' }}>{displayedBookings.length}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
            {displayedBookings.length === 0 ? (
              <div className="speech-bubble" style={{ background: '#fff', textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1', margin: '20px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <h3 style={{ fontSize: '22px', opacity: 0.8, fontWeight: '900' }}>🦗 CRICKETS... NO BOOKINGS HERE YET</h3>
                <p style={{ marginTop: '12px', fontSize: '16px', fontWeight: '600' }}>Select another date above.</p>
              </div>
            ) : (
              displayedBookings.map((b, index) => (
                <div key={b._id} className="pixel-border animate-pop" style={{ background: '#fff', position: 'relative', animationDelay: `${index * 0.05}s`, borderRadius: '4px' }}>
                  
                  {/* Card Header -> Time Slot */}
                  <div style={{ background: 'var(--accent-yellow)', padding: '16px 20px', borderBottom: '4px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>⏰ {b.timeSlot}</span>
                    <span style={{ background: 'var(--accent-green)', padding: '6px 12px', border: '2px solid #111', fontWeight: '900', fontSize: '11px', borderRadius: '4px', transform: 'rotate(5deg)' }}>
                      BOOKED ✓
                    </span>
                  </div>
                  
                  {/* Card Body -> Hacker Details */}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ borderBottom: '2px dashed #ccc', paddingBottom: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>APPLICANT NAME</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent-pink)', marginTop: '4px' }}>{b.name}</div>
                    </div>
                    
                    <div style={{ borderBottom: '2px dashed #ccc', paddingBottom: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>COMMLINK (PHONE)</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>📞 {b.phone}</div>
                    </div>
                    
                    {/* Identification Block */}
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', border: '3px solid var(--border-color)', borderRadius: '4px', position: 'relative' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '8px', opacity: 0.6, letterSpacing: '0.5px' }}>// IDENTIFICATION DB</div>
                      <div style={{ fontSize: '15px', margin: '8px 0', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
                        <span style={{ color: '#666', fontWeight: '700' }}>ID:</span> <strong style={{ marginLeft: '6px', fontWeight: '800' }}>{b.jkluId}</strong>
                      </div>
                      <div style={{ fontSize: '15px', margin: '8px 0', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
                        <span style={{ color: '#666', fontWeight: '700' }}>ROLL:</span> <strong style={{ marginLeft: '6px', fontWeight: '800' }}>{b.rollNumber}</strong>
                      </div>
                      <div style={{ fontSize: '15px', margin: '8px 0' }}>
                        <span style={{ color: '#666', fontWeight: '700' }}>FORM REF:</span> <strong style={{ marginLeft: '6px', fontWeight: '800' }}>{b.formNumber}</strong>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
