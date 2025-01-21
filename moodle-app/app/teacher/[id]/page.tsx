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
  const [myLectures, setMyLectures] = useState<any[]>([]);
  const [selectedMaterialType, setSelectedMaterialType] = useState("pdf");
  const [professorData, setProfessorData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    teachingRank: string;
    associationType: string;
    association: string;
  } | null>(null);
  const [successMessageChangePassword, setSuccessChangePassword] = useState<string | null>(null);
  const [formDataChangePassword, setFormDataChangePassword] = useState({
      currentPassword: "",
      newPassword: "",
    });
  const router = useRouter();

  const { id: professorId } = useParams(); 

  useEffect(() => {
    const page = getActivePageFromQuery();
    setActivePage(page);
    window.localStorage.setItem("activePage", page);
  }, [professorId]);

  useEffect(() => {
    if (!professorId || Array.isArray(professorId)) {
      setError("Professor ID is missing or invalid");
      return;
    }

    if (activePage) {
      const queryParams = new URLSearchParams(window.location.search);
      queryParams.set("activePage", activePage);
      window.history.replaceState(null, "", `${window.location.pathname}?${queryParams}`);
    }
    if (activePage === "all_lectures") {
      fetchAllLectures(professorId as string);
    } else if (activePage === "my_lectures") {
      fetchMyLectures(professorId);
    }

    fetchProfessorData(professorId);
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

  const fetchMyLectures = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing.");
      }
  
      const response = await fetch(
        `http://localhost:8000/api/academia/professors/${id}/lectures`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch lectures.");
      }
  
      const data = await response.json();
      setMyLectures(data.lectures);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvaluation = async (href: string, method: string) => {
    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in again");
      }

      const baseUrl = "http://localhost:8000";
      const full_link = baseUrl + href;
  
      const response = await fetch(full_link, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete evaluation.");
      }
  
      const data = await response.json();
      alert(data.message || "The evaluation has been successfully deleted.");
      window.location.reload();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };
  
  const handleDeleteMaterials = async (href: string, method: string) => {
    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in again");
      }
  
      const baseUrl = "http://localhost:8000";
      let full_link = baseUrl + href;

      const response = await fetch(full_link, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete material.");
      }
  
      const data = await response.json();
      alert(data.message || "The material has been successfully deleted.");
      window.location.reload();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };
  
  
  const changePage = (page: string) => {
    setActivePage(page);
  };

  const handleInputChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDataChangePassword({ ...formDataChangePassword, [e.target.name]: e.target.value });
  };

  const fetchProfessorData = async (id: string) => {
    try {
      setLoading(true);
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing.");
      }
  
      const response = await fetch(`http://localhost:8000/api/academia/professors/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch professor data.");
      }
  
      const data = await response.json();
      setProfessorData({
        firstName: data.nume,
        lastName: data.prenume,
        email: data.email,
        teachingRank: data.grad_didactic,
        associationType: data.tip_asociere,
        association: data.asociere
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDataChangePassword.newPassword || formDataChangePassword.newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }
  
    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing.");
      }

      const professorResponse = await fetch(
        `http://localhost:8000/api/academia/professors/${professorId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!professorResponse.ok) {
        throw new Error("Failed to fetch professor details.");
      }
  
      const professorData = await professorResponse.json();
      const username = professorData.email;
  
      const changePasswordResponse = await fetch(
        "http://localhost:8080/changePassword",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: username,
            current_password: formDataChangePassword.currentPassword,
            new_password: formDataChangePassword.newPassword,
          }),
        }
      );
  
      if (!changePasswordResponse.ok) {
        const errorData = await changePasswordResponse.json();
        throw new Error(errorData.detail || "Failed to change password.");
      }
  
      setSuccessChangePassword("Password changed successfully!");
      setFormDataChangePassword({ currentPassword: "", newPassword: "" });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
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
                      <th className="border border-gray-300 px-4 py-2">Tenured teacher</th>
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
                    <th className="border border-gray-300 px-4 py-2">Evaluations</th>
                    <th className="border border-gray-300 px-4 py-2">Materials</th>
                    <th className="border border-gray-300 px-4 py-2">Students</th>
                    <th className="border border-gray-300 px-4 py-2">Collaborators</th>
                  </tr>
                </thead>
                <tbody>
                  {myLectures.map((lecture, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{lecture.cod}</td>
                      <td className="border border-gray-300 px-4 py-2">{lecture.nume_disciplina}</td>
                      <td className="border border-gray-300 px-4 py-2">{lecture.an_studiu}</td>
                      <td className="border border-gray-300 px-4 py-2">{lecture.tip_disciplina}</td>
                      <td className="border border-gray-300 px-4 py-2">{lecture.categorie_disciplina}</td>
                      <td className="border border-gray-300 px-4 py-2">{lecture.tip_examinare}</td>
                      <td className="border border-gray-300 px-4 py-2 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => router.push(`${professorId}/create_evaluation?link=${lecture._links.create_evaluation.href}&method=${lecture._links.create_evaluation.method}`)}
                            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                            Create
                          </button>
                          <button
                            onClick={() => router.push(`${professorId}/get_evaluation?get_link=${lecture._links.get_evaluation.href}&get_method=${lecture._links.get_evaluation.method}&update_link=${lecture._links.update_evaluation.href}&update_method=${lecture._links.update_evaluation.method}`)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                            List & Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete?")) {
                                handleDeleteEvaluation(lecture._links.delete_evaluation.href, lecture._links.delete_evaluation.method)
                              }
                            }}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                            Delete
                          </button>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => router.push(`${professorId}/create_materials?link=${lecture._links.create_materials.href}&method=${lecture._links.create_materials.method}`)}
                            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                            Create
                          </button>
                          <button
                            onClick={() => router.push(`${professorId}/get_materials?get_link=${lecture._links.get_materials.href}&get_method=${lecture._links.get_materials.method}&update_link=${lecture._links.update_materials.href}&update_method=${lecture._links.update_materials.method}`)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                            List & Edit
                          </button>
                          <button
                             onClick={() => {
                              if (window.confirm("Are you sure you want to delete?")) {
                                handleDeleteMaterials(lecture._links.delete_materials.href, lecture._links.delete_materials.method)
                              }
                            }} 
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                            Delete
                          </button>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 space-y-2">
                        <button
                          onClick={() => router.push(`${professorId}/get_students?link=${lecture._links.students.href}&method=${lecture._links.students.method}`)}
                          className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600">
                          List
                        </button>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 space-y-2">
                        <button
                          onClick={() => router.push(`${professorId}/get_collaborators?link=${lecture._links.collaborators.href}&method=${lecture._links.collaborators.method}`)}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                          List
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        );
      case "personal_info":
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
              <h1 className="text-2xl font-bold mb-4 text-center">Personal Information</h1>
              {loading ? (
              <div className="text-center">Loading...</div>
              ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
              ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <p className="bg-gray-100 px-3 py-2 rounded-lg">{professorData?.firstName} {professorData?.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <p className="bg-gray-100 px-3 py-2 rounded-lg">{professorData?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teaching Rank</label>
                  <p className="bg-gray-100 px-3 py-2 rounded-lg">{professorData?.teachingRank}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Association Type</label>
                  <p className="bg-gray-100 px-3 py-2 rounded-lg">{professorData?.associationType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Association</label>
                  <p className="bg-gray-100 px-3 py-2 rounded-lg">{professorData?.association}</p>
                </div>
              </div>
              )}
            </div>
          </div>
        );
      case "change_password":
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
              <h1 className="text-2xl font-bold mb-4 text-center">Change Password</h1>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {error && <div className="text-red-500 text-center">{error}</div>}
                {successMessageChangePassword && (
                  <div className="text-green-500 text-center">{successMessageChangePassword}</div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formDataChangePassword.currentPassword}
                    onChange={handleInputChangePassword}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="newPassword"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formDataChangePassword.newPassword}
                    onChange={handleInputChangePassword}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`w-full px-4 py-2 rounded-lg text-white ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  disabled={loading}
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
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
