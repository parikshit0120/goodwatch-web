'use client';

import { useState, useEffect } from 'react';
import { Task, TabName } from '@/types';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TaskBoardProps {
  category: TabName;
}

export default function TaskBoard({ category }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    linkedMetric: '',
    impactScore: 3,
    effortScore: 2,
    dueDate: '',
  });

  useEffect(() => {
    const q = query(
      collection(db, 'tasks'),
      where('category', '==', category),
      where('status', '!=', 'done')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Task[];

      // Sort by priority (will be calculated on display)
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [category]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        category,
        status: 'backlog',
        createdAt: Timestamp.now(),
      });

      setNewTask({
        title: '',
        linkedMetric: '',
        impactScore: 3,
        effortScore: 2,
        dueDate: '',
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'backlog' | 'in_progress' | 'done') => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const update: { status: string; completedAt?: Timestamp } = { status: newStatus };

      if (newStatus === 'done') {
        update.completedAt = Timestamp.now();
      }

      await updateDoc(taskRef, update);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const calculateUrgency = (dueDate: string): number => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysUntil = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 5; // Overdue
    if (daysUntil === 0) return 4; // Today
    if (daysUntil === 1) return 3; // Tomorrow
    if (daysUntil <= 3) return 2; // Within 3 days
    return 1;
  };

  const topTasks = tasks
    .map((task) => ({
      ...task,
      urgency: calculateUrgency(task.dueDate),
      priority: task.impactScore * calculateUrgency(task.dueDate),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#e8e6e3]">
          Top 3 Priority Tasks - {category}
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#d4a843] text-[#0a0a0f] rounded font-medium hover:bg-[#c49833] transition text-sm"
        >
          {showAddForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTask} className="mb-6 p-4 bg-[#0a0a0f] rounded border border-[#2a2a2f] space-y-4">
          <div>
            <label className="block text-sm text-[#a8a6a3] mb-1">Title</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#a8a6a3] mb-1">Linked Metric</label>
              <input
                type="text"
                value={newTask.linkedMetric}
                onChange={(e) => setNewTask({ ...newTask, linkedMetric: e.target.value })}
                className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
                placeholder="e.g., DAU, New Users"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#a8a6a3] mb-1">Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#a8a6a3] mb-1">Impact (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={newTask.impactScore}
                onChange={(e) => setNewTask({ ...newTask, impactScore: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#a8a6a3] mb-1">Effort (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={newTask.effortScore}
                onChange={(e) => setNewTask({ ...newTask, effortScore: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-[#1a1a1f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm focus:outline-none focus:border-[#d4a843]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#d4a843] text-[#0a0a0f] rounded font-medium hover:bg-[#c49833] transition text-sm"
          >
            Create Task
          </button>
        </form>
      )}

      {topTasks.length === 0 ? (
        <div className="text-center py-8 text-[#6a6a6f]">
          No active tasks. Add your first task to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {topTasks.map((task, index) => (
            <div
              key={task.id}
              className="p-4 bg-[#0a0a0f] border border-[#2a2a2f] rounded hover:border-[#3a3a3f] transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#d4a843]">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-[#e8e6e3]">
                      {task.title}
                    </span>
                  </div>
                  <div className="text-xs text-[#a8a6a3]">
                    Metric: {task.linkedMetric} | Impact: {task.impactScore} | Urgency: {task.urgency} | Priority Score: {task.priority}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    task.status === 'in_progress'
                      ? 'bg-blue-900/30 text-blue-400'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-[#6a6a6f]">
                  Due: {new Date(task.dueDate).toLocaleDateString()} |{' '}
                  {Math.floor((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                </div>

                <div className="flex gap-2">
                  {task.status === 'backlog' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Start
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'done')}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tasks.length > 3 && (
        <div className="mt-4 text-center text-sm text-[#6a6a6f]">
          +{tasks.length - 3} more tasks in backlog
        </div>
      )}
    </div>
  );
}
