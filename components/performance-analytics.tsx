"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Trophy,
  Target,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";

interface Trade {
  id: string;
  tradingPair: string;
  entryPrice: string;
  exitPrice: string;
  profitOrLoss: string;
  screenshotUrl: string | null;
  tradeDate: string;
}

interface PerformanceAnalyticsProps {
  refreshTrigger?: number;
}

interface ChartData {
  date: string;
  profit: number;
  trades: number;
}

export function PerformanceAnalytics({ refreshTrigger }: PerformanceAnalyticsProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/trades?limit=100"); // Get more trades for analytics
      if (!response.ok) {
        throw new Error("Failed to fetch trades");
      }

      const data = await response.json();
      setTrades(data.trades || []);

      // Prepare chart data
      if (data.trades && data.trades.length > 0) {
        const groupedData = data.trades.reduce((acc: any, trade: Trade) => {
          const date = new Date(trade.tradeDate).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { date, profit: 0, trades: 0 };
          }
          acc[date].profit += parseFloat(trade.profitOrLoss);
          acc[date].trades += 1;
          return acc;
        }, {});

        const sortedData = Object.values(groupedData)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-30); // Last 30 days

        setChartData(sortedData);
      }
    } catch (error) {
      console.error("Error fetching trades for analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [refreshTrigger]);

  // Calculate analytics
  const totalTrades = trades.length;
  const winningTrades = trades.filter(trade => parseFloat(trade.profitOrLoss) > 0).length;
  const losingTrades = trades.filter(trade => parseFloat(trade.profitOrLoss) < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;
  const totalProfitLoss = trades.reduce((sum, trade) => sum + parseFloat(trade.profitOrLoss), 0);
  const avgProfitLoss = totalTrades > 0 ? totalProfitLoss / totalTrades : 0;

  const biggestWin = trades.length > 0
    ? Math.max(...trades.map(trade => parseFloat(trade.profitOrLoss)))
    : 0;
  const biggestLoss = trades.length > 0
    ? Math.min(...trades.map(trade => parseFloat(trade.profitOrLoss)))
    : 0;

  // Most traded pairs
  const pairCounts = trades.reduce((acc: any, trade) => {
    acc[trade.tradingPair] = (acc[trade.tradingPair] || 0) + 1;
    return acc;
  }, {});

  const mostTradedPair = Object.entries(pairCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              {winningTrades} wins, {losingTrades} losses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {winningTrades} of {totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P/L</CardTitle>
            {totalProfitLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average: {avgProfitLoss >= 0 ? '+' : ''}{avgProfitLoss.toFixed(2)}% per trade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Traded</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostTradedPair ? mostTradedPair[0] : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {mostTradedPair ? `${mostTradedPair[1] as number} trades` : "No trades yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      {totalTrades > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Biggest Win</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{biggestWin.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Best performing trade
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Biggest Loss</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {biggestLoss.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Worst performing trade
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {losingTrades > 0
                  ? (winningTrades / losingTrades).toFixed(2)
                  : winningTrades > 0 ? '∞' : '0'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Win/Loss ratio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Badge variant={totalProfitLoss >= 0 ? "default" : "destructive"}>
                {totalProfitLoss >= 0 ? "Profitable" : "Loss"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {totalProfitLoss >= 0 ? "🎉" : "📉"}
              </div>
              <p className="text-xs text-muted-foreground">
                Current performance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>
              Daily profit/loss percentage for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                profit: {
                  label: "Profit/Loss %",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ value: "Profit/Loss %", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="profit"
                    fill="var(--color-profit)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {totalTrades === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Trading Data Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start adding your trades to see your performance analytics here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}