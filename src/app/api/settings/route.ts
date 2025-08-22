import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { handleError, logError, AuthenticationError } from "@/lib/error-handler";

// GET /api/settings - Get settings for the logged-in doctor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      throw new AuthenticationError();
    }

    const doctorId = session.user.id;
    
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        email: true,
        clinicName: true,
        specialty: true,
        phone: true,
        address: true,
        // Add any other fields that should be included in settings
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { message: "Doctor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(doctor);
  } catch (error) {
    logError(error, 'SETTINGS_GET');
    return handleError(error);
  }
}

// PUT /api/settings - Update settings for the logged-in doctor
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      throw new AuthenticationError();
    }

    const doctorId = session.user.id;
    const data = await request.json();
    
    // Only allow updating specific fields
    const allowedFields = ['clinicName', 'specialty', 'phone', 'address'];
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: updateData,
      select: {
        id: true,
        email: true,
        clinicName: true,
        specialty: true,
        phone: true,
        address: true,
      },
    });

    return NextResponse.json(updatedDoctor);
  } catch (error) {
    logError(error, 'SETTINGS_PUT');
    return handleError(error);
  }
}