/**
 * Lightweight fetch wrapper for the CivicSync backend.
 * - Base URL comes from VITE_API_URL env var
 * - credentials: 'include' ensures httpOnly JWT cookies are sent automatically
 * - Returns parsed JSON; throws an Error with the server's message on non-2xx
 */

const BASE = import.meta.env.VITE_API_URL as string;

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  [key: string]: T | boolean | string | undefined;
}

async function request<T = ApiResponse>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    // Don't set Content-Type for FormData — fetch sets multipart boundary automatically
    headers: isFormData
      ? (options.headers ?? {})
      : { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });

  const data = (await res.json()) as T & { message?: string };

  if (!res.ok) {
    throw new Error(data.message ?? `Request failed with status ${res.status}`);
  }

  return data;
}

// ── Auth — Citizen ─────────────────────────────────────────────────────────────

export const sendOTP = (mobile: string) =>
  request("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ mobile }),
  });

export const verifyOTP = (mobile: string, otp: string) =>
  request<{
    success: boolean;
    message: string;
    user: {
      id: string;
      name: string;
      mobile: string;
      district: string;
      preferredLanguage: string;
    };
  }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ mobile, otp }),
  });

export const getMe = () => request("/auth/me");

export const logout = () => request("/auth/logout", { method: "POST" });

// ── Auth — Admin ───────────────────────────────────────────────────────────────

export const adminLogin = (username: string, password: string) =>
  request<{
    success: boolean;
    message: string;
    admin: {
      id: string;
      name: string;
      username: string;
      email: string;
      role: string;
      district: unknown;
      department: unknown;
    };
  }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const adminLogout = () => request("/admin/logout", { method: "POST" });

export const adminGetMe = () => request("/admin/me");

// ── Complaints ─────────────────────────────────────────────────────────────────

export interface ComplaintPayload {
  departmentCode: string; // e.g. "WATER"
  category: string;
  description: string;
  urgency: "low" | "medium" | "high";
  streetAddress?: string;
  city: string;
  state: string;
  pincode?: string;
  districtName: string;
  photo?: File | null;
}

export interface SubmittedComplaint {
  id: string;
  referenceNumber: string;
  status: string;
  department: string;
  category: string;
  urgency: string;
  city: string;
  createdAt: string;
}

export const submitComplaint = (payload: ComplaintPayload) => {
  const fd = new FormData();
  fd.append("departmentCode", payload.departmentCode);
  fd.append("category", payload.category);
  fd.append("description", payload.description);
  fd.append("urgency", payload.urgency);
  fd.append("city", payload.city);
  fd.append("state", payload.state);
  fd.append("districtName", payload.districtName);
  if (payload.streetAddress) fd.append("streetAddress", payload.streetAddress);
  if (payload.pincode) fd.append("pincode", payload.pincode);
  if (payload.photo) fd.append("photo", payload.photo);

  return request<{
    success: boolean;
    message: string;
    complaint: SubmittedComplaint;
  }>("/complaints", { method: "POST", body: fd });
};

export const getMyComplaints = () =>
  request<{ success: boolean; complaints: unknown[] }>("/complaints/my");

export const getDistrictComplaints = (districtName: string) =>
  request<{ success: boolean; descriptions: string[] }>(
    `/complaints/district/${encodeURIComponent(districtName)}`,
  );

export const getComplaintByRef = (refNumber: string) =>
  request<{ success: boolean; complaint: unknown }>(`/complaints/${refNumber}`);

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminComplaint {
  _id: string;
  referenceNumber: string;
  category: string;
  description: string;
  status: string;
  urgency: string;
  priority: string;
  createdAt: string;
  resolvedAt?: string;
  userId: { name: string; mobile: string };
  department: { name: string; code: string };
  district: { name: string; state: string };
  address: { street: string; city: string; state: string; pincode: string };
  statusHistory: { status: string; note: string; timestamp: string }[];
}

export interface AdminServiceRequest {
  _id: string;
  referenceNumber: string;
  applicantName: string;
  contactPhone: string;
  serviceType: string;
  requestType: string;
  status: string;
  createdAt: string;
  estimatedCompletionDate?: string;
  address: { street: string; city: string; state: string; pincode: string };
  department: { name: string; code: string };
}

export interface AdminStats {
  totalComplaints: number;
  submitted: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  totalSR: number;
}

export const getAdminStats = () =>
  request<{ success: boolean; stats: AdminStats }>("/admin/stats");

export const getAdminComplaints = (params?: {
  status?: string;
  urgency?: string;
  priority?: string;
  search?: string;
  page?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.urgency) qs.set("urgency", params.urgency);
  if (params?.priority) qs.set("priority", params.priority);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  return request<{
    success: boolean;
    complaints: AdminComplaint[];
    pagination: { total: number; pages: number; page: number };
  }>(`/admin/complaints?${qs}`);
};

export const updateComplaintStatus = (
  id: string,
  status: string,
  note?: string,
) =>
  request(`/admin/complaints/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });

export const escalateComplaintPriority = (id: string, priority: string) =>
  request(`/admin/complaints/${id}/priority`, {
    method: "PATCH",
    body: JSON.stringify({ priority }),
  });

export const getAdminServiceRequests = (params?: {
  status?: string;
  search?: string;
  page?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  return request<{
    success: boolean;
    serviceRequests: AdminServiceRequest[];
    pagination: { total: number; pages: number; page: number };
  }>(`/admin/service-requests?${qs}`);
};

export const updateServiceRequestStatus = (
  id: string,
  status: string,
  note?: string,
) =>
  request(`/admin/service-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });

// ── Service Requests (Citizen) ────────────────────────────────────────────────

export interface CitizenServiceRequest {
  _id: string;
  referenceNumber: string;
  serviceType: string;
  requestType: string;
  applicantName: string;
  contactPhone: string;
  status: string;
  createdAt: string;
  estimatedCompletionDate?: string;
  completedAt?: string;
  department: { name: string; code: string };
  district: { name: string; state: string };
  address: { street: string; city: string; state: string; pincode: string };
  statusHistory: { status: string; note: string; timestamp: string }[];
}

export interface ServiceRequestPayload {
  serviceType: string;
  requestType: string;
  applicantName: string;
  contactPhone: string;
  streetAddress: string;
  city: string;
  state: string;
  pincode: string;
  districtName: string;
  additionalNotes?: string;
  idProof?: File | null;
  addressProof?: File | null;
}

export const submitServiceRequest = (payload: ServiceRequestPayload) => {
  const fd = new FormData();
  fd.append("serviceType", payload.serviceType);
  fd.append("requestType", payload.requestType);
  fd.append("applicantName", payload.applicantName);
  fd.append("contactPhone", payload.contactPhone);
  fd.append("streetAddress", payload.streetAddress);
  fd.append("city", payload.city);
  fd.append("state", payload.state);
  fd.append("pincode", payload.pincode);
  fd.append("districtName", payload.districtName);
  if (payload.additionalNotes)
    fd.append("additionalNotes", payload.additionalNotes);
  if (payload.idProof) fd.append("id_proof", payload.idProof);
  if (payload.addressProof) fd.append("address_proof", payload.addressProof);

  return request<{
    success: boolean;
    message: string;
    serviceRequest: {
      id: string;
      referenceNumber: string;
      status: string;
      serviceType: string;
      requestType: string;
      department: string;
      district: string;
      createdAt: string;
    };
  }>("/service-requests", { method: "POST", body: fd });
};

export const getMyServiceRequests = () =>
  request<{ success: boolean; serviceRequests: CitizenServiceRequest[] }>(
    "/service-requests/my",
  );

export const getServiceRequestById = (id: string) =>
  request<{ success: boolean; serviceRequest: CitizenServiceRequest }>(
    `/service-requests/${id}`,
  );

// ── Heatmap ────────────────────────────────────────────────────────────────────

export interface HeatmapDistrict {
  districtId: string;
  name: string;
  count: number;
  topCategory: string;
  urgencyScore: number;
  lat: number;
  lng: number;
}

export const getHeatmap = (params?: {
  districtId?: string;
  days?: number;
  category?: string;
}) => {
  const qs = new URLSearchParams();
  if (params?.districtId) qs.set("districtId", params.districtId);
  if (params?.days) qs.set("days", String(params.days));
  if (params?.category) qs.set("category", params.category);
  return request<{ success: boolean; districts: HeatmapDistrict[] }>(
    `/complaints/heatmap${qs.toString() ? `?${qs}` : ""}`,
  );
};
