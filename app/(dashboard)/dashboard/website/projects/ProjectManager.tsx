"use client";

import { useState } from "react";
import {
  createWebsiteProject,
  uploadWebsiteImage,
} from "@/lib/website-cms-api";

export default function ProjectManager() {
  const [open, setOpen] = useState(false);

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [panels, setPanels] = useState("");
  const [inverter, setInverter] = useState("");
  const [battery, setBattery] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  function handleImage(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setCategory("");
    setTitle("");
    setLocation("");
    setCapacity("");
    setPanels("");
    setInverter("");
    setBattery("");
    setImage(null);
    setImagePreview(null);
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

    if (!image) {
      alert("Please select Project Image.");
      return;
    }

    try {
      setSaving(true);

      const uploadResult =
        await uploadWebsiteImage(image);

      await createWebsiteProject({
        category: category.trim(),
        title: title.trim(),
        location: location.trim(),
        capacity: capacity.trim(),
        panels: panels.trim(),
        inverter: inverter.trim(),
        battery: battery.trim(),
        image: uploadResult.path,
        isPublished: true,
       sortOrder: 0,
      });

      alert("Project saved successfully.");

      resetForm();
      setOpen(false);

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        "Project save failed. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
      >
        + Add Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Add Project
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Add a project to the AK Energy website.
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

                        <p className="mt-1 text-xs text-slate-400">
                          JPG, PNG or WEBP
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
                  placeholder="Residential"
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
                  placeholder="Private House Solar System"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>

              {/* Five Project Details */}
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
                      placeholder="Yangon, Myanmar"
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
                      placeholder="10kW"
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
                      placeholder="18 Panels"
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
                      placeholder="Deye 10kW"
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
                      placeholder="Sunness 51.2V 280Ah"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
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
                  : "Save Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}