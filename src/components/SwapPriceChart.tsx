import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import dayjs from 'dayjs';

interface SwapEvent {
  timestamp: number;
  amount0In: string;
  amount1In: string;
  amount0Out: string;
  amount1Out: string;
  reserve0: string;
  reserve1: string;
}

interface SwapPriceChartProps {
  swapEvents: SwapEvent[];
  token0Symbol: string;
  token1Symbol: string;
}

export function SwapPriceChart({ swapEvents, token0Symbol, token1Symbol }: SwapPriceChartProps) {
  // Calculate the price from each swap event
  const priceData = swapEvents.map(event => {
    // Calculate price as reserve1/reserve0 (token1 per token0)
    const price = parseFloat(event.reserve1) / parseFloat(event.reserve0);
    return {
      timestamp: event.timestamp,
      price,
      timeFormatted: dayjs(event.timestamp * 1000).format('HH:mm:ss')
    };
  });

  if (swapEvents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Swap Price History ({token1Symbol}/{token0Symbol})
        </h3>
        <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No swap events found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Swap Price History ({token1Symbol}/{token0Symbol})
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={priceData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timeFormatted" 
              label={{ value: 'Time', position: 'insideBottomRight', offset: -10 }}
            />
            <YAxis 
              label={{ value: `Price (${token1Symbol}/${token0Symbol})`, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => value.toFixed(6)}
              labelFormatter={(time: string) => `Time: ${time}`}
            />
            <Legend />
            <Bar 
              dataKey="price" 
              name={`Price (${token1Symbol}/${token0Symbol})`} 
              fill="#82ca9d" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Chart shows price calculated as Reserve1/Reserve0 at swap execution time</p>
      </div>
    </div>
  );
}