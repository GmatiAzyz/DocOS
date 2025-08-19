"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { format } from "date-fns";

interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function AppointmentDetail({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchAppointment();
    }
  }, [status, params.id]);

  const fetchAppointment = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/appointments/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch appointment");
      }
      
      const data = await response.json();
      setAppointment(data);
      setFormData({
        patientId: data.patientId,
        appointmentDate: format(new Date(data.appointmentDate), "yyyy-MM-dd"),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        status: data.status,
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Error fetching appointment:", error);
      toast.error("Failed to load appointment details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update appointment");
      }
      
      const updatedAppointment = await response.json();
      setAppointment(updatedAppointment);
      setIsEditing(false);
      toast.success("Appointment updated successfully");
      fetchAppointment(); // Refresh data
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast.error(error.message || "Failed to update appointment");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this appointment?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }
      
      toast.success("Appointment deleted successfully");
      router.push("/dashboard/appointments");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment");
    }
  };

  const handleCreateVisitNote = () => {
    if (appointment) {
      router.push(`/dashboard/visit-notes/new?appointmentId=${appointment.id}&patientId=${appointment.patientId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "NO_SHOW":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Appointment not found. It may have been deleted or you don't have permission to view it.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push("/dashboard/appointments")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Appointment" : "Appointment Details"}
        </h1>
        <div className="flex space-x-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
              <button
                onClick={handleCreateVisitNote}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Create Visit Note
              </button>
            </>
          )}
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient
              </label>
              <div className="p-3 border rounded-md bg-gray-50">
                {appointment.patient.firstName} {appointment.patient.lastName}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Date
              </label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="INITIAL_CONSULTATION">Initial Consultation</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="ROUTINE_CHECKUP">Routine Checkup</option>
                <option value="PROCEDURE">Procedure</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md h-32"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Patient</h3>
              <p className="mt-1 text-lg">
                {appointment.patient.firstName} {appointment.patient.lastName}
              </p>
              <p className="text-sm text-gray-500">{appointment.patient.email}</p>
              <p className="text-sm text-gray-500">{appointment.patient.phone}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Appointment Details</h3>
              <p className="mt-1 text-lg">
                {format(new Date(appointment.appointmentDate), "MMMM d, yyyy")}
              </p>
              <p className="text-sm text-gray-500">
                {appointment.startTime} - {appointment.endTime}
              </p>
              <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                {appointment.status.replace(/_/g, " ")}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Type</h3>
              <p className="mt-1 text-lg">
                {appointment.type.replace(/_/g, " ")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-lg">
                {/* Display creation date if available */}
                {appointment.createdAt ? format(new Date(appointment.createdAt), "MMMM d, yyyy") : "N/A"}
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="mt-1">
                {appointment.notes || "No notes provided"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => router.push("/dashboard/appointments")}
          className="text-blue-500 hover:text-blue-600"
        >
          &larr; Back to Appointments
        </button>
      </div>
    </div>
  );
}