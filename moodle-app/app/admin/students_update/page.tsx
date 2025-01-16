"use client";

import React, { useState } from "react";
import {useRouter} from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import './styles.css';

const UpdateStudentPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    nume: "",
    prenume: "",
    ciclu_studii: "",
    an_studiu: "",
    grupa: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryGet = searchParams.get('getLink');
  const getMethod = searchParams.get('getMethod');
  const queryUpdate = searchParams.get('updateLink');
  const updateMethod = searchParams.get('updateMethod');
  const baseUrl = "http://localhost:8000";
  const getLink = baseUrl + queryGet;
  const updateLink = baseUrl + queryUpdate;

  const handleInputChange = (e:any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email:any) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const isOnlyLetters = (text: string) => {
    const pattern = /^[a-zA-ZăîșțâĂÎȘȚÂ\s]+$/;
    return pattern.test(text);
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const grupa = Number(formData.grupa);
    const anStudiu = Number(formData.an_studiu);

    if (!isValidEmail(formData.email)) {
      throw new Error("Invalid email format");
    }

    if (!formData.nume || formData.nume.trim() === "" || !isOnlyLetters(formData.nume)) {
      setError("Name is required and can only contain letters.");
      setLoading(false);
      return;
    }

    if (!formData.prenume || formData.prenume.trim() === "" || !isOnlyLetters(formData.prenume)) {
      setError("Surname is required and can only contain letters.");
      setLoading(false);
      return;
    }

    const validCicluStudii = ["licenta", "master"];
    if (!validCicluStudii.includes(formData.ciclu_studii)) {
      setError(
        "The study cycle is invalid. Accepted values: licenta, master."
      );
      setLoading(false);
      return;
    }

    if (
      !formData.an_studiu ||
      isNaN(anStudiu) ||
      anStudiu < 1 ||
      anStudiu > 4
    ) {
      setError("The year of study must be a number between 1 and 4.");
      setLoading(false);
      return;
    }

    if (
      !formData.grupa ||
      isNaN(grupa)
    ) {
      setError("Group must be completed");
      setLoading(false);
      return;
    }

    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      if (!getMethod) {
        setError("GET method is missing or invalid.");
        setLoading(false);
        return;
      }

      const response = await fetch(getLink as string, {
          method: getMethod,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      if (!response.ok) {
        throw new Error("Failed to update student in academia service.");
      }

      const existingData = await response.json();

      if (!isValidEmail(formData.email)) {
        throw new Error("Invalid email format");
      }

      const isDataUnchanged =
        formData.nume === existingData.nume &&
        formData.prenume === existingData.prenume &&
        formData.email === existingData.email &&
        Number(formData.an_studiu) === Number(existingData.an_studiu) &&
        formData.ciclu_studii === existingData.ciclu_studii &&
        Number(formData.grupa) === Number(existingData.grupa);

      if (isDataUnchanged) {
        alert("No changes detected. Update not performed.");
        setLoading(false);
        return;
      }

      if (!updateMethod) {
        setError("GET method is missing or invalid.");
        setLoading(false);
        return;
      }

      const putResponse = await fetch(updateLink as string, {
        method: updateMethod,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!putResponse.ok) {
        throw new Error(`Failed to update student: ${putResponse.statusText}`);
      }

      alert("Student updated successfully!");
      router.push(`/admin?activePage=students`);
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-blue-100 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-indigo-700 text-center text-2xl font-bold mb-6">Update Student</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="nume"
              value={formData.nume}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="prenume"
              value={formData.prenume}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Year of study</label>
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
            <label className="block text-sm font-medium text-gray-700">Study cycle</label>
            <input
              type="text"
              name="ciclu_studii"
              value={formData.ciclu_studii}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Group</label>
            <input
              type="number"
              name="grupa"
              value={formData.grupa}
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
            {loading ? "Updating..." : "Update Student"}
          </button>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
  
};

export default UpdateStudentPage;
