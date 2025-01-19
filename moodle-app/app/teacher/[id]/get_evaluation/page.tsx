"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Proba {
  tip_proba: string;
  pondere: number;
}

const EvaluationPage = () => {
  const searchParams = useSearchParams();
  const getLink = searchParams.get("get_link");
  const getMethod = searchParams.get("get_method");
  const updateLink = searchParams.get("update_link");
  const updateMethod = searchParams.get("update_method");
  const baseUrl = "http://localhost:8000";
  const router = useRouter();

  const [probe, setProbe] = useState<Proba[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvaluations = async () => {
      setLoading(true);
      try {

        if (!getMethod) {
            setError("GET method is missing or invalid.");
            setLoading(false);
            return;
        }

        if (!updateMethod) {
            setError("UPDATE method is missing or invalid.");
            setLoading(false);
            return;
        }

        const response = await fetch(baseUrl + getLink, {
          method: getMethod,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProbe(data.evaluare.probe || []);
        } else {
          setError("Failed to fetch evaluations");
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching evaluations");
      } finally {
        setLoading(false);
      }
    };

    if (getLink) fetchEvaluations();
  }, [getLink, getMethod]);

  const addProba = () => {
    setProbe((prev) => [...prev, { tip_proba: "", pondere: 0 }]);
  };

  const updateProba = (index: number, field: keyof Proba, value: string | number) => {
    const updatedProbe = [...probe];
    if (field === "tip_proba") {
      updatedProbe[index].tip_proba = value as string;
    } else if (field === "pondere") {
      const numericValue = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
        setError("Weighting must be between 0 and 100%");
        return;
      }
      updatedProbe[index].pondere = numericValue;
    }
    setProbe(updatedProbe);
    setError("");
  };

  const deleteProba = (index: number) => {
    const updatedProbe = probe.filter((_, i) => i !== index);
    setProbe(updatedProbe);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalPondere = probe.reduce((sum, p) => sum + p.pondere, 0);
    if (totalPondere !== 100) {
      setError("The total weighting of all tests must equal 100%");
      return;
    }

    setError("");

    try {
      const response = await fetch(baseUrl + updateLink, {
        method: updateMethod || "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ probe }),
      });

      if (response.ok) {
        alert("Evaluations updated successfully!");
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.detail || "An error occurred while updating evaluations");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-blue-500">
      <div className="bg-white p-8 rounded shadow-lg max-w-lg w-full text-black">
        <h1 className="text-2xl font-bold mb-4 text-center text-indigo-600">
          {loading ? "Loading..." : "List & Update Evaluation"}
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {probe.map((proba, index) => (
            <div key={index} className="space-y-2 border-b pb-4">
              <div>
                <label className="block font-medium">Test Type</label>
                <input
                  type="text"
                  value={proba.tip_proba}
                  onChange={(e) => updateProba(index, "tip_proba", e.target.value)}
                  className="border border-gray-300 px-4 py-2 w-full rounded focus:outline-none focus:ring focus:ring-indigo-200"
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Weighting (%)</label>
                <input
                  type="number"
                  value={proba.pondere}
                  onChange={(e) => updateProba(index, "pondere", e.target.value)}
                  className="border border-gray-300 px-4 py-2 w-full rounded focus:outline-none focus:ring focus:ring-indigo-200"
                  required
                  min="0"
                  max="100"
                />
              </div>
              <button
                type="button"
                onClick={() => deleteProba(index)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Delete Test
              </button>
            </div>
          ))}

        <button
            type="button"
            onClick={addProba}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full mb-4">
        Add Test
        </button>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full">
            Update Evaluations
          </button>
        </form>
      </div>
    </div>
  );
};

export default EvaluationPage;
