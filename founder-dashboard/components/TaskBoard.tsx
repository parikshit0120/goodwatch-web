'use client';

import { useState, useEffect } from 'react';
import { Task, TabName } from '@/types';
import { supabase } from '@/lib/supabase';

interface TaskBoardProps {
  category: TabName;
}

export default function TaskBoard({ category }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    linkedMetric: '',
    impactScore: 3,
    effortScore: 2,
    dueDate: '',
  });

  useEffect(() => {
    fetchTasks();
  }, [category]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_tasks')
        .select('*')
        .eq('category', category)
        .neq('status', 'done')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('dashboard_tasks').insert([
        {
          ...newTask,
          category,
          status: 'todo',
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setNewTask({
        title: '',
        linkedMetric: '',
        impactScore: 3,
        effortScore: 2,
        dueDate: '',
      });
      setShowAddForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const calculatePriority = (task: Task) => {
    const daysUntilDue = task.dueDate
      ? Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 999;

    let urgencyScore = 1;
    if (daysUntilDue < 0) urgencyScore = 5; // Overdue
    else if (daysUntilDue === 0) urgencyScore = 4; // Due today
    else if (daysUntilDue === 1) urgencyScore = 3; // Due tomorrow
    else if (daysUntilDue <= 3) urgencyScore = 2; // Due in 3 days

    return task.impactScore * urgencyScore;
  };

  const sortedTasks = [...tasks].sort((a, b) => calculatePriority(b) - calculatePriority(a));

  if (loading) {
    return (
      <div className="text-center text-[#a8a6a3] py-8">Loading tasks...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#e8e6e3]">
          {category} Tasks ({tasks.length})
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#d4a843] text-[#0a0a0f] rounded font-medium hover:bg-[#c49833] transition text-sm"
        >
          {showAddForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTask} className="bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Linked metric (optional)"
              value={newTask.linkedMetric}
              onChange={(e) => setNewTask({ ...newTask, linkedMetric: e.target.value })}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm"
            />
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="px-3 py-2 bg-[#0a0a0f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a8a6a3] mb-1">Impact (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={newTask.impactScore}
                onChange={(e) => setNewTask({ ...newTask, impactScore: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#a8a6a3] mb-1">Effort (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={newTask.effortScore}
                onChange={(e) => setNewTask({ ...newTask, effortScore: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a2f] rounded text-[#e8e6e3] text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#d4a843] text-[#0a0a0f] rounded font-medium hover:bg-[#c49833] transition text-sm"
          >
            Add Task
          </button>
        </form>
      )}

      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="text-center text-[#6a6a6f] py-8 bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg">
            No tasks yet. Add one to get started!
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className="bg-[#1a1a1f] border border-[#2a2a2f] rounded-lg p-4 hover:border-[#3a3a3f] transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-[#e8e6e3] font-medium">{task.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#a8a6a3]">
                    <span>Impact: {task.impactScore}/5</span>
                    <span>Effort: {task.effortScore}/5</span>
                    {task.dueDate && (
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                    {task.linkedMetric && <span>→ {task.linkedMetric}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  className="ml-4 px-3 py-1 bg-green-900/20 text-green-400 border border-green-700 rounded text-xs hover:bg-green-900/30 transition"
                >
                  ✓ Done
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
