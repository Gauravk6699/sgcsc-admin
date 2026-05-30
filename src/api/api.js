import API from "./axiosInstance";

/* ===================== COURSES ===================== */

// PUBLIC / ADMIN – list courses
export const getCourses = async () => {
  const res = await API.get("/courses");
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

/* ===================== STUDENTS ===================== */

// Lookup student by enrollment/roll number
export const getStudentByEnrollment = async (enrollmentNumber) => {
  const res = await API.get(`/students/lookup/${enrollmentNumber}`);
  return res.data?.data || null;
};

/* ===================== SETTINGS ===================== */

export const getSettings = async () => {
  const res = await API.get("/settings");
  return res.data?.data || null;
};

export const updateSocialLinks = async (socialLinks) => {
  const res = await API.put("/settings/social", { socialLinks });
  return res.data;
};

export const getCreditSettings = async () => {
  const res = await API.get("/settings/credit");
  return res.data?.data || null;
};

export const updateCreditPricing = async (pricing) => {
  const res = await API.put("/settings/credit-pricing", pricing);
  return res.data;
};

export const uploadCreditTopupQR = async (formData) => {
  const res = await API.post("/settings/credit-topup-qr", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const deleteCreditTopupQR = async () => {
  const res = await API.delete("/settings/credit-topup-qr");
  return res.data;
};

export const updateCreditTopupInstructions = async (data) => {
  const res = await API.put("/settings/credit-topup-instructions", data);
  return res.data;
};

export const getCertificateTemplateConfig = async () => {
  const res = await API.get("/settings/certificate-template");
  return res.data?.data || null;
};

export const updateCertificateTemplateConfig = async (templateConfig) => {
  const res = await API.put("/settings/certificate-template", { templateConfig });
  return res.data;
};

/* ===================== CREDITS ===================== */

export const getAllFranchiseCredits = async () => {
  const res = await API.get("/credits/admin/franchises");
  return res.data;
};

export const addCreditsToFranchise = async (data) => {
  const res = await API.post("/credits/admin/add", data);
  return res.data;
};

export const getFranchiseTransactions = async (franchiseId, page = 1, limit = 10) => {
  const res = await API.get(`/credits/admin/transactions/${franchiseId}?page=${page}&limit=${limit}`);
  return res.data;
};

export default API; 
