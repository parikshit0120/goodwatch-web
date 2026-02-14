'use client';

import { useState, useEffect } from 'react';
import { DashboardMetrics, MetricTarget } from '@/types';
import { getCurrentMetrics } from '@/lib/metrics';

export default function MetricsHeader() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    dau: 0,
    newUsers: 0,
    retention7d: 0,
    sharesPerUser: 0,
    revenue7d: 0,
  });

  const [targets] = useState<MetricTarget>({
    dau: 50,
    newUsers: 25,
    retention7d: 30,
    sharesPerUser: 0.1,
    revenue7d: 100,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const data = await getCurrentMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDelta = (actual: number, target: number): number => {
    if (target === 0) return 0;
    return ((actual - target) / target) * 100;
  };

  const formatDelta = (delta: number): string => {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}%`;
  };

  const getDeltaColor = (delta: number): string => {
    if (delta >= 0) return 'text-green-400';
    if (delta >= -10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const MetricCard = ({
    label,
    value,
    target,
    format = (v: number) => v.toFixed(0),
  }: {
    label: string;
    value: number;
    target: number;
    format?: (v: number) => string;
  }) => {
    const delta = calculateDelta(value, target);

    return (
      <div className="bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg p-4">
        <div className="text-[#a8a6a3] text-sm mb-1">{label}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-[#e8e6e3]">
            {loading ? '—' : format(value)}
          </div>
          <div className={`text-sm font-medium ${getDeltaColor(delta)}`}>
            {!loading && formatDelta(delta)}
          </div>
        </div>
        <div className="text-[#6a6a6f] text-xs mt-1">
          Target: {format(target)}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#0a0a0f] border-b border-[#2a2a2f]">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard label="DAU" value={metrics.dau} target={targets.dau} />

          <MetricCard
            label="New Users Today"
            value={metrics.newUsers}
            target={targets.newUsers}
          />

          <MetricCard
            label="7D Retention"
            value={metrics.retention7d}
            target={targets.retention7d}
            format={(v) => `${v.toFixed(1)}%`}
          />

          <MetricCard
            label="Shares per User"
            value={metrics.sharesPerUser}
            target={targets.sharesPerUser}
            format={(v) => v.toFixed(2)}
          />

          <MetricCard
            label="Revenue (7D)"
            value={metrics.revenue7d}
            target={targets.revenue7d}
            format={(v) => `$${v.toFixed(0)}`}
          />
        </div>
      </div>
    </div>
  );
}
