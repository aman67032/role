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
      setFetchError('Session expired. Please log in again.');
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
      <div className="min-h-screen bg-slate-950 flex justify-center items-center p-4 sm:p-8 font-sans relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[150px] pointer-events-none"></div>

        <div className="relative w-full max-w-lg backdrop-blur-2xl bg-slate-900/60 p-8 sm:p-12 rounded-3xl border border-slate-700/50 shadow-2xl transform transition-all duration-500 hover:shadow-blue-900/20 hover:border-slate-600/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-3xl"></div>
          
          <div className="text-center mb-10">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 drop-shadow-sm mb-3">
              Admin Portal
            </h2>
            <p className="text-slate-400 text-lg">Sign in to manage bookings</p>
          </div>
          
          {loginError && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-lg animate-pop">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 uppercase letter-spacing-wide ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-4 text-xl bg-slate-900/50 border border-slate-700/80 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600 shadow-inner"
                placeholder="Enter admin ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 uppercase letter-spacing-wide ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-4 text-xl bg-slate-900/50 border border-slate-700/80 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600 shadow-inner"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-4 px-6 text-xl font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:ring-4 focus:ring-indigo-500/30 transform transition-all active:scale-[0.98] shadow-lg shadow-blue-900/40 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD VIEW (TIMELINE) ----------
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 relative">
      {/* Background glow effects */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none z-0"></div>

      <div className="max-w-6xl mx-auto px-6 py-12 sm:py-20 relative z-10">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 -mx-6 px-6 py-6 mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-2xl">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-2">
              Bookings Overview
            </h1>
            <p className="text-lg text-slate-400">Chronological timeline of scheduled slots</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-700 transition-all shadow-sm active:scale-95"
          >
            Sign Out
          </button>
        </div>

        {fetchError && (
          <div className="mb-12 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xl font-medium text-center">
            {fetchError}
          </div>
        )}
        
        {bookings.length === 0 && !fetchError && (
          <div className="text-center py-32 px-6 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
            <h3 className="text-3xl text-slate-500 font-semibold mb-2">No bookings yet</h3>
            <p className="text-slate-600 text-lg">As users book slots, they will appear here automatically.</p>
          </div>
        )}

        {/* Timeline */}
        <div className="flex flex-col gap-24">
          {Object.keys(groupedBookings).sort().map(date => (
            <div key={date} className="relative">
              
              {/* Date Header */}
              <div className="sticky top-[100px] z-40 inline-block mb-12">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 shadow-xl px-8 py-3 rounded-full flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
                  <h2 className="text-3xl font-bold text-slate-100 uppercase tracking-widest">{date}</h2>
                </div>
              </div>
              
              <div className="relative border-l-2 border-slate-800 ml-8 pl-10 sm:pl-16 space-y-16 pb-10">
                {groupedBookings[date].map((b) => (
                  <div key={b._id} className="relative group">
                    
                    {/* Glowing Timeline Node */}
                    <div className="absolute w-5 h-5 bg-indigo-500 rounded-full -left-[49px] sm:-left-[73px] top-[14px] ring-4 ring-slate-950 group-hover:bg-blue-400 group-hover:shadow-[0_0_20px_rgba(96,165,250,0.6)] transition-all duration-300"></div>
                    
                    {/* Time Slot Label */}
                    <h3 className="text-3xl font-extrabold text-indigo-300 mb-6 flex items-center gap-4">
                      {b.timeSlot}
                      <span className="h-px bg-slate-800 flex-grow rounded-full max-w-[100px] sm:max-w-md"></span>
                    </h3>
                    
                    {/* Booking Glass Card */}
                    <div className="backdrop-blur-xl bg-slate-900/40 p-8 rounded-2xl border border-slate-700/40 shadow-xl hover:shadow-2xl hover:bg-slate-800/50 hover:border-slate-600/50 transition-all duration-300 group-hover:-translate-y-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8">
                        <div>
                          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Full Name</span>
                          <div className="text-2xl text-slate-100 font-bold">{b.name}</div>
                        </div>
                        
                        <div>
                          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Phone Number</span>
                          <div className="text-2xl text-slate-100 font-bold">{b.phone}</div>
                        </div>
                        
                        <div>
                          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2 block">JKLU ID</span>
                          <div className="inline-block px-4 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xl font-bold tracking-wider">
                            {b.jkluId}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Roll Number</span>
                          <div className="text-2xl text-slate-100 font-bold">{b.rollNumber}</div>
                        </div>
                        
                        <div className="lg:col-span-2">
                          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2 block">Form Number</span>
                          <div className="text-2xl text-slate-100 font-bold">{b.formNumber}</div>
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
