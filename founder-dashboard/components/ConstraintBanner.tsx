'use client';

import { useState, useEffect } from 'react';
import { Constraint } from '@/types';
import { detectConstraint } from '@/lib/metrics';

export default function ConstraintBanner() {
  const [constraint, setConstraint] = useState<Constraint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConstraint();
    // Refresh every 10 minutes
    const interval = setInterval(fetchConstraint, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchConstraint = async () => {
    try {
      const data = await detectConstraint();
      setConstraint(data);
    } catch (error) {
      console.error('Failed to fetch constraint:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#2a2a2f] border-b border-[#3a3a3f]">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="text-[#a8a6a3] text-center">Analyzing constraints...</div>
        </div>
      </div>
    );
  }

  if (!constraint) return null;

  const getConstraintColor = (type: string) => {
    switch (type) {
      case 'Growth':
        return 'bg-blue-900/30 border-blue-700';
      case 'Retention':
        return 'bg-red-900/30 border-red-700';
      case 'Monetization':
        return 'bg-green-900/30 border-green-700';
      case 'Product Velocity':
        return 'bg-yellow-900/30 border-yellow-700';
      default:
        return 'bg-gray-900/30 border-gray-700';
    }
  };

  const getGapText = (gap: number) => {
    if (gap >= 0) {
      return `+${gap.toFixed(1)} above target`;
    }
    return `${Math.abs(gap).toFixed(1)} below target`;
  };

  return (
    <div className={`border-b ${getConstraintColor(constraint.type)}`}>
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-white font-bold text-lg">
              CURRENT CONSTRAINT: {constraint.type.toUpperCase()}
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="text-white/80 text-sm">
              {constraint.metric}: Target {constraint.target} | Actual{' '}
              {constraint.actual.toFixed(1)}
            </div>
          </div>

          <div className="text-right">
            <div
              className={`font-bold ${
                constraint.gap >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {getGapText(constraint.gap)}
            </div>
            <div className="text-white/60 text-xs">
              Detected {new Date(constraint.detectedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
