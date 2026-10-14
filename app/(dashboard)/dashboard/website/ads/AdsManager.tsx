"use client";

import { useState } from "react";
import {
  createWebsiteAd,
  updateWebsiteAd,
  uploadWebsiteImage,
} from "@/lib/website-cms-api";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

type Ad = {
  id: string;
  slot: number;
  image: string;
  isPublished: boolean;
};

type AdsManagerProps = {
  slot: number;
  ad?: Ad;
};

export default function AdsManager({
  slot,
  ad,
}: AdsManagerProps) {
  const [image, setImage] =
    useState<File | null>(null);

  const [preview, setPreview] =
  useState<string | null>(
    ad?.image
      ? `${API_URL}${ad.image}`
      : null,
  );

  const [saving, setSaving] =
    useState(false);

  function handleImage(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(
      URL.createObjectURL(file),
    );
  }

  async function handleSave() {
    if (!image && !ad) {
      alert(
        `Please select an image for Ad ${slot}.`,
      );
      return;
    }

    if (!image) {
      alert(
        "Please select a new image to replace the current image.",
      );
      return;
    }

    try {
      setSaving(true);

      const uploadResult =
        await uploadWebsiteImage(image);

      if (ad) {
        await updateWebsiteAd(
          ad.id,
          {
            image: uploadResult.path,
            isPublished: true,
          },
        );
      } else {
        await createWebsiteAd({
          slot,
          image: uploadResult.path,
        });
      }

      alert(
        `Ad ${slot} saved successfully.`,
      );

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        `Ad ${slot} save failed. Please try again.`,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Advertisement
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Ad {slot}
            </h2>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              ad
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {ad ? "Active" : "Empty"}
          </span>
        </div>
      </div>

      <div className="p-5">
        <label className="block cursor-pointer overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImage}
            className="hidden"
          />

          <div className="aspect-square w-full">
            {preview ? (
              <img
                src={preview}
                alt={`Ad ${slot}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-500">
                    Click to select image
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Recommended: 1080 × 1080 px
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    JPG, PNG or WEBP
                  </p>
                </div>
              </div>
            )}
          </div>
        </label>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : ad
              ? "Replace Image"
              : "Add Image"}
        </button>

        <p className="mt-3 text-center text-xs leading-5 text-slate-400">
          This slot is fixed. You can replace the image,
          but cannot add or remove advertisement slots.
        </p>
      </div>
    </section>
  );
}
