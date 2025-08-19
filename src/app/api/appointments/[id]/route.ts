import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/appointments/[id] - Get a specific appointment
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
    const appointmentId = params.id;
    
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctorId, // Ensure the appointment belongs to the logged-in doctor
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update an appointment
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
    const appointmentId = params.id;
    const data = await req.json();
    
    // Check if appointment exists and belongs to the doctor
    const existingAppointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctorId,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Check for double booking (only if date or time is changing)
    if (
      data.appointmentDate !== existingAppointment.appointmentDate.toISOString().split('T')[0] ||
      data.startTime !== existingAppointment.startTime ||
      data.endTime !== existingAppointment.endTime
    ) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: doctorId,
          appointmentDate: new Date(data.appointmentDate),
          id: { not: appointmentId }, // Exclude the current appointment
          OR: [
            {
              AND: [
                { startTime: { lte: data.startTime } },
                { endTime: { gt: data.startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: data.endTime } },
                { endTime: { gte: data.endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: data.startTime } },
                { endTime: { lte: data.endTime } }
              ]
            }
          ]
        }
      });

      if (conflictingAppointment) {
        return NextResponse.json(
          { error: "This time slot conflicts with an existing appointment" },
          { status: 409 }
        );
      }
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        patientId: data.patientId,
        appointmentDate: new Date(data.appointmentDate),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        status: data.status,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete an appointment
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
    const appointmentId = params.id;
    
    // Check if appointment exists and belongs to the doctor
    const existingAppointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctorId,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: {
        id: appointmentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}