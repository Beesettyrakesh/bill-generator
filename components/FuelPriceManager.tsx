"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useFuelPrices } from '@/contexts/FuelPriceContext';
import branchData from '../branches.json';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Check, X, MoveHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <Button 
        variant={persistenceStatus === false ? "destructive" : "default"}
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2"
      >
        <span>⛽ Fuel Prices</span>
        {persistenceStatus === false && <AlertTriangle className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Card 
      className={cn(
        "fixed z-50 w-[300px] shadow-lg",
        position.x === 'right' ? 'right-4' : 'left-4',
        position.y === 'top' ? 'top-4' : 'bottom-4'
      )}
      ref={panelRef}
    >
      <CardHeader className="bg-primary text-primary-foreground py-2 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>⛽</span>
            <CardTitle className="text-base">Fuel Prices</CardTitle>
            {persistenceStatus === false && 
              <AlertTriangle className="h-4 w-4 text-destructive-foreground animate-pulse" />
            }
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-primary-foreground hover:bg-primary/80"
              onClick={() => setPosition({ 
                x: position.x === 'right' ? 'left' : 'right', 
                y: position.y 
              })}
            >
              <MoveHorizontal className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-primary-foreground hover:bg-primary/80"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 space-y-3">
        <Input
          type="text"
          placeholder="Search branches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm"
        />
        
        <div className="flex gap-2 items-center">
          <select 
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {branchData.map(branch => (
              <option key={branch.id} value={branch.name}>
                {branch.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <Input
              type="text"
              placeholder="Price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-20 h-9 text-sm"
            />
            <Button 
              variant="secondary"
              size="icon"
              onClick={handleUpdatePrice}
              className="h-9 w-9"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
          {filteredBranches.map(branch => (
            <div 
              key={branch.id} 
              className={cn(
                "rounded-md border p-2 text-xs cursor-pointer hover:bg-muted transition-colors",
                editingBranch === branch.name && "border-primary"
              )}
              onClick={() => editingBranch !== branch.name && handleQuickEdit(branch.name)}
            >
              {editingBranch === branch.name ? (
                <div className="space-y-1">
                  <div className="font-medium truncate">{branch.name}</div>
                  <div className="flex gap-1">
                    <Input
                      type="text"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button 
                        variant="default"
                        size="icon"
                        onClick={handleSaveQuickEdit}
                        className="h-7 w-7"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingBranch(null)}
                        className="h-7 w-7"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-medium truncate">{branch.name}</div>
                  <div className="text-primary font-medium mt-1">
                    {fuelPrices[branch.name] ? `₹${fuelPrices[branch.name]}` : 'Not set'}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0">
        <Button 
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="ml-auto text-xs"
        >
          Clear All Prices
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FuelPriceManager;
