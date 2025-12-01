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
import { getDatasetSchema, getModelReport, predictDataset } from "@/lib/datasetService";

function normalizeFeature(field, targetName) {
  const name = field?.name || field?.columnName || field?.ColumnName;
  if (!name || name === targetName) return null;
  if (field?.is_target || field?.isTarget) return null;
  const rawType = (field?.dataType || field?.type || field?.Type || "").toLowerCase();
  const inputType = (field?.input_type || field?.inputType || "").toLowerCase();
  const options = field?.raw_labels || field?.rawLabels || field?.categories || field?.uniqueValues || field?.unique_values || field?.values;
  const normalizedOptions = Array.isArray(options)
    ? options
    : options && typeof options === "object"
      ? Object.values(options)
      : null;
  const typeSuggestsNumeric = ["int", "integer", "float", "double", "decimal", "number"].some((t) => rawType.includes(t));
  const inputSuggestsNumeric = ["numeric", "number"].includes(inputType);
  const isDate = inputType.includes("date") || rawType.includes("date");
  const isBoolean = inputType.includes("bool") || rawType.includes("bool");
  const isNumeric = isDate || isBoolean ? false : (field?.isNumeric ?? field?.is_numeric ?? inputSuggestsNumeric ?? typeSuggestsNumeric);
  let categories = !isNumeric && Array.isArray(normalizedOptions) && normalizedOptions.length > 0
    ? normalizedOptions.map((v) => (v == null ? "" : String(v)))
    : [];
  if (isBoolean) {
    categories = ["true", "false"];
  }
  return {
    name,
    label: field?.label || name.replace(/_/g, " "),
    type: rawType,
    isNumeric,
    isBoolean,
    isDate,
    categories,
  };
}

export default function PredictPage() {
  const [datasetId, setDatasetId] = useState("");
  const [activeId, setActiveId] = useState("");
  const [tokenPresent, setTokenPresent] = useState(false);
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [featureDefs, setFeatureDefs] = useState([]);
  const [featureValues, setFeatureValues] = useState({});
  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState("");
  const [predictionResult, setPredictionResult] = useState(null);

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
    if (!activeId) return;
    loadMetadata(activeId);
  }, [activeId]);

  async function loadMetadata(id) {
    setMetaLoading(true);
    setMetaError("");
    setPredictionResult(null);
    try {
      const [schemaRes, modelsRes] = await Promise.all([
        getDatasetSchema(id),
        getModelReport(id),
      ]);
      setSchemaInfo(schemaRes);
      const targetName = schemaRes?.target_column || schemaRes?.targetColumn || schemaRes?.target;
      const rawColumns = schemaRes?.columns || schemaRes?.schema || schemaRes?.fields || schemaRes?.data || [];
      const normalized = rawColumns
        .map((col) => normalizeFeature(col, targetName))
        .filter(Boolean);
      setFeatureDefs(normalized);
      setFeatureValues((prev) => {
        const next = {};
        normalized.forEach((f) => {
          next[f.name] = prev[f.name] ?? "";
        });
        return next;
      });
      const names = modelsRes?.all_models?.map((m) => m.name).filter(Boolean) || [];
      setModelOptions(names);
      if (names.length) {
        setSelectedModel((current) => (current && names.includes(current) ? current : names[0]));
      } else {
        setSelectedModel("");
      }
    } catch (err) {
      setMetaError(err?.response?.data?.message || err.message || "Failed to fetch schema/models");
      setSchemaInfo(null);
      setFeatureDefs([]);
      setModelOptions([]);
    } finally {
      setMetaLoading(false);
    }
  }

  const derivedVersion = useMemo(() => schemaInfo?.version || schemaInfo?.Version || schemaInfo?.data_version, [schemaInfo]);

  const handleDatasetSubmit = async (e) => {
    e.preventDefault();
    const trimmed = datasetId.trim();
    if (!trimmed) {
      setMetaError("Please enter a dataset id");
      return;
    }
    if (trimmed !== activeId) {
      setActiveId(trimmed);
    } else {
      await loadMetadata(trimmed);
    }
  };

  const handleFeatureChange = (name, value) => {
    setFeatureValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredictError("");
    setPredictionResult(null);
    if (!activeId) {
      setPredictError("Load a dataset first");
      return;
    }
    if (!selectedModel) {
      setPredictError("Select a model");
      return;
    }
    if (!derivedVersion) {
      setPredictError("Dataset version unavailable from schema endpoint");
      return;
    }
    const missing = featureDefs.filter((f) => {
      const value = featureValues[f.name];
      return value === "" || value === null || value === undefined;
    });
    if (missing.length) {
      setPredictError(`Please provide a value for ${missing[0].label}`);
      return;
    }
    const payload = {
      datasetId: Number(activeId),
      version: Number(derivedVersion),
      model_Name: selectedModel,
      features: {},
    };
    featureDefs.forEach((f) => {
      const raw = featureValues[f.name];
      if (f.isBoolean) {
        payload.features[f.name] = raw === true || raw === "true";
      } else if (f.isNumeric) {
        payload.features[f.name] = Number(raw);
      } else {
        payload.features[f.name] = raw;
      }
    });
    setPredicting(true);
    try {
      const res = await predictDataset(payload);
      setPredictionResult(res);
    } catch (err) {
      setPredictError(err?.response?.data?.message || err.message || "Prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="p-4 md:p-6 pb-12 space-y-6 w-full">
        <Header pageName="Predict" sectionName="Model inference" />

        <Card className="w-full !max-w-none">
          <CardHeader>
            <CardTitle>Load dataset metadata</CardTitle>
            <CardDescription>
              Provide a dataset id to fetch the latest schema (feature list, version) and available models. All requests automatically include the bearer token from local storage.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleDatasetSubmit} className="flex flex-col gap-4">
            <Input value={datasetId} onChange={(e) => setDatasetId(e.target.value)} placeholder="Dataset ID" />
            <div className="flex flex-wrap gap-2 items-center">
              <Button type="submit" disabled={metaLoading || !tokenPresent}>Load metadata</Button>
              <Button type="button" variant="outline" onClick={() => activeId && loadMetadata(activeId)} disabled={!activeId || metaLoading}>Refresh</Button>
              {metaLoading && <Spinner size={20} />}
            </div>
            {!tokenPresent && (
              <Alert variant="destructive">Missing auth token. Please log in to authorize the request.</Alert>
            )}
            {metaError && <Alert variant="destructive">{metaError}</Alert>}
          </form>
        </Card>

        {schemaInfo && !metaLoading && (
          <form onSubmit={handlePredict} className="space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border bg-white shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Dataset ID</p>
                <p className="mt-1 text-lg font-semibold">{activeId}</p>
              </div>
              <div className="p-4 rounded-lg border bg-white shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Schema version</p>
                <p className="mt-1 text-lg font-semibold">{derivedVersion ?? "–"}</p>
              </div>
              <div className="p-4 rounded-lg border bg-white shadow-sm">
                <label className="text-xs uppercase tracking-wide text-gray-500" htmlFor="model-select">Model name</label>
                <select
                  id="model-select"
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {modelOptions.length === 0 && <option value="">No models available</option>}
                  {modelOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Feature values</h3>
              {featureDefs.length === 0 && (
                <Alert variant="default">No feature definitions were returned from the schema endpoint.</Alert>
              )}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featureDefs.map((feature) => (
                  <div key={feature.name} className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor={`feature-${feature.name}`}>
                      {feature.label}
                      <span className="ml-2 text-xs text-gray-500">
                        {feature.isDate
                          ? "date"
                          : feature.isBoolean
                            ? "boolean"
                            : feature.isNumeric
                              ? "numeric"
                              : "categorical"}
                      </span>
                    </label>
                    {feature.isDate ? (
                      <Input
                        id={`feature-${feature.name}`}
                        type="date"
                        value={featureValues[feature.name] ?? ""}
                        onChange={(e) => handleFeatureChange(feature.name, e.target.value)}
                        className="w-full"
                      />
                    ) : feature.isNumeric ? (
                      <Input
                        id={`feature-${feature.name}`}
                        type="number"
                        step="any"
                        value={featureValues[feature.name] ?? ""}
                        onChange={(e) => handleFeatureChange(feature.name, e.target.value)}
                        placeholder="Enter value"
                        className="w-full"
                      />
                    ) : (
                      <select
                        id={`feature-${feature.name}`}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={featureValues[feature.name] ?? ""}
                        onChange={(e) => handleFeatureChange(feature.name, e.target.value)}
                      >
                        <option value="" disabled>Select value</option>
                        {feature.categories.map((option) => (
                          <option key={`${feature.name}-${option}`} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {predictError && <Alert variant="destructive">{predictError}</Alert>}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={predicting || featureDefs.length === 0}>Predict</Button>
              {predicting && <Spinner size={24} label="Submitting" />}
            </div>

            {predictionResult && (
              <section className="grid gap-4 md:grid-cols-2">
                <div className="p-5 rounded-xl border bg-white shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Prediction</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{predictionResult.prediction?.toLocaleString?.()}</p>
                  <p className="text-sm text-gray-500 mt-1">Model used: {predictionResult.model_used}</p>
                </div>
                <div className="p-5 rounded-xl border bg-white shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Processing time</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {typeof predictionResult.processing_time_ms === "number"
                      ? `${predictionResult.processing_time_ms.toFixed(2)} ms`
                      : "–"}
                  </p>
                </div>
              </section>
            )}
          </form>
        )}
      </main>
    </ProtectedRoute>
  );
}
