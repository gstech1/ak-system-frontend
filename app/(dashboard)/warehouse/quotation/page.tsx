"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardShell from "@/components/layout/DashboardShell";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageProvider";
import { deleteQuotationCatalogItem, getQuotation, getQuotationCatalogItems, getQuotations, getWebsiteCmsImageUrl, getWebsiteProductCategories, saveQuotation, saveQuotationCatalogItem, uploadQuotationImage, type QuotationCatalogItem, type QuotationListItem, type QuotationRecord, type SaveQuotationCatalogItemPayload, type SaveQuotationPayload } from "@/lib/website-cms-api";
import { ArrowLeft, FileText, Pencil, Plus, Printer, Save, Trash2, X } from "lucide-react";

type WebsiteProduct = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  mainImage?: string | null;
  specificationImage?: string | null;
  isPublished?: boolean;
  images?: { imageUrl: string; altText?: string | null }[];
};

type WebsiteCategory = {
  id: string;
  title: string;
  slug: string;
  isPublished?: boolean;
  products: WebsiteProduct[];
};

type QuotationProduct = WebsiteProduct & {
  categoryTitle: string;
  categoryGroup: string;
  catalogModel?: string;
  catalogItemId?: string;
  isCustom?: boolean;
};

type QuoteItem = {
  id: string;
  productId?: string;
  categoryTitle: string;
  title: string;
  model: string;
  description: string;
  mainImage: string;
  specificationImage: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  warrantyTerm: string;
};

const PRODUCT_GROUPS = [
  { value: "inverter", label: "Inverter" },
  { value: "battery", label: "Battery System" },
] as const;

const BOM_PRESETS = [
  { title: "Solar System / Solar Panel", unit: "set", category: "Solar System" },
  { title: "Tomzn DB Box 15way", unit: "pcs" },
  { title: "Tomzn DB Box 18ways", unit: "pcs" },
  { title: "Suntree ATS Breaker", unit: "pcs" },
  { title: "Suntree VA Protector", unit: "pcs" },
  { title: "Suntree AC Breaker", unit: "pcs" },
  { title: "Suntree DC MCB", unit: "pcs" },
  { title: "Tomzn DC SPD", unit: "pcs" },
  { title: "Suntree Fuse Holder + DC Fuse", unit: "pcs" },
  { title: "Suntree DC MCCB", unit: "pcs" },
  { title: "Rail 2.4m", unit: "pcs" },
  { title: "Mid Clamp", unit: "pcs" },
  { title: "End Clamp", unit: "pcs" },
  { title: "L-Feet", unit: "pcs" },
  { title: "Suntree MC4 Connector", unit: "pcs" },
  { title: "AC Cable", unit: "m" },
  { title: "Suntree DC Cable", unit: "m" },
  { title: "DC Cable", unit: "m" },
  { title: "6mm Earth Cable", unit: "m" },
  { title: "Earthing System Installation (Earth Rod 3pcs)", unit: "set" },
  { title: "Pipe, Trunking & Other Accessories", unit: "set" },
  { title: "Battery, Inverter & AC Safety Device Installation", unit: "job" },
  { title: "Solar & DC Safety Device Installation", unit: "job" },
] as const;

function getProductGroup(category: WebsiteCategory) {
  const source = `${category.slug} ${category.title}`.toLowerCase();
  if (source.includes("inverter")) return "inverter";
  if (source.includes("batter")) return "battery";
  if (source.includes("solar") || source.includes("panel") || source.includes("pv module")) return "solar";
  return null;
}

const DEFAULT_WARRANTY_PARAGRAPHS = [
  "Inverter အာမခံကာလသည် ရွေးချယ်ထားသော Model နှင့် ထုတ်လုပ်သူ၏ စည်းကမ်းချက်အလိုက် သတ်မှတ်ပါသည်။ Warranty ကာလအတွင်း ထုတ်လုပ်မှုဆိုင်ရာချို့ယွင်းချက်ကို စစ်ဆေးအတည်ပြုနိုင်ပါက သက်ဆိုင်ရာအာမခံစည်းကမ်းအတိုင်း ပြုပြင်/အစားထိုးဝန်ဆောင်မှု ပေးပါမည်။ SUNTREE Circuit Breaker များအတွက် ဝယ်ယူသည့်နေ့တွင် Online Warranty Registration ပြုလုပ်ထားရန် လိုအပ်ပြီး သက်ဆိုင်ရာ Model နှင့် Warranty Policy အလိုက် အကျုံးဝင်ပါသည်။",
  "Lithium Battery များ၏ အာမခံကာလသည် Model အလိုက် ကွာခြားနိုင်ပြီး Battery Pack၊ BMS၊ Breaker နှင့် Display တို့ ပါဝင်မှုကို ထုတ်ကုန်သတ်မှတ်ချက်အတိုင်း ဆောင်ရွက်ပါမည်။ Battery ၏ SOH သည် အသုံးပြုမှုအလိုက် နှစ်စဉ် 5% မှ 7% ခန့် သဘာဝအတိုင်း ကျဆင်းနိုင်ပါသည်။ သက်ဆိုင်ရာ Warranty ကာလအတွင်း SOH 60% အောက်ကျဆင်းပါက ထုတ်လုပ်သူ၏ မူဝါဒနှင့် စစ်ဆေးအတည်ပြုချက်အရ အာမခံဝန်ဆောင်မှု ပေးပါမည်။",
  "တပ်ဆင်ပေးထားသော Solar System များအတွက် Installation Workmanship နှင့် After-Sales Service ကို 1 နှစ် ပေးပါမည်။ အာမခံ/ဝန်ဆောင်မှုကာလအတွင်း ချို့ယွင်းချက်ဖြစ်ပါက စစ်ဆေးပြီး အကျုံးဝင်မှုအလိုက် ဆောင်ရွက်ပေးပါမည်။ ကာလကျော်လွန်သော Site Visit နှင့် Transportation Fee များ ကောက်ခံနိုင်ပြီး မသွားရောက်မီ Customer အတည်ပြုချက်ရယူကာ သက်ဆိုင်ရာကုန်ကျစရိတ်ကို ကြိုတင်အသိပေးပါမည်။ မှားယွင်းတပ်ဆင်မှု၊ အသုံးပြုမှုလွဲမှားခြင်း၊ ခွင့်ပြုချက်မရှိသော ပြုပြင်မွမ်းမံမှုနှင့် ပြင်ပအကြောင်းရင်းကြောင့်ဖြစ်သော ပျက်စီးမှုများသည် Warranty အကျုံးမဝင်ပါ။",
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatMMK(value: number) {
  return `${Math.round(value || 0).toLocaleString()} MMK`;
}

function createQuoteDefaults() {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yangon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const datePart = (type: string) => dateParts.find((part) => part.type === type)?.value || "";
  const date = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Yangon",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const uniqueSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return {
    date,
    number: `MTK-Q-${date.replaceAll("-", "")}-${time.replaceAll(":", "")}-${uniqueSuffix}`,
  };
}

function Letterhead({ small = false, companyTitle, companyAddress, companyPhone, servicePhone }: { small?: boolean; companyTitle: string; companyAddress: string; companyPhone: string; servicePhone: string }) {
  return (
    <div className={`quote-letterhead flex items-center justify-between gap-6 border-b-2 border-emerald-700 ${small ? "pb-2" : "pb-4"}`}>
      <Image src="/images/logo/ak-logo1.png" alt="Arkar Min Thu Kha Electro Trading Co., Ltd." width={280} height={160} priority unoptimized className={`${small ? "h-12" : "h-16"} max-w-[38%] object-contain object-left`} />
      <div className="min-w-0 flex-1 text-center">
        {companyTitle && <p className="text-xs font-bold tracking-[0.18em] text-emerald-800">{companyTitle}</p>}
        {companyAddress && <p className="mt-1 text-[10px] text-slate-600">{companyAddress}</p>}
        {companyPhone && <p className="text-[10px] text-slate-600">{companyPhone}</p>}
        {servicePhone && <p className="text-[9px] text-slate-500">Customer Service: {servicePhone}</p>}
      </div>
      <Image src="/images/logo/mtk-solar-energy.png" alt="MTK Solar Energy" width={160} height={160} priority unoptimized className={`${small ? "h-12" : "h-16"} max-w-[38%] object-contain object-right`} />
    </div>
  );
}

function OneLineDiagram() {
  return (
    <div className="quote-diagram-crop relative mx-auto aspect-[0.916/1] w-full max-w-[165mm] overflow-hidden bg-white">
      <Image
        src="/images/quotation/solar-hybrid-one-line.png"
        alt="Solar hybrid system one-line diagram"
        fill
        priority
        unoptimized
        sizes="(max-width: 768px) 100vw, 620px"
        className="object-contain"
      />
    </div>
  );
}

export default function QuotationPage() {
  const { language } = useDashboardLanguage();
  const [quoteDefaults] = useState(createQuoteDefaults);
  const [categories, setCategories] = useState<WebsiteCategory[]>([]);
  const [savedCatalogItems, setSavedCatalogItems] = useState<QuotationCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [catalogEditorOpen, setCatalogEditorOpen] = useState(false);
  const [catalogManagementError, setCatalogManagementError] = useState("");
  const [catalogManagementMessage, setCatalogManagementMessage] = useState("");
  const [catalogSavingId, setCatalogSavingId] = useState("");
  const [catalogDrafts, setCatalogDrafts] = useState<Record<string, { title: string; model: string }>>({});
  const [canManageCatalog, setCanManageCatalog] = useState(false);
  const [newCatalogGroup, setNewCatalogGroup] = useState<"inverter" | "battery">("inverter");
  const [newCatalogTitle, setNewCatalogTitle] = useState("");
  const [newCatalogModel, setNewCatalogModel] = useState("");
  const [newCatalogMainImage, setNewCatalogMainImage] = useState("");
  const [newCatalogSpecificationImage, setNewCatalogSpecificationImage] = useState("");
  const [warrantyEditorOpen, setWarrantyEditorOpen] = useState(false);
  const [letterheadEditorOpen, setLetterheadEditorOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [quotationHistory, setQuotationHistory] = useState<QuotationListItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [persistedQuotationNo, setPersistedQuotationNo] = useState("");
  const [quotationActionError, setQuotationActionError] = useState("");
  const [quotationActionMessage, setQuotationActionMessage] = useState("");
  const [savingQuotation, setSavingQuotation] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, string>>({});
  const [selectedPreset, setSelectedPreset] = useState("");
  const [imageError, setImageError] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [companyTitle, setCompanyTitle] = useState("MTK SOLAR ENERGY GROUP");
  const [companyAddress, setCompanyAddress] = useState("No. 141, Parami Road, South Okkalapa Township, Yangon");
  const [companyPhone, setCompanyPhone] = useState("09 880 921 643 · 09 777 499 600");
  const [servicePhone, setServicePhone] = useState("09 880 921 646–649");
  const [projectTitle, setProjectTitle] = useState("Solar Hybrid System Installation");
  const [projectSupervisor, setProjectSupervisor] = useState("");
  const [quoteDate, setQuoteDate] = useState(quoteDefaults.date);
  const [quotationNo, setQuotationNo] = useState(quoteDefaults.number);
  const [validDays, setValidDays] = useState("7");
  const [discount, setDiscount] = useState("0");
  const [bankInformation, setBankInformation] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("တပ်ဆင်ရန် အတည်ပြုပြီးပါက စရံငွေ 30% ပေးချေရမည်ဖြစ်ပြီး Site အပ်နှံပြီးချိန်တွင် ကျန်ငွေအားလုံး ပေးချေရပါမည်။");
  const [priceNote, setPriceNote] = useState("ဈေးနှုန်းများသည် ဈေးကွက်အပြောင်းအလဲအရ ပြောင်းလဲနိုင်ပါသည်။");
  const [diagramNotes, setDiagramNotes] = useState("");
  const [warrantyParagraphs, setWarrantyParagraphs] = useState<string[]>(DEFAULT_WARRANTY_PARAGRAPHS);

  useEffect(() => {
    let cancelled = false;
    getWebsiteProductCategories()
      .then((data: WebsiteCategory[]) => {
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      })
      .catch((error: unknown) => {
        if (!cancelled) setCatalogError(error instanceof Error ? error.message : "Unable to load website products.");
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("authUser") || "null");
      setCanManageCatalog(["ADMIN", "BOSS", "MANAGER"].includes(String(currentUser?.role || "").toUpperCase()));
    } catch {
      setCanManageCatalog(false);
    }

    let cancelled = false;
    getQuotationCatalogItems()
      .then((items) => { if (!cancelled) setSavedCatalogItems(Array.isArray(items) ? items : []); })
      .catch((error: unknown) => { if (!cancelled) setCatalogManagementError(error instanceof Error ? error.message : "Product names could not be loaded."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setHistoryLoading(true);
      getQuotations(historySearch, historyPage, 20)
        .then((result) => {
          if (cancelled) return;
          setQuotationHistory(result.items);
          setHistoryTotal(result.total);
          setHistoryError("");
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setHistoryError(error instanceof Error ? error.message : "Quotation history could not be loaded.");
        })
        .finally(() => {
          if (!cancelled) setHistoryLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [historySearch, historyPage, historyVersion]);

  const catalogProducts = useMemo<QuotationProduct[]>(() => {
    const websiteProducts = categories.flatMap((category) => {
      const categoryGroup = getProductGroup(category);
      if (!categoryGroup || category.isPublished === false) return [];
      return (category.products || [])
        .filter((product) => product.isPublished !== false)
        .map((product) => {
          const saved = savedCatalogItems.find((item) => item.sourceProductId === product.id);
          return {
            ...product,
            title: saved?.title || product.title,
            description: saved?.description ?? product.description,
            mainImage: saved?.mainImage || product.mainImage || product.images?.[0]?.imageUrl || null,
            specificationImage: saved?.specificationImage || product.specificationImage || product.images?.[1]?.imageUrl || null,
            categoryTitle: category.title,
            categoryGroup,
            catalogModel: saved?.model || "",
            catalogItemId: saved?.id,
            isCustom: false,
          };
        });
    });
    const customProducts: QuotationProduct[] = savedCatalogItems
      .filter((item) => item.isCustom)
      .map((item) => ({
        id: item.id,
        slug: item.id,
        title: item.title,
        description: item.description,
        mainImage: item.mainImage,
        specificationImage: item.specificationImage,
        categoryTitle: item.group === "inverter" ? "Inverter" : "Battery System",
        categoryGroup: item.group,
        catalogModel: item.model || "",
        catalogItemId: item.id,
        isCustom: true,
      }));
    return [...websiteProducts, ...customProducts];
  }, [categories, savedCatalogItems]);

  useEffect(() => {
    setCatalogDrafts(Object.fromEntries(catalogProducts.map((product) => [
      product.id,
      { title: product.title, model: product.catalogModel || "" },
    ])));
  }, [catalogProducts]);

  const netTotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const discountAmount = Math.min(netTotal, Math.max(0, Number(discount) || 0));
  const totalAmount = Math.max(0, netTotal - discountAmount);
  const depositAmount = Math.round(totalAmount * 0.3);
  const balanceAmount = totalAmount - depositAmount;
  const quoteItemPages = useMemo(() => {
    const pageSize = 10;
    const pages: QuoteItem[][] = [];
    for (let index = 0; index < items.length; index += pageSize) {
      pages.push(items.slice(index, index + pageSize));
    }
    return pages;
  }, [items]);

  function addCatalogProduct(groupId: string) {
    const selectedProduct = catalogProducts.find((product) => product.id === selectedProductIds[groupId]);
    if (!selectedProduct) return;
    setItems((current) => {
      const existing = current.find((item) => item.productId === selectedProduct.id);
      if (existing) {
        return current.map((item) => item.id === existing.id
          ? { ...item, quantity: String(Number(item.quantity || 1) + 1) }
          : item);
      }
      return [...current, {
        id: makeId(),
        productId: selectedProduct.id,
        categoryTitle: selectedProduct.categoryTitle,
        title: selectedProduct.categoryTitle,
        model: selectedProduct.catalogModel || selectedProduct.title,
        description: selectedProduct.description || "",
        mainImage: selectedProduct.mainImage ? getWebsiteCmsImageUrl(selectedProduct.mainImage) : "",
        specificationImage: selectedProduct.specificationImage ? getWebsiteCmsImageUrl(selectedProduct.specificationImage) : "",
        quantity: "1",
        unit: "pcs",
        unitPrice: "0",
        warrantyTerm: "",
      }];
    });
  }

  function addCustomItem() {
    setItems((current) => [...current, {
      id: makeId(), categoryTitle: "Other", title: "", model: "", description: "", mainImage: "", specificationImage: "", quantity: "1", unit: "pcs", unitPrice: "0", warrantyTerm: "",
    }]);
  }

  function addPresetItem() {
    const preset = BOM_PRESETS[Number(selectedPreset)];
    if (!preset) return;
    setItems((current) => [...current, {
      id: makeId(), categoryTitle: "category" in preset ? preset.category : "Accessories / Installation", title: preset.title, model: "", description: "", mainImage: "", specificationImage: "", quantity: "1", unit: preset.unit, unitPrice: "0", warrantyTerm: "",
    }]);
  }

  function updateItem(id: string, changes: Partial<QuoteItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  async function uploadItemImage(id: string, field: "mainImage" | "specificationImage", file?: File) {
    setImageError("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImageError("ပုံဖိုင် 5 MB ထက်မကျော်စေရပါ။ ပိုသေးတဲ့ပုံကိုရွေးပါ။");
      return;
    }
    setUploadingImage(true);
    try {
      const result = await uploadQuotationImage(file);
      updateItem(id, { [field]: getWebsiteCmsImageUrl(result.path) });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "ပုံဖိုင်သိမ်းမရပါ။ နောက်တစ်ကြိမ်ပြန်ရွေးပါ။");
    } finally {
      setUploadingImage(false);
    }
  }

  function updateWarrantyParagraph(index: number, value: string) {
    setWarrantyParagraphs((current) => current.map((paragraph, itemIndex) => itemIndex === index ? value : paragraph));
  }

  async function saveManagedCatalogProduct(product: QuotationProduct) {
    const draft = catalogDrafts[product.id] || { title: product.title, model: product.catalogModel || "" };
    if (!draft.title.trim()) {
      setCatalogManagementError("ထုတ်ကုန်အမည် ဖြည့်ပါ။");
      return;
    }
    setCatalogSavingId(product.id);
    setCatalogManagementError("");
    setCatalogManagementMessage("");
    try {
      const saved = await saveQuotationCatalogItem({
        id: product.catalogItemId,
        group: product.categoryGroup as "inverter" | "battery",
        title: draft.title.trim(),
        model: draft.model.trim() || undefined,
        description: product.description || undefined,
        mainImage: product.mainImage || undefined,
        specificationImage: product.specificationImage || undefined,
        sourceProductId: product.isCustom ? undefined : product.id,
      });
      setSavedCatalogItems((current) => current.some((item) => item.id === saved.id)
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved]);
      setCatalogManagementMessage(`${saved.title} သိမ်းပြီးပါပြီ။`);
    } catch (error) {
      setCatalogManagementError(error instanceof Error ? error.message : "ထုတ်ကုန်အမည် သိမ်းမရပါ။");
    } finally {
      setCatalogSavingId("");
    }
  }

  async function removeManagedCatalogProduct(product: QuotationProduct) {
    if (!product.catalogItemId) return;
    setCatalogSavingId(product.id);
    setCatalogManagementError("");
    setCatalogManagementMessage("");
    try {
      await deleteQuotationCatalogItem(product.catalogItemId);
      setSavedCatalogItems((current) => current.filter((item) => item.id !== product.catalogItemId));
      setCatalogManagementMessage(product.isCustom ? "ထုတ်ကုန်စာရင်းမှ ဖယ်ရှားပြီးပါပြီ။" : "မူရင်းအမည်သို့ ပြန်ထားပြီးပါပြီ။");
    } catch (error) {
      setCatalogManagementError(error instanceof Error ? error.message : "ထုတ်ကုန်ကို ဖယ်ရှားမရပါ။");
    } finally {
      setCatalogSavingId("");
    }
  }

  async function uploadNewCatalogImage(field: "mainImage" | "specificationImage", file?: File) {
    if (!file) return;
    setCatalogManagementError("");
    if (file.size > 5 * 1024 * 1024) {
      setCatalogManagementError("ပုံဖိုင်တစ်ပုံလျှင် 5 MB ထက်မကျော်စေရပါ။");
      return;
    }
    setUploadingImage(true);
    try {
      const result = await uploadQuotationImage(file);
      if (field === "mainImage") setNewCatalogMainImage(result.path);
      else setNewCatalogSpecificationImage(result.path);
    } catch (error) {
      setCatalogManagementError(error instanceof Error ? error.message : "ပုံဖိုင်တင်မရပါ။");
    } finally {
      setUploadingImage(false);
    }
  }

  async function addManagedCatalogProduct() {
    if (!newCatalogTitle.trim()) {
      setCatalogManagementError("ထုတ်ကုန်အမည် ဖြည့်ပါ။");
      return;
    }
    setCatalogSavingId("new");
    setCatalogManagementError("");
    setCatalogManagementMessage("");
    try {
      const saved = await saveQuotationCatalogItem({
        group: newCatalogGroup,
        title: newCatalogTitle.trim(),
        model: newCatalogModel.trim() || undefined,
        mainImage: newCatalogMainImage || undefined,
        specificationImage: newCatalogSpecificationImage || undefined,
      });
      setSavedCatalogItems((current) => [...current, saved]);
      setSelectedProductIds((current) => ({ ...current, [saved.group]: saved.id }));
      setNewCatalogTitle("");
      setNewCatalogModel("");
      setNewCatalogMainImage("");
      setNewCatalogSpecificationImage("");
      setCatalogManagementMessage(`${saved.title} ထည့်ပြီးပါပြီ။`);
    } catch (error) {
      setCatalogManagementError(error instanceof Error ? error.message : "ထုတ်ကုန်အသစ် ထည့်မရပါ။");
    } finally {
      setCatalogSavingId("");
    }
  }

  function applyQuotationRecord(record: QuotationRecord) {
    const data = record.data;
    const text = (key: string, fallback = "") => typeof data[key] === "string" ? data[key] as string : fallback;
    setQuotationNo(record.quotationNo);
    setPersistedQuotationNo(record.quotationNo);
    setQuoteDate(text("quoteDate", record.quoteDate.slice(0, 10)).slice(0, 10));
    setCustomerName(text("customerName", record.customerName));
    setCustomerId(text("customerId", record.customerId || ""));
    setPhone(text("phone"));
    setAddress(text("address"));
    setCompanyTitle(text("companyTitle", "MTK SOLAR ENERGY GROUP"));
    setCompanyAddress(text("companyAddress", "No. 141, Parami Road, South Okkalapa Township, Yangon"));
    setCompanyPhone(text("companyPhone", "09 880 921 643 · 09 777 499 600"));
    setServicePhone(text("servicePhone", "09 880 921 646–649"));
    setProjectTitle(text("projectTitle", "Solar Hybrid System Installation"));
    setProjectSupervisor(text("projectSupervisor"));
    setValidDays(text("validDays", "7"));
    setDiscount(text("discount", "0"));
    setBankInformation(text("bankInformation"));
    setPaymentTerms(text("paymentTerms"));
    setPriceNote(text("priceNote"));
    setDiagramNotes(text("diagramNotes"));
    setWarrantyParagraphs(Array.isArray(data.warrantyParagraphs) && data.warrantyParagraphs.length === 3
      ? data.warrantyParagraphs.map((paragraph) => typeof paragraph === "string" ? paragraph : "")
      : DEFAULT_WARRANTY_PARAGRAPHS);
    setItems(Array.isArray(data.items) ? data.items as QuoteItem[] : []);
    setQuotationActionError("");
    setQuotationActionMessage(`ဖွင့်ပြီးပါပြီ — ${record.quotationNo}`);
  }

  async function openQuotation(quotationNoToOpen: string) {
    const normalized = quotationNoToOpen.trim();
    if (!normalized) return;
    setQuotationActionError("");
    setQuotationActionMessage("");
    try {
      const record = await getQuotation(normalized);
      applyQuotationRecord(record);
    } catch (error) {
      setQuotationActionError(error instanceof Error ? error.message : "Quotation ကိုရှာမတွေ့ပါ။");
    }
  }

  async function saveCurrentQuotation() {
    if (!quotationNo.trim()) {
      setQuotationActionError("Quotation ID ကို ဖြည့်ပါ။");
      return false;
    }
    setSavingQuotation(true);
    setQuotationActionError("");
    setQuotationActionMessage("");
    const payload: SaveQuotationPayload = {
      quotationNo: quotationNo.trim(),
      quoteDate,
      customerName,
      customerId,
      totalAmount,
      data: {
        quotationNo: quotationNo.trim(), quoteDate, customerName, customerId, phone, address,
        companyTitle, companyAddress, companyPhone, servicePhone, projectTitle, projectSupervisor,
        validDays, discount, bankInformation, paymentTerms, priceNote, diagramNotes, warrantyParagraphs, items,
      },
    };
    try {
      const record = await saveQuotation(payload, persistedQuotationNo || undefined);
      setPersistedQuotationNo(record.quotationNo);
      setQuotationNo(record.quotationNo);
      setQuotationActionMessage(`Quotation ကို သိမ်းပြီးပါပြီ — ${record.quotationNo}`);
      setHistoryVersion((version) => version + 1);
      return true;
    } catch (error) {
      setQuotationActionError(error instanceof Error ? error.message : "Quotation ကို သိမ်းမရပါ။");
      return false;
    } finally {
      setSavingQuotation(false);
    }
  }

  async function saveAndPrintQuotation() {
    if (!items.length || uploadingImage) return;
    if (await saveCurrentQuotation()) window.print();
  }

  function startNewQuotation() {
    const next = createQuoteDefaults();
    setQuotationNo(next.number);
    setQuoteDate(next.date);
    setPersistedQuotationNo("");
    setCustomerName(""); setCustomerId(""); setPhone(""); setAddress("");
    setCompanyTitle("MTK SOLAR ENERGY GROUP");
    setCompanyAddress("No. 141, Parami Road, South Okkalapa Township, Yangon");
    setCompanyPhone("09 880 921 643 · 09 777 499 600");
    setServicePhone("09 880 921 646–649");
    setProjectTitle("Solar Hybrid System Installation"); setProjectSupervisor("");
    setValidDays("7"); setDiscount("0"); setBankInformation("");
    setPaymentTerms("တပ်ဆင်ရန် အတည်ပြုပြီးပါက စရံငွေ 30% ပေးချေရမည်ဖြစ်ပြီး Site အပ်နှံပြီးချိန်တွင် ကျန်ငွေအားလုံး ပေးချေရပါမည်။");
    setPriceNote("ဈေးနှုန်းများသည် ဈေးကွက်အပြောင်းအလဲအရ ပြောင်းလဲနိုင်ပါသည်။");
    setDiagramNotes("");
    setWarrantyParagraphs(DEFAULT_WARRANTY_PARAGRAPHS);
    setItems([]); setQuotationActionError(""); setQuotationActionMessage("");
  }

  const dateLabel = quoteDate ? new Date(`${quoteDate}T12:00:00`).toLocaleDateString("en-GB") : "";

  return (
    <DashboardShell>
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <div>
              <Link href="/warehouse" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"><ArrowLeft size={16} /> Dashboard</Link>
              <h1 className="text-3xl font-black text-slate-900">Solar Quotation</h1>
              <p className="mt-1 text-sm text-slate-500">Choose equipment, enter the project details and print a complete A4 proposal.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={startNewQuotation} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 shadow-sm hover:bg-slate-50">{language === "my" ? "Quotation အသစ်" : "New quotation"}</button>
              <button type="button" onClick={saveAndPrintQuotation} disabled={items.length === 0 || savingQuotation || uploadingImage} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><Printer size={18} /> {savingQuotation ? (language === "my" ? "သိမ်းနေသည်…" : "Saving…") : language === "my" ? "သိမ်းပြီး PDF ထုတ်ရန်" : "Save & Print / PDF"}</button>
            </div>
          </div>

          <section className="space-y-5 print:hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">{language === "my" ? "Quotation မှတ်တမ်း" : "Quotation history"}</h2><p className="mt-1 text-sm text-slate-500">{language === "my" ? "ID နဲ့ပြန်ဖွင့်နိုင်ပြီး ထုတ်ထားသမျှကို ရှာနိုင်ပါတယ်။" : "Find and reopen any saved quotation by ID or customer."}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{historyTotal.toLocaleString()} {language === "my" ? "စောင်" : "records"}</span></div>
              <div className="flex flex-wrap gap-2"><input value={historySearch} onChange={(event) => { setHistorySearch(event.target.value); setHistoryPage(1); }} onKeyDown={(event) => { if (event.key === "Enter") void openQuotation(historySearch); }} className="h-11 min-w-64 flex-1 rounded-lg border border-slate-300 px-3" placeholder={language === "my" ? "Quotation ID သို့မဟုတ် ဖောက်သည်အမည်" : "Quotation ID or customer name"} /><button type="button" onClick={() => void openQuotation(historySearch)} className="h-11 rounded-lg border border-emerald-700 px-4 font-bold text-emerald-800 hover:bg-emerald-50">{language === "my" ? "ID ဖြင့်ဖွင့်ရန်" : "Open by ID"}</button></div>
              {historyError && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{language === "my" ? "Quotation မှတ်တမ်း မရသေးပါ။ Backend deploy ပြီးမှ ပြန်စမ်းပါ။" : "Quotation history is unavailable. Try again after the backend is deployed."} ({historyError})</p>}
              <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                {quotationHistory.map((record) => <div key={record.quotationNo} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"><div className="min-w-0"><strong className="block truncate text-sm text-slate-800">{record.quotationNo}</strong><span className="text-xs text-slate-500">{record.customerName || (language === "my" ? "ဖောက်သည်အမည်မရှိ" : "No customer name")} · {new Date(record.quoteDate).toLocaleDateString("en-GB")} · {formatMMK(Number(record.totalAmount))}{record.createdBy?.username ? ` · ${record.createdBy.username}` : ""}</span></div><button type="button" onClick={() => void openQuotation(record.quotationNo)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50">{language === "my" ? "ဖွင့်ရန်" : "Open"}</button></div>)}
                {!historyLoading && !historyError && quotationHistory.length === 0 && <p className="px-3 py-5 text-center text-sm text-slate-500">{language === "my" ? "သိမ်းထားသော quotation မရှိသေးပါ။" : "No saved quotations yet."}</p>}
                {historyLoading && <p className="px-3 py-5 text-center text-sm text-slate-500">{language === "my" ? "စာရင်းဖွင့်နေသည်…" : "Loading history…"}</p>}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{quotationActionError || quotationActionMessage}</span><div className="flex items-center gap-2"><button type="button" onClick={() => setHistoryPage((page) => Math.max(1, page - 1))} disabled={historyPage <= 1} className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40">Previous</button><span>{historyPage} / {Math.max(1, Math.ceil(historyTotal / 20))}</span><button type="button" onClick={() => setHistoryPage((page) => page + 1)} disabled={historyPage * 20 >= historyTotal} className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40">Next</button></div></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><FileText size={22} /></div><div><h2 className="font-bold text-slate-900">Quotation details</h2><p className="text-sm text-slate-500">Information on the first page and letterhead.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm font-semibold text-slate-700">Customer name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Customer name" /></label>
                <label className="text-sm font-semibold text-slate-700">Customer ID<input value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Optional" /></label>
                <label className="text-sm font-semibold text-slate-700">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Customer phone" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Address<input value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Project / customer address" /></label>
                <div className="flex items-end"><button type="button" onClick={() => setLetterheadEditorOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-lg border border-emerald-700 px-4 text-sm font-bold text-emerald-800 hover:bg-emerald-50"><Pencil size={15} /> {language === "my" ? "Letterhead ပြင်ရန်" : "Edit letterhead"}</button></div>
                <label className="text-sm font-semibold text-slate-700">Project title<input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700">Quotation ID (အလိုအလျောက်)<input value={quotationNo} readOnly className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 font-normal text-slate-700" /></label>
                <label className="text-sm font-semibold text-slate-700">Date<input type="date" value={quoteDate} onChange={(event) => setQuoteDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700">Project supervisor<input value={projectSupervisor} onChange={(event) => setProjectSupervisor(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Supervisor name" /></label>
                <label className="text-sm font-semibold text-slate-700">Price validity (days)<input type="number" min="1" value={validDays} onChange={(event) => setValidDays(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">အဓိကပစ္စည်း မော်ဒယ်ရွေးရန်</h2><p className="text-sm text-slate-500">Inverter နဲ့ Battery ကိုရွေးပြီး Add လုပ်ပါ။ Product ပုံနဲ့ Spec ပုံပါသော စာမျက်နှာတစ်မျက်နှာစီ ထည့်ပေးပါမယ်။</p></div>{canManageCatalog && <button type="button" onClick={() => { setCatalogEditorOpen((open) => !open); setCatalogManagementError(""); }} className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"><Pencil size={15} /> ထုတ်ကုန်အမည် ပြင် / အသစ်ထည့်</button>}</div>
              {catalogError && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Website product စာရင်း မရသေးပါ။ ခဏနေရင် Refresh လုပ်ပါ၊ သို့မဟုတ် အောက်က Add item မှာ ကိုယ်တိုင်ဖြည့်ပါ။ ({catalogError})</p>}
              <div className="grid gap-4 lg:grid-cols-2">
                {PRODUCT_GROUPS.map((group) => {
                  const products = catalogProducts.filter((product) => product.categoryGroup === group.value);
                  return <div key={group.value} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-bold text-slate-700">{group.label}
                      <select value={selectedProductIds[group.value] || ""} onChange={(event) => setSelectedProductIds((current) => ({ ...current, [group.value]: event.target.value }))} disabled={catalogLoading || products.length === 0} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal disabled:bg-slate-100">
                        <option value="">{catalogLoading ? "ပစ္စည်းစာရင်းဖွင့်နေသည်…" : products.length ? "ပစ္စည်းအမည်ရွေးပါ" : "ပစ္စည်းမရှိသေးပါ"}</option>
                        {products.map((product) => <option key={product.id} value={product.id}>{product.title}{product.catalogModel ? ` — ${product.catalogModel}` : ""}</option>)}
                      </select>
                    </label>
                    <button type="button" onClick={() => addCatalogProduct(group.value)} disabled={!selectedProductIds[group.value]} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} /> Add to quotation</button>
                  </div>;
                })}
              </div>
              {canManageCatalog && catalogEditorOpen && <div className="mt-5 space-y-5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">Inverter / Battery အမည်စာရင်း</h3><p className="mt-1 text-xs text-slate-600">Website စာရင်းအစဉ်အတိုင်း ပစ္စည်းပုံနဲ့ Spec ပုံကို ဘေးမှာတွဲပြထားပါတယ်။ ပုံကြည့်ပြီး အမည်/Model ဖြည့်ကာ သိမ်းပါ။</p></div><button type="button" onClick={() => setCatalogEditorOpen(false)} aria-label="Close product editor" className="rounded-lg p-2 text-slate-500 hover:bg-white"><X size={18} /></button></div>
                {catalogManagementError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{catalogManagementError}</p>}
                {catalogManagementMessage && <p className="rounded-lg border border-emerald-200 bg-white p-3 text-sm text-emerald-800">{catalogManagementMessage}</p>}
                {catalogManagementError && catalogManagementError.toLowerCase().includes("forbidden") && <p className="text-xs text-slate-600">ထုတ်ကုန်အမည် စီမံခွင့်ကို Admin, Boss, Manager များအတွက်သာ ဖွင့်ထားပါသည်။</p>}
                {(["inverter", "battery"] as const).map((group) => <section key={group} className="space-y-2">
                  <h4 className="text-sm font-bold text-emerald-900">{group === "inverter" ? "Inverter" : "Battery System"}</h4>
                  {catalogProducts.filter((product) => product.categoryGroup === group).map((product) => {
                    const draft = catalogDrafts[product.id] || { title: product.title, model: product.catalogModel || "" };
                    return <div key={product.id} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                      <div className="flex gap-2">
                        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                          {product.mainImage ? <Image src={getWebsiteCmsImageUrl(product.mainImage)} alt={`${product.title} product image`} width={96} height={72} unoptimized className="h-[68px] w-full rounded border border-slate-200 bg-white object-contain" /> : <div className="grid h-[68px] w-full place-items-center rounded border border-dashed border-slate-300 text-[10px] text-slate-400">ပုံမရှိ</div>}
                          <span className="text-[10px] text-slate-500">ပစ္စည်းပုံ</span>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                          {product.specificationImage ? <Image src={getWebsiteCmsImageUrl(product.specificationImage)} alt={`${product.title} specification image`} width={96} height={72} unoptimized className="h-[68px] w-full rounded border border-slate-200 bg-white object-contain" /> : <div className="grid h-[68px] w-full place-items-center rounded border border-dashed border-slate-300 text-[10px] text-slate-400">Spec မရှိ</div>}
                          <span className="text-[10px] text-slate-500">Spec ပုံ</span>
                        </div>
                      </div>
                      <input value={draft.title} onChange={(event) => setCatalogDrafts((current) => ({ ...current, [product.id]: { ...draft, title: event.target.value } }))} className="h-10 min-w-0 rounded-lg border border-slate-300 px-3 text-sm" aria-label={`${product.title} product name`} placeholder="ထုတ်ကုန်အမည်" />
                      <input value={draft.model} onChange={(event) => setCatalogDrafts((current) => ({ ...current, [product.id]: { ...draft, model: event.target.value } }))} className="h-10 min-w-0 rounded-lg border border-slate-300 px-3 text-sm" aria-label={`${product.title} model`} placeholder="Model (မဖြည့်လည်းရ)" />
                      <button type="button" onClick={() => void saveManagedCatalogProduct(product)} disabled={catalogSavingId === product.id} className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-emerald-700 px-3 text-sm font-bold text-white disabled:opacity-50"><Save size={15} /> သိမ်း</button>
                      {product.catalogItemId && <button type="button" onClick={() => void removeManagedCatalogProduct(product)} disabled={catalogSavingId === product.id} aria-label="Reset or remove product" className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 text-red-600 disabled:opacity-50"><Trash2 size={16} /></button>}
                    </div>;
                  })}
                </section>)}
                <section className="space-y-3 rounded-lg border border-emerald-200 bg-white p-4">
                  <h4 className="font-bold text-slate-900">ထုတ်ကုန်အသစ်ထည့်ရန်</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-600">ပစ္စည်းအမျိုးအစား<select value={newCatalogGroup} onChange={(event) => setNewCatalogGroup(event.target.value as "inverter" | "battery")} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="inverter">Inverter</option><option value="battery">Battery System</option></select></label>
                    <label className="text-xs font-semibold text-slate-600">ထုတ်ကုန်အမည်<input value={newCatalogTitle} onChange={(event) => setNewCatalogTitle(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="ဥပမာ — Felicity Solar Inverter" /></label>
                    <label className="text-xs font-semibold text-slate-600">Model<input value={newCatalogModel} onChange={(event) => setNewCatalogModel(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="Model / capacity (ရွေးချယ်နိုင်သည်)" /></label>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">{newCatalogMainImage ? "Product ပုံရွေးပြီး" : "Product ပုံရွေး"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void uploadNewCatalogImage("mainImage", event.target.files?.[0]); event.target.value = ""; }} /></label>
                      <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">{newCatalogSpecificationImage ? "Spec ပုံရွေးပြီး" : "Spec ပုံရွေး"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void uploadNewCatalogImage("specificationImage", event.target.files?.[0]); event.target.value = ""; }} /></label>
                    </div>
                  </div>
                  <button type="button" onClick={() => void addManagedCatalogProduct()} disabled={catalogSavingId === "new" || uploadingImage} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-50"><Plus size={16} /> အသစ်ထည့်</button>
                </section>
              </div>}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-900">{language === "my" ? "ဆက်စပ်ပစ္စည်းများ" : "Related Items"} <span className="ml-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">{items.length}</span></h2><p className="mt-1 text-xs text-slate-500">{language === "my" ? "Quotation အတွက် လိုအပ်သောပစ္စည်းများကို ရွေးထည့်ပါ။" : "Choose the equipment and accessories needed for this quotation."}</p></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-600"><tr><th className="px-3 py-3">Sr</th><th className="px-3 py-3">Item</th><th className="px-3 py-3">Model</th><th className="w-24 px-3 py-3">Qty</th><th className="w-40 px-3 py-3">Price (MMK)</th><th className="w-40 px-3 py-3 text-right">Total Amount</th><th className="w-52 px-3 py-3">Product Photo / Spec</th><th className="w-12 px-2 py-3" /></tr></thead>
                  <tbody>{items.map((item, index) => (
                    <tr key={item.id} className="border-t border-slate-200 align-top">
                      <td className="px-3 py-3 font-semibold text-slate-500">{index + 1}</td>
                      <td className="min-w-52 px-3 py-3"><input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} className="h-10 w-full rounded-lg border border-slate-300 px-3 font-semibold" placeholder="Item name" /><span className="mt-1 block text-[11px] text-emerald-700">{item.categoryTitle}</span></td>
                      <td className="min-w-48 px-3 py-3"><input value={item.model} onChange={(event) => updateItem(item.id, { model: event.target.value })} className="h-10 w-full rounded-lg border border-slate-300 px-3" placeholder="Model / specification" /><input value={item.warrantyTerm} onChange={(event) => updateItem(item.id, { warrantyTerm: event.target.value })} className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs" placeholder="Warranty (optional)" /></td>
                      <td className="px-3 py-3"><input type="number" min="0" step="any" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} className="h-10 w-full rounded-lg border border-slate-300 px-2" /><input value={item.unit} onChange={(event) => updateItem(item.id, { unit: event.target.value })} className="mt-2 h-8 w-full rounded-lg border border-slate-200 px-2 text-xs" aria-label="Unit" placeholder="Unit" /></td>
                      <td className="px-3 py-3"><input type="number" min="0" value={item.unitPrice} onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })} className="h-10 w-full rounded-lg border border-slate-300 px-2 text-right" placeholder="0" /></td>
                      <td className="px-3 py-3 text-right font-bold">{formatMMK(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</td>
                      <td className="px-3 py-3"><div className="flex items-center gap-2">{item.mainImage && <Image src={item.mainImage} alt="" width={44} height={44} unoptimized className="h-11 w-11 shrink-0 rounded border border-slate-200 bg-white object-contain" />}<label className={`cursor-pointer rounded-lg border border-slate-300 px-2 py-2 text-xs font-semibold hover:bg-slate-50 ${uploadingImage ? "pointer-events-none opacity-50" : ""}`}>{uploadingImage ? "Uploading…" : item.mainImage ? "Photo ပြောင်း" : "Photo ထည့်"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} className="sr-only" onChange={(event) => { void uploadItemImage(item.id, "mainImage", event.target.files?.[0]); event.target.value = ""; }} /></label></div><label className={`mt-2 block cursor-pointer text-xs font-medium text-blue-700 hover:underline ${uploadingImage ? "pointer-events-none opacity-50" : ""}`}>Spec sheet ထည့် / ပြောင်း<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} className="sr-only" onChange={(event) => { void uploadItemImage(item.id, "specificationImage", event.target.files?.[0]); event.target.value = ""; }} /></label>{item.specificationImage && <span className="mt-1 block text-[10px] text-emerald-700">Spec sheet အဆင်သင့်</span>}</td>
                      <td className="px-2 py-3"><button type="button" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))} aria-label={`Remove ${item.title || "quotation item"}`} className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {imageError && <p className="mx-5 mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{imageError}</p>}
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 p-4">
                <select value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value)} className="h-10 min-w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">{language === "my" ? "ပစ္စည်းရွေးရန်" : "Select an item"}</option>{BOM_PRESETS.map((preset, index) => <option key={preset.title} value={index}>{preset.title}</option>)}</select>
                <button type="button" onClick={addPresetItem} disabled={selectedPreset === ""} className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-700 px-4 text-sm font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"><Plus size={16} /> ရွေးထားတာ Add</button>
                <button type="button" onClick={addCustomItem} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"><Plus size={16} /> အသစ်ထည့်ရန်</button>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="mb-4 font-bold text-slate-900">Payment and quotation notes</h2><label className="mb-4 block text-sm font-semibold text-slate-700">Bank information (optional)<textarea value={bankInformation} onChange={(event) => setBankInformation(event.target.value)} rows={2} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm font-normal" placeholder="Enter the payment details to show on this quotation" /></label><label className="block text-sm font-semibold text-slate-700">Price note<textarea value={priceNote} onChange={(event) => setPriceNote(event.target.value)} rows={2} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm font-normal" /></label></div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm sm:p-7"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-slate-900">Quotation total</h2><span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">A4 proposal</span></div><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-600">Net total</span><strong>{formatMMK(netTotal)}</strong></div><label className="flex items-center justify-between gap-4"><span className="text-slate-600">Discount (MMK)</span><input type="number" min="0" value={discount} onChange={(event) => setDiscount(event.target.value)} className="h-9 w-36 rounded-lg border border-emerald-200 bg-white px-3 text-right" /></label><div className="flex justify-between border-t border-emerald-200 pt-3 text-base"><strong>Total amount</strong><strong className="text-emerald-800">{formatMMK(totalAmount)}</strong></div><div className="flex justify-between"><span className="text-slate-600">30% deposit</span><strong>{formatMMK(depositAmount)}</strong></div><div className="flex justify-between"><span className="text-slate-600">Balance after handover</span><strong>{formatMMK(balanceAmount)}</strong></div></div><p className="mt-4 text-xs leading-5 text-slate-500">Deposit percentage follows the current quotation reference and is calculated automatically.</p></div>
            </div>

          </section>
        </div>

        <div className="mt-10 block">
          <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2 print:hidden"><h2 className="text-xl font-black text-slate-900">{language === "my" ? "Quotation စာမျက်နှာများ အကြိုကြည့်ရန်" : "Quotation page preview"}</h2><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">{language === "my" ? `စာရင်း ${quoteItemPages.length} မျက်နှာ · တစ်မျက်နှာလျှင် ပစ္စည်း ၁၀ ခု` : `${quoteItemPages.length} item page${quoteItemPages.length === 1 ? "" : "s"} · up to 10 items per page`}</span></div>
          <div className="space-y-6 print:space-y-0">
          {quoteItemPages.map((pageItems, pageIndex) => {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === quoteItemPages.length - 1;
            return <article key={`quote-page-${pageIndex}`} className="quote-print-page quote-page-break mx-auto my-5 min-h-[297mm] w-full max-w-[210mm] border border-slate-200 bg-white p-[10mm] shadow-sm print:my-0 print:border-0 print:shadow-none">
              <Letterhead companyTitle={companyTitle} companyAddress={companyAddress} companyPhone={companyPhone} servicePhone={servicePhone} />
              {isFirstPage ? <>
                <div className="mt-5 flex items-start justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Solar Energy Proposal</p><h1 className="mt-1 text-3xl font-black text-slate-900">Quotation</h1><p className="mt-2 text-lg font-semibold text-slate-800">{projectTitle || "Solar Hybrid System Installation"}</p></div><div className="rounded-xl bg-slate-50 p-4 text-right text-sm"><p><span className="text-slate-500">Quotation No.</span> <strong>{quotationNo}</strong></p><p className="mt-1"><span className="text-slate-500">Date</span> <strong>{dateLabel}</strong></p><p className="mt-1"><span className="text-slate-500">Valid</span> <strong>{validDays} days</strong></p></div></div>
                <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-2 rounded-xl border border-slate-200 p-4 text-xs sm:grid-cols-3"><p><span className="text-slate-500">Customer:</span> <strong>{customerName || "—"}</strong></p><p><span className="text-slate-500">Customer ID:</span> <strong>{customerId || "—"}</strong></p><p><span className="text-slate-500">Phone:</span> <strong>{phone || "—"}</strong></p><p className="sm:col-span-2"><span className="text-slate-500">Address / project site:</span> <strong>{address || "—"}</strong></p><p><span className="text-slate-500">Project supervisor:</span> <strong>{projectSupervisor || "—"}</strong></p></div>
              </> : <div className="mt-6 flex items-center justify-between border-b border-slate-200 pb-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Quotation continuation</p><h2 className="mt-1 text-xl font-black text-slate-900">{projectTitle || "Solar Hybrid System Installation"}</h2><p className="mt-1 text-xs text-slate-500">Customer: {customerName || "—"} · Quotation No.: {quotationNo}</p></div><p className="text-sm font-bold text-slate-500">စာမျက်နှာ {pageIndex + 1} / {quoteItemPages.length}</p></div>}
              <table className="quote-items mt-5 w-full border-collapse text-left text-[11px]"><thead className="[display:table-header-group]"><tr className="bg-slate-900 text-white"><th className="px-2 py-2">No.</th><th className="px-2 py-2">Item / model</th><th className="px-2 py-2 text-right">Qty</th><th className="px-2 py-2">Unit</th><th className="px-2 py-2 text-right">Unit price</th><th className="px-2 py-2 text-right">Amount (MMK)</th></tr></thead><tbody>{pageItems.map((item, pageItemIndex) => { const index = pageIndex * 10 + pageItemIndex; return <tr key={item.id} className="quote-no-break border-b border-slate-200"><td className="px-2 py-2">{index + 1}</td><td className="px-2 py-2"><strong>{item.title || "Item"}</strong>{item.model && <span className="block text-slate-500">{item.model}</span>}{item.warrantyTerm && <span className="block text-emerald-700">Warranty: {item.warrantyTerm}</span>}</td><td className="px-2 py-2 text-right">{Number(item.quantity || 0).toLocaleString()}</td><td className="px-2 py-2">{item.unit}</td><td className="px-2 py-2 text-right">{Number(item.unitPrice || 0).toLocaleString()}</td><td className="px-2 py-2 text-right font-semibold">{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString()}</td></tr>; })}</tbody></table>
              {isLastPage && <>
                <div className="ml-auto mt-4 w-72 space-y-1.5 text-sm"><div className="flex justify-between"><span>Net Total</span><strong>{formatMMK(netTotal)}</strong></div><div className="flex justify-between"><span>Discount</span><strong>− {formatMMK(discountAmount)}</strong></div><div className="flex justify-between border-t border-slate-300 pt-2 text-base"><strong>Total Amount</strong><strong className="text-emerald-800">{formatMMK(totalAmount)}</strong></div><div className="flex justify-between"><span>30% Deposit</span><strong>{formatMMK(depositAmount)}</strong></div><div className="flex justify-between"><span>Balance</span><strong>{formatMMK(balanceAmount)}</strong></div></div>
                {bankInformation && <div className="quote-no-break mt-3 rounded-xl border border-slate-200 p-4 text-xs leading-5"><strong>Bank information</strong><p className="mt-1 whitespace-pre-line">{bankInformation}</p></div>}<p className="mt-4 text-xs italic text-slate-500">{priceNote}</p>
                <div className="mt-10 grid grid-cols-2 gap-16 text-center text-xs"><div className="border-t border-slate-400 pt-2">Prepared by</div><div className="border-t border-slate-400 pt-2">Customer acceptance</div></div>
              </>}
            </article>;
          })}

          <article className="quote-print-page quote-page-break mx-auto my-5 min-h-[297mm] w-full max-w-[210mm] border border-slate-200 bg-white p-[10mm] shadow-sm print:my-0 print:border-0 print:shadow-none">
            <Letterhead small companyTitle={companyTitle} companyAddress={companyAddress} companyPhone={companyPhone} servicePhone={servicePhone} />
            <div className="mt-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">System Overview</p><h2 className="mt-2 text-3xl font-black text-slate-900">One-Line Diagram</h2><p className="mt-2 text-sm text-slate-500">{projectTitle || "Solar Hybrid System Installation"}</p></div>
            <div className="mt-8"><OneLineDiagram /></div>
            <label className="mt-5 block print:hidden"><span className="mb-2 block text-sm font-bold text-slate-700">Diagram အောက်မှတ်ချက် (ရွေးချယ်နိုင်သည်)</span><textarea value={diagramNotes} onChange={(event) => setDiagramNotes(event.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 p-3 text-sm" placeholder="ဒီ Diagram နဲ့သက်ဆိုင်တဲ့ မှတ်ချက်ရေးရန်" /></label>
            {diagramNotes.trim() && <p className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-700">{diagramNotes}</p>}
          </article>

          {items.filter((item) => item.productId || item.mainImage || item.specificationImage).map((item) => (
            <article key={item.id} className="quote-print-page quote-page-break mx-auto my-5 min-h-[297mm] w-full max-w-[210mm] border border-slate-200 bg-white p-[10mm] shadow-sm print:my-0 print:border-0 print:shadow-none">
              <Letterhead small companyTitle={companyTitle} companyAddress={companyAddress} companyPhone={companyPhone} servicePhone={servicePhone} />
              <div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Product Specification</p><h2 className="mt-2 text-2xl font-black text-slate-900">{item.model || item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.categoryTitle}{item.title && item.model ? ` · ${item.title}` : ""}</p>{item.warrantyTerm && <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Warranty: {item.warrantyTerm}</p>}</div>
              {item.description && <p className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-700">{item.description}</p>}
              {(item.mainImage || item.specificationImage) && <div className={`mt-6 grid gap-4 ${item.mainImage && item.specificationImage ? "grid-cols-2" : "grid-cols-1"}`}>
                {item.mainImage && <section className="quote-no-break rounded-xl border border-slate-200 p-3"><h3 className="mb-2 text-center text-xs font-bold text-slate-600">Product image</h3><div className="grid min-h-[95mm] place-items-center"><Image src={item.mainImage} alt={item.title} width={800} height={1000} unoptimized className="max-h-[100mm] max-w-full object-contain" /></div></section>}
                {item.specificationImage && <section className="quote-no-break rounded-xl border border-slate-200 p-3"><h3 className="mb-2 text-center text-xs font-bold text-slate-600">Product specifications</h3><div className="grid min-h-[95mm] place-items-center"><Image src={item.specificationImage} alt={`${item.title} specification`} width={1200} height={1600} unoptimized className="max-h-[110mm] max-w-full object-contain" /></div></section>}
              </div>}
              {!item.mainImage && !item.specificationImage && <div className="mt-8 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">Technical specification sheet is not available for this product in the website catalog.</div>}
              <p className="mt-5 text-xs text-slate-500">Specifications and product images are provided from the published SuntreeMyanmar website catalog. Product model warranty terms are shown as entered in the quotation.</p>
            </article>
          ))}

          <article className="quote-print-page mx-auto my-5 min-h-[297mm] w-full max-w-[210mm] border border-slate-200 bg-white p-[10mm] shadow-sm print:my-0 print:border-0 print:shadow-none">
            <Letterhead small companyTitle={companyTitle} companyAddress={companyAddress} companyPhone={companyPhone} servicePhone={servicePhone} />
            <div className="mt-7 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Customer Care</p><h2 className="mt-2 text-3xl font-black text-slate-900">Warranty & After-Sales Service</h2><p className="mt-2 text-sm leading-6 text-slate-600">ယုံကြည်စိတ်ချစွာ အသုံးပြုနိုင်ရန် စနစ်တကျ အာမခံဝန်ဆောင်မှုနှင့် နည်းပညာအကူအညီများ ပေးအပ်ပါသည်။ အောက်ပါအချက်များသည် ရွေးချယ်ထားသော ပစ္စည်း Model နှင့် ထုတ်လုပ်သူ၏ အာမခံမူဝါဒအလိုက် အကျုံးဝင်ပါသည်။</p></div><button type="button" onClick={() => setWarrantyEditorOpen(true)} className="print:hidden inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"><Pencil size={15} /> စာသားပြင်ရန်</button></div>
            <div className="mt-6 space-y-4">{warrantyParagraphs.map((paragraph, index) => <section key={index} className="quote-no-break rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-700 text-sm font-black text-white">0{index + 1}</span><h3 className="text-base font-black text-slate-900">{["Inverter နှင့် Circuit Protection", "Lithium Battery အာမခံ", "Installation နှင့် After-Sales Service"][index]}</h3></div><p className="whitespace-pre-line text-[12px] leading-7 text-slate-700">{paragraph}</p></section>)}</div>
            {paymentTerms && <div className="quote-no-break mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5"><strong>Payment terms / ငွေပေးချေမှုစည်းကမ်း</strong><p className="mt-1 whitespace-pre-line">{paymentTerms}</p></div>}
            <div className="quote-no-break mt-6 rounded-2xl bg-slate-50 p-5"><h3 className="font-bold text-slate-900">အာမခံဝန်ဆောင်မှု ရယူရန်</h3><p className="mt-2 text-sm leading-6 text-slate-700">Warranty claim တင်ရာတွင် ဝယ်ယူကြောင်းအထောက်အထား၊ Product Serial Number နှင့် Warranty Registration အချက်အလက်များကို ပြသပေးပါ။ စစ်ဆေးအတည်ပြုပြီးနောက် သက်ဆိုင်ရာ Warranty Policy အတိုင်း ဝန်ဆောင်မှုပေးပါမည်။</p></div>
            <div className="mt-10 grid grid-cols-2 gap-16 text-center text-xs"><div className="border-t border-slate-400 pt-2">MTK Solar Energy Group</div><div className="border-t border-slate-400 pt-2">Customer acceptance</div></div>
          </article>
          </div>
        </div>
        {letterheadEditorOpen && <>
          <button type="button" aria-label="Close letterhead editor" onClick={() => setLetterheadEditorOpen(false)} className="fixed inset-0 z-40 bg-slate-950/35 print:hidden" />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl print:hidden sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-lg font-black text-slate-900">Letterhead အချက်အလက်ပြင်ရန်</h2><p className="mt-1 text-sm text-slate-500">ဒီအချက်အလက်တွေကို quotation PDF ရဲ့ ခေါင်းပိုင်းမှာ ဖော်ပြပါမယ်။</p></div><button type="button" onClick={() => setLetterheadEditorOpen(false)} aria-label="Close editor" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">{language === "my" ? "ကုမ္ပဏီခေါင်းစဉ်" : "Company heading"}<input value={companyTitle} onChange={(event) => setCompanyTitle(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
              <label className="block text-sm font-bold text-slate-700">{language === "my" ? "ကုမ္ပဏီလိပ်စာ" : "Company address"}<input value={companyAddress} onChange={(event) => setCompanyAddress(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
              <label className="block text-sm font-bold text-slate-700">{language === "my" ? "ကုမ္ပဏီဖုန်း" : "Company phones"}<input value={companyPhone} onChange={(event) => setCompanyPhone(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
              <label className="block text-sm font-bold text-slate-700">{language === "my" ? "Customer Service ဖုန်း" : "Customer service phone"}<input value={servicePhone} onChange={(event) => setServicePhone(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
            </div>
            <button type="button" onClick={() => setLetterheadEditorOpen(false)} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white">ပြီးပါပြီ</button>
          </aside>
        </>}
        {warrantyEditorOpen && <>
          <button type="button" aria-label="Close warranty editor" onClick={() => setWarrantyEditorOpen(false)} className="fixed inset-0 z-40 bg-slate-950/35 print:hidden" />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl print:hidden sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-lg font-black text-slate-900">နောက်ဆုံးစာမျက်နှာ စာသားပြင်ရန်</h2><p className="mt-1 text-sm text-slate-500">ပြင်ပြီးသိမ်းထားသော စာသားများကို PDF မှာဖော်ပြပါမယ်။</p></div><button type="button" onClick={() => setWarrantyEditorOpen(false)} aria-label="Close editor" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
            <label className="mb-5 block text-sm font-bold text-slate-700">Payment terms / ငွေပေးချေမှုစည်းကမ်း<textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} rows={4} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm font-normal leading-6" /></label>
            <div className="space-y-4">{warrantyParagraphs.map((paragraph, index) => <label key={index} className="block text-sm font-bold text-slate-700">{["Inverter နှင့် Circuit Protection", "Lithium Battery", "Installation နှင့် After-Sales Service"][index]}<textarea value={paragraph} onChange={(event) => updateWarrantyParagraph(index, event.target.value)} rows={6} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm font-normal leading-6" /></label>)}</div>
            <button type="button" onClick={() => setWarrantyEditorOpen(false)} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white">ပြီးပါပြီ</button>
          </aside>
        </>}
      </main>
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          html, body { background: #fff !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .quote-print-page { box-sizing: border-box; width: 190mm; min-height: 277mm; padding: 0; break-after: page; page-break-after: always; color: #0f172a; }
          .quote-print-page:last-child { break-after: auto; page-break-after: auto; }
          .quote-page-break { break-after: page; page-break-after: always; }
          .quote-no-break { break-inside: avoid; page-break-inside: avoid; }
          .quote-items tr { break-inside: avoid; page-break-inside: avoid; }
          .quote-letterhead img { print-color-adjust: exact; }
        }
        .quote-print-page { box-sizing: border-box; }
      `}</style>
    </DashboardShell>
  );
}
