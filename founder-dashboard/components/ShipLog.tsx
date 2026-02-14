'use client';

import { useState, useEffect } from 'react';
import { ShipLog as ShipLogType, TabName } from '@/types';
import { collection, query, orderBy, limit, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ShipLogProps {
  category: TabName;
}

export default function ShipLog({ category }: ShipLogProps) {
  const [logs, setLogs] = useState<ShipLogType[]>([]);
  const [showShipForm, setShowShipForm] = useState(false);
  const [shipData, setShipData] = useState({
    description: '',
    metricTargeted: '',
    resultNote: '',
  });

  const today = new Date().toISOString().split('T')[0];
  const hasShippedToday = logs.some((log) => log.date === today);

  useEffect(() => {
    const q = query(
      collection(db, 'shipLogs'),
      orderBy('date', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as ShipLogType[];

      setLogs(logsData);
    });

    return () => unsubscribe();
  }, []);

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'shipLogs'), {
        ...shipData,
        date: today,
        createdAt: Timestamp.now(),
      });

      setShipData({
        description: '',
        metricTargeted: '',
        resultNote: '',
      });
      setShowShipForm(false);
    } catch (error) {
      console.error('Failed to log ship:', error);
    }
  };

  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#e8e6e3]">Ship Log</h2>

        {!hasShippedToday && (
          <button
            onClick={() => setShowShipForm(!showShipForm)}
            className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition text-sm"
          >
            {showShipForm ? 'Cancel' : 'Ship Something Today'}
          </button>
        )}

        {hasShippedToday && (
          <span className="px-3 py-1 bg-green-900/30 text-green-400 text-sm font-medium rounded">
            ✓ Shipped today
          </span>
        )}
      </div>

      {showShipForm && (
        <form onSubmit={handleShip} className="mb-6 p-4 bg-[#0a0a0f] rounded border border-[#2a2a2f] space-y-4">
          <div>
            <label className="block text-sm text-[#a8a6a3] mb-1">What shipped?</label>
            <textarea
              value={shipData.description}
              onChange={(e) => setShipData({ ...shipData, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843] resize-none"
              rows={3}
              placeholder="Describe what you shipped..."
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#a8a6a3] mb-1">Metric Targeted</label>
            <input
              type="text"
              value={shipData.metricTargeted}
              onChange={(e) => setShipData({ ...shipData, metricTargeted: e.target.value })}
              className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
              placeholder="e.g., Retention, Growth, DAU"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#a8a6a3] mb-1">
              Expected Result (optional)
            </label>
            <input
              type="text"
              value={shipData.resultNote}
              onChange={(e) => setShipData({ ...shipData, resultNote: e.target.value })}
              className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
              placeholder="What impact do you expect?"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition text-sm"
          >
            Log Ship
          </button>
        </form>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-8 text-[#6a6a6f]">
          No ships logged yet. Ship something today!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2f]">
                <th className="text-left py-2 px-3 text-[#a8a6a3] font-medium">Date</th>
                <th className="text-left py-2 px-3 text-[#a8a6a3] font-medium">What Shipped</th>
                <th className="text-left py-2 px-3 text-[#a8a6a3] font-medium">Metric</th>
                <th className="text-left py-2 px-3 text-[#a8a6a3] font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[#2a2a2f]/50 hover:bg-[#0a0a0f] transition">
                  <td className="py-3 px-3 text-[#e8e6e3]">
                    {new Date(log.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-[#e8e6e3]">{log.description}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-1 bg-[#d4a843]/20 text-[#d4a843] rounded text-xs">
                      {log.metricTargeted}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#a8a6a3]">
                    {log.resultNote || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
