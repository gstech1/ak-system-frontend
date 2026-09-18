export type WarrantyStatus = "ACTIVE" | "EXPIRED" | "NOT_REGISTERED" | "PENDING" | "VOID" | "NOT_FOUND";
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
export declare function checkWarranty(serialNumber: string): Promise<WarrantyResponse>;
export type WarrantyStartRule = "DEALER_PURCHASE" | "DEALER_REGISTRATION" | "CUSTOMER_SALE";
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
export declare function getWarrantyPolicies(): Promise<WarrantyPolicy[]>;
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
export type UpdateProductData = Partial<CreateProductData>;
export declare function getProducts(): Promise<Product[]>;
export declare function getProduct(id: string): Promise<Product>;
export declare function createProduct(data: CreateProductData): Promise<Product>;
export declare function updateProduct(id: string, data: UpdateProductData): Promise<Product>;
export declare function deleteProduct(id: string): Promise<void>;
//# sourceMappingURL=api.d.ts.map