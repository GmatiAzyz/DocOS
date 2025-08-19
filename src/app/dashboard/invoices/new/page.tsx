"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import { format } from "date-fns";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface InvoiceFormData {
  patientId: string;
  issueDate: string;
  dueDate: string;
  status: string;
  notes: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export default function NewInvoice() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      patientId: patientId || "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
      status: "PENDING",
      notes: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");
  const totalAmount = watchItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchPatients();
    }
  }, [status]);

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

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setIsSubmitting(true);
      
      // Calculate invoice number (simple implementation - can be enhanced)
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          invoiceNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create invoice");
      }

      const result = await response.json();
      toast.success("Invoice created successfully");
      router.push(`/dashboard/invoices/${result.id}`);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create invoice");
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Invoice</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient *
              </label>
              <select
                {...register("patientId", { required: "Patient is required" })}
                className={`w-full p-2 border rounded-md ${errors.patientId ? "border-red-500" : "border-gray-300"}`}
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
                Status
              </label>
              <select
                {...register("status")}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                {...register("issueDate", { required: "Issue date is required" })}
                className={`w-full p-2 border rounded-md ${errors.issueDate ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.issueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.issueDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                {...register("dueDate", { required: "Due date is required" })}
                className={`w-full p-2 border rounded-md ${errors.dueDate ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Invoice Items</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-12 gap-2 mb-2 font-medium text-sm">
                <div className="col-span-6">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-3">Unit Price ($)</div>
                <div className="col-span-1"></div>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-6">
                    <input
                      {...register(`items.${index}.description` as const, { 
                        required: "Description is required" 
                      })}
                      placeholder="Service or item description"
                      className={`w-full p-2 border rounded-md ${
                        errors.items?.[index]?.description ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      {...register(`items.${index}.quantity` as const, {
                        required: "Required",
                        min: { value: 1, message: "Min 1" },
                        valueAsNumber: true
                      })}
                      className={`w-full p-2 border rounded-md ${
                        errors.items?.[index]?.quantity ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`items.${index}.unitPrice` as const, {
                        required: "Required",
                        min: { value: 0, message: "Min 0" },
                        valueAsNumber: true
                      })}
                      className={`w-full p-2 border rounded-md ${
                        errors.items?.[index]?.unitPrice ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                className="mt-2 inline-flex items-center text-sm text-blue-500 hover:text-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Item
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-end">
              <div className="bg-gray-100 p-4 rounded-md w-full md:w-1/3">
                <div className="flex justify-between font-semibold mb-2">
                  <span>Subtotal:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 my-2"></div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Additional notes or payment instructions..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}