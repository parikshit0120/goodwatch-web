'use client';

import { useState, useEffect } from 'react';
import { TabName } from '@/types';
import MetricsHeader from './MetricsHeader';
import ConstraintBanner from './ConstraintBanner';
import TabContent from './TabContent';
import AIChat from './AIChat';

const TABS: TabName[] = [
  'Product',
  'Growth',
  'Marketing',
  'Tech',
  'Monetization',
  'Partnerships',
  'Bugs',
  'Analytics',
  'Experiments',
  'Content',
  'Context',
];

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TabName>('Product');
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Top Metrics */}
      <MetricsHeader />

      {/* Constraint Banner */}
      <ConstraintBanner />

      {/* Tab Navigation */}
      <div className="border-b border-[#2a2a2f] bg-[#1a1a1f]">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 overflow-x-auto py-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded transition whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-[#d4a843] text-[#0a0a0f]'
                      : 'text-[#a8a6a3] hover:text-[#e8e6e3] hover:bg-[#2a2a2f]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* AI Chat Toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="ml-4 px-4 py-2 bg-[#2a2a2f] text-[#e8e6e3] rounded text-sm font-medium hover:bg-[#3a3a3f] transition whitespace-nowrap"
            >
              {showChat ? 'Hide' : 'Show'} AI Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tab Content */}
          <div className={showChat ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <TabContent activeTab={activeTab} />
          </div>

          {/* AI Chat Sidebar */}
          {showChat && (
            <div className="lg:col-span-1">
              <AIChat activeTab={activeTab} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
