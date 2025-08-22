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
    
    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10', 10)), 100); // Max 100 per page
    const search = searchParams.get('search');
    
    // Build where clause
    const whereClause: any = { doctorId };
    
    if (search) {
      // Sanitize search input to prevent injection
      const sanitizedSearch = search.replace(/[^a-zA-Z0-9\s@.-]/g, '');
      
      whereClause.OR = [
        { firstName: { contains: sanitizedSearch, mode: 'insensitive' } },
        { lastName: { contains: sanitizedSearch, mode: 'insensitive' } },
        { email: { contains: sanitizedSearch, mode: 'insensitive' } },
        { phone: { contains: sanitizedSearch, mode: 'insensitive' } },
      ];
    }
    
    // Get patients with pagination
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        orderBy: {
          lastName: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dob: true,
          createdAt: true,
        },
      }),
      prisma.patient.count({ where: whereClause })
    ]);

    return NextResponse.json({
      data: patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
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