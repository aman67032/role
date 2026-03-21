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
      <div className="min-h-screen bg-[#FDFBF7] flex justify-center items-center p-4 sm:p-8 font-sans">
        <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 transition-all">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-800 mb-2">
              Admin Portal
            </h2>
            <p className="text-stone-500 text-sm sm:text-base">Sign in to manage bookings</p>
          </div>
          
          {loginError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-center text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4 sm:gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-3 sm:p-3.5 text-base bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder-stone-400"
                placeholder="Enter admin ID"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 sm:p-3.5 text-base bg-stone-50 border border-stone-200 rounded-xl text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder-stone-400"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-3 sm:py-3.5 px-4 text-sm sm:text-base font-bold text-white rounded-xl bg-stone-800 hover:bg-stone-700 focus:ring-4 focus:ring-stone-200 transform transition-all active:scale-[0.98] shadow-md disabled:opacity-50 disabled:active:scale-100"
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
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-stone-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
              Bookings Overview
            </h1>
            <p className="text-sm sm:text-base text-stone-500">Chronological timeline of scheduled slots</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-5 py-2 sm:py-2.5 bg-white hover:bg-stone-50 text-stone-700 font-semibold rounded-lg border border-stone-200 transition-all shadow-sm active:scale-95 text-sm sm:text-base"
          >
            Sign Out
          </button>
        </div>

        {fetchError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm sm:text-base font-medium text-center">
            {fetchError}
          </div>
        )}
        
        {bookings.length === 0 && !fetchError && (
          <div className="text-center py-16 sm:py-24 px-4 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
            <h3 className="text-lg sm:text-xl text-stone-600 font-medium mb-1">No bookings yet</h3>
            <p className="text-stone-400 text-sm sm:text-base">As users book slots, they will appear here automatically.</p>
          </div>
        )}

        {/* Timeline */}
        <div className="flex flex-col gap-12 sm:gap-16">
          {Object.keys(groupedBookings).sort().map(date => (
            <div key={date}>
              
              {/* Date Header */}
              <div className="inline-block mb-6 sm:mb-8">
                <div className="bg-white border border-stone-200 shadow-sm px-5 py-2 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <h2 className="text-sm sm:text-base font-bold text-stone-800 uppercase tracking-widest">{date}</h2>
                </div>
              </div>
              
              <div className="relative border-l-2 border-stone-200 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-8 sm:space-y-12 pb-4">
                {groupedBookings[date].map((b) => (
                  <div key={b._id} className="relative group">
                    
                    {/* Timeline Node */}
                    <div className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 rounded-full -left-[33px] sm:-left-[43px] top-[4px] sm:top-[6px] ring-4 ring-[#FDFBF7] transition-all duration-300"></div>
                    
                    {/* Time Slot Label */}
                    <h3 className="text-xl sm:text-2xl font-bold text-stone-800 mb-3 sm:mb-4 flex items-center gap-3">
                      {b.timeSlot}
                      <span className="h-px bg-stone-200 flex-grow rounded-full max-w-[60px] sm:max-w-[100px]"></span>
                    </h3>
                    
                    {/* Booking Card */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 sm:gap-y-6 gap-x-6">
                        <div>
                          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1 block">Full Name</span>
                          <div className="text-base sm:text-lg text-stone-800 font-medium">{b.name}</div>
                        </div>
                        
                        <div>
                          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1 block">Phone Number</span>
                          <div className="text-base sm:text-lg text-stone-800 font-medium">{b.phone}</div>
                        </div>
                        
                        <div>
                          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1 block">JKLU ID</span>
                          <div className="inline-block px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 border border-stone-200 text-sm sm:text-base font-semibold tracking-wide">
                            {b.jkluId}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1 block">Roll Number</span>
                          <div className="text-base sm:text-lg text-stone-800 font-medium">{b.rollNumber}</div>
                        </div>
                        
                        <div className="sm:col-span-2 lg:col-span-2">
                          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1 block">Form Number</span>
                          <div className="text-base sm:text-lg text-stone-800 font-medium">{b.formNumber}</div>
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
