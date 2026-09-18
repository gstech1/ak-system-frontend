const API_URL = 'http://localhost:5001';

export type SerialStatus =
  | 'IN_STOCK'
  | 'SHIPPED'
  | 'REGISTERED'
  | 'RETURNED'
  | 'REPLACED'
  | 'REJECT_PENDING'
  | 'REJECTED';

export interface Serial {
  id: string;
  serialNumber: string;
  shipmentItemId?: string | null;
  status: SerialStatus;
  rejectReason?: string | null;
  rejectedById?: string | null;
  rejectedAt?: string | null;
  rejectApprovedById?: string | null;
  rejectApprovedAt?: string | null;
  manufacturedAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  shippedAt?: string | null;
  productId: string;
  product?: {
    id: string;
    productCode: string;
    modelCode: string;
    name: string;
    category?: string | null;
    poles?: string | null;
    ratedCurrent?: string | null;
    ratedVoltage?: string | null;
    breakingCapacity?: string | null;
    warrantyMonths?: number | null;
  };
}

function getToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem('token') ?? '';
}

function getHeaders(): HeadersInit {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

/* ======================================================
   GET SERIAL
   ====================================================== */

export async function getSerial(
  serialNumber: string,
): Promise<Serial> {
  const response = await fetch(
    `${API_URL}/serials/${encodeURIComponent(serialNumber)}`,
    {
      method: 'GET',
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || 'Failed to get serial',
    );
  }

  return response.json();
}

/* ======================================================
   UPDATE STATUS
   ====================================================== */

export async function updateSerialStatus(
  serialNumber: string,
  status: SerialStatus,
): Promise<Serial> {
  const response = await fetch(
    `${API_URL}/serials/${encodeURIComponent(serialNumber)}/status`,
    {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        status,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || 'Failed to update serial status',
    );
  }

  return response.json();
}

/* ======================================================
   REQUEST REJECT
   ====================================================== */

export async function rejectSerial(
  serialNumber: string,
  reason: string,
): Promise<Serial> {
  const response = await fetch(
    `${API_URL}/serials/${encodeURIComponent(serialNumber)}/reject`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        reason,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || 'Failed to request serial rejection',
    );
  }

  return response.json();
}

/* ======================================================
   APPROVE REJECT
   ====================================================== */

export async function approveSerialReject(
  serialNumber: string,
): Promise<Serial> {
  const response = await fetch(
    `${API_URL}/serials/${encodeURIComponent(serialNumber)}/reject/approve`,
    {
      method: 'PATCH',
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || 'Failed to approve serial rejection',
    );
  }

  return response.json();
}