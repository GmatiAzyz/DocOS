import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { handleError, logError, AuthenticationError } from "@/lib/error-handler";
import { validateInput, patientCreationSchema } from "@/lib/validation";

// GET /api/patients - Get all patients for the logged-in doctor
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      throw new AuthenticationError();
    }

    const doctorId = session.user.id;
    
    const patients = await prisma.patient.findMany({
      where: {
        doctorId: doctorId,
      },
      orderBy: {
        lastName: 'asc',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dob: true,
        createdAt: true,
      },
    });

    return NextResponse.json(patients);
  } catch (error) {
    logError(error, 'PATIENTS_GET');
    return handleError(error);
  }
}

// POST /api/patients - Create a new patient
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      throw new AuthenticationError();
    }

    const doctorId = session.user.id;
    const data = await req.json();
    
    // Validate input using centralized validation
    const validatedData = validateInput(patientCreationSchema, data);

    // Create the patient
    const patient = await prisma.patient.create({
      data: {
        doctorId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email || null,
        phone: validatedData.phone,
        dob: validatedData.dob,
        address: validatedData.address || null,
        emergencyContact: validatedData.emergencyContact || null,
        medicalHistory: validatedData.medicalHistory || null,
        allergies: validatedData.allergies || null,
        medications: validatedData.medications || null,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    logError(error, 'PATIENTS_POST');
    return handleError(error);
  }
}