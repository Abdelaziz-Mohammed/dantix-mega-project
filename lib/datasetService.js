import api from "./api";

export async function uploadDataset({ file, targetColumn, runAutoML }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetColumn", targetColumn);
  formData.append("runAutoML", String(Boolean(runAutoML)));

  const res = await api.post("/Dataset/upload", formData, {
    headers: {
      // Override default JSON header for this request
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function getDashboardData(datasetId) {
  if (!datasetId) throw new Error("datasetId is required");
  const res = await api.get(`/Dataset/dashboard/${encodeURIComponent(datasetId)}`);
  return res.data;
}

export async function getModelReport(datasetId) {
  if (!datasetId) throw new Error("datasetId is required");
  const res = await api.get(`/Dataset/models/${encodeURIComponent(datasetId)}`);
  return res.data;
}

export async function getDatasetSchema(datasetId) {
  if (!datasetId) throw new Error("datasetId is required");
  const res = await api.get(`/Dataset/schema/${encodeURIComponent(datasetId)}`);
  return res.data;
}

export async function predictDataset(payload) {
  if (!payload || !payload.datasetId) throw new Error("payload with datasetId is required");
  const res = await api.post("/Dataset/predict", payload);
  return res.data;
}

export async function getUserDatasets() {
  // Returns array of datasets for the authenticated user
  const res = await api.get("/Dataset/GetUserDatasets");
  return res.data;
}
