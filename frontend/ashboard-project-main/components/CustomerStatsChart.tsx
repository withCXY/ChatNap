'use client';

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Customer } from '../app/types';

interface CustomerStatsChartProps {
  customers: Customer[];
}

const PLATFORM_COLORS = [
  '#6C5DD3', // Purple - Instagram
  '#A66DD4', // Light Purple - Meta
  '#FF6AD5', // Pink Purple - WhatsApp
  '#4ECDC4', // Cyan - Etsy
  '#45B7D1', // Blue - Shopify
  '#96CEB4', // Green - Others
  '#FFEAA7', // Yellow - Others
  '#DDA0DD'  // Light Purple - Others
];

const INTERACTION_COLORS = [
  '#6C5DD3', // Purple - Ongoing
  '#45B7D1', // Blue - Confirmed
  '#FFB347', // Orange - Escalated
  '#96CEB4'  // Green - Others
];

export default function CustomerStatsChart({ customers }: CustomerStatsChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'doughnut'>('pie');

  // Calculate platform data
  const platformData = useMemo(() => {
    const platformCounts: { [key: string]: number } = {};
    customers.forEach(customer => {
      platformCounts[customer.platform] = (platformCounts[customer.platform] || 0) + 1;
    });

    return Object.entries(platformCounts).map(([platform, count], index) => ({
      name: platform,
      value: count,
      color: PLATFORM_COLORS[index % PLATFORM_COLORS.length]
    }));
  }, [customers]);

  // Calculate interaction stage data
  const interactionData = useMemo(() => {
    const interactionCounts: { [key: string]: number } = {};
    customers.forEach(customer => {
      interactionCounts[customer.interactionStage] = (interactionCounts[customer.interactionStage] || 0) + 1;
    });

    return Object.entries(interactionCounts).map(([stage, count], index) => ({
      name: stage,
      value: count,
      color: INTERACTION_COLORS[index % INTERACTION_COLORS.length]
    }));
  }, [customers]);

  const renderChart = () => {
    if (customers.length === 0) {
      return (
        <div className="flex items-center justify-center h-80 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div>No data available</div>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Customer Count">
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={interactionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {interactionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Customer Analytics</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'pie' 
                ? 'bg-[#6C5DD3] text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'bar' 
                ? 'bg-[#6C5DD3] text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType('doughnut')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartType === 'doughnut' 
                ? 'bg-[#6C5DD3] text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Doughnut
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        {chartType === 'pie' && 'Platform Distribution'}
        {chartType === 'bar' && 'Customer Count by Platform'}
        {chartType === 'doughnut' && 'Interaction Stage Distribution'}
      </div>
      
      {renderChart()}
    </div>
  );
} 