import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Scatter,
  ScatterChart
} from 'recharts';

interface ReservesCurveChartProps {
  reserve0: string;
  reserve1: string;
  token0Symbol: string;
  token1Symbol: string;
}

export function ReservesCurveChart({ 
  reserve0, 
  reserve1, 
  token0Symbol, 
  token1Symbol 
}: ReservesCurveChartProps) {
  const [curveData, setCurveData] = useState<Array<{x: number, y: number}>>([]);
  const [currentPoint, setCurrentPoint] = useState<{x: number, y: number}>({x: 0, y: 0});

  useEffect(() => {
    if (reserve0 && reserve1) {
      // Convert string values to numbers
      const r0 = parseFloat(reserve0);
      const r1 = parseFloat(reserve1);
      
      // Calculate constant product (k)
      const k = r0 * r1;
      
      // Generate points along the x*y=k curve
      const points = [];
      const numPoints = 100;
      
      // Set reasonable x bounds based on reserve0
      const minX = Math.max(r0 * 0.1, 0.1);
      const maxX = r0 * 2;
      
      for (let i = 0; i < numPoints; i++) {
        const x = minX + (i / (numPoints - 1)) * (maxX - minX);
        const y = k / x;
        points.push({ x, y });
      }
      
      setCurveData(points);
      setCurrentPoint({ x: r0, y: r1 });
    }
  }, [reserve0, reserve1]);

  if (!reserve0 || !reserve1 || curveData.length === 0) {
    return <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">Loading chart data...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">AMM Reserve Curve (x * y = k)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={curveData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              type="number" 
              name={token0Symbol}
              label={{ value: token0Symbol, position: 'insideBottomRight', offset: -10 }}
            />
            <YAxis 
              dataKey="y" 
              type="number" 
              name={token1Symbol}
              label={{ value: token1Symbol, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => value.toFixed(2)}
              labelFormatter={(value: number) => `${token0Symbol}: ${value.toFixed(2)}`}
            />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#8884d8" 
              name="Reserve Curve"
              dot={false}
            />
            <Scatter 
              name="Current Position" 
              data={[currentPoint]} 
              fill="#ff7300" 
              shape="circle" 
              line={{ strokeWidth: 2 }}
            >
            </Scatter>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>
          Current position: {parseFloat(reserve0).toFixed(2)} {token0Symbol} × {parseFloat(reserve1).toFixed(2)} {token1Symbol} = {(parseFloat(reserve0) * parseFloat(reserve1)).toFixed(2)}
        </p>
      </div>
    </div>
  );
}