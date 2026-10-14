"use client";

import { useState } from "react";
import {
  updateWebsiteProject,
  uploadWebsiteImage,
} from "@/lib/website-cms-api";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

function getImageUrl(image: string | null | undefined) {
  if (!image) return null;

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  return `${API_URL}${image}`;
}

type Project = {
  id: string;
  category: string;
  title: string;
  location: string;
  capacity: string;
  panels: string;
  inverter: string;
  battery: string;
  image: string;
  isPublished: boolean;
};

type ProjectEditorProps = {
  project: Project;
};

export default function ProjectEditor({
  project,
}: ProjectEditorProps) {
  const [open, setOpen] = useState(false);

  const [category, setCategory] =
    useState(project.category);

  const [title, setTitle] =
    useState(project.title);

  const [location, setLocation] =
    useState(project.location);

  const [capacity, setCapacity] =
    useState(project.capacity);

  const [panels, setPanels] =
    useState(project.panels);

  const [inverter, setInverter] =
    useState(project.inverter);

  const [battery, setBattery] =
    useState(project.battery);

  const [image, setImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(
      getImageUrl(project.image),
    );

  const [isPublished, setIsPublished] =
    useState(project.isPublished);

  const [saving, setSaving] =
    useState(false);

  function openEditor() {
    setCategory(project.category);
    setTitle(project.title);
    setLocation(project.location);
    setCapacity(project.capacity);
    setPanels(project.panels);
    setInverter(project.inverter);
    setBattery(project.battery);
    setImage(null);
    setImagePreview(getImageUrl(project.image));
    setIsPublished(project.isPublished);
    setOpen(true);
  }

  function handleImage(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(file);
    setImagePreview(
      URL.createObjectURL(file),
    );
  }

  async function handleSave() {
    if (!category.trim()) {
      alert("Please enter Category.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter Project Title.");
      return;
    }

    if (!location.trim()) {
      alert("Please enter Location.");
      return;
    }

    if (!capacity.trim()) {
      alert("Please enter Capacity.");
      return;
    }

    if (!panels.trim()) {
      alert("Please enter Solar Panels.");
      return;
    }

    if (!inverter.trim()) {
      alert("Please enter Inverter.");
      return;
    }

    if (!battery.trim()) {
      alert("Please enter Battery.");
      return;
    }

    try {
      setSaving(true);

      let imagePath = project.image;

      if (image) {
        const uploadResult =
          await uploadWebsiteImage(image);

        imagePath = uploadResult.path;
      }

      await updateWebsiteProject(
        project.id,
        {
          category: category.trim(),
          title: title.trim(),
          location: location.trim(),
          capacity: capacity.trim(),
          panels: panels.trim(),
          inverter: inverter.trim(),
          battery: battery.trim(),
          image: imagePath,
          isPublished,
        },
      );

      alert("Project updated successfully.");

      setOpen(false);

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        "Project update failed. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Edit Project
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Update this project.
              </p>
            </div>

            <div className="space-y-5 p-5">
              {/* Project Image */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Project Image
                </label>

                <label className="block cursor-pointer overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImage}
                    className="hidden"
                  />

                  <div className="flex min-h-48 items-center justify-center p-4">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Project preview"
                        className="max-h-64 max-w-full rounded-lg object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-500">
                          Click to select image
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <input
                  type="text"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Project Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>

              {/* Project Details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project Details
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Location
                    </label>

                    <input
                      type="text"
                      value={location}
                      onChange={(event) =>
                        setLocation(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Capacity
                    </label>

                    <input
                      type="text"
                      value={capacity}
                      onChange={(event) =>
                        setCapacity(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Solar Panels
                    </label>

                    <input
                      type="text"
                      value={panels}
                      onChange={(event) =>
                        setPanels(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Inverter
                    </label>

                    <input
                      type="text"
                      value={inverter}
                      onChange={(event) =>
                        setInverter(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Battery
                    </label>

                    <input
                      type="text"
                      value={battery}
                      onChange={(event) =>
                        setBattery(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Publish */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Published
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Show this project on the website.
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

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                disabled={saving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
