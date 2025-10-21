"use client";

import { AddTradeForm } from "@/components/add-trade-form"
import { PerformanceAnalytics } from "@/components/performance-analytics"
import { TradesTable } from "@/components/trades-table"
import { useState } from "react"

export default function Page() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTradeAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Header with Add Trade Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trading Journal</h1>
            <p className="text-muted-foreground">
              Track and analyze your crypto trading performance
            </p>
          </div>
          <AddTradeForm onTradeAdded={handleTradeAdded} />
        </div>

        {/* Performance Analytics */}
        <div className="px-4 lg:px-6">
          <PerformanceAnalytics refreshTrigger={refreshTrigger} />
        </div>

        {/* Trades Table */}
        <div className="px-4 lg:px-6">
          <TradesTable refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}