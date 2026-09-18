"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createProduct,
  createProductOption,
  deleteProduct,
  getProducts,
  getWarrantyPolicies,
  getProductOptions,
  updateProduct,
  type CreateProductData,
  type Product,
  type ProductOption,
  type WarrantyPolicy,
} from "@/lib/api";

import PermissionGuard from "@/components/auth/PermissionGuard";

type FormState = {
  productCode: string;
  modelCode: string;
  name: string;
  category: string;
  poles: string;
  ratedCurrent: string;
  ratedVoltage: string;
  breakingCapacity: string;
  warrantyMonths: string;
  warrantyPolicyId: string;
};

const emptyForm: FormState = {
  productCode: "",
  modelCode: "",
  name: "",
  category: "",
  poles: "",
  ratedCurrent: "",
  ratedVoltage: "",
  breakingCapacity: "",
  warrantyMonths: "12",
  warrantyPolicyId: "",
};

function productToForm(product: Product): FormState {
  return {
    productCode: product.productCode,
    modelCode: product.modelCode,
    name: product.name,
    category: product.category,
    poles:
      product.poles !== null &&
      product.poles !== undefined
        ? String(product.poles)
        : "",
    ratedCurrent: product.ratedCurrent ?? "",
    ratedVoltage: product.ratedVoltage ?? "",
    breakingCapacity:
      product.breakingCapacity ?? "",
    warrantyMonths: String(
      product.warrantyMonths,
    ),
    warrantyPolicyId:
      product.warrantyPolicyId ?? "",
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<
    Product[]
  >([]);

  const [policies, setPolicies] = useState<
    WarrantyPolicy[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productCodeError, setProductCodeError] = useState("");

  const [productTypes, setProductTypes] =
    useState<ProductOption[]>([]);

  const [ratedCurrents, setRatedCurrents] =
    useState<ProductOption[]>([]);

  const [ratedVoltages, setRatedVoltages] =
    useState<ProductOption[]>([]);

  const [polesOptions, setPolesOptions] =
    useState<ProductOption[]>([]);

  const [breakingCapacities, setBreakingCapacities] =
    useState<ProductOption[]>([]);
  async function loadData() {
  try {
    setLoading(true);
    setError("");

    const [
      productsData,
      policiesData,
      productTypesData,
      ratedCurrentsData,
      ratedVoltagesData,
      polesOptionsData,
      breakingCapacitiesData,
    ] = await Promise.all([
      getProducts(),
      getWarrantyPolicies(),
      getProductOptions("PRODUCT_TYPE"),
      getProductOptions("RATED_CURRENT"),
      getProductOptions("RATED_VOLTAGE"),
      getProductOptions("POLES"),
      getProductOptions("BREAKING_CAPACITY"),
    ]);

    setProducts(productsData);

    setPolicies(
      policiesData.filter(
        (policy) => policy.isActive,
      ),
    );

    setProductTypes(
      productTypesData.filter(
        (option) => option.isActive,
      ),
    );

    setRatedCurrents(
      ratedCurrentsData.filter(
        (option) => option.isActive,
      ),
    );

    setRatedVoltages(
      ratedVoltagesData.filter(
        (option) => option.isActive,
      ),
    );

    setPolesOptions(
      polesOptionsData.filter(
        (option) => option.isActive,
      ),
    );

    setBreakingCapacities(
      breakingCapacitiesData.filter(
        (option) => option.isActive,
      ),
    );
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to load products.",
    );
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    loadData();
  }, []);

  function openCreateForm() {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setForm(productToForm(product));
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
  }

  function updateField(
  field: keyof FormState,
  value: string,
) {
  setForm((current) => ({
    ...current,
    [field]: value,
  }));
}

async function checkProductCode(
  value: string,
) {
  const code = value.trim();

  if (!code) {
    setProductCodeError("");
    return;
  }

  const duplicate = products.some(
    (product) =>
      product.productCode.trim().toLowerCase() ===
        code.toLowerCase() &&
      product.id !== editingProduct?.id,
  );

  if (duplicate) {
    setProductCodeError(
      `Product Code "${code}" already exists.`,
    );
  } else {
    setProductCodeError("");
  }
}

async function handleAddRatedCurrent() {
  const value = window.prompt("Enter new Rated Current");

  if (!value?.trim()) return;

  try {
    setError("");

    const newOption = await createProductOption({
      optionType: "RATED_CURRENT",
      optionValue: value.trim(),
    });

    setRatedCurrents((current) => [
      ...current,
      newOption,
    ]);

    updateField(
      "ratedCurrent",
      newOption.optionValue,
    );

    setSuccess("Rated Current added successfully.");
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to add Rated Current.",
    );
  }
}


async function handleAddBreakingCapacity() {
  const value = window.prompt(
    "Enter new Breaking Capacity",
  );

  if (!value?.trim()) {
    return;
  }

  try {
    setError("");

    const newOption =
      await createProductOption({
        optionType: "BREAKING_CAPACITY",
        optionValue: value.trim(),
      });

    setBreakingCapacities((current) => [
      ...current,
      newOption,
    ]);

    updateField(
      "breakingCapacity",
      newOption.optionValue,
    );

    setSuccess(
      "Breaking Capacity added successfully.",
    );
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to add Breaking Capacity.",
    );
  }
}

async function handleAddCategory() {
  const value = window.prompt(
    "Enter new Category",
  );

  if (!value?.trim()) {
    return;
  }

  try {
    setError("");

    const newOption =
      await createProductOption({
        optionType: "PRODUCT_TYPE",
        optionValue: value.trim(),
      });

    setProductTypes((current) => [
      ...current,
      newOption,
    ]);

    updateField(
      "category",
      newOption.optionValue,
    );

    setSuccess(
      "Category added successfully.",
    );
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to add Category.",
    );
  }
}

async function handleAddPoles() {
  const value = window.prompt(
    "Enter new Poles",
  );

  if (!value?.trim()) {
    return;
  }

  try {
    setError("");

    const newOption =
      await createProductOption({
        optionType: "POLES",
        optionValue: value.trim(),
      });

    setPolesOptions((current) => [
      ...current,
      newOption,
    ]);

    updateField(
      "poles",
      newOption.optionValue,
    );

    setSuccess(
      "Poles added successfully.",
    );
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to add Poles.",
    );
  }
}

async function handleAddRatedVoltage() {
  const value = window.prompt(
    "Enter new Rated Voltage",
  );

  if (!value?.trim()) {
    return;
  }

  try {
    setError("");

    const newOption =
      await createProductOption({
        optionType: "RATED_VOLTAGE",
        optionValue: value.trim(),
      });

    setRatedVoltages((current) => [
      ...current,
      newOption,
    ]);

    updateField(
      "ratedVoltage",
      newOption.optionValue,
    );

    setSuccess(
      "Rated Voltage added successfully.",
    );
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to add Rated Voltage.",
    );
  }
}

async function handleSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  setError("");
  setSuccess("");

  if (!form.productCode.trim()) {
    setError("Product code is required.");
    return;
  }

  if (!form.modelCode.trim()) {
    setError("Model code is required.");
    return;
  }

  if (!form.name.trim()) {
    setError("Product name is required.");
    return;
  }

  if (!form.category.trim()) {
    setError("Category is required.");
    return;
  }

  const warrantyMonths =
    Number(form.warrantyMonths);

  if (
    !Number.isFinite(warrantyMonths) ||
    warrantyMonths <= 0
  ) {
    setError(
      "Warranty period must be greater than 0.",
    );
    return;
  }

  const data: CreateProductData = {
    productCode:
      form.productCode.trim(),

    modelCode:
      form.modelCode.trim(),

    name:
      form.name.trim(),

    category:
      form.category.trim(),

    poles: form.poles
      ? Number(form.poles)
      : undefined,

    ratedCurrent:
      form.ratedCurrent.trim() ||
      undefined,

    ratedVoltage:
      form.ratedVoltage.trim() ||
      undefined,

    breakingCapacity:
      form.breakingCapacity.trim() ||
      undefined,

    warrantyMonths,

    warrantyPolicyId:
      form.warrantyPolicyId || null,
  };

  try {
    setSaving(true);

    if (editingProduct) {
      await updateProduct(
        editingProduct.id,
        data,
      );

      setSuccess(
        "Product updated successfully.",
      );
    } else {
      await createProduct(data);

      setSuccess(
        "Product created successfully.",
      );
    }

    await loadData();

    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyForm);
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to save product.",
    );
  } finally {
    setSaving(false);
  }
}

async function handleToggleProductStatus(
  product: Product,
) {
  try {
    setError("");
    setSuccess("");

    await updateProduct(product.id, {
      isActive: !product.isActive,
    });

    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === product.id
          ? {
              ...item,
              isActive: !item.isActive,
            }
          : item,
      ),
    );

    setSuccess(
      `Product ${
        product.isActive
          ? "deactivated"
          : "activated"
      } successfully.`,
    );
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to update product status.",
    );
  }
}

  async function handleDelete(
    product: Product,
  ) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteProduct(product.id);

      setProducts((current) =>
        current.filter(
          (item) =>
            item.id !== product.id,
        ),
      );

      setSuccess(
        "Product deleted successfully.",
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete product.",
      );
    }
  }

   return (
    <PermissionGuard permission="PRODUCTS_VIEW">
      <main className="min-h-screen bg-slate-100 p-6 md:p-8">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <button
            type="button"
            onClick={() =>
              window.history.back()
            }
            className="mb-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            Products
          </h1>

          <p className="mt-1 text-slate-500">
            Manage products and assign internal
            warranty policies.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          + Add Product
        </button>
      </div>

      {/* Messages */}
      {error && !showForm && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-700">
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingProduct
                  ? "Edit Product"
                  : "Add Product"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingProduct
                  ? "Update product information and warranty assignment."
                  : "Create a product and assign its warranty policy."}
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="text-2xl text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="p-6"
          >
            <div className="grid gap-6 md:grid-cols-2">

{/* Product Code */}
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Product Code
  </label>

  <input
    value={form.productCode}
    onChange={(event) => {
      const value = event.target.value;

      updateField("productCode", value);
      checkProductCode(value);
    }}
    placeholder="Example: STB-001"
    className={`h-12 w-full rounded-xl border px-4 outline-none focus:ring-2 ${
      productCodeError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-100"
    }`}
  />

  {productCodeError && (
    <p className="mt-2 text-sm font-medium text-red-600">
      ⚠ {productCodeError}
    </p>
  )}
</div>

              {/* Model Code */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Model Code
                </label>

                <input
                  value={form.modelCode}
                  onChange={(event) =>
                    updateField(
                      "modelCode",
                      event.target.value,
                    )
                  }
                  placeholder="Example: STB-M100"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Product Name
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="Example: Solar DC Circuit Breaker"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

{/* Category */}
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Category
  </label>

  <div className="flex gap-2">
    <select
      value={form.category}
      onChange={(event) =>
        updateField(
          "category",
          event.target.value,
        )
      }
      className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    >
      <option value="">
        Select Category
      </option>

      {productTypes.map((option) => (
        <option
          key={option.id}
          value={option.optionValue}
        >
          {option.optionValue}
        </option>
      ))}
    </select>

    <button
      type="button"
      onClick={handleAddCategory}
      className="h-12 shrink-0 rounded-xl bg-emerald-600 px-4 font-bold text-white transition hover:bg-emerald-700"
    >
      + Add
    </button>
  </div>
</div>

{/* Poles */}
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Poles
  </label>

  <div className="flex gap-2">
    <select
      value={form.poles}
      onChange={(event) =>
        updateField(
          "poles",
          event.target.value,
        )
      }
      className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    >
      <option value="">
        Select Poles
      </option>

      {polesOptions.map((option) => (
        <option
          key={option.id}
          value={option.optionValue}
        >
          {option.optionValue}
        </option>
      ))}
    </select>

    <button
      type="button"
      onClick={handleAddPoles}
      className="h-12 shrink-0 rounded-xl bg-emerald-600 px-4 font-bold text-white transition hover:bg-emerald-700"
    >
      + Add
    </button>
  </div>
</div>

{/* Rated Current */}
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Rated Current
  </label>

  <div className="flex gap-2">
    <select
      value={form.ratedCurrent}
      onChange={(event) =>
        updateField(
          "ratedCurrent",
          event.target.value,
        )
      }
      className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    >
      <option value="">
        Select Rated Current
      </option>

      {ratedCurrents.map((option) => (
        <option
          key={option.id}
          value={option.optionValue}
        >
          {option.optionValue}
        </option>
      ))}
    </select>

    <button
      type="button"
      onClick={handleAddRatedCurrent}
      className="h-12 shrink-0 rounded-xl bg-emerald-600 px-4 font-bold text-white transition hover:bg-emerald-700"
    >
      + Add
    </button>
  </div>
</div>

{/* Rated Voltage */}
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Rated Voltage
  </label>

  <div className="flex gap-2">
    <select
      value={form.ratedVoltage}
      onChange={(event) =>
        updateField(
          "ratedVoltage",
          event.target.value,
        )
      }
      className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    >
      <option value="">
        Select Rated Voltage
      </option>

      {ratedVoltages.map((option) => (
        <option
          key={option.id}
          value={option.optionValue}
        >
          {option.optionValue}
        </option>
      ))}
    </select>

    <button
      type="button"
      onClick={handleAddRatedVoltage}
      className="h-12 shrink-0 rounded-xl bg-emerald-600 px-4 font-bold text-white transition hover:bg-emerald-700"
    >
      + Add
    </button>
  </div>
</div>

{/* Breaking Capacity */}
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Breaking Capacity
  </label>

  <div className="flex gap-2">
    <select
      value={form.breakingCapacity}
      onChange={(event) =>
        updateField(
          "breakingCapacity",
          event.target.value,
        )
      }
      className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    >
      <option value="">
        Select Breaking Capacity
      </option>

      {breakingCapacities.map((option) => (
        <option
          key={option.id}
          value={option.optionValue}
        >
          {option.optionValue}
        </option>
      ))}
    </select>

    <button
      type="button"
      onClick={handleAddBreakingCapacity}
      className="h-12 shrink-0 rounded-xl bg-emerald-600 px-4 font-bold text-white transition hover:bg-emerald-700"
    >
      + Add
    </button>
  </div>
</div>

{/* Warranty Policy */}
<div>
  <label className="mb-2 block text-sm font-semibold text-slate-700">
    Warranty Policy
  </label>

  <select
    value={form.warrantyPolicyId}
    onChange={(event) => {
      const policyId = event.target.value;

      updateField(
        "warrantyPolicyId",
        policyId,
      );

      const selectedPolicy = policies.find(
        (policy) => policy.id === policyId,
      );

      if (selectedPolicy) {
        updateField(
          "warrantyMonths",
          String(
            selectedPolicy.warrantyMonths,
          ),
        );
      }
    }}
    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
  >
    <option value="">
      No Policy Assigned
    </option>

    {policies.map((policy) => (
      <option
        key={policy.id}
        value={policy.id}
      >
        {policy.code} — {policy.name}
      </option>
    ))}
  </select>

  <p className="mt-2 text-xs text-slate-500">
    Internal policy assignment.
    Customers and dealers will not see
    these internal rules.
  </p>
</div>

</div>

{/* Selected Policy Preview */}
{form.warrantyPolicyId && (
  <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
    {(() => {
      const selectedPolicy =
        policies.find(
          (policy) =>
            policy.id ===
            form.warrantyPolicyId,
        );

      if (!selectedPolicy) {
        return null;
      }

      return (
        <>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Selected Warranty Policy
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-emerald-700">
              {selectedPolicy.code}
            </span>

            <span className="font-bold text-slate-900">
              {selectedPolicy.name}
            </span>
          </div>
        </>
      );
    })()}
  </div>
)}

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {saving
                  ? "Saving..."
                  : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
              </button>

            </div>
          </form>
        </section>
      )}

      {/* Product List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Product List
            </h2>

            <p className="text-sm text-slate-500">
              {products.length} product
              {products.length !== 1
                ? "s"
                : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-slate-700">
              No products found.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add your first product to get
              started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-6 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {product.productCode}
                      </span>

                      <button
  type="button"
  onClick={() =>
    handleToggleProductStatus(product)
  }
  className={`rounded-full px-3 py-1 text-xs font-bold transition hover:opacity-80 ${
    product.isActive
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-200 text-slate-600"
  }`}
>
  {product.isActive
    ? "ACTIVE"
    : "INACTIVE"}
</button>
                    </div>

                    <h3 className="mt-3 text-lg font-bold text-slate-900">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {product.modelCode} ·{" "}
                      {product.category}
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-[minmax(320px,1fr)_220px_320px_220px_170px] lg:items-center lg:gap-4">

  {/* Product Info */}
  <div className="min-w-0">
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
        {product.productCode}
      </span>

      <button
        type="button"
        onClick={() =>
          handleToggleProductStatus(product)
        }
        className={`rounded-full px-3 py-1 text-xs font-bold transition hover:opacity-80 ${
          product.isActive
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-600"
        }`}
      >
        {product.isActive
          ? "ACTIVE"
          : "INACTIVE"}
      </button>
    </div>

    <h3 className="mt-3 text-lg font-bold text-slate-900">
      {product.name}
    </h3>

    <p className="mt-1 text-sm text-slate-500">
      {product.modelCode} ·{" "}
      {product.category}
    </p>
  </div>

  {/* Warranty */}
  <div className="rounded-xl bg-slate-50 p-4 lg:h-full">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      Warranty
    </p>

    <p className="mt-1 font-bold text-slate-900">
      {product.warrantyMonths} Months
    </p>
  </div>

  {/* Policy */}
  <div className="rounded-xl bg-slate-50 p-4 lg:h-full">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      Policy
    </p>

    <p className="mt-1 truncate font-bold text-slate-900">
      {product.warrantyPolicy
        ? `${product.warrantyPolicy.code} — ${product.warrantyPolicy.name}`
        : "Not Assigned"}
    </p>
  </div>

  {/* Rating */}
  <div className="rounded-xl bg-slate-50 p-4 lg:h-full">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      Rating
    </p>

    <p className="mt-1 font-bold text-slate-900">
      {product.ratedCurrent || "—"} /{" "}
      {product.ratedVoltage || "—"}
    </p>
  </div>

  {/* Actions */}
  <div className="flex shrink-0 gap-2 lg:justify-end">
    <button
      type="button"
      onClick={() =>
        openEditForm(product)
      }
      className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      Edit
    </button>

    <button
      type="button"
      onClick={() =>
        handleDelete(product)
      }
      className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600 transition hover:bg-red-50"
    >
      Delete
    </button>
  </div>

</div>

                 
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
          </main>
    </PermissionGuard>
  );
}