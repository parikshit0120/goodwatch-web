import { supabase } from './supabase';
import { DashboardMetrics, Constraint } from '@/types';

export async function getCurrentMetrics(): Promise<DashboardMetrics> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get app events from last 7 days
    const { data: events, error } = await supabase
      .from('app_events')
      .select('*')
      .gte('created_at', sevenDaysAgo);

    if (error) {
      console.error('Error fetching events:', error);
      return { dau: 0, newUsers: 0, retention7d: 0, sharesPerUser: 0, revenue7d: 0 };
    }

    // Calculate DAU (unique users today)
    const todayEvents = events?.filter(e => e.created_at.startsWith(today)) || [];
    const dau = new Set(todayEvents.map(e => e.user_id)).size;

    // Calculate new users today
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59');

    const newUsers = profiles?.length || 0;

    // Calculate 7-day retention (simplified)
    const allEvents = events || [];
    const activeUsers = new Set(allEvents.map(e => e.user_id));
    const retention7d = activeUsers.size > 0 ? (dau / activeUsers.size) * 100 : 0;

    // Shares per user
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('interaction_type', 'share')
      .gte('created_at', sevenDaysAgo);

    const sharesPerUser = activeUsers.size > 0 ? (interactions?.length || 0) / activeUsers.size : 0;

    // Revenue (placeholder - no payments yet)
    const revenue7d = 0;

    return {
      dau,
      newUsers,
      retention7d: Math.round(retention7d * 10) / 10,
      sharesPerUser: Math.round(sharesPerUser * 100) / 100,
      revenue7d,
    };
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return { dau: 0, newUsers: 0, retention7d: 0, sharesPerUser: 0, revenue7d: 0 };
  }
}

export async function detectConstraint(): Promise<Constraint> {
  try {
    const currentMetrics = await getCurrentMetrics();

    const targets = {
      dau: 50,
      newUsers: 25,
      retention7d: 30,
      sharesPerUser: 0.1,
      revenue7d: 100,
    };

    const retentionGap = currentMetrics.retention7d - targets.retention7d;
    const growthGap = currentMetrics.newUsers - targets.newUsers;
    const revenueGap = currentMetrics.revenue7d - targets.revenue7d;

    if (retentionGap < -10) {
      return {
        type: 'Retention',
        metric: 'retention7d',
        actual: currentMetrics.retention7d,
        target: targets.retention7d,
        gap: retentionGap,
        detectedAt: new Date(),
      };
    }

    if (growthGap < -15) {
      return {
        type: 'Growth',
        metric: 'newUsers',
        actual: currentMetrics.newUsers,
        target: targets.newUsers,
        gap: growthGap,
        detectedAt: new Date(),
      };
    }

    if (revenueGap < -50) {
      return {
        type: 'Monetization',
        metric: 'revenue7d',
        actual: currentMetrics.revenue7d,
        target: targets.revenue7d,
        gap: revenueGap,
        detectedAt: new Date(),
      };
    }

    return {
      type: 'Product Velocity',
      metric: 'dau',
      actual: currentMetrics.dau,
      target: targets.dau,
      gap: currentMetrics.dau - targets.dau,
      detectedAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to detect constraint:', error);
    return {
      type: 'Product Velocity',
      metric: 'dau',
      actual: 0,
      target: 50,
      gap: -50,
      detectedAt: new Date(),
    };
  }
}
