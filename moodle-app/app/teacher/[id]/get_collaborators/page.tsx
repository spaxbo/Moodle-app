"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import './styles.css';

type Collaborator = {
  professor_name: string;
  professor_email: string;
  profesor_association: string;
};

const GetCollaborators = () => {
  const searchParams = useSearchParams();
  const method = searchParams.get('method');
  const link_incomplete = searchParams.get('link');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = "http://localhost:8000";
  const full_link = baseUrl + link_incomplete;

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        if (!method || !full_link) {
          throw new Error("Invalid method or link");
        }

        const token = window.localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found. Please log in again");
        }

        const response = await fetch(full_link as string, {
          method: method as string,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch collaborators.");
        }

        const data = await response.json();
        setCollaborators(data.collaborators || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (full_link && method) {
      fetchCollaborators();
    }
  }, [full_link, method]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-purple-100 to-blue-100 p-8">
      <h1 className="text-2xl font-bold mb-4 text-black">Collaborators List</h1>
      {collaborators.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300 bg-white shadow-md rounded-md">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Association</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((collaborator, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{collaborator.professor_name}</td>
                  <td className="border border-gray-300 px-4 py-2">{collaborator.professor_email}</td>
                  <td className="border border-gray-300 px-4 py-2">{collaborator.profesor_association}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-red-500">No collaborators found for this discipline.</p>
      )}
    </div>
  );  
};

export default GetCollaborators;

