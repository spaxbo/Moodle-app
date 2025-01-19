"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface StructuraMaterial {
  titlu: string;
  descriere: string;
}

interface Material {
  disciplina: string;
  tip_material: string;
  material: {
    pdf?: string | null;
    structurat?: StructuraMaterial[];
  };
}

const ListMaterialsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const getLink = searchParams.get("get_link");
  const getMethod = searchParams.get("get_method");
  const updateLink = searchParams.get("update_link");
  const updateMethod = searchParams.get("update_method");
  const baseUrl = "http://localhost:8000";

  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [materialCategory, setMaterialCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token is missing.");
        }

        const response = await fetch(baseUrl + getLink, {
          method: getMethod || "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.materiale)) {
            setMaterials(data.materiale);
            setFilteredMaterials(data.materiale);
          } else {
            throw new Error("Unexpected API response. Expected an array.");
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch materials.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (getLink && getMethod) {
      fetchMaterials();
    }
  }, [getLink, getMethod]);

  const handleMaterialCategoryChange = (category: string) => {
    setMaterialCategory(category);

    if (category === "") {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter(
        (material) => material.tip_material === category
      );
      setFilteredMaterials(filtered);
    }
  };

  const handleEdit = (material: Material, index: number) => {
    setEditMaterial({ ...material });
    setEditIndex(index);
  };

  const handleSave = async () => {
    if (!updateLink || !updateMethod || !editMaterial) {
      setError("Missing update information.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing.");
      }

      const response = await fetch(baseUrl + updateLink, {
        method: updateMethod || "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editMaterial),
      });

      if (response.ok) {
        const updatedMaterials = [...materials];
        if (editIndex !== null) {
          updatedMaterials[editIndex] = editMaterial;
        }
        setMaterials(updatedMaterials);
        setFilteredMaterials(updatedMaterials);
        setEditMaterial(null);
        setEditIndex(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update material.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const renderMaterialContent = (material: Material) => {
    if (material.material.pdf) {
      return (
        <p>
          <a
            href={material.material.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Open PDF
          </a>
        </p>
      );
    } else if (material.material.structurat) {
      return material.material.structurat.map((struct, idx) => (
        <div key={idx} className="mt-2">
          <p>
            <strong>Title:</strong> {struct.titlu}
          </p>
          <p>
            <strong>Description:</strong> {struct.descriere}
          </p>
        </div>
      ));
    } else {
      return <p>No valid material found.</p>;
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-blue-500">
      <div className="bg-white p-8 rounded shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-4 text-indigo-600">
          List & Update Materials
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Material Category</label>
          <select
            value={materialCategory}
            onChange={(e) => handleMaterialCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-200"
          >
            <option value="">All Categories</option>
            <option value="curs">Curs</option>
            <option value="laborator">Laborator</option>
          </select>
        </div>
  
        <div className="space-y-4 mt-4">
          {loading ? (
            <p className="text-center text-gray-500">Loading materials...</p>
          ) : filteredMaterials.length > 0 ? (
            filteredMaterials.map((material, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-100">
                <h2 className="font-bold">
                  {material.material.pdf
                    ? "PDF Material"
                    : material.material.structurat
                    ? "Structured Material"
                    : "Unknown Material"}
                </h2>
                {renderMaterialContent(material)}
                <button
                  onClick={() => handleEdit(material, index)}
                  className="bg-yellow-500 text-white px-2 py-1 mt-2 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No materials found.</p>
          )}
        </div>
  
        {editMaterial && (
    <div className="mt-6 p-4 border rounded-lg bg-gray-100">
      <h2 className="font-bold text-center">Edit Material</h2>
      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Disciplina</label>
        <input
          type="text"
          value={editMaterial.disciplina}
          onChange={(e) =>
            setEditMaterial({ ...editMaterial, disciplina: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-lg focus:outline-none"
        />
      </div>
      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Tip Material</label>
        <select
          value={editMaterial.tip_material}
          onChange={(e) =>
            setEditMaterial({ ...editMaterial, tip_material: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-lg focus:outline-none"
        >
          <option value="curs">Curs</option>
          <option value="laborator">Laborator</option>
        </select>
      </div>

      {editMaterial.material.pdf ? (
        <div className="mt-4">
          <p>Materialul este un PDF. Nu este nevoie să editezi conținutul.</p>
          <a
            href={editMaterial.material.pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Deschide PDF
          </a>
        </div>
      ) : (
        <div className="mt-2">
          <label className="block text-sm font-medium mb-1">Structurat</label>
          {editMaterial.material.structurat?.map((struct, idx) => (
            <div key={idx} className="mt-2">
              <input
                type="text"
                placeholder="Titlu"
                value={struct.titlu}
                onChange={(e) => {
                  const updatedStructurat = [...(editMaterial.material.structurat || [])];
                  updatedStructurat[idx].titlu = e.target.value;
                  setEditMaterial({
                    ...editMaterial,
                    material: { ...editMaterial.material, structurat: updatedStructurat },
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none mb-1"
              />
              <input
                type="text"
                placeholder="Descriere"
                value={struct.descriere}
                onChange={(e) => {
                  const updatedStructurat = [...(editMaterial.material.structurat || [])];
                  updatedStructurat[idx].descriere = e.target.value;
                  setEditMaterial({
                    ...editMaterial,
                    material: { ...editMaterial.material, structurat: updatedStructurat },
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => setEditMaterial(null)}
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
    )}
      </div>
    </div>
  );
};

export default ListMaterialsPage;
