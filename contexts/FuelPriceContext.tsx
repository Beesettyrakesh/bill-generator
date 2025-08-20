"use client";

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import branchData from '../branches.json';

// Create default fuel prices object with all branches
const createDefaultFuelPrices = () => {
  const defaultPrices: Record<string, string> = {};
  branchData.forEach(branch => {
    defaultPrices[branch.name] = "";
  });
  return defaultPrices;
};

// Helper function to safely interact with localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  }
};

interface FuelPriceContextType {
  fuelPrices: Record<string, string>;
  updateFuelPrice: (branch: string, price: string) => void;
  verifyPersistence: () => boolean;
}

const FuelPriceContext = createContext<FuelPriceContextType>({
  fuelPrices: createDefaultFuelPrices(),
  updateFuelPrice: () => {},
  verifyPersistence: () => false
});

export const FuelPriceProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Initialize with default empty prices
  const [fuelPrices, setFuelPrices] = useState<Record<string, string>>(createDefaultFuelPrices());
  const initialized = useRef(false);
  const persistenceVerified = useRef(false);

  // Load saved prices from localStorage on mount - only once
  useEffect(() => {
    if (initialized.current) return;
    
    console.log('FuelPriceContext: Initializing and loading from localStorage');
    
    // Ensure we're running in browser environment
    if (typeof window !== 'undefined') {
      const savedPrices = safeLocalStorage.getItem('fuelPrices');
      
      if (savedPrices) {
        try {
          const parsedPrices = JSON.parse(savedPrices);
          console.log('FuelPriceContext: Found saved prices in localStorage:', parsedPrices);
          setFuelPrices(parsedPrices);
          persistenceVerified.current = true;
        } catch (error) {
          console.error('FuelPriceContext: Error parsing saved fuel prices:', error);
          // Fall back to default prices (already set in state)
        }
      } else {
        console.log('FuelPriceContext: No saved prices found in localStorage');
      }
    }
    
    initialized.current = true;
  }, []);

  // Save prices to localStorage when they change
  useEffect(() => {
    // Skip the initial render
    if (!initialized.current) return;
    
    console.log('FuelPriceContext: Saving prices to localStorage:', fuelPrices);
    
    // Ensure we're running in browser environment
    if (typeof window !== 'undefined') {
      const success = safeLocalStorage.setItem('fuelPrices', JSON.stringify(fuelPrices));
      
      if (success) {
        // Verify the data was actually saved
        const savedData = safeLocalStorage.getItem('fuelPrices');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            const keysMatch = Object.keys(parsedData).length === Object.keys(fuelPrices).length;
            persistenceVerified.current = keysMatch;
            
            if (!keysMatch) {
              console.error('FuelPriceContext: Persistence verification failed - key count mismatch');
            } else {
              console.log('FuelPriceContext: Persistence verified successfully');
            }
          } catch (error) {
            console.error('FuelPriceContext: Persistence verification failed - parse error:', error);
            persistenceVerified.current = false;
          }
        } else {
          console.error('FuelPriceContext: Persistence verification failed - could not read saved data');
          persistenceVerified.current = false;
        }
      }
    }
  }, [fuelPrices]);

  const updateFuelPrice = (branch: string, price: string) => {
    console.log(`FuelPriceContext: Updating price for ${branch} to ${price}`);
    setFuelPrices(prev => {
      const updated = {
        ...prev,
        [branch]: price
      };
      return updated;
    });
  };
  
  // Function to verify if persistence is working
  const verifyPersistence = (): boolean => {
    return persistenceVerified.current;
  };

  return (
    <FuelPriceContext.Provider value={{ fuelPrices, updateFuelPrice, verifyPersistence }}>
      {children}
    </FuelPriceContext.Provider>
  );
};

export const useFuelPrices = () => useContext(FuelPriceContext);
