"use client";

import { useEffect, useState } from "react";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import { getWebsiteAds, WebsiteAd } from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function getImageUrl(image?: string | null) {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_BASE_URL}${image}`;
}

export default function WebsiteAdsPage() {
  const [ads, setAds] = useState<WebsiteAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAds() {
      try {
        setLoading(true);
        setError("");

        const data = await getWebsiteAds();
        setAds(data);
      } catch (err) {
        console.error("Failed to load website ads:", err);
        setError("Failed to load ads and promotions.");
      } finally {
        setLoading(false);
      }
    }

    loadAds();
  }, []);

  return (
    <DashboardShell>
      <PageTitle
        title="Ads & Promotions"
        subtitle="Manage the promotional images displayed above Our Products."
      />

      {loading && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading ads and promotions...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Promotional Slots
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage the two promotional images displayed above Our
                  Products.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {ads.length} Slots
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {[1, 2].map((slot) => {
              const ad = ads.find((item) => item.slot === slot);
              const imageUrl = getImageUrl(ad?.image);

              return (
                <div
                  key={slot}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Promotion Slot {slot}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Website promotional banner
                      </p>
                    </div>

                    {ad && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          ad.isPublished
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {ad.isPublished ? "Published" : "Draft"}
                      </span>
                    )}
                  </div>

                  <div className="aspect-[16/7] bg-slate-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`Promotion Slot ${slot}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        No promotional image
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {ad ? "Image configured" : "Empty slot"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Slot {slot}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-400"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardShell>
  );
}