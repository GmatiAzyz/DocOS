"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Link from "next/link";

interface VisitNote {
  id: string;
  visitDate: string;
  chiefComplaint: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  appointment?: {
    id: string;
    appointmentDate: string;
    startTime: string;
  } | null;
}

export default function VisitNotes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visitNotes, setVisitNotes] = useState<VisitNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchVisitNotes();
    }
  }, [status]);

  const fetchVisitNotes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/visit-notes");
      
      if (!response.ok) {
        throw new Error("Failed to fetch visit notes");
      }
      
      const data = await response.json();
      setVisitNotes(data);
    } catch (error) {
      console.error("Error fetching visit notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVisitNotes = visitNotes.filter((note) => {
    const patientName = `${note.patient.firstName} ${note.patient.lastName}`.toLowerCase();
    const complaint = note.chiefComplaint.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return patientName.includes(search) || complaint.includes(search);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Visit Notes</h1>
        <Link
          href="/dashboard/visit-notes/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Visit Note
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by patient name or chief complaint..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredVisitNotes.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">
            {searchTerm ? "No visit notes match your search." : "No visit notes found. Create your first one!"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chief Complaint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Related Appointment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVisitNotes.map((note) => (
                <tr key={note.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(note.visitDate), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/patients/${note.patient.id}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {note.patient.firstName} {note.patient.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="line-clamp-1">{note.chiefComplaint}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {note.appointment ? (
                      <Link
                        href={`/dashboard/appointments/${note.appointment.id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {format(new Date(note.appointment.appointmentDate), "MMM d")} at {note.appointment.startTime}
                      </Link>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/visit-notes/${note.id}`}
                      className="text-blue-500 hover:text-blue-700 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/visit-notes/${note.id}/edit`}
                      className="text-green-500 hover:text-green-700"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}