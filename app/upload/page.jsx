"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Header from "@/components/shared/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { uploadDataset } from "@/lib/datasetService";
import { Spinner } from "@/components/ui/spinner";
import { setCookie, getCookie, eraseCookie } from "@/lib/utils";

export default function UploadPage() {
  const [targetColumn, setTargetColumn] = useState("");
  const [runAutoML, setRunAutoML] = useState(true);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [response, setResponse] = useState(null);
  const [cached, setCached] = useState(false);

  // Load cached dataset response if present
  useState(() => {
    if (typeof window === "undefined") return;
    const raw = getCookie("dataset_response");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setResponse(parsed);
        setCached(true);
      } catch {
        // ignore parse errors
      }
    }
  });

  const validateFile = (file) => {
    if (!file) {
      return "Please choose a dataset file to upload.";
    }

    // Check file size (10 MB = 10 * 1024 * 1024 bytes)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be 10 MB or less. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    }

    // Check filename for whitespaces
    if (/\s/.test(file.name)) {
      return "Filename cannot contain whitespaces. Please rename your file.";
    }

    // Check file extension and MIME type
    const allowedExtensions = [".csv", ".json", ".xls", ".xlsx"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    const isValidExtension = allowedExtensions.some((ext) => fileExtension.endsWith(ext));

    if (!isValidExtension) {
      return `File type not supported. Accepted formats: CSV, JSON, Excel (.xls, .xlsx)`;
    }

    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResponse(null);

    const fileValidationError = validateFile(file);
    if (fileValidationError) {
      setError(fileValidationError);
      return;
    }

    if (!targetColumn.trim()) {
      setError("Please provide the target column name.");
      return;
    }

    try {
      setSubmitting(true);
      const data = await uploadDataset({ file, targetColumn: targetColumn.trim(), runAutoML });
      setSuccess("Dataset uploaded successfully.");
      setResponse(data);
      // Store trimmed response to cookie (avoid oversize)
      try {
        const trimmed = typeof data === "object" && data !== null ? data : { value: data };
        const json = JSON.stringify(trimmed).slice(0, 3500); // keep under typical 4KB cookie limit
        setCookie("dataset_response", json, 1); // 1 day expiry
        setCached(true);
      } catch {
        // ignore cookie errors
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Upload failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="p-4 md:p-6">
        <Header pageName="Dashboard" sectionName="Upload Dataset" />

        <div className="mt-6 flex w-full justify-center">
          <Card className="w-full max-w-2xl relative">
            {submitting && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
                <Spinner label="Uploading & Processing (may take time)" />
              </div>
            )}
            <CardHeader>
              <CardTitle>Upload Your Dataset</CardTitle>
              <CardDescription>
                Choose a file and set options. If cached, you can clear to upload another. Your bearer token is attached automatically.
              </CardDescription>
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <p className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  Upload Guidelines
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-white p-3 border border-gray-200">
                    <p className="font-medium text-gray-800 flex items-center gap-2">
                      <span>📦</span>
                      File Size
                    </p>
                    <p className="text-sm text-gray-700 mt-1">Maximum 10 MB per file</p>
                  </div>
                  <div className="rounded-md bg-white p-3 border border-gray-200">
                    <p className="font-medium text-gray-800 flex items-center gap-2">
                      <span>📄</span>
                      Supported Formats
                    </p>
                    <p className="text-sm text-gray-700 mt-1">CSV, JSON, Excel (.xls, .xlsx)</p>
                  </div>
                  <div className="rounded-md bg-white p-3 border border-gray-200 md:col-span-2">
                    <p className="font-medium text-gray-800 flex items-center gap-2">
                      <span>✓</span>
                      Requirements
                    </p>
                    <ul className="text-sm text-gray-700 list-disc pl-5 mt-2 space-y-1">
                      <li>Include a target column for predictions</li>
                      <li>Consistent data types within columns</li>
                      <li>UTF-8 encoding recommended</li>
                    </ul>
                  </div>
                  <div className="rounded-md bg-white p-3 border border-gray-200 md:col-span-2">
                    <p className="font-medium text-gray-800 flex items-center gap-2">
                      <span>⚙️</span>
                      Processing
                    </p>
                    <p className="text-sm text-gray-700 mt-1">Dataset validation, schema extraction, and optional AutoML may take several minutes</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={onSubmit} className="space-y-5" aria-disabled={cached}>
              {error ? (
                <Alert variant="destructive">{error}</Alert>
              ) : null}
              {success ? <Alert variant="success">{success}</Alert> : null}
              {cached ? <Alert variant="default">Cached dataset detected. Form disabled.</Alert> : null}

              <div>
                <Label htmlFor="file">Dataset File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,.json"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <Label htmlFor="targetColumn">Target Column</Label>
                <Input
                  id="targetColumn"
                  placeholder="e.g., price"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="runAutoML"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={runAutoML}
                  onChange={(e) => setRunAutoML(e.target.checked)}
                />
                <Label htmlFor="runAutoML" className="m-0">Run AutoML after upload</Label>
              </div>

              <CardFooter className="flex justify-end">
                {cached ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      eraseCookie("dataset_response");
                      setCached(false);
                      setResponse(null);
                      setSuccess("");
                      setError("");
                    }}
                  >
                    Clear Cached Dataset
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
                    Upload
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Server response display removed as requested */}
      </main>
    </ProtectedRoute>
  );
}
