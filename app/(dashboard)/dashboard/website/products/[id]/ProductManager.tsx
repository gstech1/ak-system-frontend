"use client";

import { useState } from "react";
import {
  createWebsiteProduct,
  uploadWebsiteImage,
} from "@/lib/website-cms-api";

type ProductManagerProps = {
  categoryId: string;
  categorySlug: string;
};

function isGalleryCategory(categorySlug: string) {
  const galleryCategories = [
    "ev-charger",
    "dc-circuit-breaker",
    "ac-circuit-breaker",
    "dc-spd",
    "dc-isolator",
    "ats",
    "ac-voltage-protector",
  ];

  return galleryCategories.includes(categorySlug);
}

export default function ProductManager({
  categoryId,
  categorySlug,
}: ProductManagerProps) {
  const isGallery = isGalleryCategory(categorySlug);

  const [productName, setProductName] = useState("");

  const [productImage, setProductImage] =
    useState<File | null>(null);

  const [specificationImage, setSpecificationImage] =
    useState<File | null>(null);

  const [detailImages, setDetailImages] =
    useState<(File | null)[]>([
      null,
      null,
      null,
      null,
    ]);

  const [productPreview, setProductPreview] =
    useState<string | null>(null);

  const [specificationPreview, setSpecificationPreview] =
    useState<string | null>(null);

  const [detailPreviews, setDetailPreviews] =
    useState<(string | null)[]>([
      null,
      null,
      null,
      null,
    ]);

  const [uploading, setUploading] = useState(false);

  function handleProductImage(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setProductImage(file);
    setProductPreview(URL.createObjectURL(file));
  }

  function handleSpecificationImage(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSpecificationImage(file);
    setSpecificationPreview(URL.createObjectURL(file));
  }

  function handleDetailImage(
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const newImages = [...detailImages];

    newImages[index] = file;

    setDetailImages(newImages);

    const newPreviews = [...detailPreviews];

    newPreviews[index] =
      URL.createObjectURL(file);

    setDetailPreviews(newPreviews);
  }

  async function handleSave() {
    if (isGallery && !productName.trim()) {
      alert("Please enter a Product Name.");
      return;
    }

    if (!productImage) {
      alert("Please select a Product Image.");
      return;
    }

    if (isGallery) {
      const missingDetailImage =
        detailImages.some(
          (image) => !image,
        );

      if (missingDetailImage) {
        alert(
          "Please select all 4 Detail Images.",
        );

        return;
      }
    } else {
      if (!specificationImage) {
        alert(
          "Please select a Specification Image.",
        );

        return;
      }
    }

    try {
      setUploading(true);

      /*
       * Upload Main Product Image
       */
      const productImageResult =
        await uploadWebsiteImage(
          productImage,
        );

      /*
       * Gallery Categories
       *
       * EV Charger
       * Circuit Breakers
       * DC SPD
       * DC Isolator
       * ATS
       * AC Voltage Protector
       */
      if (isGallery) {
        const detailImageResults: {
          imageUrl: string;
          sortOrder: number;
        }[] = [];

        for (
          let index = 0;
          index < detailImages.length;
          index++
        ) {
          const image =
            detailImages[index];

          if (!image) continue;

          const result =
            await uploadWebsiteImage(
              image,
            );

          detailImageResults.push({
            imageUrl: result.path,
            sortOrder: index,
          });
        }

        await createWebsiteProduct({
          categoryId,
          title: productName.trim(),
          mainImage:
            productImageResult.path,
          isPublished: true,
          sortOrder: 0,
          images: detailImageResults,
        });
      }

      /*
       * Specification Categories
       *
       * Inverter
       * Battery
       */
      else {
        const specificationImageResult =
          await uploadWebsiteImage(
            specificationImage!,
          );

        await createWebsiteProduct({
          categoryId,
          title:
            productName.trim() ||
            `Product ${Date.now()}`,
          mainImage:
            productImageResult.path,
          specificationImage:
            specificationImageResult.path,
          isPublished: true,
         sortOrder: 0,
        });
      }

      alert(
        "Product saved successfully.",
      );

      /*
       * Reset Form
       */
      setProductName("");

      setProductImage(null);
      setSpecificationImage(null);

      setDetailImages([
        null,
        null,
        null,
        null,
      ]);

      setProductPreview(null);
      setSpecificationPreview(null);

      setDetailPreviews([
        null,
        null,
        null,
        null,
      ]);
    } catch (error) {
      console.error(error);

      alert(
        "Product save failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <h2 className="text-lg font-semibold text-slate-900">
        Add Product
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {isGallery
          ? "Add a product name, 1 main product image and 4 detail images."
          : "Add a product name, product image and specification image."}
      </p>

      {/* Product Name */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Product Name
        </label>

        <input
          type="text"
          value={productName}
          onChange={(event) =>
            setProductName(event.target.value)
          }
          placeholder="Enter product name"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      {/* Main Product Image */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Main Product Image
        </label>

        <label className="flex min-h-64 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100">

          {productPreview ? (
            <img
              src={productPreview}
              alt="Product preview"
              className="max-h-64 max-w-full object-contain p-4"
            />
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">
                Choose Product Image
              </p>

              <p className="mt-1 text-xs text-slate-400">
                JPG, PNG or WebP
              </p>
            </div>
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleProductImage}
          />

        </label>
      </div>

      {/* Gallery Images */}
      {isGallery && (
        <div className="mt-6">

          <div className="mb-3">
            <p className="text-sm font-medium text-slate-700">
              Detail Images
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Select exactly 4 detail images for this product.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {[0, 1, 2, 3].map(
              (index) => (
                <div key={index}>

                  <label className="mb-2 block text-xs font-medium text-slate-600">
                    Detail Image {index + 1}
                  </label>

                  <label className="flex min-h-52 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100">

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
                          index + 1
                        }`}
                        className="max-h-52 max-w-full object-contain p-4"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-600">
                          Choose Detail Image
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Image {index + 1}
                        </p>
                      </div>
                    )}

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
        </div>
      )}

      {/* Specification Image */}
      {!isGallery && (
        <div className="mt-6">

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Specification Image
          </label>

          <label className="flex min-h-64 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100">

            {specificationPreview ? (
              <img
                src={
                  specificationPreview
                }
                alt="Specification preview"
                className="max-h-64 max-w-full object-contain p-4"
              />
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">
                  Choose Specification Image
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  JPG, PNG or WebP
                </p>
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={
                handleSpecificationImage
              }
            />

          </label>

        </div>
      )}

      {/* Save */}
      <div className="mt-6 flex justify-end">

        <button
          type="button"
          onClick={handleSave}
          disabled={uploading}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Saving..."
            : "Save Product"}
        </button>

      </div>

    </div>
  );
}