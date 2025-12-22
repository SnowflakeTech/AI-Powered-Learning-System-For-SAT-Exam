
const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:8000/api/v1";

function cleanToken(raw) {
  if (!raw) return "";
  let t = String(raw).trim();

  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }

 
  if (/^bearer\s+/i.test(t)) {
    t = t.replace(/^bearer\s+/i, "").trim();
  }

  return t;
}

function getToken() {
  // ưu tiên token, fallback access_token 
  const raw =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    "";
  return cleanToken(raw);
}

function toFormBody(data) {
  const sp = new URLSearchParams();
  Object.entries(data || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.append(k, String(v));
  });
  return sp.toString();
}

async function request(method, path, data) {
  const headers = {};
  const token = getToken();

  if (token) headers["Authorization"] = `Bearer ${token}`;

  // login dùng x-www-form-urlencoded
  const isLogin = method === "POST" && path === "/auth/login";
  if (isLogin) {
    headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
  } else {
    headers["Content-Type"] = "application/json";
  }

  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    // GET không gửi body
    body:
      data && method !== "GET"
        ? isLogin
          ? toFormBody(data)
          : JSON.stringify(data)
        : undefined,
  });

  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }

  // nếu 401: báo rõ để biết đang lỗi token
  if (res.status === 401) {
  
    const msg =
      payload?.message ||
      payload?.error ||
      "Unauthorized (token không hợp lệ hoặc thiếu)";
    throw new Error(msg);
  }

  if (!res.ok) {
    const msg = payload?.message || payload?.error || text || "Network error";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return payload;
}

export const apiGet = (path) => request("GET", path);
export const apiPost = (path, data) => request("POST", path, data);
export const apiPut = (path, data) => request("PUT", path, data);
export const apiPatch = (path, data) => request("PATCH", path, data);
export const apiDelete = (path, data) => request("DELETE", path, data);
