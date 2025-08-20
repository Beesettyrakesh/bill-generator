"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useFuelPrices } from '@/contexts/FuelPriceContext';
import branchData from '../branches.json';
import '../css/FuelPriceManager.css';

const FuelPriceManager: React.FC = () => {
  const { fuelPrices, updateFuelPrice, verifyPersistence } = useFuelPrices();
  const [selectedBranch, setSelectedBranch] = useState(branchData[0].name);
  const [newPrice, setNewPrice] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 'right', y: 'top' });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [persistenceStatus, setPersistenceStatus] = useState<boolean | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Filter branches based on search term
  const filteredBranches = branchData.filter(branch => 
    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check persistence status when component mounts
  useEffect(() => {
    const status = verifyPersistence();
    setPersistenceStatus(status);
    console.log('FuelPriceManager: Persistence status:', status ? 'OK' : 'FAILED');
  }, [verifyPersistence]);

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleUpdatePrice = () => {
    if (newPrice && !isNaN(Number(newPrice)) && Number(newPrice) > 0) {
      console.log(`FuelPriceManager: Updating price for ${selectedBranch} to ${newPrice}`);
      updateFuelPrice(selectedBranch, newPrice);
      
      // Check persistence after update
      setTimeout(() => {
        const status = verifyPersistence();
        setPersistenceStatus(status);
        console.log('FuelPriceManager: Persistence status after update:', status ? 'OK' : 'FAILED');
      }, 100);
      
      setNewPrice('');
    } else {
      console.error('Please enter a valid fuel price');
    }
  };

  const handleQuickEdit = (branch: string) => {
    setEditingBranch(branch);
    setEditPrice(fuelPrices[branch] || '');
  };

  const handleSaveQuickEdit = () => {
    if (editingBranch && editPrice && !isNaN(Number(editPrice)) && Number(editPrice) > 0) {
      updateFuelPrice(editingBranch, editPrice);
      setEditingBranch(null);
    } else {
      console.error('Please enter a valid fuel price');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all cached fuel prices?')) {
      branchData.forEach(branch => {
        updateFuelPrice(branch.name, '');
      });
    }
  };

  // Toggle button
  if (!isExpanded) {
    return (
      <button 
        className={`manage-prices-button ${persistenceStatus === false ? 'persistence-error' : ''}`}
        onClick={() => setIsExpanded(true)}
        title="Manage Fuel Prices"
      >
        <span className="button-icon">⛽</span>
        <span className="button-text">Fuel Prices</span>
        {persistenceStatus === false && <span className="persistence-warning" title="Storage persistence issue detected">⚠️</span>}
      </button>
    );
  }

  return (
    <div 
      className={`fuel-price-manager floating-panel ${position.x} ${position.y}`}
      ref={panelRef}
    >
      <div className="fuel-price-manager-header">
        <div className="header-title">
          <span className="header-icon">⛽</span>
          <h3>Fuel Prices</h3>
          {persistenceStatus === false && 
            <span className="persistence-warning-header" title="Storage persistence issue detected">⚠️</span>
          }
        </div>
        <div className="header-controls">
          <button 
            className="position-button" 
            onClick={() => setPosition({ 
              x: position.x === 'right' ? 'left' : 'right', 
              y: position.y 
            })}
            title="Change horizontal position"
          >
            ↔️
          </button>
          <button 
            className="close-button" 
            onClick={() => setIsExpanded(false)}
            title="Close panel"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search branches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="quick-update-container">
        <select 
          value={selectedBranch} 
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="branch-select"
        >
          {branchData.map(branch => (
            <option key={branch.id} value={branch.name}>
              {branch.name}
            </option>
          ))}
        </select>
        <div className="price-input-container">
          <input
            type="text"
            placeholder="Price"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="price-input"
          />
          <button 
            onClick={handleUpdatePrice}
            className="update-button"
            title="Update price"
          >
            ✓
          </button>
        </div>
      </div>
      
      <div className="price-cards-container">
        {filteredBranches.map(branch => (
          <div key={branch.id} className="price-card">
            {editingBranch === branch.name ? (
              <div className="editing-card">
                <span className="branch-name">{branch.name}</span>
                <div className="edit-controls">
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="edit-price-input"
                    autoFocus
                  />
                  <button 
                    onClick={handleSaveQuickEdit}
                    className="save-edit-button"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button 
                    onClick={() => setEditingBranch(null)}
                    className="cancel-edit-button"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="view-card"
                onClick={() => handleQuickEdit(branch.name)}
              >
                <span className="branch-name">{branch.name}</span>
                <span className="price-value">
                  {fuelPrices[branch.name] ? `₹${fuelPrices[branch.name]}` : 'Not set'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="fuel-price-manager-footer">
        <button 
          onClick={handleClearAll}
          className="clear-all-button"
          title="Clear all prices"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default FuelPriceManager;
