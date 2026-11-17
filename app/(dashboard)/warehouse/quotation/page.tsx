"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardShell from "@/components/layout/DashboardShell";
import { getWebsiteCmsImageUrl, getWebsiteProductCategories } from "@/lib/website-cms-api";
import { ArrowLeft, FileText, Plus, Printer, Trash2 } from "lucide-react";

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
  { value: "inverter", label: "Inverter", slugs: ["inverter", "inverters"] },
  { value: "battery", label: "Battery System", slugs: ["battery", "battery-system", "batteries"] },
  { value: "solar", label: "Solar System", slugs: ["solar", "solar-system", "solar-panel", "solar-panels", "solar-power-system", "solar-solutions"] },
  {
    value: "circuit-protection",
    label: "Circuit Protection",
    slugs: ["dc-circuit-breaker", "ac-circuit-breaker", "dc-spd", "dc-isolator", "ats", "ac-voltage-protector"],
  },
] as const;

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
    hourCycle: "h23",
  }).format(now).replace(":", "");
  return {
    date,
    number: `MTK-Q-${date.replaceAll("-", "")}-${time}`,
  };
}

function Letterhead({ small = false }: { small?: boolean }) {
  return (
    <div className={`quote-letterhead flex items-center justify-between gap-6 border-b-2 border-emerald-700 ${small ? "pb-2" : "pb-4"}`}>
      <Image src="/images/logo/ak-logo1.png" alt="Arkar Min Thu Kha Electro Trading Co., Ltd." width={280} height={160} priority unoptimized className={`${small ? "h-12" : "h-16"} max-w-[38%] object-contain object-left`} />
      <div className="min-w-0 flex-1 text-center">
        <p className="text-xs font-bold tracking-[0.18em] text-emerald-800">MTK SOLAR ENERGY GROUP</p>
        <p className="mt-1 text-[10px] text-slate-600">No. 141, Parami Road, South Okkalapa Township, Yangon</p>
        <p className="text-[10px] text-slate-600">09 880 921 643 · 09 777 499 600</p>
      </div>
      <Image src="/images/logo/mtk-solar-energy.png" alt="MTK Solar Energy" width={160} height={160} priority unoptimized className={`${small ? "h-12" : "h-16"} max-w-[38%] object-contain object-right`} />
    </div>
  );
}

function OneLineDiagram({ systemTitle }: { systemTitle: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <svg viewBox="0 0 1000 510" role="img" aria-label="Illustrative solar system one-line diagram" className="w-full">
        <defs>
          <marker id="quote-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#047857" />
          </marker>
        </defs>
        <text x="500" y="42" textAnchor="middle" fill="#0f172a" fontSize="24" fontWeight="700">{systemTitle || "Solar Hybrid System"}</text>
        <g fill="#f0fdf4" stroke="#059669" strokeWidth="3">
          <rect x="35" y="185" width="180" height="105" rx="16" />
          <rect x="285" y="185" width="150" height="105" rx="16" />
          <rect x="535" y="165" width="175" height="145" rx="16" />
          <rect x="785" y="185" width="170" height="105" rx="16" />
          <rect x="545" y="375" width="155" height="90" rx="16" />
          <rect x="785" y="375" width="170" height="90" rx="16" />
        </g>
        <g fill="#065f46" fontSize="20" fontWeight="700" textAnchor="middle">
          <text x="125" y="228">SOLAR ARRAY</text><text x="125" y="258">PV Modules</text>
          <text x="360" y="228">DC PROTECTION</text><text x="360" y="258">DC DB / Isolator</text>
          <text x="622" y="225">HYBRID INVERTER</text><text x="622" y="258">Power Conversion</text>
          <text x="870" y="228">AC PROTECTION</text><text x="870" y="258">AC DB / Breaker</text>
          <text x="622" y="413">BATTERY SYSTEM</text><text x="622" y="440">BMS / DC MCCB</text>
          <text x="870" y="413">CUSTOMER LOAD</text><text x="870" y="440">Site Distribution</text>
        </g>
        <g fill="none" stroke="#047857" strokeWidth="5" markerEnd="url(#quote-arrow)">
          <path d="M215 238 H278" />
          <path d="M435 238 H528" />
          <path d="M710 238 H778" />
          <path d="M622 310 V367" />
          <path d="M870 290 V367" />
        </g>
        <g fill="#64748b" fontSize="15" fontWeight="600" textAnchor="middle">
          <text x="245" y="220">DC</text><text x="482" y="220">DC</text><text x="745" y="220">AC</text><text x="654" y="344">DC BATTERY LINK</text><text x="915" y="344">AC OUTPUT</text>
        </g>
        <text x="500" y="495" textAnchor="middle" fill="#64748b" fontSize="14">Illustrative system layout. Final design depends on site conditions and approved equipment.</text>
      </svg>
    </div>
  );
}

export default function QuotationPage() {
  const [quoteDefaults] = useState(createQuoteDefaults);
  const [categories, setCategories] = useState<WebsiteCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>(PRODUCT_GROUPS[0].value);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState("Solar Hybrid System Installation");
  const [projectSupervisor, setProjectSupervisor] = useState("");
  const [quoteDate, setQuoteDate] = useState(quoteDefaults.date);
  const [quotationNo, setQuotationNo] = useState(quoteDefaults.number);
  const [validDays, setValidDays] = useState("7");
  const [discount, setDiscount] = useState("0");
  const [bankInformation, setBankInformation] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("တပ်ဆင်ရန် အတည်ပြုပြီးပါက စရံငွေ 30% ပေးချေရမည်ဖြစ်ပြီး Site အပ်နှံပြီးချိန်တွင် ကျန်ငွေအားလုံး ပေးချေရပါမည်။");
  const [priceNote, setPriceNote] = useState("ဈေးနှုန်းများသည် ဈေးကွက်အပြောင်းအလဲအရ ပြောင်းလဲနိုင်ပါသည်။");

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

  const catalogProducts = useMemo<QuotationProduct[]>(() => {
    return categories.flatMap((category) => {
      const group = PRODUCT_GROUPS.find((option) =>
        (option.slugs as readonly string[]).includes(category.slug),
      );
      if (!group || category.isPublished === false) return [];
      return (category.products || [])
        .filter((product) => product.isPublished !== false)
        .map((product) => ({ ...product, categoryTitle: category.title, categoryGroup: group.value }));
    });
  }, [categories]);

  const productsInGroup = catalogProducts.filter((product) => product.categoryGroup === selectedGroup);
  const selectedProduct = productsInGroup.find((product) => product.id === selectedProductId);
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

  function addCatalogProduct() {
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
        title: selectedProduct.title,
        model: selectedProduct.slug,
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

  function updateItem(id: string, changes: Partial<QuoteItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
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
            <button type="button" onClick={() => window.print()} disabled={items.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><Printer size={18} /> Print / Save as PDF</button>
          </div>

          <section className="space-y-5 print:hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><FileText size={22} /></div><div><h2 className="font-bold text-slate-900">Quotation details</h2><p className="text-sm text-slate-500">Information on the first page and letterhead.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm font-semibold text-slate-700">Customer name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Customer name" /></label>
                <label className="text-sm font-semibold text-slate-700">Customer ID<input value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Optional" /></label>
                <label className="text-sm font-semibold text-slate-700">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Customer phone" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Address<input value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Project / customer address" /></label>
                <label className="text-sm font-semibold text-slate-700">Project title<input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700">Quotation no.<input value={quotationNo} onChange={(event) => setQuotationNo(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700">Date<input type="date" value={quoteDate} onChange={(event) => setQuoteDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700">Project supervisor<input value={projectSupervisor} onChange={(event) => setProjectSupervisor(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Supervisor name" /></label>
                <label className="text-sm font-semibold text-slate-700">Price validity (days)<input type="number" min="1" value={validDays} onChange={(event) => setValidDays(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5"><h2 className="font-bold text-slate-900">Select products</h2><p className="text-sm text-slate-500">Products are loaded from the published SuntreeMyanmar website catalog. Photos and specification sheets are attached to the following pages automatically.</p></div>
              {catalogError && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load website products: {catalogError}</p>}
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                <label className="text-sm font-semibold text-slate-700">Product group<select value={selectedGroup} onChange={(event) => { setSelectedGroup(event.target.value); setSelectedProductId(""); }} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal">{PRODUCT_GROUPS.map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}</select></label>
                <label className="text-sm font-semibold text-slate-700">Website product<select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} disabled={catalogLoading || productsInGroup.length === 0} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal disabled:bg-slate-100">{catalogLoading ? <option>Loading products...</option> : productsInGroup.length === 0 ? <option value="">No published products in this group</option> : <><option value="">Choose a product</option>{productsInGroup.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}</>}</select></label>
                <button type="button" onClick={addCatalogProduct} disabled={!selectedProduct} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={17} /> Add</button>
              </div>
              <button type="button" onClick={addCustomItem} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus size={16} /> Add custom material / service</button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-900">Quotation items <span className="ml-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">{items.length}</span></h2></div>
              {items.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Choose products above to begin the quotation.</div> : <div className="divide-y divide-slate-200">{items.map((item, index) => (
                <div key={item.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_120px_120px_160px_auto] lg:items-end">
                  <div className="flex min-w-0 gap-3">
                    {item.mainImage ? <Image src={item.mainImage} alt="" width={64} height={64} unoptimized className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1" /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">Item</div>}
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-700">{item.categoryTitle} · {String(index + 1).padStart(2, "0")}</p>
                      <input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" placeholder="Product / service name" />
                      <input value={item.model} onChange={(event) => updateItem(item.id, { model: event.target.value })} className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs" placeholder="Model / specification" />
                      <input value={item.warrantyTerm} onChange={(event) => updateItem(item.id, { warrantyTerm: event.target.value })} className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs" placeholder="Warranty term for this model (optional)" />
                    </div>
                  </div>
                  <label className="text-xs font-semibold text-slate-600">Quantity<input type="number" min="0" step="any" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
                  <label className="text-xs font-semibold text-slate-600">Unit<input value={item.unit} onChange={(event) => updateItem(item.id, { unit: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
                  <label className="text-xs font-semibold text-slate-600">Unit price (MMK)<input type="number" min="0" value={item.unitPrice} onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /><span className="mt-1 block text-right text-xs font-bold text-slate-800">{formatMMK(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</span></label>
                  <button type="button" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))} aria-label={`Remove ${item.title || "quotation item"}`} className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
              ))}</div>}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="mb-4 font-bold text-slate-900">Payment and quotation notes</h2><label className="mb-4 block text-sm font-semibold text-slate-700">Payment terms<textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm font-normal" /></label><label className="mb-4 block text-sm font-semibold text-slate-700">Bank information (optional)<textarea value={bankInformation} onChange={(event) => setBankInformation(event.target.value)} rows={2} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm font-normal" placeholder="Enter the payment details to show on this quotation" /></label><label className="block text-sm font-semibold text-slate-700">Price note<textarea value={priceNote} onChange={(event) => setPriceNote(event.target.value)} rows={2} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm font-normal" /></label></div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm sm:p-7"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-slate-900">Quotation total</h2><span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">A4 proposal</span></div><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-600">Net total</span><strong>{formatMMK(netTotal)}</strong></div><label className="flex items-center justify-between gap-4"><span className="text-slate-600">Discount (MMK)</span><input type="number" min="0" value={discount} onChange={(event) => setDiscount(event.target.value)} className="h-9 w-36 rounded-lg border border-emerald-200 bg-white px-3 text-right" /></label><div className="flex justify-between border-t border-emerald-200 pt-3 text-base"><strong>Total amount</strong><strong className="text-emerald-800">{formatMMK(totalAmount)}</strong></div><div className="flex justify-between"><span className="text-slate-600">30% deposit</span><strong>{formatMMK(depositAmount)}</strong></div><div className="flex justify-between"><span className="text-slate-600">Balance after handover</span><strong>{formatMMK(balanceAmount)}</strong></div></div><p className="mt-4 text-xs leading-5 text-slate-500">Deposit percentage follows the current quotation reference and is calculated automatically.</p></div>
            </div>

          </section>
        </div>

        <div className="hidden print:block">
          {quoteItemPages.map((pageItems, pageIndex) => {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === quoteItemPages.length - 1;
            return <article key={`quote-page-${pageIndex}`} className="quote-print-page quote-page-break">
              <Letterhead />
              {isFirstPage ? <>
                <div className="mt-5 flex items-start justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Solar Energy Proposal</p><h1 className="mt-1 text-3xl font-black text-slate-900">Quotation</h1><p className="mt-2 text-lg font-semibold text-slate-800">{projectTitle || "Solar Hybrid System Installation"}</p></div><div className="rounded-xl bg-slate-50 p-4 text-right text-sm"><p><span className="text-slate-500">Quotation No.</span> <strong>{quotationNo}</strong></p><p className="mt-1"><span className="text-slate-500">Date</span> <strong>{dateLabel}</strong></p><p className="mt-1"><span className="text-slate-500">Valid</span> <strong>{validDays} days</strong></p></div></div>
                <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 rounded-xl border border-slate-200 p-4 text-sm"><p><span className="text-slate-500">Customer</span><br /><strong>{customerName || "—"}</strong></p><p><span className="text-slate-500">Customer ID</span><br /><strong>{customerId || "—"}</strong></p><p><span className="text-slate-500">Phone</span><br /><strong>{phone || "—"}</strong></p><p><span className="text-slate-500">Project supervisor</span><br /><strong>{projectSupervisor || "—"}</strong></p><p className="col-span-2"><span className="text-slate-500">Address / project site</span><br /><strong>{address || "—"}</strong></p></div>
              </> : <div className="mt-6 flex items-center justify-between border-b border-slate-200 pb-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Quotation continuation</p><h2 className="mt-1 text-xl font-black text-slate-900">{projectTitle || "Solar Hybrid System Installation"}</h2><p className="mt-1 text-xs text-slate-500">Customer: {customerName || "—"} · Quotation No.: {quotationNo}</p></div><p className="text-sm font-bold text-slate-500">Page {pageIndex + 1}</p></div>}
              <table className="quote-items mt-5 w-full border-collapse text-left text-[11px]"><thead className="[display:table-header-group]"><tr className="bg-slate-900 text-white"><th className="px-2 py-2">No.</th><th className="px-2 py-2">Item / model</th><th className="px-2 py-2 text-right">Qty</th><th className="px-2 py-2">Unit</th><th className="px-2 py-2 text-right">Unit price</th><th className="px-2 py-2 text-right">Amount (MMK)</th></tr></thead><tbody>{pageItems.map((item, pageItemIndex) => { const index = pageIndex * 10 + pageItemIndex; return <tr key={item.id} className="quote-no-break border-b border-slate-200"><td className="px-2 py-2">{index + 1}</td><td className="px-2 py-2"><strong>{item.title || "Item"}</strong>{item.model && <span className="block text-slate-500">{item.model}</span>}{item.warrantyTerm && <span className="block text-emerald-700">Warranty: {item.warrantyTerm}</span>}</td><td className="px-2 py-2 text-right">{Number(item.quantity || 0).toLocaleString()}</td><td className="px-2 py-2">{item.unit}</td><td className="px-2 py-2 text-right">{Number(item.unitPrice || 0).toLocaleString()}</td><td className="px-2 py-2 text-right font-semibold">{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString()}</td></tr>; })}</tbody></table>
              {isLastPage && <>
                <div className="ml-auto mt-4 w-72 space-y-1.5 text-sm"><div className="flex justify-between"><span>Net Total</span><strong>{formatMMK(netTotal)}</strong></div><div className="flex justify-between"><span>Discount</span><strong>− {formatMMK(discountAmount)}</strong></div><div className="flex justify-between border-t border-slate-300 pt-2 text-base"><strong>Total Amount</strong><strong className="text-emerald-800">{formatMMK(totalAmount)}</strong></div><div className="flex justify-between"><span>30% Deposit</span><strong>{formatMMK(depositAmount)}</strong></div><div className="flex justify-between"><span>Balance</span><strong>{formatMMK(balanceAmount)}</strong></div></div>
                {paymentTerms && <div className="quote-no-break mt-5 rounded-xl bg-emerald-50 p-4 text-xs leading-5"><strong>Payment terms</strong><p className="mt-1">{paymentTerms}</p></div>}{bankInformation && <div className="quote-no-break mt-3 rounded-xl border border-slate-200 p-4 text-xs leading-5"><strong>Bank information</strong><p className="mt-1 whitespace-pre-line">{bankInformation}</p></div>}<p className="mt-4 text-xs italic text-slate-500">{priceNote}</p>
                <div className="mt-10 grid grid-cols-2 gap-16 text-center text-xs"><div className="border-t border-slate-400 pt-2">Prepared by</div><div className="border-t border-slate-400 pt-2">Customer acceptance</div></div>
              </>}
            </article>;
          })}

          <article className="quote-print-page quote-page-break">
            <Letterhead small />
            <div className="mt-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">System Overview</p><h2 className="mt-2 text-3xl font-black text-slate-900">One-Line Diagram</h2><p className="mt-2 text-sm text-slate-500">{projectTitle || "Solar Hybrid System Installation"}</p></div>
            <div className="mt-8"><OneLineDiagram systemTitle={projectTitle} /></div>
            <div className="quote-no-break mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6"><strong className="text-emerald-900">Designed for your project</strong><p className="mt-1 text-slate-700">The selected inverter, battery, solar and circuit protection products are shown in the following specification pages. Final system design is confirmed against site conditions and approved equipment.</p></div>
          </article>

          {items.filter((item) => item.productId).map((item) => (
            <article key={item.id} className="quote-print-page quote-page-break">
              <Letterhead small />
              <div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Product Specification</p><h2 className="mt-2 text-2xl font-black text-slate-900">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.categoryTitle}{item.model ? ` · ${item.model}` : ""}</p>{item.warrantyTerm && <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Warranty: {item.warrantyTerm}</p>}</div>
              {item.description && <p className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-700">{item.description}</p>}
              {item.mainImage && <div className="mt-6 grid min-h-40 place-items-center rounded-2xl border border-slate-200 bg-white p-5"><Image src={item.mainImage} alt={item.title} width={800} height={600} unoptimized className="max-h-[55mm] max-w-full object-contain" /></div>}
              {item.specificationImage && <div className="mt-5 grid min-h-48 place-items-center rounded-2xl border border-slate-200 bg-white p-4"><Image src={item.specificationImage} alt={`${item.title} specification`} width={1200} height={1600} unoptimized className="max-h-[105mm] max-w-full object-contain" /></div>}
              {!item.mainImage && !item.specificationImage && <div className="mt-8 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">Technical specification sheet is not available for this product in the website catalog.</div>}
              <p className="mt-5 text-xs text-slate-500">Specifications and product images are provided from the published SuntreeMyanmar website catalog. Product model warranty terms are shown as entered in the quotation.</p>
            </article>
          ))}

          <article className="quote-print-page">
            <Letterhead small />
            <div className="mt-7"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Customer Care</p><h2 className="mt-2 text-3xl font-black text-slate-900">Warranty & After-Sales Service</h2><p className="mt-2 text-sm leading-6 text-slate-600">ယုံကြည်စိတ်ချစွာ အသုံးပြုနိုင်ရန် စနစ်တကျ အာမခံဝန်ဆောင်မှုနှင့် နည်းပညာအကူအညီများ ပေးအပ်ပါသည်။ အောက်ပါအချက်များသည် ရွေးချယ်ထားသော ပစ္စည်း Model နှင့် ထုတ်လုပ်သူ၏ အာမခံမူဝါဒအလိုက် အကျုံးဝင်ပါသည်။</p></div>
            <div className="mt-6 space-y-4">{DEFAULT_WARRANTY_PARAGRAPHS.map((paragraph, index) => <section key={index} className="quote-no-break rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-700 text-sm font-black text-white">0{index + 1}</span><h3 className="text-base font-black text-slate-900">{["Inverter နှင့် Circuit Protection", "Lithium Battery အာမခံ", "Installation နှင့် After-Sales Service"][index]}</h3></div><p className="whitespace-pre-line text-[12px] leading-7 text-slate-700">{paragraph}</p></section>)}</div>
            <div className="quote-no-break mt-6 rounded-2xl bg-slate-50 p-5"><h3 className="font-bold text-slate-900">အာမခံဝန်ဆောင်မှု ရယူရန်</h3><p className="mt-2 text-sm leading-6 text-slate-700">Warranty claim တင်ရာတွင် ဝယ်ယူကြောင်းအထောက်အထား၊ Product Serial Number နှင့် Warranty Registration အချက်အလက်များကို ပြသပေးပါ။ စစ်ဆေးအတည်ပြုပြီးနောက် သက်ဆိုင်ရာ Warranty Policy အတိုင်း ဝန်ဆောင်မှုပေးပါမည်။</p></div>
            <div className="mt-10 grid grid-cols-2 gap-16 text-center text-xs"><div className="border-t border-slate-400 pt-2">MTK Solar Energy Group</div><div className="border-t border-slate-400 pt-2">Customer acceptance</div></div>
          </article>
        </div>
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
      `}</style>
    </DashboardShell>
  );
}
