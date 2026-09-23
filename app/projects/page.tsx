"use client";

import { useEffect, useState } from "react";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import {
  getWebsiteProjects,
  WebsiteProject,
} from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function getImageUrl(image?: string | null) {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_BASE_URL}${image}`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<WebsiteProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const data = await getWebsiteProjects();
        setProjects(data);
      } catch (err) {
        console.error("Failed to load website projects:", err);
        setError("Failed to load website projects.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <DashboardShell>
      <PageTitle
        title="Projects"
        subtitle="Manage the projects displayed on the website."
      />

      {loading && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading projects...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Website Projects
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {projects.length} project
                {projects.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                No projects found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No website projects have been added yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const imageUrl = getImageUrl(project.image);

                return (
                  <div
                    key={project.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[16/10] bg-slate-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          No Image
                        </div>
                      )}

                      <div className="absolute right-3 top-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            project.isPublished
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {project.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {project.title}
                          </h3>

                          {project.category && (
                            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                              {project.category}
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 text-xs text-slate-400">
                          Order {project.sortOrder}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        {project.location && (
                          <div>
                            <span className="font-medium text-slate-900">
                              Location:
                            </span>{" "}
                            {project.location}
                          </div>
                        )}

                        {project.capacity && (
                          <div>
                            <span className="font-medium text-slate-900">
                              Capacity:
                            </span>{" "}
                            {project.capacity}
                          </div>
                        )}

                        {project.panels && (
                          <div>
                            <span className="font-medium text-slate-900">
                              Panels:
                            </span>{" "}
                            {project.panels}
                          </div>
                        )}

                        {project.inverter && (
                          <div>
                            <span className="font-medium text-slate-900">
                              Inverter:
                            </span>{" "}
                            {project.inverter}
                          </div>
                        )}

                        {project.battery && (
                          <div>
                            <span className="font-medium text-slate-900">
                              Battery:
                            </span>{" "}
                            {project.battery}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}