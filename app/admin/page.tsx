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

  const groupedBookings = bookings.reduce((acc, booking) => {
    if (!acc[booking.date]) acc[booking.date] = [];
    acc[booking.date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  // ---------- LOGIN VIEW ----------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4 antialiased">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Admin Portal</h2>
            <p className="text-gray-500">Sign in to manage slot bookings</p>
          </div>
          
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter admin ID"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-4 px-4 text-lg font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD VIEW ----------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header Dashboard Nav */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">
                Bookings Dashboard
              </h1>
              <p className="text-sm text-gray-500 font-medium">Manage all scheduled slots</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold rounded-xl transition-all"
          >
            Sign Out
          </button>
        </div>

        {fetchError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 font-medium text-center shadow-sm">
            {fetchError}
          </div>
        )}
        
        {bookings.length === 0 && !fetchError && (
          <div className="text-center py-20 px-4 border-2 border-dashed border-gray-300 rounded-3xl bg-gray-50/50">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No bookings yet</h3>
            <p className="text-gray-500">When users book slots, they will appear here in a structured table.</p>
          </div>
        )}

        {/* Data Tables Grouped by Date */}
        <div className="flex flex-col gap-10">
          {Object.keys(groupedBookings).sort().map(date => (
            <div key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Date Badge */}
              <div className="flex items-center gap-3 mb-4 pl-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                <h2 className="text-xl font-bold text-gray-800 tracking-wide">{date}</h2>
                <div className="h-px bg-gray-300 flex-grow ml-4 rounded-full"></div>
              </div>
              
              {/* Table Container */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                        <th className="p-5 w-32">Time Slot</th>
                        <th className="p-5">Full Name</th>
                        <th className="p-5">Phone</th>
                        <th className="p-5">JKLU ID</th>
                        <th className="p-5">Roll No</th>
                        <th className="p-5">Form No</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupedBookings[date].map((b, i) => (
                        <tr key={b._id} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="p-5">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-sm border border-blue-200 group-hover:bg-blue-200 transition-colors">
                              {b.timeSlot}
                            </span>
                          </td>
                          <td className="p-5 font-bold text-gray-900">{b.name}</td>
                          <td className="p-5 font-medium text-gray-600">{b.phone}</td>
                          <td className="p-5">
                            <span className="font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200 text-sm">
                              {b.jkluId}
                            </span>
                          </td>
                          <td className="p-5 font-medium text-gray-600">{b.rollNumber}</td>
                          <td className="p-5 font-bold text-gray-900">{b.formNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
