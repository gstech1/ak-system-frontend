const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

export function getWebsiteCmsAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
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
