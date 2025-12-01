"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Header from "@/components/shared/Header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { getCookie } from "@/lib/utils";
import { getModelReport } from "@/lib/datasetService";

function MetricGrid({ title, metrics }) {
  if (!metrics) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="p-3 rounded-lg border bg-white shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">{key.toUpperCase()}</div>
            <div className="text-lg font-semibold text-gray-900">{typeof value === "number" ? value.toLocaleString() : String(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [datasetId, setDatasetId] = useState("");
  const [activeId, setActiveId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [tokenPresent, setTokenPresent] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("auth_token");
      setTokenPresent(Boolean(token));
    }
    const cachedDataset = getCookie("dataset_response");
    if (cachedDataset) {
      try {
        const parsed = JSON.parse(cachedDataset);
        const possibleId = parsed?.datasetId || parsed?.dataset_id || parsed?.id || parsed?.dataSetId;
        if (possibleId) {
          setDatasetId(String(possibleId));
          setActiveId(String(possibleId));
        }
      } catch (err) {
        console.warn("Failed to parse dataset cookie", err);
      }
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      fetchReport(activeId);
    }
  }, [activeId]);

  async function fetchReport(id) {
    try {
      setLoading(true);
      setError("");
      const res = await getModelReport(id);
      setReport(res);
      setLastFetched(new Date());
    } catch (err) {
      setReport(null);
      setError(err?.response?.data?.message || err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = datasetId.trim();
    if (!trimmed) {
      setError("Please enter a dataset id");
      return;
    }
    if (trimmed !== activeId) {
      setActiveId(trimmed);
    } else {
      await fetchReport(trimmed);
    }
  };

  const models = report?.all_models || [];
  const bestModel = report?.best_model;
  const infoItems = useMemo(() => ([
    { label: "Task", value: report?.task },
    { label: "Target column", value: report?.target_column },
    { label: "Version", value: report?.version },
    { label: "User ID", value: report?.user_id }
  ]), [report]);

  return (
    <ProtectedRoute>
      <main className="p-4 md:p-6 pb-12 space-y-6 w-full">
        <Header pageName="Report" sectionName="Model comparison & audit" />

        <Card className="w-full !max-w-none">
          <CardHeader>
            <CardTitle>Model report loader</CardTitle>
            <CardDescription>Provide a dataset id to retrieve the evaluated models report. The request automatically adds the bearer token from local storage.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input value={datasetId} onChange={(e) => setDatasetId(e.target.value)} placeholder="Dataset ID" />
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading || !tokenPresent}>Load report</Button>
              <Button type="button" variant="outline" onClick={() => fetchReport(activeId)} disabled={!activeId || loading}>Refresh</Button>
              {loading && <Spinner size={20} />}
            </div>
            {!tokenPresent && (
              <Alert variant="destructive">Missing auth token. Please log in to authorize the request.</Alert>
            )}
            {error && <Alert variant="destructive">{error}</Alert>}
            {lastFetched && !loading && !error && (
              <Alert variant="success">Last fetched: {lastFetched.toLocaleString()}</Alert>
            )}
          </form>
        </Card>

        {report && !loading && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Report overview</h2>
              <Button variant="outline" size="sm" onClick={() => setShowRaw((prev) => !prev)}>
                {showRaw ? "Hide raw" : "Show raw"}
              </Button>
            </div>

            <section className="grid gap-4 md:grid-cols-2">
              {infoItems.map(({ label, value }) => (
                value ? (
                  <div key={label} className="p-4 rounded-lg border bg-white shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 break-all">{value}</p>
                  </div>
                ) : null
              ))}
            </section>

            {bestModel && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold">Best model</h3>
                <div className="p-5 rounded-xl border bg-white shadow-sm space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Name</p>
                      <p className="text-2xl font-bold text-gray-900">{bestModel.name}</p>
                    </div>
                    {typeof bestModel.generalization_gap === "number" && (
                      <div className="text-sm text-gray-600">
                        Generalization gap: <span className="font-semibold">{bestModel.generalization_gap.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <MetricGrid title="Train metrics" metrics={bestModel.train_metrics} />
                    <MetricGrid title="Test metrics" metrics={bestModel.test_metrics} />
                  </div>
                </div>
              </section>
            )}

            {models.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold">All evaluated models</h3>
                <div className="overflow-auto rounded-xl border bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left">Model</th>
                        <th className="px-4 py-3 text-left">Train RMSE</th>
                        <th className="px-4 py-3 text-left">Test RMSE</th>
                        <th className="px-4 py-3 text-left">Train R²</th>
                        <th className="px-4 py-3 text-left">Test R²</th>
                        <th className="px-4 py-3 text-left">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((model) => (
                        <tr key={model.name} className="border-t">
                          <td className="px-4 py-3 font-semibold text-gray-900">{model.name}</td>
                          <td className="px-4 py-3">{model.train_metrics?.rmse?.toLocaleString?.()}</td>
                          <td className="px-4 py-3">{model.test_metrics?.rmse?.toLocaleString?.()}</td>
                          <td className="px-4 py-3">{model.train_metrics?.r2?.toFixed?.(4)}</td>
                          <td className="px-4 py-3">{model.test_metrics?.r2?.toFixed?.(4)}</td>
                          <td className="px-4 py-3 text-gray-700">{model.generalization_gap?.toLocaleString?.()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {report?.report_markdown && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold">Detailed report</h3>
                <article className="prose max-w-none bg-white p-5 rounded-xl border shadow-sm whitespace-pre-wrap">
                  {report.report_markdown}
                </article>
              </section>
            )}

            {showRaw && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Raw response</h3>
                <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-auto">
{JSON.stringify(report, null, 2)}
                </pre>
              </section>
            )}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
