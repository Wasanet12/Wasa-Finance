/**
 * Change Indicator Component
 * Displays directional indicators for metric changes
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChangeIndicatorProps {
  change: number;
  changePercent: number;
}

export function ChangeIndicator({ change, changePercent }: ChangeIndicatorProps) {
  if (change === 0) {
    return (
      <div className="flex items-center text-gray-500">
        <Minus className="h-4 w-4 mr-1" />
        <span className="text-sm">0%</span>
      </div>
    );
  }

  const isPositive = change > 0;
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center ${color}`}>
      <Icon className="h-4 w-4 mr-1" />
      <span className="text-sm font-medium">
        {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
      </span>
    </div>
  );
}

// Convenience function for direct usage
export function getChangeIndicator(change: number, changePercent: number) {
  return <ChangeIndicator change={change} changePercent={changePercent} />;
}