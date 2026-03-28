import React, { useState, useEffect } from 'react';
import App from './App';
import { Auth } from './components/Auth';
import { getMe, removeToken } from './lib/api';
import { CustomCursor, AmbientBackground } from './components/UI/UIComponents';

function Root() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleAuthSuccess = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (err) {
      console.error("Failed to fetch user after auth", err);
    }
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <AmbientBackground isTestActive={false} />
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="App">
      {!user ? (
        <>
          <CustomCursor />
          <AmbientBackground isTestActive={false} />
          <Auth onAuthSuccess={handleAuthSuccess} />
        </>
      ) : (
        <App user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default Root;
