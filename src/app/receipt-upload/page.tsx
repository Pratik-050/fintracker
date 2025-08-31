"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Image, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/trpc/react";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  extractedData?: {
    amount: number;
    date: string;
    merchant: string;
    category: string;
    type: "income" | "expense";
    description?: string;
    confidence: number;
  };
  transaction?: {
    id: number;
    message: string;
  };
  error?: string;
}

export default function ReceiptUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const acceptedFileTypes = "image/*,.pdf";
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  // TRPC utils for invalidating queries after receipt processing
  const utils = api.useUtils();

  const processReceiptFile = useCallback(
    async (fileId: string, file: File) => {
      const updateProgress = (progress: number) => {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
        );
      };

      try {
        // Update to processing status
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "processing",
                  progress: 50,
                }
              : f,
          ),
        );

        // Create form data and send to API
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/process-receipt", {
          method: "POST",
          body: formData,
        });

        updateProgress(80);

        if (!response.ok) {
          // Handle case where response might be HTML (error page) instead of JSON
          const contentType = response.headers.get("content-type");
          console.log("Error response content-type:", contentType);
          if (contentType?.includes("application/json")) {
            const errorData = (await response.json()) as { error?: string };
            throw new Error(errorData.error ?? "Failed to process receipt");
          } else {
            // If it's not JSON, it's likely an HTML error page
            const errorText = await response.text();
            console.error(
              "Non-JSON error response:",
              errorText.substring(0, 200),
            );
            throw new Error(
              `Server error: ${response.status} ${response.statusText}`,
            );
          }
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const errorText = await response.text();
          console.error(
            "Expected JSON but got:",
            contentType,
            errorText.substring(0, 200),
          );
          throw new Error("Server returned non-JSON response");
        }

        const result = (await response.json()) as {
          success: boolean;
          error?: string;
          data?: {
            amount: number;
            date: string;
            merchant: string;
            category: string;
            type: "income" | "expense";
            description?: string;
            confidence: number;
          };
          transaction?: {
            id: number;
            message: string;
          };
        };

        if (!result.success) {
          throw new Error(result.error ?? "Processing failed");
        }

        updateProgress(100);

        // Update with extracted data and transaction info
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "completed",
                  extractedData: result.data!,
                  transaction: result.transaction!,
                }
              : f,
          ),
        );

        // Invalidate transaction queries since a new transaction was added
        await utils.transaction.getTransactions.invalidate();
        await utils.transaction.getSummary.invalidate();

        toast.success("Receipt processed and transaction added successfully!");
      } catch (error) {
        console.error("Receipt processing error:", error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to process receipt",
                }
              : f,
          ),
        );
      }
    },
    [utils.transaction.getTransactions, utils.transaction.getSummary],
  );

  const handleFileUpload = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      fileArray.forEach((file) => {
        // Validate file type
        if (!file.type.startsWith("image/") && !file.type.includes("pdf")) {
          alert(
            `File ${file.name} is not a supported format. Please upload images or PDFs.`,
          );
          return;
        }

        // Validate file size
        if (file.size > maxFileSize) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          return;
        }

        const fileId = Math.random().toString(36).substr(2, 9);
        const uploadedFile: UploadedFile = {
          id: fileId,
          file,
          status: "uploading",
          progress: 0,
        };

        setUploadedFiles((prev) => [...prev, uploadedFile]);
        void processReceiptFile(fileId, file);
      });
    },
    [maxFileSize, processReceiptFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFileUpload(e.target.files);
      }
    },
    [handleFileUpload],
  );

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const retryProcessing = (fileId: string) => {
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              status: "uploading",
              progress: 0,
              error: undefined,
            }
          : f,
      ),
    );
    const file = uploadedFiles.find((f) => f.id === fileId)?.file;
    if (file) {
      void processReceiptFile(fileId, file);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipt Upload</h1>
          <p className="text-muted-foreground">
            Upload receipts and PDFs to automatically extract transaction data
          </p>
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Upload receipt images (JPG, PNG) or PDF files. Maximum file size:
              10MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
            >
              <Upload className="text-muted-foreground mx-auto mb-4 size-12" />
              <h3 className="mb-2 text-lg font-semibold">
                Drop files here or click to upload
              </h3>
              <p className="text-muted-foreground mb-4">
                Supports images and PDF files up to 10MB
              </p>
              <input
                type="file"
                multiple
                accept={acceptedFileTypes}
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <Button asChild>
                <label htmlFor="file-input" className="cursor-pointer">
                  Select Files
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Info */}
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>Receipt Processing Features</AlertTitle>
          <AlertDescription>
            Our AI-powered system automatically extracts key information from
            your receipts including: amount, date, merchant name, and
            categories, then saves them directly to your transaction history.
            Processing is instant and hands-free!
          </AlertDescription>
        </Alert>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
              <CardDescription>
                Track the processing status of your uploaded receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="flex items-center space-x-4 rounded-lg border p-4"
                  >
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {uploadedFile.file.type.startsWith("image/") ? (
                        /* eslint-disable-next-line jsx-a11y/alt-text */
                        <Image className="size-8 text-blue-500" />
                      ) : (
                        <FileText className="size-8 text-red-500" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {/* Progress */}
                      {uploadedFile.status === "uploading" && (
                        <div className="mt-2">
                          <Progress
                            value={uploadedFile.progress}
                            className="w-full"
                          />
                          <p className="text-muted-foreground mt-1 text-xs">
                            Uploading... {Math.round(uploadedFile.progress)}%
                          </p>
                        </div>
                      )}

                      {/* Processing */}
                      {uploadedFile.status === "processing" && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <div className="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                            <span className="text-muted-foreground text-sm">
                              Processing receipt...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Extracted Data */}
                      {uploadedFile.status === "completed" &&
                        uploadedFile.extractedData && (
                          <div className="bg-muted mt-2 rounded-md p-3">
                            <p className="mb-2 text-sm font-medium">
                              Extracted Data:
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Amount:
                                </span>
                                <span className="ml-2 font-medium">
                                  $
                                  {uploadedFile.extractedData.amount.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Date:
                                </span>
                                <span className="ml-2 font-medium">
                                  {uploadedFile.extractedData.date}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Merchant:
                                </span>
                                <span className="ml-2 font-medium">
                                  {uploadedFile.extractedData.merchant}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Type:
                                </span>
                                <span className="ml-2">
                                  <Badge
                                    variant={
                                      uploadedFile.extractedData.type ===
                                      "income"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={
                                      uploadedFile.extractedData.type ===
                                      "income"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {uploadedFile.extractedData.type}
                                  </Badge>
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Category:
                                </span>
                                <span className="ml-2">
                                  <Badge variant="outline">
                                    {uploadedFile.extractedData.category}
                                  </Badge>
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Confidence:
                                </span>
                                <span className="ml-2 font-medium">
                                  {Math.round(
                                    uploadedFile.extractedData.confidence * 100,
                                  )}
                                  %
                                </span>
                              </div>
                            </div>
                            {uploadedFile.extractedData.description && (
                              <div className="mt-2">
                                <span className="text-muted-foreground text-sm">
                                  Description:
                                </span>
                                <p className="mt-1 text-sm">
                                  {uploadedFile.extractedData.description}
                                </p>
                              </div>
                            )}
                            {uploadedFile.transaction && (
                              <div className="mt-2 rounded-md bg-green-50 p-2">
                                <p className="text-sm font-medium text-green-800">
                                  ✅ {uploadedFile.transaction.message}
                                </p>
                                <p className="text-xs text-green-600">
                                  Transaction ID: {uploadedFile.transaction.id}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Error */}
                      {uploadedFile.status === "error" && (
                        <div className="bg-destructive/10 mt-2 rounded-md p-3">
                          <p className="text-destructive text-sm">
                            {uploadedFile.error}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => retryProcessing(uploadedFile.id)}
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <Badge
                        variant={
                          uploadedFile.status === "completed"
                            ? "default"
                            : uploadedFile.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {uploadedFile.status === "completed" && (
                          <Check className="mr-1 size-3" />
                        )}
                        {uploadedFile.status === "uploading" && "Uploading"}
                        {uploadedFile.status === "processing" && "Processing"}
                        {uploadedFile.status === "completed" && "Completed"}
                        {uploadedFile.status === "error" && "Error"}
                      </Badge>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadedFile.id)}
                      className="flex-shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
