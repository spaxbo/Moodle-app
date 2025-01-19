"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from 'next/navigation';

interface Proba {
  tip_proba: string;
  pondere: number;
}

const CreateEvaluation = () => {
  const searchParams = useSearchParams();
  const method = searchParams.get('method');
  const linkIncomplete = searchParams.get('link');
  const baseUrl = "http://localhost:8000";
  const fullLink = baseUrl + linkIncomplete;
  const router = useRouter();

  const [probe, setProbe] = useState<Proba[]>([{ tip_proba: "", pondere: 0 }]);
  const [error, setError] = useState("");

  const addProba = () => {
    setProbe([...probe, { tip_proba: "", pondere: 0 }]);
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

  const extractParams = (url: string) => {
    const regex = /\/professors\/(\d+)\/lectures\/([^/]+)\/evaluare/;
    const match = url.match(regex);
    if (match) {
      return { professorId: match[1], disciplineCod: match[2] };
    }
    return { professorId: null, disciplineCod: null };
  };

  const { professorId, disciplineCod } = extractParams(linkIncomplete || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalPondere = probe.reduce((sum, p) => sum + p.pondere, 0);
    if (totalPondere !== 100) {
      setError("The total weighting of all tests must equal 100%");
      return;
    }

    setError("");

    const evaluationData = {
      disciplina: disciplineCod,
      probe: probe,
    };

    try {
      const response = await fetch(fullLink, {
        method: method || "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(evaluationData),
      });

      if (response.ok) {
        alert("Evaluation created successfully!");
        router.push(`/teacher/${professorId}`);
      } else {
        const data = await response.json();
        setError(data.detail || "An error occurred while creating the evaluation");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-blue-500"
    >
      <div className="bg-white p-8 rounded shadow-lg max-w-lg w-full text-black">
        <h1 className="text-2xl font-bold mb-4 text-center text-indigo-600">Create Evaluation</h1>
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
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full">
            Add Test
          </button>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvaluation;
