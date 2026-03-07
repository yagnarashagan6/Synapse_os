import React, { createContext, useContext, useState, useEffect } from 'react';

const PlatformContext = createContext();

export const PlatformProvider = ({ children }) => {
  // Try to load from localStorage, otherwise default to 'instagram'
  const [activePlatform, setActivePlatform] = useState('instagram');

  // We can still save/sync to localStorage, but on mount we force 'instagram' as per user request
  useEffect(() => {
    localStorage.setItem('synapse_active_platform', activePlatform);
  }, [activePlatform]);

  return (
    <PlatformContext.Provider value={{ activePlatform, setActivePlatform }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => useContext(PlatformContext);
