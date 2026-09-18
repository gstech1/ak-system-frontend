export type WarrantyStatus = "ACTIVE" | "EXPIRED" | "NOT_REGISTERED" | "NOT_FOUND" | "PENDING" | "VOID";
type Props = {
    status: WarrantyStatus;
    product?: string;
    productCode?: string;
    serialNumber?: string;
    warrantyStart?: string | null;
    warrantyEnd?: string | null;
    dealer?: string;
    location?: string;
    customerName?: string;
    warrantyNo?: string;
};
export default function WarrantyResultCard(props: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=WarrantyResultCard.d.ts.map