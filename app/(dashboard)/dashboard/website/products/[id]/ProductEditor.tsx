"use client";

import { useState } from "react";
import {
  getWebsiteCmsImageUrl,
  updateWebsiteProduct,
  uploadWebsiteImage,
} from "@/lib/website-cms-api";

type ProductEditorProps = {
  product: {
    id: string;
    title: string;
    mainImage?: string | null;
    specificationImage?: string | null;
    images?: {
      id: string;
      imageUrl: string;
      altText?: string | null;
      sortOrder: number;
    }[];
    isPublished: boolean;
  };
  isGallery: boolean;
};

export default function ProductEditor({
  product,
  isGallery,
}: ProductEditorProps) {
  const [open, setOpen] = useState(false);

  const [productName, setProductName] =
    useState(product.title);

  const [mainImage, setMainImage] =
    useState<File | null>(null);

  const [mainPreview, setMainPreview] =
  useState<string | null>(
    getWebsiteCmsImageUrl(product.mainImage),
  );

  const [specificationImage, setSpecificationImage] =
    useState<File | null>(null);

  const [specificationPreview, setSpecificationPreview] =
    useState<string | null>(
      product.specificationImage ?? null,
    );

  const [detailImages, setDetailImages] =
    useState<(File | null)[]>([
      null,
      null,
      null,
      null,
    ]);

    const [saving, setSaving] = useState(false);
    const [isPublished, setIsPublished] =
  useState(product.isPublished);

  const [detailPreviews, setDetailPreviews] =
  useState<(string | null)[]>([
    getWebsiteCmsImageUrl(product.images?.[0]?.imageUrl),
    getWebsiteCmsImageUrl(product.images?.[1]?.imageUrl),
    getWebsiteCmsImageUrl(product.images?.[2]?.imageUrl),
    getWebsiteCmsImageUrl(product.images?.[3]?.imageUrl),
  ]);

  function handleMainImage(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setMainImage(file);
    setMainPreview(
      URL.createObjectURL(file),
    );
  }

  function handleSpecificationImage(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSpecificationImage(file);

    setSpecificationPreview(
      URL.createObjectURL(file),
    );
  }

  function handleDetailImage(
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const newImages = [
      ...detailImages,
    ];

    newImages[index] = file;

    setDetailImages(newImages);

    const newPreviews = [
      ...detailPreviews,
    ];

    newPreviews[index] =
      URL.createObjectURL(file);

    setDetailPreviews(
      newPreviews,
    );
  }

  async function handleSave() {
  if (!productName.trim()) {
    alert("Please enter Product Name.");
    return;
  }

  try {
    setSaving(true);

    // 1. Main Product Image
    let mainImagePath = product.mainImage ?? undefined;

    if (mainImage) {
      const result = await uploadWebsiteImage(mainImage);
      mainImagePath = result.path;
    }

    // 2. Specification Image
    let specificationPath =
      product.specificationImage ?? undefined;

    if (!isGallery && specificationImage) {
      const result =
        await uploadWebsiteImage(
          specificationImage,
        );

      specificationPath = result.path;
    }

    // 3. Gallery / Detail Images
    let images:
      {
        imageUrl: string;
        sortOrder: number;
      }[] | undefined;

    if (isGallery) {
      images = [];

      for (let index = 0; index < 4; index++) {
        const file = detailImages[index];

        if (file) {
          const result =
            await uploadWebsiteImage(file);

          images.push({
            imageUrl: result.path,
            sortOrder: index + 1,
          });
        } else {
          const existingImage =
            product.images?.[index]?.imageUrl;

          if (existingImage) {
            images.push({
              imageUrl: existingImage,
              sortOrder: index + 1,
            });
          }
        }
      }
    }

    // 4. Update Product
    await updateWebsiteProduct(
      product.id,
      {
        title: productName.trim(),
        mainImage: mainImagePath,
        specificationImage:
          specificationPath,
       isPublished,
        ...(isGallery
          ? { images }
          : {}),
      },
    );

    alert(
      "Product updated successfully.",
    );

    setOpen(false);

    window.location.reload();
  } catch (error) {
    console.error(error);

    alert(
      "Product update failed. Please try again.",
    );
  } finally {
    setSaving(false);
  }
}

  return (
    <>
      {/* Edit Button */}
      <button
        type="button"
        onClick={() => {
          setIsPublished(product.isPublished);
          setProductName(product.title);

          setMainImage(null);
          setSpecificationImage(null);

          setMainPreview(
  getWebsiteCmsImageUrl(product.mainImage),
);

          setSpecificationPreview(
            product.specificationImage ??
              null,
          );

          setDetailImages([
            null,
            null,
            null,
            null,
          ]);

          setDetailPreviews([
  getWebsiteCmsImageUrl(product.images?.[0]?.imageUrl),
  getWebsiteCmsImageUrl(product.images?.[1]?.imageUrl),
  getWebsiteCmsImageUrl(product.images?.[2]?.imageUrl),
  getWebsiteCmsImageUrl(product.images?.[3]?.imageUrl),
]);

          setOpen(true);
        }}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {isGallery
          ? "Edit Product"
          : "Edit Images"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                  Website CMS
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Edit Product
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Close
              </button>

            </div>

            {/* Content */}
            <div className="max-h-[75vh] overflow-y-auto p-5">

              {/* Product Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Product Name
                </label>

                <input
                  type="text"
                  value={productName}
                  onChange={(event) =>
                    setProductName(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Main Product Image */}
              <div className="mt-6">

                <p className="mb-2 text-sm font-medium text-slate-700">
                  Main Product Image
                </p>

                <label className="block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100">

                  <div className="flex h-64 items-center justify-center p-4">

                    {mainPreview ? (
                      <img
                        src={mainPreview}
                        alt="Main Product"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-600">
                          Choose Product Image
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Click to select a new image
                        </p>
                      </div>
                    )}

                  </div>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={
                      handleMainImage
                    }
                  />

                </label>

                <p className="mt-2 text-xs text-slate-400">
                  Click the image to replace it.
                </p>

              </div>

              {/* Detail Images */}
              {isGallery && (
                <div className="mt-6">

                  <p className="mb-3 text-sm font-medium text-slate-700">
                    Detail Images
                  </p>

                  <div className="grid grid-cols-2 gap-4">

                    {[0, 1, 2, 3].map(
                      (index) => (
                        <div
                          key={index}
                        >

                          <p className="mb-2 text-xs font-medium text-slate-600">
                            Detail Image{" "}
                            {index + 1}
                          </p>

                          <label className="block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100">

                            <div className="flex h-48 items-center justify-center p-3">

                              {detailPreviews[
                                index
                              ] ? (
                                <img
                                  src={
                                    detailPreviews[
                                      index
                                    ]!
                                  }
                                  alt={`Detail ${
                                    index +
                                    1
                                  }`}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <div className="text-center">
                                  <p className="text-xs font-medium text-slate-500">
                                    Choose Image
                                  </p>
                                </div>
                              )}

                            </div>

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(
                                event,
                              ) =>
                                handleDetailImage(
                                  index,
                                  event,
                                )
                              }
                            />

                          </label>

                        </div>
                      ),
                    )}

                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Click any detail image to replace it.
                  </p>

                </div>
              )}

              {/* Specification Image */}
              {!isGallery && (
                <div className="mt-6">

                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Specification Image
                  </p>

                  <label className="block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100">

                    <div className="flex h-64 items-center justify-center p-4">

                      {specificationPreview ? (
                        <img
                          src={
                            specificationPreview
                          }
                          alt="Specification"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-600">
                            Choose Specification Image
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Click to select an image
                          </p>
                        </div>
                      )}

                    </div>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={
                        handleSpecificationImage
                      }
                    />

                  </label>

                  <p className="mt-2 text-xs text-slate-400">
                    Click the image to replace it.
                  </p>

                </div>
              )}

              {/* Status */}
              <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">

                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Publication Status
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Current product status
                  </p>
                </div>

                <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() =>
      setIsPublished((current) => !current)
    }
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
      isPublished
        ? "bg-emerald-600"
        : "bg-slate-300"
    }`}
    aria-label={
      isPublished ? "Published" : "Draft"
    }
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
        isPublished
          ? "translate-x-6"
          : "translate-x-1"
      }`}
    />
  </button>

  <span
    className={`text-xs font-medium ${
      isPublished
        ? "text-emerald-700"
        : "text-slate-500"
    }`}
  >
    {isPublished ? "Published" : "Draft"}
  </span>
</div>

              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
  type="button"
  onClick={handleSave}
  disabled={saving}
  className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white ${
    saving
      ? "cursor-not-allowed bg-slate-400"
      : "bg-slate-900 hover:bg-slate-800"
  }`}
>
  {saving ? "Saving..." : "Save Changes"}
</button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}
