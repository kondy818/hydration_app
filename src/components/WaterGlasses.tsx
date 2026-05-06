import React from 'react';

export function WaterGlasses({ remainingWaterMl }: { remainingWaterMl: number }) {
  const GLASS_CAPACITY = 200; // 1杯 200ml
  const totalGlasses = Math.ceil(remainingWaterMl / GLASS_CAPACITY);

  if (totalGlasses === 0) {
    return (
      <div className="water-glasses-empty">
        <span className="glasses-empty-emoji">💧</span>
        <p>必要な水分はすべて補給済みです！</p>
      </div>
    );
  }

  const glasses = Array.from({ length: totalGlasses }).map((_, index) => {
    const remainingForThisGlass = remainingWaterMl - index * GLASS_CAPACITY;
    const fillRatio = Math.min(1, Math.max(0, remainingForThisGlass / GLASS_CAPACITY));
    const fillPercentage = fillRatio * 100;

    return (
      <div key={index} className="water-glass-container">
        <div className="water-glass">
          <div 
            className="water-glass-fill" 
            style={{ height: `${fillPercentage}%` }}
          />
        </div>
        <span className="glass-volume-label">
          {Math.round(Math.min(GLASS_CAPACITY, Math.max(0, remainingForThisGlass)))}ml
        </span>
      </div>
    );
  });

  return (
    <div className="water-glasses-wrapper">
      <div className="water-glasses-grid">
        {glasses}
      </div>
      <p className="water-glasses-total-label">
        あと <strong>{Math.ceil(remainingWaterMl)}ml</strong> (約{totalGlasses}杯)
      </p>
    </div>
  );
}
