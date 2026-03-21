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
      <div className="font-[times_new_roman,serif] min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-10 rounded-xl shadow-lg max-w-lg w-full border border-gray-200">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-center text-gray-900 leading-tight">Administration</h2>
          
          {loginError && (
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6 text-lg border border-red-400">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="block text-xl font-bold mb-2 text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-4 text-xl border-2 border-gray-300 rounded-md outline-none focus:border-gray-800 transition-colors"
                placeholder="Enter your ID"
              />
            </div>
            <div>
              <label className="block text-xl font-bold mb-2 text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-4 text-xl border-2 border-gray-300 rounded-md outline-none focus:border-gray-800 transition-colors"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white p-4 text-2xl font-bold rounded-md hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 active:bg-gray-900 transition-all disabled:opacity-50 mt-4"
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
    <div className="font-[times_new_roman,serif] min-h-screen bg-gray-50 p-6 sm:p-12 text-gray-900">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-gray-200 pb-8 mb-10 gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold m-0 text-gray-900 leading-tight">Booking Administration</h1>
            <p className="text-xl sm:text-2xl text-gray-500 mt-2">Review all scheduled slots in chronological order.</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-red-500 text-white border-none py-3 px-8 text-xl sm:text-2xl font-bold rounded-md cursor-pointer shadow hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {fetchError && (
          <div className="bg-red-50 text-red-800 p-6 text-xl sm:text-2xl rounded-md mb-10 border border-red-400">
            {fetchError}
          </div>
        )}
        
        {bookings.length === 0 && !fetchError && (
          <div className="text-center p-10 sm:p-20 text-3xl text-gray-500 border-4 border-dashed border-gray-300 rounded-xl bg-gray-100">
            No bookings have been made yet.
          </div>
        )}

        {/* Timeline */}
        <div className="flex flex-col gap-16">
          {Object.keys(groupedBookings).sort().map(date => (
            <div key={date}>
              <div className="inline-block bg-gray-900 text-white py-3 px-8 rounded-full mb-8 shadow-md">
                <h2 className="text-2xl sm:text-4xl font-bold m-0 tracking-wide">Date: {date}</h2>
              </div>
              
              <div className="relative border-l-4 sm:border-l-8 border-gray-300 ml-4 sm:ml-8 pl-6 sm:pl-10">
                {groupedBookings[date].map((b) => (
                  <div key={b._id} className="relative mb-14">
                    
                    {/* Timeline Node */}
                    <div className="absolute w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full -left-[30px] sm:-left-[46px] top-1 sm:top-2 border-4 sm:border-8 border-gray-50 shadow-sm ring-2 ring-gray-300"></div>
                    
                    {/* Time Slot Header */}
                    <h3 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-4 inline-block border-b-4 border-blue-200 pb-1">
                      {b.timeSlot}
                    </h3>
                    
                    {/* Details Card */}
                    <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        
                        <div className="break-words">
                          <strong className="text-lg sm:text-xl text-gray-500 block mb-1 uppercase tracking-wider">Full Name</strong>
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{b.name}</div>
                        </div>
                        
                        <div className="break-words">
                          <strong className="text-lg sm:text-xl text-gray-500 block mb-1 uppercase tracking-wider">Phone Number</strong>
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{b.phone}</div>
                        </div>
                        
                        <div className="break-words">
                          <strong className="text-lg sm:text-xl text-gray-500 block mb-1 uppercase tracking-wider">JKLU ID</strong>
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded inline-block">{b.jkluId}</div>
                        </div>
                        
                        <div className="break-words">
                          <strong className="text-lg sm:text-xl text-gray-500 block mb-1 uppercase tracking-wider">Roll Number</strong>
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{b.rollNumber}</div>
                        </div>
                        
                        <div className="break-words lg:col-span-2">
                          <strong className="text-lg sm:text-xl text-gray-500 block mb-1 uppercase tracking-wider">Form Number</strong>
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{b.formNumber}</div>
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
