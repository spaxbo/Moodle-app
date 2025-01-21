"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import {useRouter} from 'next/navigation';
import './styles.css';

const AdminDashboard = () => {
  const [professors, setProfessors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState<string | null>(null);
  const [selectedExamination, setSelectedExamination] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [successMessageEnroll, setSuccessMessageEnroll] = useState<string | null>(null);
  const [successMessageUnenroll, setSuccessMessageUnenroll] = useState<string | null>(null);
  const [successMessageAddCollaborator, setSuccessMessageAddCollaborator] = useState<string | null>(null);
  const [successMessageRemoveCollaborator, setSuccessMessageRemoveCollaborator] = useState<string | null>(null);
  const [currentPageTeachers, setCurrentPageTeachers] = useState(1);
  const [itemsPerPageTeachers, setItemsPerPageTeachers] = useState(2);
  const [currentPageStudents, setCurrentPageStudents] = useState(1);
  const [itemsPerPageStudents, setItemsPerPageStudents] = useState(2);
  const [currentPageLectures, setCurrentPageLectures] = useState(1);
  const [itemsPerPageLectures, setItemsPerPageLectures] = useState(2);
  const [formDataEnroll, setFormDataEnroll] = useState({
    email: "",
    discipline_cod: "",
  });
  const [formDataUnenroll, setFormDataUnenroll] = useState({
    email: "",
    discipline_cod: "",
  });
  const [formDataAddCollaborator, setFormDataAddCollaborator] = useState({
    email: "",
    discipline_cod: "",
  });
  const [formDataRemoveCollaborator, setFormDataRemoveCollaborator] = useState({
    email: "",
    discipline_cod: "",
  });
  const [error, setError] = useState(null);
  const router = useRouter();

  const getActivePageFromQuery = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("activePage") || localStorage.getItem("activePage") || "teachers";
    }
    return "teachers";
  };
  
  const [activePage, setActivePage] = useState("teachers");
  
  useEffect(() => {
    const page = getActivePageFromQuery();
    setActivePage(page);
    window.localStorage.setItem("activePage", page);
  }, []);
  
  useEffect(() => {
    if (activePage) {
      const queryParams = new URLSearchParams(window.location.search);
      queryParams.set("activePage", activePage);
      window.history.replaceState(null, "", `${window.location.pathname}?${queryParams}`);
      fetchData(activePage);
    }
  }, [activePage]);
  
  const fetchData = (type: string) => {
    if (type === "teachers") fetchProfessors();
    else if (type === "students") fetchStudents();
    else if (type === "lectures") fetchLectures();
  };

  const handlePageChangeTeachers = (newPage: number) => {
    setCurrentPageTeachers(newPage);
  };

  const handlePageChangeStudents = (newPage: number) => {
    setCurrentPageStudents(newPage);
  };

  const handlePageChangeLectures = (newPage: number) => {
    setCurrentPageLectures(newPage);
  };
  
  const handleItemsPerPageChangeTeachers = (newItemsPerPage: number) => {
    setItemsPerPageTeachers(newItemsPerPage);
  };

  const handleItemsPerPageChangeStudents = (newItemsPerPage: number) => {
    setItemsPerPageStudents(newItemsPerPage);
  };

  const handleItemsPerPageChangeLectures = (newItemsPerPage: number) => {
    setItemsPerPageLectures(newItemsPerPage);
  };
  
  const changePage = (page: string) => {
    setActivePage(page);
  };

  const handleInputChangeEnroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDataEnroll({ ...formDataEnroll, [e.target.name]: e.target.value });
  };

  const handleInputChangeUnenroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDataUnenroll({ ...formDataUnenroll, [e.target.name]: e.target.value });
  };

  const handleInputChangeAddCollaborator = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDataAddCollaborator({ ...formDataAddCollaborator, [e.target.name]: e.target.value });
  };

  const handleInputChangeRemoveCollaborator = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDataRemoveCollaborator({ ...formDataRemoveCollaborator, [e.target.name]: e.target.value });
  };
  
  const fetchProfessors = async ( page: number = 1,
    itemsPerPage : number = 6,
    associationType: string | null = null) => {
    setLoading(true);
    setError(null);

    try{
      const token = window.localStorage.getItem("token");
      if(!token){
        throw new Error("Authentication token is missing");
      }
      const queryParams = new URLSearchParams();
      queryParams.set("page", page.toString());
      queryParams.set("items_per_page", itemsPerPage.toString());
      if(associationType){
        queryParams.set("tip_asociere", associationType);
      }
      const response = await fetch(`http://localhost:8000/api/academia/professors?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if(!response.ok){
        throw new Error(`Failed to fetch professors: ${response.statusText}`);
      }
      const data = await response.json();
      setProfessors(data.professors || []);
    }catch(err:any){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents(currentPageStudents, itemsPerPageStudents, selectedCycle);
  }, [currentPageStudents, itemsPerPageStudents, selectedCycle]);

  useEffect(() => {
    fetchProfessors(currentPageTeachers, itemsPerPageTeachers, selectedAssociation);
  }, [currentPageTeachers, itemsPerPageTeachers, selectedAssociation]);

  useEffect(() => {
    fetchLectures(currentPageLectures, itemsPerPageLectures, selectedExamination);
  }, [currentPageLectures, itemsPerPageLectures, selectedExamination]);

  const handleAssociationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const associationType = event.target.value || null;
    setSelectedAssociation(associationType);
    fetchProfessors(currentPageTeachers, itemsPerPageTeachers, associationType);
  };

  const fetchStudents = async (page: number = 1,
    itemsPerPage : number = 6,
    studyCycle: string | null = null) => {
    setLoading(true);
    setError(null);

    try{
      const token = window.localStorage.getItem("token");
      if(!token){
        throw new Error("Authentication token is missing");
      }
      const queryParams = new URLSearchParams();
      queryParams.set("page", page.toString());
      queryParams.set("items_per_page", itemsPerPage.toString());
      if(studyCycle){
        queryParams.set("ciclu_studii", studyCycle);
      }
      const response = await fetch(`http://localhost:8000/api/academia/students?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if(!response.ok){
        throw new Error(`Failed to fetch students: ${response.statusText}`);
      }
      const data = await response.json();
      setStudents(data.students || []);
    }catch(err:any){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  }

  const handleStudyCycleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const studyCycle = event.target.value || null;
    setSelectedCycle(studyCycle);
    fetchStudents(currentPageStudents, itemsPerPageStudents, studyCycle);
  };

  const fetchLectures = async (page: number = 1,
    itemsPerPage : number = 6,
    examinationType: string | null = null) =>{
    setLoading(true);
    setError(null);

    try{
      const token = window.localStorage.getItem("token");
      if(!token){
        throw new Error("Authentication token is missing");
      }
      const queryParams = new URLSearchParams();
      queryParams.set("page", page.toString());
      queryParams.set("items_per_page", itemsPerPage.toString());
      if(examinationType){
        queryParams.set("tip_examinare", examinationType);
      }
      const response = await fetch(`http://localhost:8000/api/academia/lectures?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if(!response.ok){
        throw new Error(`Failed to fetch lectures: ${response.statusText}`);
      }

      const data = await response.json();

      const lecturesWithProfessors = await Promise.all(
        data.disciplines.map(async (lecture:any) => {
          if (lecture._links.read_titular?.href) {
            const professorResponse = await fetch(`http://localhost:8000/${lecture._links.read_titular.href}`, {
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
          }
          return { ...lecture, professorName: "No titular" };
        })
      );

      setLectures(lecturesWithProfessors);
    }catch(err:any){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  }

  const handleExaminationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const examinationType = event.target.value || null;
    setSelectedExamination(examinationType);
    fetchLectures(currentPageLectures, itemsPerPageLectures, examinationType);
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
          "Authorization": `Bearer ${token}`,
        },
      });

      if(!response.ok){
        throw new Error("Failed to log out");
      }


      const data = await response.json();
      alert(data.message || "Successfully logged out.");

      window.localStorage.removeItem("token");
      router.push(`/`);

    }catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const deleteProfessor = async(professorId: number) => {
    try{
      const token = window.localStorage.getItem("token");
      if(!token){
        throw new Error("Authentication token is missing");
      }

      const professor = professors.find((prof: any) => prof.id === professorId);
      if (!professor) {
        throw new Error("Professor not found");
      }

      const baseUrl = "http://localhost:8000";
      const deleteLink = baseUrl + professor._links.delete.href;
      const deleteMethod = professor._links.delete.method;
      const username = professor.email;

      if(!deleteMethod){
        throw new Error("Delete method is missing");
      }

      const response = await fetch(deleteLink, {
        method: deleteMethod,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if(!response.ok){
        throw new Error(`Failed to delete professor: ${response.statusText}`);
      }

      const responseIDM = await fetch("http://localhost:8080/deleteUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username
        }),
      });

      if(!responseIDM.ok){
        throw new Error(`Failed to delete IDM user: ${responseIDM.statusText}`);
      }

      setProfessors((prev) => prev.filter((prof:any) => prof.id !== professorId));
      
    }catch (err: any) {
      alert(err.message);
    }
  }

  const deleteStudent = async(studentId: number) => {
    try{
      const token = window.localStorage.getItem("token");
      if(!token){
        throw new Error("Authentication token is missing");
      }

      const student = students.find((stud: any) => stud.id === studentId);
      if (!student) {
        throw new Error("Student not found");
      }

      const baseUrl = "http://localhost:8000";
      const deleteLink = baseUrl + student._links.delete.href;
      const deleteMethod = student._links.delete.method;
      const username = student.email;

      const response = await fetch(deleteLink, {
        method: deleteMethod,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if(!response.ok){
        throw new Error(`Failed to delete student: ${response.statusText}`);
      }

      const responseIDM = await fetch("http://localhost:8080/deleteUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username
        }),
      });

      if(!responseIDM.ok){
        throw new Error(`Failed to delete IDM user: ${responseIDM.statusText}`);
      }

      setStudents((prev) => prev.filter((stud:any) => stud.id !== studentId));
      
    }catch (err: any) {
      alert(err.message);
    }
  }

  const deleteLecture = async(lectureCode: string) => {
    try{
      const token = window.localStorage.getItem("token");
      if(!token){
        throw new Error("Authentication token is missing");
      }

      const lecture = lectures.find((stud: any) => stud.cod === lectureCode);
      if (!lecture) {
        throw new Error("Lecture not found");
      }

      const baseUrl = "http://localhost:8000";
      const deleteLink = baseUrl + lecture._links.delete.href;
      const deleteMethod = lecture._links.delete.method;

      const response = await fetch(deleteLink, {
        method: deleteMethod,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if(!response.ok){
        throw new Error(`Failed to delete student: ${response.statusText}`);
      }

      setLectures((prev) => prev.filter((stud:any) => stud.cod !== lectureCode));
      
    }catch (err: any) {
      alert(err.message);
    }
  }

  const handleSubmitEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessageEnroll(null);

    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch("http://localhost:8000/api/academia/students/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formDataEnroll),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to enroll student");
      }

      setSuccessMessageEnroll("Student enrolled successfully!");
      setFormDataEnroll({ email: "", discipline_cod: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUnenroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessageUnenroll(null);

    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch("http://localhost:8000/api/academia/students/unenroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formDataUnenroll),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to unenroll student");
      }

      setSuccessMessageUnenroll("Student unenrolled successfully!");
      setFormDataUnenroll({ email: "", discipline_cod: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessageAddCollaborator(null);

    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch("http://localhost:8000/api/academia/lectures/collaborators/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formDataAddCollaborator),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to add collaborator");
      }

      setSuccessMessageAddCollaborator("Collaborator added successfully!");
      setFormDataAddCollaborator({ email: "", discipline_cod: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRemoveCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessageRemoveCollaborator(null);

    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const response = await fetch("http://localhost:8000/api/academia/lectures/collaborators/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formDataRemoveCollaborator),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to remove collaborator");
      }

      setSuccessMessageRemoveCollaborator("Collaborator removed successfully!");
      setFormDataRemoveCollaborator({ email: "", discipline_cod: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case "teachers":
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Teachers</h1>
            <div className="flex justify-center gap-12 mb-20">
              <button
                onClick={() => router.push("admin/teachers_create")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Create Teacher
              </button>
              <select
                value={selectedAssociation || ""}
                onChange={handleAssociationChange}
                className="bg-purple-500 text-white border border-purple-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">Association Type</option>
                <option value="titular">titular</option>
                <option value="asociat">asociat</option>
                <option value="extern">extern</option>
              </select>

              <input
                type="number"
                min="1"
                value={currentPageTeachers}
                onChange={(e) => handlePageChangeTeachers(Number(e.target.value))}
                className="w-20 bg-gray-100 border border-gray-500 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="Page"
              />

              <select
                value={itemsPerPageTeachers}
                onChange={(e) => handleItemsPerPageChangeTeachers(Number(e.target.value))}
                className="bg-gray-500 text-white border border-gray-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value={2}>2 items</option>
                <option value={4}>4 items</option>
                <option value={6}>6 items</option>
              </select>
            </div>
            {loading && <p className="mt-4 text-blue-500">Loading...</p>}
            {error && <p className="mt-4 text-red-500">Error: {error}</p>}
            {professors.length >= 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">Teachers List</h2>
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Id</th>
                      <th className="border border-gray-300 px-4 py-2">Name</th>
                      <th className="border border-gray-300 px-4 py-2">Email</th>
                      <th className="border border-gray-300 px-4 py-2">Teaching rank</th>
                      <th className="border border-gray-300 px-4 py-2">Association type</th>
                      <th className="border border-gray-300 px-4 py-2">Association</th>
                      <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professors.map((professor:any, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{professor.id}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {professor.nume} {professor.prenume}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{professor.email}</td>
                        <td className="border border-gray-300 px-4 py-2">{professor.grad_didactic}</td>
                        <td className="border border-gray-300 px-4 py-2">{professor.tip_asociere}</td>
                        <td className="border border-gray-300 px-4 py-2">{professor.asociere}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`admin/teachers_update?getMethod=${professor._links.self.method}&getLink=${professor._links.self.href}&updateMethod=${professor._links.update.method}&updateLink=${professor._links.update.href}`)}
                              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteProfessor(professor.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case "lectures":
        return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Lectures</h1>
          <div className="flex justify-center gap-12 mb-20">
            <button
              onClick={() => router.push("admin/lectures_create")}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Create Lecture
            </button>
            <select
              value={selectedExamination || ""}
              onChange={handleExaminationChange}
              className="bg-purple-500 text-white border border-purple-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">Examination Type</option>
              <option value="examen">examen</option>
              <option value="colocviu">colocviu</option>
            </select>
            <input
              type="number"
              min="1"
              value={currentPageLectures}
              onChange={(e) => handlePageChangeLectures(Number(e.target.value))}
              className="w-20 bg-gray-100 border border-gray-500 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Page"
            />

            <select
              value={itemsPerPageLectures}
              onChange={(e) => handleItemsPerPageChangeLectures(Number(e.target.value))}
              className="bg-gray-500 text-white border border-gray-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value={2}>2 items</option>
              <option value={4}>4 items</option>
              <option value={6}>6 items</option>
            </select>
          </div>
          {loading && <p className="mt-4 text-blue-500">Loading...</p>}
          {error && <p className="mt-4 text-red-500">Error: {error}</p>}
          {lectures.length >= 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Lectures List</h2>
              <table className="table-auto w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2">Code</th>
                    <th className="border border-gray-300 px-4 py-2">Name</th>
                    <th className="border border-gray-300 px-4 py-2">Year of Study</th>
                    <th className="border border-gray-300 px-4 py-2">Discipline Type</th>
                    <th className="border border-gray-300 px-4 py-2">Discipline Category</th>
                    <th className="border border-gray-300 px-4 py-2">Examination Type</th>
                    <th className="border border-gray-300 px-4 py-2">Professor</th>
                    <th className="border border-gray-300 px-4 py-2">Actions</th>
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
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`admin/lectures_update?getMethod=${lecture._links.self.method}&getLink=${lecture._links.self.href}&updateMethod=${lecture._links.update.method}&updateLink=${lecture._links.update.href}`)}
                            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteLecture(lecture.cod)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
      case "students":
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Students</h1>
            <div className="flex justify-center gap-12 mb-20">
              <button
                onClick={() => router.push("admin/students_create")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Create Student
              </button>
              <select
                value={selectedCycle || ""}
                onChange={handleStudyCycleChange}
                className="bg-purple-500 text-white border border-purple-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">Study Cycle</option>
                <option value="licenta">licenta</option>
                <option value="master">master</option>
              </select>

              <input
                type="number"
                min="1"
                value={currentPageStudents}
                onChange={(e) => handlePageChangeStudents(Number(e.target.value))}
                className="w-20 bg-gray-100 border border-gray-500 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="Page"
              />

              <select
                value={itemsPerPageStudents}
                onChange={(e) => handleItemsPerPageChangeStudents(Number(e.target.value))}
                className="bg-gray-500 text-white border border-gray-700 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value={2}>2 items</option>
                <option value={4}>4 items</option>
                <option value={6}>6 items</option>
              </select>
            </div>
            {loading && <p className="mt-4 text-blue-500">Loading...</p>}
            {error && <p className="mt-4 text-red-500">Error: {error}</p>}
            {students.length >= 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">Students List</h2>
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Id</th>
                      <th className="border border-gray-300 px-4 py-2">Name</th>
                      <th className="border border-gray-300 px-4 py-2">Email</th>
                      <th className="border border-gray-300 px-4 py-2">Study Cycle</th>
                      <th className="border border-gray-300 px-4 py-2">Year Of Study</th>
                      <th className="border border-gray-300 px-4 py-2">Group</th>
                      <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student:any, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{student.id}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {student.nume} {student.prenume}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{student.email}</td>
                        <td className="border border-gray-300 px-4 py-2">{student.ciclu_studii}</td>
                        <td className="border border-gray-300 px-4 py-2">{student.an_studiu}</td>
                        <td className="border border-gray-300 px-4 py-2">{student.grupa}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`admin/students_update?getMethod=${student._links.self.method}&getLink=${student._links.self.href}&updateMethod=${student._links.update.method}&updateLink=${student._links.update.href}`)}
                              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteStudent(student.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case "enroll_student":
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
              <h1 className="text-2xl font-bold mb-4 text-center">Enroll Student</h1>
              <form onSubmit={handleSubmitEnroll} className="space-y-4">
                {error && <div className="text-red-500 text-center">{error}</div>}
                {successMessageEnroll && (
                  <div className="text-green-500 text-center">{successMessageEnroll}</div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="email">
                    Student Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formDataEnroll.email}
                    onChange={handleInputChangeEnroll}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="discipline_cod"
                  >
                    Discipline Code
                  </label>
                  <input
                    type="text"
                    id="discipline_cod"
                    name="discipline_cod"
                    value={formDataEnroll.discipline_cod}
                    onChange={handleInputChangeEnroll}
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
                  {loading ? "Enrolling..." : "Enroll"}
                </button>
              </form>
            </div>
          </div>
        );
      case "unenroll_student":
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
              <h1 className="text-2xl font-bold mb-4 text-center">Unenroll Student</h1>
              <form onSubmit={handleSubmitUnenroll} className="space-y-4">
                {error && <div className="text-red-500 text-center">{error}</div>}
                {successMessageUnenroll && (
                  <div className="text-green-500 text-center">{successMessageUnenroll}</div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="email">
                    Student Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formDataUnenroll.email}
                    onChange={handleInputChangeUnenroll}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="discipline_cod"
                  >
                    Discipline Code
                  </label>
                  <input
                    type="text"
                    id="discipline_cod"
                    name="discipline_cod"
                    value={formDataUnenroll.discipline_cod}
                    onChange={handleInputChangeUnenroll}
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
                  {loading ? "Unenrolling..." : "Unenroll"}
                </button>
              </form>
            </div>
          </div>
        );
      case "add_collaborator":
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
              <h1 className="text-2xl font-bold mb-4 text-center">Add Collaborator</h1>
              <form onSubmit={handleSubmitAddCollaborator} className="space-y-4">
                {error && <div className="text-red-500 text-center">{error}</div>}
                {successMessageAddCollaborator && (
                  <div className="text-green-500 text-center">{successMessageAddCollaborator}</div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="email">
                    Teacher Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formDataAddCollaborator.email}
                    onChange={handleInputChangeAddCollaborator}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="discipline_cod"
                  >
                    Discipline Code
                  </label>
                  <input
                    type="text"
                    id="discipline_cod"
                    name="discipline_cod"
                    value={formDataAddCollaborator.discipline_cod}
                    onChange={handleInputChangeAddCollaborator}
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
                  {loading ? "Adding..." : "Added"}
                </button>
              </form>
            </div>
          </div>
        );
      case "remove_collaborator":
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
              <h1 className="text-2xl font-bold mb-4 text-center">Remove Collaborator</h1>
              <form onSubmit={handleSubmitRemoveCollaborator} className="space-y-4">
                {error && <div className="text-red-500 text-center">{error}</div>}
                {successMessageRemoveCollaborator && (
                  <div className="text-green-500 text-center">{successMessageRemoveCollaborator}</div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="email">
                    Teacher Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formDataRemoveCollaborator.email}
                    onChange={handleInputChangeRemoveCollaborator}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="discipline_cod"
                  >
                    Discipline Code
                  </label>
                  <input
                    type="text"
                    id="discipline_cod"
                    name="discipline_cod"
                    value={formDataRemoveCollaborator.discipline_cod}
                    onChange={handleInputChangeRemoveCollaborator}
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
                  {loading ? "Removing..." : "Removed"}
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
          <h2 className="text-2xl font-bold text-purple-700 text-center mb-6">
            Navigation
          </h2>
          <ul className="space-y-4">
            <li
              onClick={() => changePage("teachers")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "teachers"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Teachers
            </li>
            <li
              onClick={() => changePage("lectures")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "lectures"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Lectures
            </li>
            <li
              onClick={() => changePage("students")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "students"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Students
            </li>
            <li
              onClick={() => changePage("enroll_student")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "enroll"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Enroll Student
            </li>
            <li
              onClick={() => changePage("unenroll_student")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "enroll"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Unenroll Student
            </li>
            <li
              onClick={() => changePage("add_collaborator")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "collaborators"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Add collaborators at lecture
            </li>
            <li
              onClick={() => changePage("remove_collaborator")}
              className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                activePage === "collaborators"
                  ? "bg-purple-200 text-purple-700"
                  : "hover:bg-purple-200 hover:text-purple-700"
              }`}
            >
              Delete collaborators from lecture
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

export default AdminDashboard;
