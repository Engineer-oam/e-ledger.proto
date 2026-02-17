import { useState, useEffect } from 'react';
import { Batch } from '../types';

export const useRealTimeData = (initialBatches: Batch[]) => {
  const [stats, setStats] = useState({
    totalVolume: 0,
    activeNodes: 18,
    blockHeight: 15804,
    networkLatency: 14,
    transactionsPerSecond: 4.2
  });

  const [liveFeed, setLiveFeed] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([
    { time: '10:00', value: 400 },
    { time: '10:05', value: 300 },
    { time: '10:10', value: 600 },
    { time: '10:15', value: 800 },
    { time: '10:20', value: 500 },
    { time: '10:25', value: 900 },
    { time: '10:30', value: 1100 },
  ]);

  useEffect(() => {
    // Initial Calc
    setStats(prev => ({ ...prev, totalVolume: initialBatches.length }));

    const interval = setInterval(() => {
      // 1. Simulate changing network stats
      setStats(prev => ({
        ...prev,
        activeNodes: prev.activeNodes + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0),
        blockHeight: prev.blockHeight + 1,
        networkLatency: Math.floor(10 + Math.random() * 20),
        transactionsPerSecond: Number((3 + Math.random() * 5).toFixed(1))
      }));

      // 2. Simulate Log Feed
      const actions = ['Batch Created', 'Transfer Initiated', 'Tax Paid', 'Stock Received', 'Quality Check Passed', 'Block Mined'];
      const locations = ['Mumbai Depot', 'Baddi Plant', 'Delhi Retail', 'Chennai Hub', 'Mainnet Node 04'];
      const newLog = `${actions[Math.floor(Math.random() * actions.length)]} at ${locations[Math.floor(Math.random() * locations.length)]}`;
      
      setLiveFeed(prev => [newLog, ...prev].slice(0, 5));

      // 3. Simulate Chart Data Flow
      setChartData(prev => {
        const lastTime = prev[prev.length - 1].time;
        const [hr, min] = lastTime.split(':').map(Number);
        const d = new Date();
        d.setHours(hr);
        d.setMinutes(min + 5);
        const newTime = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        
        const newValue = Math.floor(Math.random() * 1000) + 200;
        return [...prev.slice(1), { time: newTime, value: newValue }];
      });

    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [initialBatches]);

  return { stats, liveFeed, chartData };
};