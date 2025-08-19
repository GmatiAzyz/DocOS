"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  dob: string;
  address: string | null;
  emergencyContact: string | null;
  medicalHistory: string | null;
  allergies: string | null;
  medications: string | null;
  createdAt: string;
  appointments: Array<{
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
  }>;
  visitNotes: Array<{
    id: string;
    visitDate: string;
    symptoms: string;
    diagnosis: string;
    treatment: string;
  }>;
};

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch patient");
        }
        const data = await response.json();
        setPatient(data);
      } catch (error) {
        console.error("Error fetching patient:", error);
        toast.error("Failed to load patient details");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/patients/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete patient");
      }

      toast.success("Patient deleted successfully");
      router.push("/dashboard/patients");
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error("Failed to delete patient");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Patient Not Found</h1>
        <p className="mb-4">The patient you are looking for does not exist or you don't have permission to view it.</p>
        <Link
          href="/dashboard/patients"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Back to Patients
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-gray-600">Patient ID: {patient.id}</p>
        </div>
        <div className="flex space-x-2">
          <Link
            href={`/dashboard/patients/${patient.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Edit Patient
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "appointments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "notes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Visit Notes
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                Personal Information
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 text-sm">Full Name:</span>
                  <p className="font-medium">
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Date of Birth:</span>
                  <p className="font-medium">
                    {new Date(patient.dob).toLocaleDateString()} (
                    {calculateAge(patient.dob)} years)
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Phone:</span>
                  <p className="font-medium">{patient.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Email:</span>
                  <p className="font-medium">{patient.email || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Address:</span>
                  <p className="font-medium">{patient.address || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Emergency Contact:</span>
                  <p className="font-medium">
                    {patient.emergencyContact || "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Patient Since:</span>
                  <p className="font-medium">
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                Medical Information
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-500 text-sm">Medical History:</span>
                  <p className="mt-1 whitespace-pre-wrap">
                    {patient.medicalHistory || "No medical history recorded"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Allergies:</span>
                  <p className="mt-1 whitespace-pre-wrap">
                    {patient.allergies || "No allergies recorded"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Current Medications:</span>
                  <p className="mt-1 whitespace-pre-wrap">
                    {patient.medications || "No medications recorded"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <Link
              href={`/dashboard/appointments/new?patientId=${patient.id}`}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Schedule Appointment
            </Link>
            <Link
              href={`/dashboard/visits/new?patientId=${patient.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Create Visit Note
            </Link>
          </div>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Appointment History</h2>
            <Link
              href={`/dashboard/appointments/new?patientId=${patient.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              New Appointment
            </Link>
          </div>

          {patient.appointments && patient.appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patient.appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/dashboard/appointments/${appointment.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No appointments found for this patient.
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Visit Notes</h2>
            <Link
              href={`/dashboard/visits/new?patientId=${patient.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              New Visit Note
            </Link>
          </div>

          {patient.visitNotes && patient.visitNotes.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {patient.visitNotes.map((note) => (
                <div key={note.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Visit on {new Date(note.visitDate).toLocaleDateString()}
                      </h3>
                    </div>
                    <Link
                      href={`/dashboard/visits/${note.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Symptoms</h4>
                      <p className="text-sm text-gray-900">{note.symptoms}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Diagnosis</h4>
                      <p className="text-sm text-gray-900">{note.diagnosis}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Treatment</h4>
                      <p className="text-sm text-gray-900">{note.treatment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No visit notes found for this patient.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'no-show':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}