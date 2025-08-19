import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  clinicName: z.string().min(2, "Clinic name is required"),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, password, clinicName, specialty, phone, address } = body;
    
    // Check if user already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email },
    });
    
    if (existingDoctor) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    
    // Create new doctor
    const doctor = await prisma.doctor.create({
      data: {
        email,
        passwordHash,
        clinicName,
        specialty: specialty || null,
        phone: phone || null,
        address: address || null,
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}