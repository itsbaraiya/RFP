// 
// RFP API
// 

import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/apis/rfp";

export const uploadRFP = (file: File, userId: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  return axios.post(`${BASE_URL}/upload`, formData);
};

export const getAllRFPs = (userId: string) => {
  return axios.get(`${BASE_URL}/all/${userId}`);
};

export const analyzeRFP = (id: number) => {
  return axios.post(`${BASE_URL}/analyze/${id}`);
};
