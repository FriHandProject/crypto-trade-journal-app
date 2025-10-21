"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Trade {
  id: string;
  userId: string;
  tradingPair: string;
  entryPrice: string;
  exitPrice: string;
  profitOrLoss: string;
  screenshotUrl: string | null;
  tradeDate: string;
  createdAt: string;
  updatedAt: string;
}

interface TradesTableProps {
  refreshTrigger?: number;
}

type SortField = "tradeDate" | "tradingPair" | "profitOrLoss";
type SortOrder = "asc" | "desc";

export function TradesTable({ refreshTrigger }: TradesTableProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("tradeDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sortBy: sortField,
        sortOrder: sortOrder,
      });

      const response = await fetch(`/api/trades?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch trades");
      }

      const data = await response.json();
      setTrades(data.trades || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching trades:", error);
      toast.error("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [currentPage, sortField, sortOrder, refreshTrigger]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm("Are you sure you want to delete this trade?")) {
      return;
    }

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete trade");
      }

      toast.success("Trade deleted successfully");
      fetchTrades();
    } catch (error) {
      console.error("Error deleting trade:", error);
      toast.error("Failed to delete trade");
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  const getProfitLossColor = (profitLoss: string) => {
    const value = parseFloat(profitLoss);
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getProfitLossBadge = (profitLoss: string) => {
    const value = parseFloat(profitLoss);
    if (value > 0) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          +{profitLoss}%
        </Badge>
      );
    }
    if (value < 0) {
      return (
        <Badge variant="destructive">
          {profitLoss}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        {profitLoss}%
      </Badge>
    );
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading History</CardTitle>
          <CardDescription>Your recent trading activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Trading History</CardTitle>
          <CardDescription>
            {totalCount > 0
              ? `Showing ${trades.length} of ${totalCount} trades`
              : "No trades recorded yet"
            }
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No trades found. Start by adding your first trade!
            </p>
            <Button>Add Your First Trade</Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("tradeDate")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {getSortIcon("tradeDate")}
                      </div>
                    </TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Exit Price</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("profitOrLoss")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>P/L %</span>
                        {getSortIcon("profitOrLoss")}
                      </div>
                    </TableHead>
                    <TableHead>Screenshot</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">
                        {trade.tradingPair}
                      </TableCell>
                      <TableCell>
                        {format(new Date(trade.tradeDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        ${formatPrice(trade.entryPrice)}
                      </TableCell>
                      <TableCell>
                        ${formatPrice(trade.exitPrice)}
                      </TableCell>
                      <TableCell>
                        <div className={getProfitLossColor(trade.profitOrLoss)}>
                          {getProfitLossBadge(trade.profitOrLoss)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {trade.screenshotUrl ? (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(trade.screenshotUrl, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No image</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => window.open(trade.screenshotUrl || "", "_blank")}
                              disabled={!trade.screenshotUrl}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Screenshot
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteTrade(trade.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Trade
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}