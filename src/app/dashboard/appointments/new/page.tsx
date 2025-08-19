"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
};

type AppointmentFormData = {
  patientId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes: string;
};

export default function NewAppointmentPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    defaultValues: {
      patientId: preselectedPatientId || "",
      status: "scheduled",
    },
  });

  const selectedDate = watch("appointmentDate");
  const selectedStartTime = watch("startTime");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
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

    fetchPatients();
  }, []);

  // Set default end time 30 minutes after start time
  useEffect(() => {
    if (selectedStartTime) {
      const [hours, minutes] = selectedStartTime.split(":").map(Number);
      let endHours = hours;
      let endMinutes = minutes + 30;
      
      if (endMinutes >= 60) {
        endHours += 1;
        endMinutes -= 60;
      }
      
      if (endHours >= 24) {
        endHours -= 24;
      }
      
      const formattedEndHours = endHours.toString().padStart(2, "0");
      const formattedEndMinutes = endMinutes.toString().padStart(2, "0");
      
      setValue("endTime", `${formattedEndHours}:${formattedEndMinutes}`);
    }
  }, [selectedStartTime, setValue]);

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create appointment");
      }

      toast.success("Appointment created successfully");
      router.push("/dashboard/appointments");
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Schedule New Appointment</h1>
        <p className="text-gray-600">Fill in the details below to schedule an appointment</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient *
            </label>
            <select
              {...register("patientId", { required: "Patient is required" })}
              className={`w-full p-2 border rounded ${
                errors.patientId ? "border-red-500" : "border-gray-300"
              }`}
              disabled={!!preselectedPatientId}
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
              Date *
            </label>
            <input
              type="date"
              {...register("appointmentDate", { required: "Date is required" })}
              className={`w-full p-2 border rounded ${
                errors.appointmentDate ? "border-red-500" : "border-gray-300"
              }`}
              min={new Date().toISOString().split("T")[0]}
            />
            {errors.appointmentDate && (
              <p className="mt-1 text-sm text-red-600">{errors.appointmentDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Type *
            </label>
            <select
              {...register("type", { required: "Appointment type is required" })}
              className={`w-full p-2 border rounded ${
                errors.type ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select type</option>
              <option value="New Patient">New Patient</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Consultation">Consultation</option>
              <option value="Check-up">Check-up</option>
              <option value="Urgent">Urgent</option>
              <option value="Procedure">Procedure</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              {...register("startTime", { required: "Start time is required" })}
              className={`w-full p-2 border rounded ${
                errors.startTime ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              {...register("endTime", { required: "End time is required" })}
              className={`w-full p-2 border rounded ${
                errors.endTime ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.endTime && (
              <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Any additional information about this appointment"
            ></textarea>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
}