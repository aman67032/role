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

  // Group bookings by date
  const groupedBookings = bookings.reduce((acc, booking) => {
    if (!acc[booking.date]) acc[booking.date] = [];
    acc[booking.date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  // ---------- LOGIN VIEW ----------
  if (!isLoggedIn) {
    return (
      <div style={{ fontFamily: '"Times New Roman", Times, serif', minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '50px 40px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '40px', textAlign: 'center', color: '#111827', margin: '0 0 30px 0' }}>Administration</h2>
          
          {loginError && (
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '6px', marginBottom: '24px', fontSize: '1.25rem', border: '1px solid #f87171' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '1.35rem', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', padding: '16px', fontSize: '1.5rem', border: '2px solid #d1d5db', borderRadius: '6px', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                placeholder="Enter your ID"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '1.35rem', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '16px', fontSize: '1.5rem', border: '2px solid #d1d5db', borderRadius: '6px', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#111827', color: 'white', padding: '20px', fontSize: '1.75rem', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '20px', fontFamily: 'inherit', transition: 'opacity 0.2s' }}
            >
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD VIEW (TIMELINE) ----------
  return (
    <div style={{ fontFamily: '"Times New Roman", Times, serif', minHeight: '100vh', backgroundColor: '#f9fafb', padding: '60px 20px', color: '#111827' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #e5e7eb', paddingBottom: '30px', marginBottom: '50px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', margin: '0 0 10px 0', color: '#111827' }}>Booking Administration</h1>
            <p style={{ fontSize: '1.5rem', color: '#6b7280', margin: 0 }}>Review all scheduled slots in chronological order.</p>
          </div>
          <button
            onClick={handleLogout}
            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '16px 32px', fontSize: '1.5rem', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)' }}
          >
            Logout
          </button>
        </div>

        {fetchError && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '24px', fontSize: '1.75rem', borderRadius: '8px', marginBottom: '40px', border: '1px solid #f87171' }}>
            {fetchError}
          </div>
        )}
        
        {bookings.length === 0 && !fetchError && (
          <div style={{ textAlign: 'center', padding: '80px 20px', fontSize: '2.5rem', color: '#6b7280', border: '3px dashed #d1d5db', borderRadius: '16px', backgroundColor: '#f3f4f6' }}>
            No bookings have been made yet.
          </div>
        )}

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
          {Object.keys(groupedBookings).sort().map(date => (
            <div key={date}>
              <div style={{ display: 'inline-block', backgroundColor: '#111827', color: 'white', padding: '16px 32px', borderRadius: '50px', marginBottom: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>Date: {date}</h2>
              </div>
              
              <div style={{ position: 'relative', borderLeft: '6px solid #d1d5db', marginLeft: '32px', paddingLeft: '40px' }}>
                {groupedBookings[date].map((b) => (
                  <div key={b._id} style={{ position: 'relative', marginBottom: '60px' }}>
                    
                    {/* Timeline Node */}
                    <div style={{ position: 'absolute', width: '28px', height: '28px', backgroundColor: '#3b82f6', borderRadius: '50%', left: '-57px', top: '6px', border: '6px solid #f9fafb', boxShadow: '0 0 0 2px #d1d5db' }}></div>
                    
                    {/* Time Slot Header */}
                    <h3 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center' }}>
                      <span style={{ display: 'inline-block', borderBottom: '3px solid #bfdbfe', paddingBottom: '4px' }}>{b.timeSlot}</span>
                    </h3>
                    
                    {/* Details Card */}
                    <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                        
                        <div>
                          <strong style={{ fontSize: '1.35rem', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</strong>
                          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>{b.name}</div>
                        </div>
                        
                        <div>
                          <strong style={{ fontSize: '1.35rem', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Phone Number</strong>
                          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>{b.phone}</div>
                        </div>
                        
                        <div>
                          <strong style={{ fontSize: '1.35rem', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>JKLU ID</strong>
                          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', padding: '4px 12px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'inline-block' }}>{b.jkluId}</div>
                        </div>
                        
                        <div>
                          <strong style={{ fontSize: '1.35rem', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Roll Number</strong>
                          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>{b.rollNumber}</div>
                        </div>
                        
                        <div>
                          <strong style={{ fontSize: '1.35rem', color: '#6b7280', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Form Number</strong>
                          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>{b.formNumber}</div>
                        </div>

                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
