"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Proba {
    tip_proba: string;
    pondere: number;
  }

const GetEvaluationPage = () => {
  const searchParams = useSearchParams();
  const getLink = searchParams.get("link");
  const getMethod = searchParams.get("method");
  const baseUrl = "http://localhost:8000";

  const [probe, setProbe] = useState<Proba[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvaluations = async () => {
      setLoading(true);
      try {
        if (!getMethod || getMethod !== "GET") {
          setError("Invalid GET method specified.");
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
          setError("No evaluations for this lecture.");
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching evaluations.");
      } finally {
        setLoading(false);
      }
    };

    if (getLink) fetchEvaluations();
  }, [getLink, getMethod]);

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-blue-500">
      <div className="bg-white p-8 rounded shadow-lg max-w-lg w-full text-black">
        <h1 className="text-2xl font-bold mb-4 text-center text-indigo-600">
          {loading ? "Loading..." : "List Evaluation"}
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {!loading && !error && (
          <div className="space-y-4">
            {probe.map((proba, index) => (
              <div key={index} className="space-y-2 border-b pb-4">
                <div>
                  <label className="block font-medium">Test Type</label>
                  <p className="bg-gray-100 px-4 py-2 rounded">{proba.tip_proba}</p>
                </div>
                <div>
                  <label className="block font-medium">Weighting (%)</label>
                  <p className="bg-gray-100 px-4 py-2 rounded">{proba.pondere}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GetEvaluationPage;
