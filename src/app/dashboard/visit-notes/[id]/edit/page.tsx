"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { format } from "date-fns";

interface VisitNote {
  id: string;
  patientId: string;
  appointmentId: string | null;
  visitDate: string;
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpInstructions: string | null;
  medications: string | null;
  labOrders: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function EditVisitNote({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [visitNote, setVisitNote] = useState<VisitNote | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

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
      
      // Set form values
      setValue("visitDate", format(new Date(data.visitDate), "yyyy-MM-dd"));
      setValue("chiefComplaint", data.chiefComplaint);
      setValue("subjective", data.subjective);
      setValue("objective", data.objective);
      setValue("assessment", data.assessment);
      setValue("plan", data.plan);
      setValue("followUpInstructions", data.followUpInstructions || "");
      setValue("medications", data.medications || "");
      setValue("labOrders", data.labOrders || "");
    } catch (error) {
      console.error("Error fetching visit note:", error);
      toast.error("Failed to load visit note details");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/visit-notes/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update visit note");
      }
      
      toast.success("Visit note updated successfully");
      router.push(`/dashboard/visit-notes/${params.id}`);
    } catch (error: any) {
      console.error("Error updating visit note:", error);
      toast.error(error.message || "Failed to update visit note");
    }
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
        <h1 className="text-2xl font-bold">Edit Visit Note</h1>
        <button
          onClick={() => router.push(`/dashboard/visit-notes/${params.id}`)}
          className="text-blue-500 hover:text-blue-600"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <div className="p-3 border rounded-md bg-gray-50">
              {visitNote.patient.firstName} {visitNote.patient.lastName}
            </div>
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
              <p className="mt-1 text-sm text-red-600">{errors.visitDate.message as string}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chief Complaint *
            </label>
            <input
              type="text"
              {...register("chiefComplaint", { required: "Chief complaint is required" })}
              className="w-full p-2 border rounded-md"
            />
            {errors.chiefComplaint && (
              <p className="mt-1 text-sm text-red-600">{errors.chiefComplaint.message as string}</p>
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
          />
          {errors.subjective && (
            <p className="mt-1 text-sm text-red-600">{errors.subjective.message as string}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Objective *
          </label>
          <textarea
            {...register("objective", { required: "Objective findings are required" })}
            className="w-full p-2 border rounded-md h-32"
          />
          {errors.objective && (
            <p className="mt-1 text-sm text-red-600">{errors.objective.message as string}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessment *
          </label>
          <textarea
            {...register("assessment", { required: "Assessment is required" })}
            className="w-full p-2 border rounded-md h-32"
          />
          {errors.assessment && (
            <p className="mt-1 text-sm text-red-600">{errors.assessment.message as string}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan *
          </label>
          <textarea
            {...register("plan", { required: "Treatment plan is required" })}
            className="w-full p-2 border rounded-md h-32"
          />
          {errors.plan && (
            <p className="mt-1 text-sm text-red-600">{errors.plan.message as string}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Follow-up Instructions
          </label>
          <textarea
            {...register("followUpInstructions")}
            className="w-full p-2 border rounded-md h-24"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medications
          </label>
          <textarea
            {...register("medications")}
            className="w-full p-2 border rounded-md h-24"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lab Orders
          </label>
          <textarea
            {...register("labOrders")}
            className="w-full p-2 border rounded-md h-24"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}