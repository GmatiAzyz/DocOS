import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { handleError, logError } from "@/lib/error-handler";
import { validateInput, doctorRegistrationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input using centralized validation
    const validatedData = validateInput(doctorRegistrationSchema, body);
    
    // Check if user already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingDoctor) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);
    
    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    
    // Create new doctor
    const doctor = await prisma.doctor.create({
      data: {
        email: validatedData.email,
        passwordHash,
        clinicName: validatedData.clinicName,
        specialty: validatedData.specialty || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        trialEndsAt,
        subscriptionStatus: "trial",
      },
    });
    
    return NextResponse.json(
      { 
        message: "Registration successful",
        doctorId: doctor.id 
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, 'REGISTRATION');
    return handleError(error);
  }
}