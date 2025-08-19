import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/patients/[id] - Get a specific patient
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const patientId = params.id;
    
    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
        doctorId: doctorId, // Ensure the patient belongs to the logged-in doctor
      },
      include: {
        appointments: {
          orderBy: {
            appointmentDate: 'desc',
          },
          take: 5,
        },
        visitNotes: {
          orderBy: {
            visitDate: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

// PUT /api/patients/[id] - Update a patient
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const patientId = params.id;
    const data = await req.json();
    
    // Check if patient exists and belongs to the doctor
    const existingPatient = await prisma.patient.findUnique({
      where: {
        id: patientId,
        doctorId: doctorId,
      },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Update the patient
    const updatedPatient = await prisma.patient.update({
      where: {
        id: patientId,
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone,
        dob: new Date(data.dob),
        address: data.address || null,
        emergencyContact: data.emergencyContact || null,
        medicalHistory: data.medicalHistory || null,
        allergies: data.allergies || null,
        medications: data.medications || null,
      },
    });

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/[id] - Delete a patient
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const patientId = params.id;
    
    // Check if patient exists and belongs to the doctor
    const existingPatient = await prisma.patient.findUnique({
      where: {
        id: patientId,
        doctorId: doctorId,
      },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Delete the patient
    await prisma.patient.delete({
      where: {
        id: patientId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}