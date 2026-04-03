const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://phishing-backend.onrender.com"
).replace(/\/$/, "");

/**
 * Get token from both localStorage and sessionStorage
 */
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

/**
 * Common headers
 */
function getAuthHeaders(includeJson = true) {
  const token = getToken();

  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Handle API response
 */
async function handleResponse(response: Response) {
  let data: any;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("pendingOtpEmail");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userFullName");
    sessionStorage.removeItem("pendingOtpEmail");

    window.location.href = "/login";
    throw new Error(data?.message || "Unauthorized");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

/* ============================
   AUTH APIs
============================ */

export async function signupUser(data: {
  full_name: string;
  email: string;
  password: string;
}) {
  const payload = {
    ...data,
    email: data.email.trim().toLowerCase(),
    password: data.password.trim(),
    full_name: data.full_name.trim(),
  };

  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function verifyOtp(data: {
  email: string;
  otp: string;
}) {
  const payload = {
    email: data.email.trim().toLowerCase(),
    otp: data.otp.trim(),
  };

  const response = await fetch(`${API_BASE_URL}/verify-otp`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  const payload = {
    email: data.email.trim().toLowerCase(),
    password: data.password.trim(),
  };

  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function resendOtp(data: { email: string }) {
  const payload = {
    email: data.email.trim().toLowerCase(),
  };

  const response = await fetch(`${API_BASE_URL}/resend-otp`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

/* ============================
   USER
============================ */

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "GET",
    headers: getAuthHeaders(false),
  });

  return handleResponse(response);
}

/* ============================
   URL DETECTION
============================ */

export async function scanUrl(data: { url: string }) {
  const payload = {
    url: data.url.trim(),
  };

  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

/* Quick ML check fallback:
   reuses main scan route if separate route does not exist */
export async function checkUrl(data: { url: string }) {
  return scanUrl(data);
}

export async function detectUrl(data: { url: string }) {
  return scanUrl(data);
}

/* ============================
   HISTORY
============================ */

export async function getScanHistory(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/history`, {
    method: "GET",
    headers: getAuthHeaders(false),
  });

  return handleResponse(response);
}