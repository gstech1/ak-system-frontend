import Link from "next/link";
import { getWebsiteProjects } from "@/lib/website-cms-api";
import ProjectManager from "./ProjectManager";
import ProjectEditor from "./ProjectEditor";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

function getImageUrl(
  image: string | null | undefined,
) {
  if (!image) return null;

  // Already a complete URL or local preview URL
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  // CMS uploaded images are served by the backend
  if (image.startsWith("/website-cms/uploads/")) {
    return `${API_URL}${image}`;
  }

  // Existing website images are served by Next.js frontend
  return image;
}

export default async function WebsiteProjectsPage() {
  const projects = await getWebsiteProjects();

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
              Projects
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage projects displayed on the AK Energy website.
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Projects
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {projects.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Published
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {
                projects.filter(
                  (project: any) =>
                    project.isPublished,
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">
              Draft
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {
                projects.filter(
                  (project: any) =>
                    !project.isPublished,
                ).length
              }
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Project List
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Add and manage website projects.
              </p>
            </div>

            <ProjectManager />
          </div>

          {projects.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-slate-500">
                No projects yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Projects will appear here after they are added.
              </p>
            </div>
          ) : (
            <div>
              {projects.map(
                (project: any) => {
                  const imageUrl = getImageUrl(
                    project.image,
                  );

                  return (
                    <div
                      key={project.id}
                      className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={project.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">
                              No Image
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-medium text-emerald-600">
                            {project.category}
                          </p>

                          <h3 className="mt-1 truncate text-sm font-semibold text-slate-900">
                            {project.title}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            {project.location} ·{" "}
                            {project.capacity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:shrink-0">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            project.isPublished
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {project.isPublished
                            ? "Published"
                            : "Draft"}
                        </span>

                        <ProjectEditor
                          project={project}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
