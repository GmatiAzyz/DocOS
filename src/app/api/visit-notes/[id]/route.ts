import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/visit-notes/[id] - Get a specific visit note
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
    const visitNoteId = params.id;
    
    const visitNote = await prisma.visitNote.findUnique({
      where: {
        id: visitNoteId,
        doctorId: doctorId, // Ensure the visit note belongs to the logged-in doctor
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            email: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            endTime: true,
            type: true,
          },
        },
      },
    });

    if (!visitNote) {
      return NextResponse.json({ error: "Visit note not found" }, { status: 404 });
    }

    return NextResponse.json(visitNote);
  } catch (error) {
    console.error("Error fetching visit note:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit note" },
      { status: 500 }
    );
  }
}

// PUT /api/visit-notes/[id] - Update a visit note
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
    const visitNoteId = params.id;
    const data = await req.json();
    
    // Check if visit note exists and belongs to the doctor
    const existingVisitNote = await prisma.visitNote.findUnique({
      where: {
        id: visitNoteId,
        doctorId: doctorId,
      },
    });

    if (!existingVisitNote) {
      return NextResponse.json({ error: "Visit note not found" }, { status: 404 });
    }

    // Update the visit note
    const updatedVisitNote = await prisma.visitNote.update({
      where: {
        id: visitNoteId,
      },
      data: {
        visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
        chiefComplaint: data.chiefComplaint,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        followUpInstructions: data.followUpInstructions,
        medications: data.medications,
        labOrders: data.labOrders,
        attachments: data.attachments,
      },
    });

    return NextResponse.json(updatedVisitNote);
  } catch (error) {
    console.error("Error updating visit note:", error);
    return NextResponse.json(
      { error: "Failed to update visit note" },
      { status: 500 }
    );
  }
}

// DELETE /api/visit-notes/[id] - Delete a visit note
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
    const visitNoteId = params.id;
    
    // Check if visit note exists and belongs to the doctor
    const existingVisitNote = await prisma.visitNote.findUnique({
      where: {
        id: visitNoteId,
        doctorId: doctorId,
      },
    });

    if (!existingVisitNote) {
      return NextResponse.json({ error: "Visit note not found" }, { status: 404 });
    }

    // Delete the visit note
    await prisma.visitNote.delete({
      where: {
        id: visitNoteId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting visit note:", error);
    return NextResponse.json(
      { error: "Failed to delete visit note" },
      { status: 500 }
    );
  }
}