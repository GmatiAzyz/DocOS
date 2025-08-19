"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import Link from "next/link";

interface VisitNote {
  id: string;
  visitDate: string;
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpInstructions: string | null;
  medications: string | null;
  labOrders: string | null;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
  };
  appointment?: {
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    type: string;
  } | null;
}

export default function VisitNoteDetail({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visitNote, setVisitNote] = useState<VisitNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchVisitNote();
    }
  }, [status, params.id]);

  const fetchVisitNote = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/visit-notes/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch visit note");
      }
      
      const data = await response.json();
      setVisitNote(data);
    } catch (error) {
      console.error("Error fetching visit note:", error);
      toast.error("Failed to load visit note details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this visit note?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/visit-notes/${params.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete visit note");
      }
      
      toast.success("Visit note deleted successfully");
      router.push("/dashboard/visit-notes");
    } catch (error) {
      console.error("Error deleting visit note:", error);
      toast.error("Failed to delete visit note");
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!visitNote) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Visit note not found. It may have been deleted or you don't have permission to view it.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push("/dashboard/visit-notes")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Visit Notes
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Visit Note</h1>
        <div className="flex space-x-2">
          <Link
            href={`/dashboard/visit-notes/${params.id}/edit`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Print
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Patient</h3>
            <p className="mt-1 text-lg">
              <Link
                href={`/dashboard/patients/${visitNote.patient.id}`}
                className="text-blue-500 hover:text-blue-700"
              >
                {visitNote.patient.firstName} {visitNote.patient.lastName}
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              {visitNote.patient.gender}, {calculateAge(visitNote.patient.dateOfBirth)} years
            </p>
            <p className="text-sm text-gray-500">{visitNote.patient.email}</p>
            <p className="text-sm text-gray-500">{visitNote.patient.phone}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Visit Details</h3>
            <p className="mt-1 text-lg">
              {format(new Date(visitNote.visitDate), "MMMM d, yyyy")}
            </p>
            {visitNote.appointment && (
              <p className="text-sm text-gray-500">
                <Link
                  href={`/dashboard/appointments/${visitNote.appointment.id}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Related to appointment at {visitNote.appointment.startTime}
                </Link>
              </p>
            )}
            <p className="text-sm text-gray-500">
              Created: {format(new Date(visitNote.createdAt), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500">Chief Complaint</h3>
          <p className="mt-1 text-lg">{visitNote.chiefComplaint}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Subjective</h3>
            <p className="whitespace-pre-line">{visitNote.subjective}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="font-medium text-green-800 mb-2">Objective</h3>
            <p className="whitespace-pre-line">{visitNote.objective}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-md">
            <h3 className="font-medium text-yellow-800 mb-2">Assessment</h3>
            <p className="whitespace-pre-line">{visitNote.assessment}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-md">
            <h3 className="font-medium text-purple-800 mb-2">Plan</h3>
            <p className="whitespace-pre-line">{visitNote.plan}</p>
          </div>
        </div>

        {(visitNote.followUpInstructions || visitNote.medications || visitNote.labOrders) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {visitNote.followUpInstructions && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Follow-up Instructions</h3>
                <p className="whitespace-pre-line">{visitNote.followUpInstructions}</p>
              </div>
            )}

            {visitNote.medications && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Medications</h3>
                <p className="whitespace-pre-line">{visitNote.medications}</p>
              </div>
            )}

            {visitNote.labOrders && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Lab Orders</h3>
                <p className="whitespace-pre-line">{visitNote.labOrders}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push("/dashboard/visit-notes")}
          className="text-blue-500 hover:text-blue-600"
        >
          &larr; Back to Visit Notes
        </button>
      </div>
    </div>
  );
}