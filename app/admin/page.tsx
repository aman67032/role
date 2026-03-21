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
  
  // Date-wise pagination state
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
      
      // Auto-select the earliest available date
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

  // Compute unique dates for pagination tabs
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(bookings.map(b => b.date))).sort();
  }, [bookings]);

  // Filter bookings for the currently selected date tab
  const displayedBookings = useMemo(() => {
    return bookings
      .filter(b => b.date === selectedDate)
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [bookings, selectedDate]);

  // ---------- LOGIN VIEW ----------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4 selection:bg-indigo-100 font-sans">
        <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 mb-3 tracking-tight">
              Admin Portal
            </h2>
            <p className="text-slate-500 font-medium">Verify your credentials</p>
          </div>
          
          {loginError && (
            <div className="mb-8 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-indigo-500 transition-colors">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                placeholder="ID"
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-indigo-500 transition-colors">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                placeholder="Password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-4 px-6 text-lg font-bold text-white rounded-2xl bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? 'Authenticating...' : 'Secure SignIn'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD VIEW ----------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header Dashboard Nav */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-10 gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-inner border border-indigo-100">
              🗓️
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-600 tracking-tight mb-1">
                Bookings Review
              </h1>
              <p className="text-slate-500 font-medium">Select a date tab below to view allocated slots</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold text-sm uppercase tracking-wider rounded-2xl transition-all active:scale-95"
          >
            Sign Out
          </button>
        </div>

        {fetchError && (
          <div className="mb-10 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-medium text-center shadow-sm">
            {fetchError}
          </div>
        )}
        
        {bookings.length === 0 && !fetchError && (
          <div className="text-center py-24 px-6 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white">
            <div className="text-5xl mb-6">📭</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">No registered bookings yet</h3>
            <p className="text-slate-500 font-medium">When users complete the form, records will appear here.</p>
          </div>
        )}

        {/* Date Pagination Tabs */}
        {bookings.length > 0 && uniqueDates.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-[2rem] bg-white p-2 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
             <div className="flex overflow-x-auto gap-2 p-1 no-scrollbar">
                {/* CSS to hide scrollbar for elegance */}
                <style dangerouslySetInnerHTML={{__html: `
                  .no-scrollbar::-webkit-scrollbar { display: none; }
                  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />

                {uniqueDates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 px-8 py-4 rounded-2xl font-bold transition-all duration-300 text-base sm:text-lg tracking-wide ${
                      selectedDate === date
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-500'
                        : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                    }`}
                  >
                    {date}
                  </button>
                ))}
             </div>
          </div>
        )}

        {/* Data Table for Selected Date */}
        {selectedDate && (
          <div className="animate-in fade-in zoom-in-95 duration-500 bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
            
            {/* Table Header / Context */}
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <h2 className="text-xl font-bold text-slate-800">Showing {displayedBookings.length} slots for <span className="text-indigo-600">{selectedDate}</span></h2>
            </div>
            
            {/* The Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <th className="p-6 w-32 pl-8">Time</th>
                    <th className="p-6">Applicant Name</th>
                    <th className="p-6">Phone Number</th>
                    <th className="p-6">JKLU Entity ID</th>
                    <th className="p-6">Roll Tag</th>
                    <th className="p-6 pr-8">Ref / Form No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-6 pl-8">
                        <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 font-extrabold rounded-xl text-sm border border-indigo-100 group-hover:bg-indigo-100 transition-colors tracking-wide">
                          {b.timeSlot}
                        </span>
                      </td>
                      <td className="p-6 font-bold text-slate-800 text-lg">{b.name}</td>
                      <td className="p-6 font-semibold text-slate-600">{b.phone}</td>
                      <td className="p-6">
                        <span className="font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg text-sm border border-slate-200">
                          {b.jkluId}
                        </span>
                      </td>
                      <td className="p-6 font-semibold text-slate-600">{b.rollNumber}</td>
                      <td className="p-6 font-bold text-slate-800 pr-8">{b.formNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {displayedBookings.length === 0 && (
              <div className="p-12 text-center text-slate-500 font-medium">
                No slots booked for this specific date yet.
              </div>
            )}
            
          </div>
        )}
        
      </div>
    </div>
  );
}
