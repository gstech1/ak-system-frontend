const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");
const WEBSITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://suntreemyanmar.com"
).replace(/\/+$/, "");

export function getWebsiteCmsImageUrl(
  image: string | null | undefined,
): string {
  const value = image?.trim();
  if (!value) return "";

  const normalized = value.replace(/\\/g, "/");
  const uploadIndex = normalized.indexOf("website-cms/uploads/");
  if (uploadIndex >= 0) {
    return `${API_URL}/${normalized.slice(uploadIndex)}`;
  }

  const productImageIndex = normalized.indexOf("images/products/");
  if (productImageIndex >= 0) {
    return `${WEBSITE_URL}/${normalized.slice(productImageIndex)}`;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (
        url.protocol === "http:" &&
        url.hostname === new URL(API_URL).hostname
      ) {
        url.protocol = "https:";
      }
      return url.toString();
    } catch {
      return value;
    }
  }

  return value;
}

export function getWebsiteCmsAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type QuotationListItem = {
  quotationNo: string;
  quoteDate: string;
  customerName: string;
  customerId: string | null;
  totalAmount: number | string;
  createdBy?: { username: string };
  createdAt: string;
  updatedAt: string;
};

export type QuotationRecord = QuotationListItem & {
  data: Record<string, unknown>;
};

export type QuotationListResponse = {
  items: QuotationListItem[];
  total: number;
  page: number;
  limit: number;
};

export type SaveQuotationPayload = {
  quotationNo: string;
  quoteDate: string;
  customerName: string;
  customerId?: string;
  totalAmount: number;
  data: Record<string, unknown>;
};

export type QuotationCatalogItem = {
  id: string;
  group: "inverter" | "battery";
  title: string;
  model?: string;
  description?: string;
  mainImage?: string;
  specificationImage?: string;
  sourceProductId?: string;
  isCustom: boolean;
};

export type SaveQuotationCatalogItemPayload = Omit<QuotationCatalogItem, "id" | "isCustom"> & {
  id?: string;
};

async function quotationResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message;
    throw new Error(Array.isArray(message) ? message.join(" ") : message || "Quotation request failed.");
  }
  return body as T;
}

export async function getQuotations(search = "", page = 1, limit = 20) {
  const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
  return quotationResponse<QuotationListResponse>(await fetch(`${API_URL}/quotations?${params}`, {
    headers: getWebsiteCmsAuthHeaders(),
    cache: "no-store",
  }));
}

export async function getQuotation(quotationNo: string) {
  return quotationResponse<QuotationRecord>(await fetch(`${API_URL}/quotations/${encodeURIComponent(quotationNo)}`, {
    headers: getWebsiteCmsAuthHeaders(),
    cache: "no-store",
  }));
}

export async function saveQuotation(payload: SaveQuotationPayload, existingQuotationNo?: string) {
  const isUpdate = Boolean(existingQuotationNo);
  const headers = new Headers(getWebsiteCmsAuthHeaders());
  headers.set("Content-Type", "application/json");
  return quotationResponse<QuotationRecord>(await fetch(
    isUpdate ? `${API_URL}/quotations/${encodeURIComponent(existingQuotationNo!)}` : `${API_URL}/quotations`,
    {
      method: isUpdate ? "PATCH" : "POST",
      headers,
      body: JSON.stringify(payload),
    },
  ));
}

export async function uploadQuotationImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return quotationResponse<{ success: boolean; filename: string; path: string }>(await fetch(`${API_URL}/quotations/uploads`, {
    method: "POST",
    headers: getWebsiteCmsAuthHeaders(),
    body: form,
  }));
}

export async function getQuotationCatalogItems() {
  return quotationResponse<QuotationCatalogItem[]>(await fetch(`${API_URL}/quotations/catalog`, {
    headers: getWebsiteCmsAuthHeaders(),
    cache: "no-store",
  }));
}

export async function saveQuotationCatalogItem(payload: SaveQuotationCatalogItemPayload) {
  const headers = new Headers(getWebsiteCmsAuthHeaders());
  headers.set("Content-Type", "application/json");
  const { id, ...data } = payload;
  return quotationResponse<QuotationCatalogItem>(await fetch(
    id ? `${API_URL}/quotations/catalog/${encodeURIComponent(id)}` : `${API_URL}/quotations/catalog`,
    { method: id ? "PATCH" : "POST", headers, body: JSON.stringify(data) },
  ));
}

export async function deleteQuotationCatalogItem(id: string) {
  return quotationResponse<{ success: boolean }>(await fetch(`${API_URL}/quotations/catalog/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getWebsiteCmsAuthHeaders(),
  }));
}

export async function getWebsiteProductCategories() {
  const response = await fetch(
    `${API_URL}/website-cms/categories`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch website product categories",
    );
  }

  return response.json();
}

export async function uploadWebsiteImage(
  file: File,
): Promise<{
  success: boolean;
  filename: string;
  path: string;
}> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/website-cms/uploads`,
    {
      method: "POST",
      headers: getWebsiteCmsAuthHeaders(),
      body: formData,
    },
  );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      message ||
        "Failed to upload website image",
    );
  }

  return response.json();
}
export async function getWebsiteProducts() {
  const response = await fetch(
    `${API_URL}/website-cms/products`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch website products",
    );
  }

  return response.json();
}

export async function createWebsiteProduct(
  data: {
    categoryId: string;
    title: string;
    slug?: string;
    description?: string;
    mainImage: string;
    specificationImage?: string;
    isPublished?: boolean;
    sortOrder?: number;
    images?: {
      imageUrl: string;
      altText?: string;
      sortOrder?: number;
    }[];
  },
) {
  const response = await fetch(
    `${API_URL}/website-cms/products`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        ...getWebsiteCmsAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
  );


  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      message ||
        "Failed to create website product",
    );
  }

  return response.json();
}

export async function updateWebsiteProduct(
  id: string,
  data: {
    title?: string;
    mainImage?: string;
    specificationImage?: string;
    isPublished?: boolean;
    images?: {
      id?: string;
      imageUrl: string;
      altText?: string;
      sortOrder?: number;
    }[];
  },
) {
  const response = await fetch(
    `${API_URL}/website-cms/products/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getWebsiteCmsAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      message ||
        "Failed to update website product",
    );
  }

  return response.json();
}

export async function getWebsiteProjects() {
  const response = await fetch(
    `${API_URL}/website-cms/projects`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch website projects",
    );
  }

  return response.json();
}

export async function createWebsiteProject(
  data: {
    category: string;
    title: string;
    location: string;
    capacity: string;
    panels: string;
    inverter: string;
    battery: string;
    image: string;
    isPublished?: boolean;
    sortOrder?: number;
  },
) {
  const response = await fetch(
    `${API_URL}/website-cms/projects`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        ...getWebsiteCmsAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      message ||
        "Failed to create website project",
    );
  }

  return response.json();
}

export async function updateWebsiteProject(
  id: string,
  data: {
    category?: string;
    title?: string;
    location?: string;
    capacity?: string;
    panels?: string;
    inverter?: string;
    battery?: string;
    image?: string;
    isPublished?: boolean;
    sortOrder?: number;
  },
) {
  const response = await fetch(
    `${API_URL}/website-cms/projects/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
        ...getWebsiteCmsAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      message ||
        "Failed to update website project",
    );
  }

  return response.json();
}

export async function getWebsiteAds() {
  const response = await fetch(
    `${API_URL}/website-cms/ads`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch website ads",
    );
  }

  return response.json();
}

export async function createWebsiteAd(
  data: {
    slot: number;
    image: string;
  },
) {
  const response = await fetch(
    `${API_URL}/website-cms/ads`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getWebsiteCmsAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      message ||
        "Failed to create website ad",
    );
  }

  return response.json();
}

export async function updateWebsiteAd(
  id: string,
  data: {
    image: string;
    isPublished?: boolean;
  },
) {
  const response = await fetch(
    `${API_URL}/website-cms/ads/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getWebsiteCmsAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      message ||
        "Failed to update website ad",
    );
  }

  return response.json();
}
export async function managementLogin(
  username: string,
  password: string,
) {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Invalid username or password.",
    );
  }

  return data;
}
