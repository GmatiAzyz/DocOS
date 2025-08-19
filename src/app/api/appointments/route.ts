import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// Mock appointment data
const mockAppointments = [
  {
    id: "appt-1",
    patientId: "patient-1",
    patientName: "Alice Johnson",
    appointmentDate: "2023-11-15",
    startTime: "09:00",
    endTime: "09:30",
    type: "Check-up",
    status: "confirmed",
    notes: "Regular check-up appointment",
  },
  {
    id: "appt-2",
    patientId: "patient-2",
    patientName: "Bob Smith",
    appointmentDate: "2023-11-15",
    startTime: "10:00",
    endTime: "10:30",
    type: "Follow-up",
    status: "confirmed",
    notes: "Follow-up after treatment",
  },
  {
    id: "appt-3",
    patientId: "patient-3",
    patientName: "Carol Davis",
    appointmentDate: "2023-11-16",
    startTime: "14:00",
    endTime: "14:45",
    type: "Consultation",
    status: "pending",
    notes: "New patient consultation",
  }
];

// GET /api/appointments - Get all appointments for the logged-in doctor
export async function GET(req: NextRequest) {
  try {
    // Return mock appointments instead of querying database
    return NextResponse.json(mockAppointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { message: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Create a new mock appointment
    const newAppointment = {
      id: `appt-${Date.now()}`,
      patientId: data.patientId,
      patientName: data.patientName,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
      status: "pending",
      notes: data.notes || "",
    };
    
    // Return the new appointment as if it was saved
    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { message: "Failed to create appointment" },
      { status: 500 }
    );
    }
}
}

// POST /api/appointments - Create a new appointment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const data = await req.json();
    
    // Validate required fields
    if (!data.patientId || !data.appointmentDate || !data.startTime || !data.endTime || !data.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
}
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

    if (existingAppointment) {
      return NextResponse.json(
        { error: "This time slot conflicts with an existing appointment" },
        { status: 409 }
      );
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId: data.patientId,
        appointmentDate: new Date(data.appointmentDate),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        status: data.status || 'scheduled',
        notes: data.notes || null,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}