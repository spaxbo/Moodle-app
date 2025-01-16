"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from 'next/navigation';
import "./styles.css";

const TeacherDashboard = () => {
  const [activePage, setActivePage] = useState("all_lectures");
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [professorName, setProfessorName] = useState("");
  const router = useRouter();

  const { id: professorId } = useParams(); 

  useEffect(() => {
    const page = getActivePageFromQuery();
    setActivePage(page);
    window.localStorage.setItem("activePage", page);
  }, [professorId]);

  useEffect(() => {
    if (!professorId) {
      setError("Professor ID is missing");
      return;
    }

    if (activePage) {
      const queryParams = new URLSearchParams(window.location.search);
      queryParams.set("activePage", activePage);
      window.history.replaceState(null, "", `${window.location.pathname}?${queryParams}`);
    }
    if (activePage === "all_lectures") {
      fetchAllLectures(professorId as string);
    }
  }, [activePage, professorId]);

  const getActivePageFromQuery = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("activePage") || localStorage.getItem("activePage") || "all_lectures";
    }
    return "all_lectures";
  };

  const fetchAllLectures = async (professorId: string) => {
    setLoading(true);
    setError(null);
  
    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing");
      }
  
      const response = await fetch(`http://localhost:8000/api/academia/professors/${professorId}/lectures/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch lectures");
      }
  
      const data = await response.json();
  
      const lecturesWithProfessors = await Promise.all(
        data.lectures.map(async (lecture: any) => {
          if (lecture.titular_id) {
            try {
              const professorResponse = await fetch(`http://localhost:8000/api/academia/professors/${lecture.titular_id}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
  
              if (professorResponse.ok) {
                const professorData = await professorResponse.json();
                return { ...lecture, professorName: `${professorData.nume} ${professorData.prenume}` };
              }
            } catch (err) {
              console.error(`Failed to fetch professor for lecture ${lecture.cod}:`, err);
            }
          }
  
          return { ...lecture, professorName: "No titular" };
        })
      );
  
      setLectures(lecturesWithProfessors);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };
  

  const changePage = (page: string) => {
    setActivePage(page);
  };

  const handleLogout = async () => {
    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in again");
      }

      const response = await fetch(`http://localhost:8080/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to log out");
      }

      const data = await response.json();
      alert(data.message || "Successfully logged out.");
      window.localStorage.removeItem("token");
      router.push(`/`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case "all_lectures":
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">All Lectures</h1>
            {loading ? (
              <p className="text-blue-500">Loading lectures...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <div>
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Code</th>
                      <th className="border border-gray-300 px-4 py-2">Name</th>
                      <th className="border border-gray-300 px-4 py-2">Year Of Study</th>
                      <th className="border border-gray-300 px-4 py-2">Lecture Type</th>
                      <th className="border border-gray-300 px-4 py-2">Lecture Category</th>
                      <th className="border border-gray-300 px-4 py-2">Examination Type</th>
                      <th className="border border-gray-300 px-4 py-2">Tenured professor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lectures.map((lecture, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{lecture.cod}</td>
                        <td className="border border-gray-300 px-4 py-2">{lecture.nume_disciplina}</td>
                        <td className="border border-gray-300 px-4 py-2">{lecture.an_studiu}</td>
                        <td className="border border-gray-300 px-4 py-2">{lecture.tip_disciplina}</td>
                        <td className="border border-gray-300 px-4 py-2">{lecture.categorie_disciplina}</td>
                        <td className="border border-gray-300 px-4 py-2">{lecture.tip_examinare}</td>
                        <td className="border border-gray-300 px-4 py-2">{lecture.professorName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case "my_lectures":
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">My Lectures</h1>
            <p>Here you can view your assigned lectures.</p>
          </div>
        );
      case "personal_info":
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Personal Information</h1>
            <p>Here you can view and update your personal information.</p>
          </div>
        );
      case "change_password":
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Change Password</h1>
            <p>Here you can change your password.</p>
          </div>
        );
      case "logout":
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-100 to-indigo-100">
            <p className="text-lg font-semibold mb-4">Are you sure you want to log out?</p>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        );
      default:
        return <div className="p-8">Select a page from the sidebar.</div>;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-b from-purple-700 to-blue-500">
      <div className="w-64 bg-white bg-opacity-90 rounded-xl p-6 shadow-xl m-4 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-purple-700 text-center mb-6">Navigation</h2>
          <ul className="space-y-4">
            <li
              onClick={() => changePage("all_lectures")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "all_lectures"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              All Lectures
            </li>
            <li
              onClick={() => changePage("my_lectures")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "my_lectures"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              My Lectures
            </li>
            <li
              onClick={() => changePage("personal_info")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "personal_info"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Personal Information
            </li>
            <li
              onClick={() => changePage("change_password")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "change_password"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Change Password
            </li>
          </ul>
        </div>

        <div>
          <ul>
            <li
              onClick={() => changePage("logout")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "logout"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Logout
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 bg-white bg-opacity-90 rounded-xl p-6 shadow-xl m-4 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default TeacherDashboard;
