import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/visit-notes - Get all visit notes for the logged-in doctor
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    
    const visitNotes = await prisma.visitNote.findMany({
      where: {
        doctorId: doctorId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(visitNotes);
  } catch (error) {
    console.error("Error fetching visit notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit notes" },
      { status: 500 }
    );
  }
}

// POST /api/visit-notes - Create a new visit note
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const data = await req.json();
    
    // Validate required fields
    if (!data.patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Check if patient exists and belongs to the doctor
    const patient = await prisma.patient.findUnique({
      where: {
        id: data.patientId,
        doctorId: doctorId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found or doesn't belong to you" },
        { status: 404 }
      );
    }

    // If appointmentId is provided, check if it exists and belongs to the doctor
    if (data.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: {
          id: data.appointmentId,
          doctorId: doctorId,
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found or doesn't belong to you" },
          { status: 404 }
        );
      }
      
      // If appointment exists, update its status to COMPLETED
      await prisma.appointment.update({
        where: { id: data.appointmentId },
        data: { status: "COMPLETED" },
      });
    }

    // Create the visit note
    const visitNote = await prisma.visitNote.create({
      data: {
        doctorId: doctorId,
        patientId: data.patientId,
        appointmentId: data.appointmentId || null,
        visitDate: new Date(data.visitDate),
        chiefComplaint: data.chiefComplaint,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        followUpInstructions: data.followUpInstructions || null,
        medications: data.medications || null,
        labOrders: data.labOrders || null,
        attachments: data.attachments || null,
      },
    });

    return NextResponse.json(visitNote);
  } catch (error) {
    console.error("Error creating visit note:", error);
    return NextResponse.json(
      { error: "Failed to create visit note" },
      { status: 500 }
    );
  }
}