'use client';

import { TabName } from '@/types';
import TaskBoard from './TaskBoard';
import ShipLog from './ShipLog';
import ContextTab from './ContextTab';

interface TabContentProps {
  activeTab: TabName;
}

export default function TabContent({ activeTab }: TabContentProps) {
  if (activeTab === 'Context') {
    return <ContextTab />;
  }

  return (
    <div className="space-y-6">
      {/* Top 3 Priority Tasks */}
      <TaskBoard category={activeTab} />

      {/* Ship Log */}
      <ShipLog category={activeTab} />
    </div>
  );
}
