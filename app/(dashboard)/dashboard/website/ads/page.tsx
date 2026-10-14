import Link from "next/link";
import { getWebsiteAds } from "@/lib/website-cms-api";
import AdsManager from "./AdsManager";

export default async function WebsiteAdsPage() {
  const ads = await getWebsiteAds();

  const ad1 = ads.find(
    (ad: any) => ad.slot === 1,
  );

  const ad2 = ads.find(
    (ad: any) => ad.slot === 2,
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/website"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Website Management
          </Link>

          <div className="mt-4">
            <p className="text-sm font-medium text-emerald-600">
              Website CMS
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Ads & Promotions
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage the two promotional images displayed above Our Products.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Fixed Advertisement Slots
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            There are always two advertisement slots.
            You can replace the images, but cannot add or remove slots.
          </p>

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              Recommended image size
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              1080 × 1080 px
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Desktop: 2 columns · Mobile: 1 column
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdsManager
            slot={1}
            ad={ad1}
          />

          <AdsManager
            slot={2}
            ad={ad2}
          />
        </div>
      </div>
    </main>
  );
}
