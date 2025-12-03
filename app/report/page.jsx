"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Header from "@/components/shared/Header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { getModelReport, getUserDatasets } from "@/lib/datasetService";

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
  // Removed raw response toggle
  const [tokenPresent, setTokenPresent] = useState(false);
  const [userDatasetOptions, setUserDatasetOptions] = useState([]);
  const [lastFetched, setLastFetched] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("auth_token");
      setTokenPresent(Boolean(token));
    }
    // Fetch user datasets to populate dropdown
    (async () => {
      try {
        const list = await getUserDatasets();
        let options = Array.isArray(list)
          ? list.map((d) => {
              if (typeof d === "string" || typeof d === "number") {
                return { id: String(d), name: String(d) };
              }
              return { id: String(d.id ?? d.datasetId ?? d.dataset_id), name: String(d.name ?? d.dataset_name ?? d.title ?? d.id) };
            }).filter((d) => d.id)
          : [];
        options = options.sort((a, b) => Number(b.id) - Number(a.id));
        setUserDatasetOptions(options);
        if (options.length) {
          setDatasetId(options[0].id);
          setActiveId(options[0].id);
          await fetchReport(options[0].id);
        }
      } catch (err) {
        console.warn("Failed to fetch user datasets", err);
      }
    })();
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
            <label className="text-sm" htmlFor="dataset-select">Select dataset</label>
            <select
              id="dataset-select"
              className="rounded border px-3 py-2"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
            >
              {userDatasetOptions.length === 0 && (
                <option value="" disabled>No datasets found</option>
              )}
              {userDatasetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
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
                  {(() => {
                    // Determine metric keys dynamically from the first model's test metrics
                    const sample = models[0]?.test_metrics || {};
                    let metricOrder = Object.keys(sample);
                    // Prefer common orders depending on task when available
                    if (report?.task === "classification") {
                      const preferred = ["accuracy", "precision", "recall", "f1", "auc"];
                      metricOrder = preferred.filter((k) => k in sample).concat(metricOrder.filter((k) => !preferred.includes(k)));
                    } else if (report?.task === "regression") {
                      const preferred = ["rmse", "mae", "mse", "r2"];
                      metricOrder = preferred.filter((k) => k in sample).concat(metricOrder.filter((k) => !preferred.includes(k)));
                    }
                    const formatVal = (v) => {
                      if (typeof v === "number") {
                        // Show up to 4 decimals, but keep integers or long numbers readable
                        const fixed = Number.isFinite(v) ? Number(v.toFixed(4)) : v;
                        return fixed.toLocaleString();
                      }
                      return String(v);
                    };

                    return (
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-3 text-left">Model</th>
                            {metricOrder.map((k) => (
                              <th key={k} className="px-4 py-3 text-left">Test {k.toUpperCase()}</th>
                            ))}
                            <th className="px-4 py-3 text-left">Gap</th>
                          </tr>
                        </thead>
                        <tbody>
                          {models.map((model) => (
                            <tr key={model.name} className="border-t">
                              <td className="px-4 py-3 font-semibold text-gray-900">{model.name}</td>
                              {metricOrder.map((k) => (
                                <td key={k} className="px-4 py-3">{formatVal(model.test_metrics?.[k])}</td>
                              ))}
                              <td className="px-4 py-3 text-gray-700">{model.generalization_gap?.toLocaleString?.()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
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

            {/* Raw response section removed */}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
