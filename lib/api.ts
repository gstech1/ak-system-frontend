const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001";

/* ======================================================
   AUTH
   ====================================================== */

function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    return accessToken;
  }

  const dealerAuth = localStorage.getItem("dealerAuth");

  if (dealerAuth) {
    try {
      const parsed = JSON.parse(dealerAuth);

      return parsed?.accessToken ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/* ======================================================
   WARRANTY CHECK
   ====================================================== */

export type WarrantyStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "NOT_REGISTERED"
  | "PENDING"
  | "VOID"
  | "NOT_FOUND";

export interface WarrantyResponse {
  status: WarrantyStatus;
  warrantyNo?: string;
  product?: string;
  productCode?: string;
  serialNumber?: string;
  warrantyStart?: string | null;
  warrantyEnd?: string | null;
  registerDate?: string;
  dealer?: string;
  customerName?: string;
  location?: string;
  remarks?: string | null;
}

export async function checkWarranty(
  serialNumber: string,
): Promise<WarrantyResponse> {
  const normalizedSerialNumber = serialNumber
    .trim()
    .replace(/\s+/g, "");

  const response = await fetch(
    `${API_BASE_URL}/warranty/check/${encodeURIComponent(
      normalizedSerialNumber,
    )}`,
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ||
        `Unable to verify warranty (${response.status}).`,
    );
  }

  return await response.json();
}

/* ======================================================
   WARRANTY POLICY
   ====================================================== */

export type WarrantyStartRule =
  | "DEALER_PURCHASE"
  | "DEALER_REGISTRATION"
  | "CUSTOMER_SALE";

export interface WarrantyPolicy {
  id: string;
  code: string;
  name: string;
  warrantyMonths: number;
  startRule: WarrantyStartRule;
  registrationRequired: boolean;
  registrationDeadlineMonths?: number | null;
  claimLimit?: number | null;
  replacementLimit?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarrantyPolicyData {
  code: string;
  name: string;
  warrantyMonths: number;
  startRule: WarrantyStartRule;
  registrationRequired?: boolean;
  registrationDeadlineMonths?: number | null;
  claimLimit?: number | null;
  replacementLimit?: number | null;
}

export async function getWarrantyPolicies(): Promise<
  WarrantyPolicy[]
> {
  const response = await fetch(
    `${API_BASE_URL}/warranty-policies`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load warranty policies.",
    );
  }

  return await response.json();
}

/* ======================================================
   PRODUCTS
   ====================================================== */

export interface Product {
  id: string;
  productCode: string;
  modelCode: string;
  name: string;
  category: string;

  poles?: number | null;
  ratedCurrent?: string | null;
  ratedVoltage?: string | null;
  breakingCapacity?: string | null;

  warrantyMonths: number;

  warrantyPolicyId?: string | null;

  warrantyPolicy?: WarrantyPolicy | null;

  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateProductData {
  productCode: string;
  modelCode: string;
  name: string;
  category: string;

  poles?: number;
  ratedCurrent?: string;
  ratedVoltage?: string;
  breakingCapacity?: string;

  warrantyMonths: number;

  warrantyPolicyId?: string | null;
}

export type UpdateProductData =
  Partial<CreateProductData> & {
    isActive?: boolean;
  };

/* ======================================================
   GET PRODUCTS
   ====================================================== */

export async function getProducts(): Promise<
  Product[]
> {
  const response = await fetch(
    `${API_BASE_URL}/products`,
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load products.",
    );
  }

  return await response.json();
}

/* ======================================================
   GET SINGLE PRODUCT
   ====================================================== */

export async function getProduct(
  id: string,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/products/${encodeURIComponent(
      id,
    )}`,
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load product.",
    );
  }

  return await response.json();
}

/* ======================================================
   CREATE PRODUCT
   ====================================================== */

export async function createProduct(
  data: CreateProductData,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/products`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },

      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ||
        "Unable to create product.",
    );
  }

  return await response.json();
}

/* ======================================================
   UPDATE PRODUCT
   ====================================================== */

export async function updateProduct(
  id: string,
  data: UpdateProductData,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/products/${encodeURIComponent(
      id,
    )}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },

      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ||
        "Unable to update product.",
    );
  }

  return await response.json();
}

/* ======================================================
   DELETE PRODUCT
   ====================================================== */

export async function deleteProduct(
  id: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/products/${encodeURIComponent(
      id,
    )}`,
    {
      method: "DELETE",

      headers: {
        ...getAuthHeaders(),
      },
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ||
        "Unable to delete product.",
    );
  }
}

/* ======================================================
   PRODUCT OPTIONS
   ====================================================== */

export interface ProductOption {
  id: string;
  optionType: string;
  optionValue: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateProductOptionData {
  optionType: string;
  optionValue: string;
  sortOrder?: number;
}

export async function getProductOptions(
  optionType?: string,
): Promise<ProductOption[]> {
  const query = optionType
    ? `?type=${encodeURIComponent(optionType)}`
    : "";

  const response = await fetch(
    `${API_BASE_URL}/product-options${query}`,
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load product options.",
    );
  }

  return await response.json();
}

export async function createProductOption(
  data: CreateProductOptionData,
): Promise<ProductOption> {
  const response = await fetch(
    `${API_BASE_URL}/product-options`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },

      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ||
        "Unable to create product option.",
    );
  }

  return await response.json();
}

/* ======================================================
   SERIALS
   ====================================================== */

export interface Serial {
  id: string;
  serialNumber: string;
  status: string;

  productId?: string | null;
  product?: Product | null;

  manufacturedAt?: string | null;
  receivedAt?: string | null;
  shippedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  shipmentItem?: {
    product?: Product | null;
    shipment?: {
      dealer?: {
        id: string;
        dealerCode: string;
        companyName: string;
        address: string;
      } | null;
    } | null;
  } | null;

  warranty?: WarrantyResponse | null;
}

export interface CreateSerialData {
  serialNumber: string;
  productId: string;
  manufacturedAt?: string;
}

export interface SerialListResponse {
  data: Serial[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getSerials(
  page = 1,
  limit = 50,
  search = "",
  productId = "",
  status = "",
): Promise<SerialListResponse> {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (productId.trim()) {
    params.set("productId", productId.trim());
  }

  if (status.trim()) {
    params.set("status", status.trim());
  }

  const response = await fetch(
    `${API_BASE_URL}/serials?${params.toString()}`,
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ||
        "Unable to load serials.",
    );
  }

  return await response.json();
}

export async function createSerial(
  data: CreateSerialData,
): Promise<Serial> {
  const response = await fetch(
    `${API_BASE_URL}/serials`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ||
        "Unable to register serial.",
    );
  }

  return await response.json();
}
export interface CreateSerialBulkData {
  startSerial: string;
  endSerial: string;
  productId: string;
  manufacturedAt?: string;
}

export interface CreateSerialBulkResponse {
  requested: number;
  registered: number;
  duplicates: number;
  startSerial: string;
  endSerial: string;
  productId: string;
}

export async function createSerialBulk(
  data: CreateSerialBulkData,
): Promise<CreateSerialBulkResponse> {
  const response = await fetch(
    `${API_BASE_URL}/serials/bulk`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },

      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorData?.message ||
        "Unable to register serials.",
    );
  }

  return await response.json();
}
/* ======================================================
   SERIAL REJECT
   ====================================================== */

export async function rejectSerial(
  serialNumber: string,
  reason: string,
): Promise<Serial> {
  const response = await fetch(
    `${API_BASE_URL}/serials/${encodeURIComponent(
      serialNumber,
    )}/reject`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message ||
        "Unable to request serial rejection.",
    );
  }

  return response.json();
}

/* ======================================================
   APPROVE SERIAL REJECT
   ====================================================== */

export async function approveSerialReject(
  serialNumber: string,
): Promise<Serial> {
  const response = await fetch(
    `${API_BASE_URL}/serials/${encodeURIComponent(
      serialNumber,
    )}/reject/approve`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message ||
        "Unable to approve serial rejection.",
    );
  }

  return response.json();
}