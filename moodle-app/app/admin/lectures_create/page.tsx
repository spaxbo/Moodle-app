"use client";

import React, { useState } from "react";
import {useRouter} from 'next/navigation';
import './styles.css';

const CreateLecturePage = () => {
  const [formData, setFormData] = useState({
    cod: "",
    nume_disciplina: "",
    an_studiu: "",
    tip_disciplina: "",
    categorie_disciplina: "",
    tip_examinare: "",
    id_titular: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (e:any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isOnlyLetters = (text: string) => {
    const pattern = /^[a-zA-ZăîșțâĂÎȘȚÂ\s]+$/;
    return pattern.test(text);
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const anStudiu = Number(formData.an_studiu);
    const idTitular = Number(formData.id_titular);

    if (!formData.cod || formData.cod.trim().length === 0) {
      setError("The lecture code is required.");
      setLoading(false);
      return;
    }

    if (!formData.nume_disciplina || formData.nume_disciplina.trim() === "" || !isOnlyLetters(formData.nume_disciplina)) {
      setError("The name of the lecture is required and can only contain letters.");
      setLoading(false);
      return;
    }

    if (
      !formData.an_studiu ||
      isNaN(anStudiu) ||
      anStudiu < 1 ||
      anStudiu > 4
    ) {
      setError("The year of study must be between 1 and 4.");
      setLoading(false);
      return;
    }

    const validTipDisciplina = ["impusa", "optionala", "liber_aleasa"];
    if (!validTipDisciplina.includes(formData.tip_disciplina)) {
      setError("The lecture type is invalid. Accepted values: impusa, optionala, liber_aleasa.");
      setLoading(false);
      return;
    }

    const validCategorieDisciplina = ["domeniu", "specialitate", "adiacenta"];
    if (!validCategorieDisciplina.includes(formData.categorie_disciplina)) {
      setError("The lecture category is invalid. Accepted values: domeniu, specialitate, adiacenta.");
      setLoading(false);
      return;
    }

    const validTipExaminare = ["examen", "colocviu"];
    if (!validTipExaminare.includes(formData.tip_examinare)) {
      setError("The examination type is invalid. Accepted values: examen, colocviu.");
      setLoading(false);
      return;
    }

    if (!formData.id_titular || isNaN(idTitular)) {
      setError("Tenured id must be provided and must be valid.");
      setLoading(false);
      return;
    }

    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch(
        "http://localhost:8000/api/academia/lectures",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cod: formData.cod,
            nume_disciplina: formData.nume_disciplina,
            an_studiu: formData.an_studiu,
            tip_disciplina: formData.tip_disciplina,
            categorie_disciplina: formData.categorie_disciplina,
            tip_examinare: formData.tip_examinare,
            id_titular: formData.id_titular
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create lecture in academia service.");
      }

      alert("Lecture created successfully!");
      router.push(`/admin?activePage=lectures`);
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-blue-100 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-indigo-700 text-center text-2xl font-bold mb-6">Create Lecture</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Code</label>
            <input
              type="text"
              name="cod"
              value={formData.cod}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lecture Name</label>
            <input
              type="text"
              name="nume_disciplina"
              value={formData.nume_disciplina}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Year of Study</label>
            <input
              type="number"
              name="an_studiu"
              value={formData.an_studiu}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lecture Type</label>
            <input
              type="text"
              name="tip_disciplina"
              value={formData.tip_disciplina}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lecture Category</label>
            <input
              type="text"
              name="categorie_disciplina"
              value={formData.categorie_disciplina}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Examination Type</label>
            <input
              type="text"
              name="tip_examinare"
              value={formData.tip_examinare}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tenured Id</label>
            <input
              type="number"
              name="id_titular"
              value={formData.id_titular}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-indigo-700 text-white rounded-lg px-4 py-2 font-medium hover:bg-indigo-800 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Lecture"}
          </button>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
  
};

export default CreateLecturePage;