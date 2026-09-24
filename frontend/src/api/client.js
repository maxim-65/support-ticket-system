const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("support_ticket_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseURL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(data?.error || "Request failed.");
    error.response = {
      status: response.status,
      data,
    };
    throw error;
  }

  return {
    status: response.status,
    data,
  };
}

function withParams(path, params) {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

const api = {
  get(path, config = {}) {
    return request(withParams(path, config.params), {
      method: "GET",
      headers: config.headers,
    });
  },
  post(path, body, config = {}) {
    return request(path, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify(body),
    });
  },
  put(path, body, config = {}) {
    return request(path, {
      method: "PUT",
      headers: config.headers,
      body: JSON.stringify(body),
    });
  },
  delete(path, config = {}) {
    return request(path, {
      method: "DELETE",
      headers: config.headers,
    });
  },
};

export default api;
