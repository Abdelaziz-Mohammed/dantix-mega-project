"use client";

import * as React from "react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import Header from "@/components/shared/Header";
import { useState, useEffect } from "react";
import { getDashboardData } from "@/lib/datasetService";
import { getCookie } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from "recharts";

export default function DashboardPage() {
  const [datasetId, setDatasetId] = useState(""); // input field value
  const [activeId, setActiveId] = useState(""); // id actually used for fetch
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoTried, setAutoTried] = useState(false);
  const [tokenPresent, setTokenPresent] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  // Chart color palette + heatmap scale
  const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  function valueToRdBu(v) {
    // clamp
    const x = Math.max(-1, Math.min(1, v));
    // RdBu (simplified 7-step) from red to blue
    const stops = ["#67001f", "#b2182b", "#d6604d", "#f7f7f7", "#4393c3", "#2166ac", "#053061"];
    const idx = Math.round(((x + 1) / 2) * (stops.length - 1));
    return stops[idx];
  }

  function renderHeatmap(chart) {
    const { x: xLabels = [], y: yLabels = [], z = [] } = chart.data || {};
    if (!z.length || !xLabels.length || !yLabels.length) {
      return <Alert variant="default">Heatmap data incomplete.</Alert>;
    }
    return (
      <div className="overflow-auto w-full">
        <div
          className="grid w-full"
          style={{ gridTemplateColumns: `160px repeat(${xLabels.length}, minmax(80px, 1fr))` }}
        >
          <div className="px-2 py-1 text-xs font-semibold bg-gray-200 text-center"></div>
          {xLabels.map(l => (
            <div key={l} className="px-1 py-2 text-[11px] text-center truncate" title={l}>{l}</div>
          ))}
          {yLabels.map((rowLabel, rowIdx) => (
            <React.Fragment key={rowLabel}>
              <div className="px-2 py-1 text-xs bg-gray-100 sticky left-0" title={rowLabel}>{rowLabel}</div>
              {z[rowIdx]?.map((v, colIdx) => (
                <div
                  key={colIdx}
                  title={`${rowLabel} vs ${xLabels[colIdx]} = ${v.toFixed(3)}`}
                  className="min-h-[48px] flex items-center justify-center text-[11px] font-medium"
                  style={{ backgroundColor: valueToRdBu(v), color: Math.abs(v) > 0.6 ? 'white' : '#111' }}
                >
                  {v.toFixed(2)}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  function renderHistogram(chart) {
    const { x = [], y = [], stats } = chart.data || {};
    if (!x.length || !y.length) return <Alert variant="default">Histogram data unavailable.</Alert>;
    const rows = x.map((val, i) => ({ bin: val, count: y[i] }));
    return (
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <XAxis dataKey="bin" type="number" scale="linear" tick={{ fontSize: 10 }} />
            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
            <ReTooltip formatter={(val) => val.toLocaleString()} />
            <Bar dataKey="count" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
        {stats && (
          <div className="mt-6 border-t pt-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">Summary Statistics</p>
            <div className="grid w-full grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Mean', value: stats.mean },
                { label: 'Median', value: stats.median },
                { label: 'Std', value: stats.std },
                { label: 'Min', value: stats.min },
                { label: 'Max', value: stats.max }
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-lg border bg-white shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
                  <div className="text-lg font-semibold text-gray-900">{value?.toLocaleString?.()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderScatter(chart) {
    const { x = [], y = [], correlation } = chart.data || {};
    if (!x.length || !y.length) return <Alert variant="default">Scatter data unavailable.</Alert>;
    const combined = [];
    const maxPoints = 800; // sample for performance
    for (let i = 0; i < x.length && i < y.length && i < maxPoints; i++) combined.push({ x: Number(x[i]), y: Number(y[i]) });
    return (
      <div style={{ width: '100%', height: 420 }} className="relative">
        {typeof correlation === 'number' && (
          <div className="absolute top-3 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 border">
            Corr: {correlation.toFixed(4)}
          </div>
        )}
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 40, left: 60 }}>
            <XAxis dataKey="x" type="number" name={chart.x} label={{ value: chart.x, position: 'insideBottomRight', offset: -5 }} />
            <YAxis dataKey="y" type="number" name={chart.y} label={{ value: chart.y, angle: -90, position: 'insideLeft' }} />
            <ReTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val) => val.toLocaleString()} />
            <Scatter data={combined} fill="#10b981" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  function renderBarAggregated(chart) {
    const { labels = [], values = [], counts = [], y_label } = chart.data || {};
    if (!labels.length || !values.length) return <Alert variant="default">Bar data unavailable.</Alert>;
    const rows = labels.map((l, i) => ({ label: String(l), value: values[i], count: counts[i] }));
    const valueLabel = y_label || 'Value';
    return (
      <div style={{ width: '100%', height: 420 }}>
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ left: 10, right: 10, top: 10, bottom: 80 }}>
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
            <YAxis label={{ value: valueLabel, angle: -90, position: 'insideLeft' }} />
            <ReTooltip formatter={(val) => val.toLocaleString()} />
            <Bar dataKey="value" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 border-t pt-4">
          <p className="text-sm font-semibold text-gray-600 mb-3">Category Breakdown</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(r => (
              <div key={r.label} className="p-3 bg-white rounded-lg border shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500">{r.label}</div>
                <div className="text-lg font-semibold text-gray-900">{r.value?.toLocaleString?.()}</div>
                <div className="text-xs text-gray-500">{valueLabel}</div>
                {r.count != null && (
                  <div className="text-xs text-gray-500 mt-1">n={Number(r.count).toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderBox(chart) {
    // The actual data is nested: chart.data.data contains the array
    const nestedData = chart.data?.data;
    
    let rows = [];
    
    // Check if nestedData is an array of box plot objects
    if (Array.isArray(nestedData) && nestedData.length > 0) {
      rows = nestedData.map((item) => ({
        label: item.category || item.label || item.name || String(item),
        min: item.min,
        q1: item.q1,
        median: item.median,
        q3: item.q3,
        max: item.max,
        count: item.count,
        outliers: item.outliers
      }));
    }
    
    if (rows.length === 0) {
      return <Alert variant="default">Box plot: No data available.</Alert>;
    }
    
    return (
      <div style={{ width: '100%', height: 420 }}>
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ left: 10, right: 10, top: 10, bottom: 80 }}>
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
            <YAxis label={{ value: chart.y || 'Value', angle: -90, position: 'insideLeft' }} />
            <ReTooltip formatter={(val) => val?.toLocaleString?.()} />
            <Bar dataKey="median" fill="#8b5cf6" name="Median" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 border-t pt-4">
          <p className="text-sm font-semibold text-gray-600 mb-3">Box Plot Summary</p>
          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto sm:grid-cols-2">
            {rows.map((r, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border shadow-sm text-xs space-y-2">
                <div className="text-xs uppercase tracking-wide text-gray-500">Category {r.label}</div>
                <div className="grid grid-cols-2 gap-y-1 gap-x-2">
                  {r.min != null && <span>Min: {r.min.toLocaleString()}</span>}
                  {r.q1 != null && <span>Q1: {r.q1.toLocaleString()}</span>}
                  {r.median != null && <span>Median: {r.median.toLocaleString()}</span>}
                  {r.q3 != null && <span>Q3: {r.q3.toLocaleString()}</span>}
                  {r.max != null && <span>Max: {r.max.toLocaleString()}</span>}
                  {r.count != null && <span>n={Number(r.count).toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderChartCard(chart) {
    let body;
    switch (chart.type) {
      case 'heatmap':
        body = renderHeatmap(chart);
        break;
      case 'histogram':
        body = renderHistogram(chart);
        break;
      case 'scatter':
        body = renderScatter(chart);
        break;
      case 'bar':
        body = renderBarAggregated(chart);
        break;
      case 'box':
        body = renderBox(chart);
        break;
      default:
        body = <Alert variant="default">Unsupported chart type: {chart.type}</Alert>;
    }
    // All charts take full width (col-span-12)
    return (
      <Card
        key={chart.id || chart.title}
        className="p-4 flex flex-col gap-2 w-full !max-w-none"
        style={{ gridColumn: 'span 12' }}
      >
        <h3 className="font-medium mb-2">{chart.title || chart.id}</h3>
        {body}
      </Card>
    );
  }

  // Attempt to infer datasetId from cached dataset cookie
  useEffect(() => {
    // Detect auth token
    if (typeof window !== "undefined") {
      const t = window.localStorage.getItem("auth_token");
      setTokenPresent(!!t);
    }
    if (autoTried) return;
    const raw = getCookie("dataset_response");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const candidateKeys = ["datasetId", "id", "dataSetId", "datasetID", "Id"];
        for (const k of candidateKeys) {
          if (parsed && parsed[k]) {
            const found = String(parsed[k]);
            setDatasetId(found);
            setActiveId(found); // trigger immediate fetch
            break;
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    setAutoTried(true);
  }, [autoTried]);

  // Initial auto-load only
  useEffect(() => {
    const initialFetch = async () => {
      if (!activeId) return;
      await fetchDashboard(activeId);
    };
    initialFetch();
  }, [activeId]);

  async function fetchDashboard(idToFetch) {
    if (!idToFetch) return;
    setLoading(true);
    setError("");
    try {
      const dash = await getDashboardData(idToFetch);
      setData(dash);
      setLastFetched(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const handleManualFetch = async (e) => {
    e.preventDefault();
    const trimmed = datasetId.trim();
    if (!trimmed) {
      setError("Please enter a dataset id");
      return;
    }
    // Set active id if different for persistence
    if (activeId !== trimmed) setActiveId(trimmed);
    // Always fetch even if same id
    await fetchDashboard(trimmed);
  };

  // Helpers to extract sections
  const metrics = data && (data.metrics || data.modelMetrics || null);
  const correlations = data && (data.correlations || data.featureCorrelations || []);
  const classDistribution = data && (data.classDistribution || data.classes || []);
  const columnsSummary = data && (data.columnsSummary || data.schema || []);

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"]; // pie slices

  return (
    <ProtectedRoute>
      <main className="p-4 md:p-6 pb-15 mb-70 space-y-6 w-full">
        <Header pageName="Dashboard" sectionName="Model Overview" />

        <Card className="w-full !max-w-none">
          <CardHeader>
            <CardTitle>Dataset Dashboard Loader</CardTitle>
            <CardDescription>
              Automatically attempts to use cached uploaded dataset id. Enter another id to view different dashboard.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleManualFetch} className="flex flex-col gap-4">
            <div>
              <Input
                placeholder="Dataset ID"
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !tokenPresent}>Load Dashboard</Button>
              {loading && <Spinner size={24} label="" />}
            </div>
            {!tokenPresent && (
              <Alert variant="destructive">Missing auth token. Please log in first to authorize the request.</Alert>
            )}
            {error && <Alert variant="destructive">{error}</Alert>}
            {lastFetched && !loading && !error && (
              <Alert variant="success">Last fetched: {lastFetched.toLocaleTimeString()}.</Alert>
            )}
          </form>
        </Card>

        {loading && (
          <div className="flex justify-center"><Spinner label="Fetching dashboard data..." /></div>
        )}

        {data && !loading && (
          <div className="space-y-8 w-full">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => fetchDashboard(activeId)} disabled={!activeId || loading}>Refresh</Button>
              <Button variant="outline" onClick={() => setShowRaw(r => !r)} disabled={!data}>{showRaw ? "Hide Raw" : "Show Raw"}</Button>
            </div>
            {/* Dynamic charts section */}
            {Array.isArray(data.charts) && data.charts.length > 0 && (
              <section className="space-y-4 w-full">
                <h2 className="text-xl font-semibold">Charts</h2>
                <div className="w-full grid grid-cols-12 gap-6">
                  {data.charts
                    .sort((a,b) => (a.order||0)-(b.order||0))
                    .map(renderChartCard)}
                </div>
              </section>
            )}
            {/* Metrics */}
            {metrics && typeof metrics === "object" && Object.keys(metrics).length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold mb-4">Metrics</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {Object.entries(metrics).map(([k, v]) => (
                    <Card key={k} className="p-4">
                      <CardTitle className="text-sm font-medium mb-1">{k}</CardTitle>
                      <p className="text-2xl font-semibold text-blue-600">{typeof v === "number" ? v.toFixed(4) : String(v)}</p>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Class Distribution */}
            {Array.isArray(classDistribution) && classDistribution.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Class Distribution</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Counts</h3>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={classDistribution}>
                          <XAxis dataKey={"label"} />
                          <YAxis />
                          <ReTooltip />
                          <Bar dataKey={"count"} fill="#2563eb" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Proportions</h3>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={classDistribution}
                            dataKey="count"
                            nameKey="label"
                            outerRadius={120}
                            label
                          >
                            {classDistribution.map((entry, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <ReTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </section>
            ) : null}

            {/* Correlations */}
            {Array.isArray(correlations) && correlations.length > 0 ? (
              <section className="space-y-4 w-full">
                <h2 className="text-xl font-semibold">Feature Correlations</h2>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm w-full overflow-x-auto">
                  {/* Check if it's a matrix (array of arrays) or flat data */}
                  {Array.isArray(correlations[0]) ? (
                    // Matrix heatmap
                    <div style={{ minWidth: '100%' }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
                        <tbody>
                          {correlations.map((row, i) => (
                            <tr key={i}>
                              {row.map((val, j) => {
                                const normalized = Math.max(-1, Math.min(1, typeof val === 'number' ? val : 0));
                                const hue = normalized < 0 ? 0 : 30; // Red to Blue
                                const saturation = Math.abs(normalized) * 100;
                                const lightness = 50 - Math.abs(normalized) * 20;
                                const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                                return (
                                  <td
                                    key={`${i}-${j}`}
                                    style={{
                                      border: '1px solid #ddd',
                                      padding: '12px',
                                      backgroundColor: color,
                                      textAlign: 'center',
                                      color: Math.abs(normalized) > 0.5 ? 'white' : 'black',
                                      fontWeight: normalized !== 0 ? 'bold' : 'normal'
                                    }}
                                    title={typeof val === 'number' ? val.toFixed(4) : String(val)}
                                  >
                                    {typeof val === 'number' ? val.toFixed(2) : val}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    // Flat line chart fallback
                    <div style={{ width: "100%", height: 320 }}>
                      <ResponsiveContainer>
                        <LineChart data={correlations}>
                          <XAxis dataKey={"feature"} />
                          <YAxis domain={[-1, 1]} />
                          <ReTooltip />
                          <Line type="monotone" dataKey={"value"} stroke="#10b981" strokeWidth={2} dot />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {/* Columns Summary */}
            {Array.isArray(columnsSummary) && columnsSummary.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Columns Summary</h2>
                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Column</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Missing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columnsSummary.map((col, i) => (
                        <tr key={i} className="even:bg-gray-50">
                          <td className="px-3 py-2">{col.name || col.columnName || col.ColumnName || "?"}</td>
                          <td className="px-3 py-2">{col.type || col.dataType || col.Type || col.DataType || "?"}</td>
                          <td className="px-3 py-2">{col.missing != null ? col.missing : (col.missingPercent != null ? `${col.missingPercent}%` : "-")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
            {/* Raw JSON */}
            {showRaw && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Raw Dashboard Response</h2>
                <div className="overflow-auto border rounded-lg bg-gray-50 p-4 text-xs leading-relaxed">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
