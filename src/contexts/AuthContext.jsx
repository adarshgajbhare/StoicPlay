import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import youtubeSubscriptionsService from '../services/youtubeSubscriptionsService';

const AuthContext = createContext({ 
  user: null, 
  loading: true,
  hasYouTubeAccess: false,
  refreshYouTubeAccess: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasYouTubeAccess, setHasYouTubeAccess] = useState(false);

  const checkYouTubeAccess = async (userId) => {
    if (!userId) {
      setHasYouTubeAccess(false);
      return;
    }
    
    try {
      const hasAccess = await youtubeSubscriptionsService.hasYouTubeAccess(userId);
      setHasYouTubeAccess(hasAccess);
    } catch (error) {
      console.error('Error checking YouTube access:', error);
      setHasYouTubeAccess(false);
    }
  };

  const refreshYouTubeAccess = () => {
    if (user) {
      checkYouTubeAccess(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        checkYouTubeAccess(user.uid);
      } else {
        setHasYouTubeAccess(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      hasYouTubeAccess, 
      refreshYouTubeAccess 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
