"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface StructuraMaterial {
  titlu: string;
  descriere: string;
}

interface Material {
  disciplina: string;
  tip_material: string;
  material: {
    pdf?: string;
    structurat?: StructuraMaterial[];
  };
}

const ListMaterialsPage = () => {
  const searchParams = useSearchParams();
  const getLink = searchParams.get("link");
  const getMethod = searchParams.get("method");
  const baseUrl = "http://localhost:8000";

  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [materialCategory, setMaterialCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          List Materials
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
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No materials found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListMaterialsPage;
