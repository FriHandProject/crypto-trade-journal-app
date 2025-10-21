"use client";

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Upload, X, Plus } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

// Form validation schema
const formSchema = z.object({
  tradingPair: z
    .string()
    .min(1, "Trading pair is required")
    .max(20, "Trading pair too long")
    .transform((val) => val.toUpperCase()),
  entryPrice: z
    .string()
    .regex(/^\d*\.?\d{0,8}$/, "Invalid price format")
    .refine((val) => parseFloat(val) > 0, "Entry price must be greater than 0"),
  exitPrice: z
    .string()
    .regex(/^\d*\.?\d{0,8}$/, "Invalid price format")
    .refine((val) => parseFloat(val) > 0, "Exit price must be greater than 0"),
  tradeDate: z.date({
    required_error: "Trade date is required",
  }),
  screenshot: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTradeFormProps {
  onTradeAdded?: () => void;
  trigger?: React.ReactNode;
}

export function AddTradeForm({ onTradeAdded, trigger }: AddTradeFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tradingPair: "",
      entryPrice: "",
      exitPrice: "",
      tradeDate: new Date(),
    },
  });

  // Auto-calculate profit/loss
  const entryPrice = form.watch("entryPrice");
  const exitPrice = form.watch("exitPrice");

  const calculateProfitLoss = useCallback(() => {
    if (entryPrice && exitPrice) {
      const entry = parseFloat(entryPrice);
      const exit = parseFloat(exitPrice);
      return ((exit - entry) / entry * 100).toFixed(2);
    }
    return "0.00";
  }, [entryPrice, exitPrice]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload an image.");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    setScreenshotFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Remove uploaded screenshot
  const removeScreenshot = useCallback(() => {
    setUploadedScreenshot(null);
    setScreenshotFile(null);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      let screenshotUrl = "";

      // Upload screenshot if provided
      if (screenshotFile) {
        const formData = new FormData();
        formData.append("file", screenshotFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Failed to upload screenshot");
        }

        const uploadResult = await uploadResponse.json();
        screenshotUrl = uploadResult.url;
      }

      // Calculate profit/loss
      const entry = parseFloat(values.entryPrice);
      const exit = parseFloat(values.exitPrice);
      const profitOrLoss = ((exit - entry) / entry * 100).toString();

      // Create trade
      const tradeResponse = await fetch("/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tradingPair: values.tradingPair,
          entryPrice: values.entryPrice,
          exitPrice: values.exitPrice,
          profitOrLoss,
          screenshotUrl,
          tradeDate: values.tradeDate.toISOString(),
        }),
      });

      if (!tradeResponse.ok) {
        const error = await tradeResponse.json();
        throw new Error(error.error || "Failed to create trade");
      }

      toast.success("Trade added successfully!");
      form.reset();
      setUploadedScreenshot(null);
      setScreenshotFile(null);
      setIsOpen(false);

      if (onTradeAdded) {
        onTradeAdded();
      }

    } catch (error) {
      console.error("Error adding trade:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add trade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Add Trade
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Trade</DialogTitle>
          <DialogDescription>
            Enter your trade details and upload a screenshot from Bybit.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Trading Pair */}
            <FormField
              control={form.control}
              name="tradingPair"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trading Pair</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="BTCUSDT, ETHUSDT..."
                      {...field}
                      className="uppercase"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entry Price */}
            <FormField
              control={form.control}
              name="entryPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.00000000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exit Price */}
            <FormField
              control={form.control}
              name="exitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exit Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.00000000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Profit/Loss Display */}
            {entryPrice && exitPrice && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Estimated Profit/Loss
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        parseFloat(calculateProfitLoss()) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {calculateProfitLoss()}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trade Date */}
            <FormField
              control={form.control}
              name="tradeDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Trade Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Screenshot Upload */}
            <div className="space-y-3">
              <FormLabel>Screenshot (Optional)</FormLabel>
              <Card>
                <CardContent className="pt-6">
                  {uploadedScreenshot ? (
                    <div className="relative">
                      <img
                        src={uploadedScreenshot}
                        alt="Trade screenshot"
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeScreenshot}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => document.getElementById("screenshot-upload")?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your screenshot here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 5MB
                      </p>
                      <input
                        id="screenshot-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Trade"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}