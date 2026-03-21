'use client';

import { useState, useEffect } from 'react';

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

  // Check if token exists on load
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
  };

  const fetchBookings = async (token: string) => {
    setFetchError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data);
    } catch {
      setFetchError('Could not load bookings. Your session may have expired.');
      localStorage.removeItem('adminToken');
      setIsLoggedIn(false);
    }
  };

  // Group bookings by date for cleaner UI
  const groupedBookings = bookings.reduce((acc, booking) => {
    if (!acc[booking.date]) acc[booking.date] = [];
    acc[booking.date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  // Login View
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div className="modal-content animate-pop" style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-comic)', fontSize: '2rem', letterSpacing: '1px' }}>
              🕵️ ADMIN LOGIN
            </h2>
          </div>
          
          {loginError && (
            <div className="pixel-border-sm" style={{ background: '#FFCDD2', padding: '10px', marginBottom: '16px', fontFamily: 'var(--font-comic)', color: '#B71C1C' }}>
              💥 {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-comic)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                USERNAME
              </label>
              <input
                type="text"
                className="comic-input"
                placeholder="Admin ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-comic)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                PASSWORD
              </label>
              <input
                type="password"
                className="comic-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="comic-btn" disabled={loading} style={{ background: 'var(--accent-green)', marginTop: '8px' }}>
              {loading ? '⏳ ...' : 'ENTER'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div style={{ minHeight: '100vh', padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{
          fontFamily: 'var(--font-comic)',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          color: 'var(--text-primary)',
          letterSpacing: '2px',
          textShadow: '3px 3px 0 var(--accent-yellow)',
        }}>
          🛡️ ADMIN DASHBOARD
        </h1>
        <button className="comic-btn" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '14px', background: 'var(--accent-pink)' }}>
          LOGOUT
        </button>
      </div>

      {fetchError ? (
        <div className="pixel-border-sm" style={{ background: '#FFCDD2', padding: '16px', fontFamily: 'var(--font-comic)' }}>
          {fetchError}
        </div>
      ) : bookings.length === 0 ? (
        <div className="halftone" style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-card)', border: '4px solid var(--border-color)', boxShadow: '6px 6px 0 var(--shadow-color)' }}>
          <h2 style={{ fontFamily: 'var(--font-comic)', fontSize: '1.5rem', color: '#666' }}>No bookings found.</h2>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.keys(groupedBookings).sort().map(date => (
            <div key={date} className="pixel-border" style={{ background: 'var(--bg-secondary)', padding: '20px' }}>
              <div style={{ display: 'inline-block', background: 'var(--accent-blue)', color: 'white', padding: '8px 16px', fontFamily: 'var(--font-pixel)', fontSize: '12px', marginBottom: '16px', border: '3px solid var(--border-color)', boxShadow: '3px 3px 0 var(--shadow-color)' }}>
                📅 {date}
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-comic)', background: 'white', border: '3px solid var(--border-color)' }}>
                  <thead style={{ background: 'var(--accent-yellow)' }}>
                    <tr>
                      <th style={{ padding: '12px', borderBottom: '3px solid var(--border-color)', borderRight: '2px solid #ccc', textAlign: 'left' }}>Time Slot</th>
                      <th style={{ padding: '12px', borderBottom: '3px solid var(--border-color)', borderRight: '2px solid #ccc', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '12px', borderBottom: '3px solid var(--border-color)', borderRight: '2px solid #ccc', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '12px', borderBottom: '3px solid var(--border-color)', borderRight: '2px solid #ccc', textAlign: 'left' }}>JKLU ID</th>
                      <th style={{ padding: '12px', borderBottom: '3px solid var(--border-color)', borderRight: '2px solid #ccc', textAlign: 'left' }}>Roll No</th>
                      <th style={{ padding: '12px', borderBottom: '3px solid var(--border-color)', textAlign: 'left' }}>Form No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedBookings[date].map((b, idx) => (
                      <tr key={b._id} style={{ borderBottom: '2px solid #eee', background: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                        <td style={{ padding: '12px', borderRight: '2px solid #eee', fontWeight: 'bold', color: 'var(--accent-pink)' }}>{b.timeSlot}</td>
                        <td style={{ padding: '12px', borderRight: '2px solid #eee' }}>{b.name}</td>
                        <td style={{ padding: '12px', borderRight: '2px solid #eee' }}>{b.phone}</td>
                        <td style={{ padding: '12px', borderRight: '2px solid #eee' }}>{b.jkluId}</td>
                        <td style={{ padding: '12px', borderRight: '2px solid #eee' }}>{b.rollNumber}</td>
                        <td style={{ padding: '12px' }}>{b.formNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
