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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResponse(null);

    if (!file) {
      setError("Please choose a dataset file to upload.");
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

        {response ? (
          <div className="mt-6 flex w-full justify-center">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Server Response</CardTitle>
                <CardDescription>
                  Raw JSON returned by the upload endpoint.
                </CardDescription>
              </CardHeader>
              <div className="overflow-auto rounded-md border bg-gray-50 p-4 text-sm text-gray-800">
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(response, null, 2)}</pre>
              </div>
            </Card>
          </div>
        ) : null}
      </main>
    </ProtectedRoute>
  );
}
