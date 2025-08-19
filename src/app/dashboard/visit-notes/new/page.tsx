"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { format } from "date-fns";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
}

export default function NewVisitNote() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      patientId: "",
      appointmentId: "",
      visitDate: format(new Date(), "yyyy-MM-dd"),
      chiefComplaint: "",
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
      followUpInstructions: "",
      medications: "",
      labOrders: "",
    }
  });

  const watchPatientId = watch("patientId");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchPatients();
      
      // Check for query parameters
      const patientId = searchParams.get("patientId");
      const appointmentId = searchParams.get("appointmentId");
      
      if (patientId) {
        setValue("patientId", patientId);
        setSelectedPatientId(patientId);
      }
      
      if (appointmentId) {
        setValue("appointmentId", appointmentId);
        fetchAppointmentDetails(appointmentId);
      }
    }
  }, [status, searchParams]);

  useEffect(() => {
    if (watchPatientId) {
      setSelectedPatientId(watchPatientId);
      fetchPatientAppointments(watchPatientId);
    } else {
      setAppointments([]);
    }
  }, [watchPatientId]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/patients");
      
      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }
      
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientAppointments = async (patientId: string) => {
    try {
      const response = await fetch(`/api/appointments?patientId=${patientId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      
      const data = await response.json();
      // Filter to only show appointments that are in the past or today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const filteredAppointments = data.filter((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate <= today;
      });
      
      setAppointments(filteredAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchAppointmentDetails = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch appointment details");
      }
      
      const data = await response.json();
      setValue("patientId", data.patientId);
      setSelectedPatientId(data.patientId);
      setValue("visitDate", format(new Date(data.appointmentDate), "yyyy-MM-dd"));
    } catch (error) {
      console.error("Error fetching appointment details:", error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/visit-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create visit note");
      }
      
      const visitNote = await response.json();
      toast.success("Visit note created successfully");
      router.push(`/dashboard/visit-notes/${visitNote.id}`);
    } catch (error: any) {
      console.error("Error creating visit note:", error);
      toast.error(error.message || "Failed to create visit note");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">New Visit Note</h1>
        <button
          onClick={() => router.push("/dashboard/visit-notes")}
          className="text-blue-500 hover:text-blue-600"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient *
            </label>
            <select
              {...register("patientId", { required: "Patient is required" })}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Appointment
            </label>
            <select
              {...register("appointmentId")}
              className="w-full p-2 border rounded-md"
              disabled={!selectedPatientId}
            >
              <option value="">None</option>
              {appointments.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {format(new Date(appointment.appointmentDate), "MMM d, yyyy")} at {appointment.startTime} - {appointment.type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visit Date *
            </label>
            <input
              type="date"
              {...register("visitDate", { required: "Visit date is required" })}
              className="w-full p-2 border rounded-md"
            />
            {errors.visitDate && (
              <p className="mt-1 text-sm text-red-600">{errors.visitDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chief Complaint *
            </label>
            <input
              type="text"
              {...register("chiefComplaint", { required: "Chief complaint is required" })}
              className="w-full p-2 border rounded-md"
              placeholder="Main reason for visit"
            />
            {errors.chiefComplaint && (
              <p className="mt-1 text-sm text-red-600">{errors.chiefComplaint.message}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subjective *
          </label>
          <textarea
            {...register("subjective", { required: "Subjective information is required" })}
            className="w-full p-2 border rounded-md h-32"
            placeholder="Patient's description of symptoms, history, etc."
          />
          {errors.subjective && (
            <p className="mt-1 text-sm text-red-600">{errors.subjective.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Objective *
          </label>
          <textarea
            {...register("objective", { required: "Objective findings are required" })}
            className="w-full p-2 border rounded-md h-32"
            placeholder="Physical examination findings, vital signs, test results, etc."
          />
          {errors.objective && (
            <p className="mt-1 text-sm text-red-600">{errors.objective.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessment *
          </label>
          <textarea
            {...register("assessment", { required: "Assessment is required" })}
            className="w-full p-2 border rounded-md h-32"
            placeholder="Diagnosis, differential diagnoses, clinical impressions, etc."
          />
          {errors.assessment && (
            <p className="mt-1 text-sm text-red-600">{errors.assessment.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan *
          </label>
          <textarea
            {...register("plan", { required: "Treatment plan is required" })}
            className="w-full p-2 border rounded-md h-32"
            placeholder="Treatment plan, procedures, patient education, etc."
          />
          {errors.plan && (
            <p className="mt-1 text-sm text-red-600">{errors.plan.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Follow-up Instructions
          </label>
          <textarea
            {...register("followUpInstructions")}
            className="w-full p-2 border rounded-md h-24"
            placeholder="Follow-up appointment recommendations, etc."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medications
          </label>
          <textarea
            {...register("medications")}
            className="w-full p-2 border rounded-md h-24"
            placeholder="Prescribed medications, dosages, instructions, etc."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lab Orders
          </label>
          <textarea
            {...register("labOrders")}
            className="w-full p-2 border rounded-md h-24"
            placeholder="Ordered labs, imaging, or other diagnostic tests"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
          >
            Create Visit Note
          </button>
        </div>
      </form>
    </div>
  );
}