"use client";

import React, { useState } from "react";
import {useRouter} from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import './styles.css';

const UpdateTeacherPage = () => {
  const [formData, setFormData] = useState({
    nume: "",
    prenume: "",
    email: "",
    grad_didactic: "",
    tip_asociere: "",
    asociere: ""
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

    if (!isValidEmail(formData.email)) {
      throw new Error("Invalid email format");
    }

    const validGradDidactic = ["asist", "sef lucr", "conf", "prof"];
    if (!validGradDidactic.includes(formData.grad_didactic)) {
      setError(
        "The academic degree is invalid. Accepted values: asist, sef lucr, conf, prof."
      );
      setLoading(false);
      return;
    }

    const validTipAsociere = ["titular", "asociat", "extern"];
    if (!validTipAsociere.includes(formData.tip_asociere)) {
      setError(
        "The type of association is invalid. Accepted values: titular, asociat, extern."
      );
      setLoading(false);
      return;
    }

    if (!formData.asociere || formData.asociere.trim() === "") {
      setError("Association is required.");
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
        throw new Error("Failed to update professor in academia service.");
      }

      const existingData = await response.json();

      const isDataUnchanged =
        formData.nume === existingData.nume &&
        formData.prenume === existingData.prenume &&
        formData.email === existingData.email &&
        formData.grad_didactic === existingData.grad_didactic &&
        formData.tip_asociere === existingData.tip_asociere &&
        formData.asociere === existingData.asociere;

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
        throw new Error(`Failed to update professor: ${putResponse.statusText}`);
      }

      alert("Professor updated successfully!");
      router.push("/admin");
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-blue-100 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-indigo-700 text-center text-2xl font-bold mb-6">Update Teacher</h2>
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
            <label className="block text-sm font-medium text-gray-700">Teaching rank</label>
            <input
              type="text"
              name="grad_didactic"
              value={formData.grad_didactic}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Association type</label>
            <input
              type="text"
              name="tip_asociere"
              value={formData.tip_asociere}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Association</label>
            <input
              type="text"
              name="asociere"
              value={formData.asociere}
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
            {loading ? "Updating..." : "Update Teacher"}
          </button>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
  
};

export default UpdateTeacherPage;
