"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface StructuraMaterial {
  titlu: string;
  descriere: string;
}

const CreateMaterialsPage = () => {
  const searchParams = useSearchParams();
  const createLink = searchParams.get("link");
  const createMethod = searchParams.get("method");
  const baseUrl = "http://localhost:8000";

  const router = useRouter();

  const [materialType, setMaterialType] = useState<"pdf" | "structurat" | "">("");
  const [materialCategory, setMaterialCategory] = useState<"curs" | "laborator" | "">("");

  const [formData, setFormData] = useState({
    disciplina: "",
    tip_material: "",
    material: {
      pdf: "",
      structurat: [{ titlu: "", descriere: "" }] as StructuraMaterial[],
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleMaterialCategoryChange = (category: "curs" | "laborator") => {
    setError(null);
    setMaterialCategory(category);
    setFormData((prev) => ({
      ...prev,
      tip_material: category,
    }));
  };

  const handleMaterialTypeChange = (type: "pdf" | "structurat") => {
    setError(null);
    setMaterialType(type);
  
    setFormData((prev:any) => ({
      ...prev,
      material: type === "pdf"
        ? { pdf: "", structurat: [] }
        : { pdf: null, structurat: [{ titlu: "", descriere: "" }] },
    }));
  };

  const extractParams = (url: string) => {
    const regex = /\/professors\/(\d+)\/lectures\/([^/]+)\/materiale/;
    const match = url.match(regex);
    if (match) {
      return { professorId: match[1], disciplineCod: match[2] };
    }
    return { professorId: null, disciplineCod: null };
  };

  const { professorId, disciplineCod } = extractParams(createLink || "");

  useEffect(() => {
    if (disciplineCod) {
      setFormData((prev) => ({
        ...prev,
        disciplina: disciplineCod,
      }));
    }
  }, [disciplineCod]);
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "pdf") {
      setFormData((prev) => ({
        ...prev,
        material: { ...prev.material, pdf: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleStructuraMaterialChange = (index: number, field: keyof StructuraMaterial, value: string) => {
    const updatedStructurat = [...formData.material.structurat];
    updatedStructurat[index] = {
      ...updatedStructurat[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      material: { ...prev.material, structurat: updatedStructurat },
    }));
  };

  const addStructuraMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      material: {
        ...prev.material,
        structurat: [...prev.material.structurat, { titlu: "", descriere: "" }],
      },
    }));
  };

  const removeStructuraMaterial = (index: number) => {
    const updatedStructurat = [...formData.material.structurat];
    updatedStructurat.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      material: { ...prev.material, structurat: updatedStructurat },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!createMethod || createMethod !== "POST") {
        setError("Invalid method specified.");
        setLoading(false);
        return;
      }

      const preparedFormData = {
        ...formData,
        material: {
          pdf: materialType === "pdf" ? formData.material.pdf : null,
          structurat: materialType === "structurat" ? formData.material.structurat : [],
        },
      };
    
      console.log("Prepared Form Data:", JSON.stringify(preparedFormData, null, 2));

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing.");
      }

      const response = await fetch(baseUrl + createLink, {
        method: createMethod,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage("Materials created successfully!");
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create materials.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-blue-500">
      <div className="bg-white p-8 rounded shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-indigo-600">
          Create Material
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {successMessage && (
          <p className="text-green-500 text-center mb-4">{successMessage}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Material Category</label>
            <select
              value={materialCategory}
              onChange={(e) => handleMaterialCategoryChange(e.target.value as "curs" | "laborator")}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-200"
              required
            >
              <option value="">Select Category</option>
              <option value="curs">Curs</option>
              <option value="laborator">Laborator</option>
            </select>
          </div>

          {materialCategory && (
            <div>
              <label className="block text-sm font-medium mb-1">Choose Material Format</label>
              <select
                value={materialType}
                onChange={(e) => handleMaterialTypeChange(e.target.value as "pdf" | "structurat")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-200"
                required
              >
                <option value="">Select Type</option>
                <option value="pdf">PDF</option>
                <option value="structurat">Structured</option>
              </select>
            </div>
          )}

          {materialType === "pdf" && (
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="pdf">
                PDF Link
              </label>
              <input
                type="url"
                id="pdf"
                name="pdf"
                value={formData.material.pdf}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-200"
                required
              />
            </div>
          )}
          {materialType === "structurat" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Structured Materials
              </label>
              {formData.material.structurat.map((structura, index) => (
                <div key={index} className="space-y-2 border-b pb-2 mb-2">
                  <input
                    type="text"
                    placeholder="Title"
                    value={structura.titlu}
                    onChange={(e) =>
                      handleStructuraMaterialChange(index, "titlu", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-200 mb-2"
                  />
                  <textarea
                    placeholder="Description"
                    value={structura.descriere}
                    onChange={(e) =>
                      handleStructuraMaterialChange(index, "descriere", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-200"
                    required
                  ></textarea>
                  <button
                    type="button"
                    onClick={() => removeStructuraMaterial(index)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addStructuraMaterial}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
              >
                Add More Materials
              </button>
            </div>
          )}
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded-lg text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Materials"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateMaterialsPage;
