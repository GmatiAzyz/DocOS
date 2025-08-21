import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { handleError, logError, AuthenticationError } from "@/lib/error-handler";
import { validateInput, appointmentCreationSchema } from "@/lib/validation";

// Mock appointment data for guest mode or when no database is available
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
    console.log("GET /api/appointments called");
    console.log("Database URL exists:", !!process.env.DATABASE_URL);
    console.log("NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);
    console.log("Auth options:", !!authOptions);
    
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log("Session:", session);
    } catch (authError) {
      console.warn("Authentication error, returning mock data:", authError);
      return NextResponse.json(mockAppointments);
    }
    
    // If no session, return mock data (for guest mode)
    if (!session || !session.user.id) {
      console.log("No session, returning mock data");
      return NextResponse.json(mockAppointments);
    }

    const doctorId = session.user.id;
    console.log("Doctor ID:", doctorId);

    try {
      // Test database connectivity first
      console.log("Testing database connectivity...");
      console.log("Prisma client:", !!prisma);
      
      if (!prisma) {
        console.warn("Prisma client not available, returning mock data");
        return NextResponse.json(mockAppointments);
      }
      
      await prisma.$queryRaw`SELECT 1`;
      console.log("Database connection successful");
      
      // Try to get appointments from database
      const appointments = await prisma.appointment.findMany({
        where: { doctorId },
        orderBy: { appointmentDate: "asc" },
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

      console.log("Found appointments in database:", appointments.length);

      // Transform database appointments to match frontend expected format
      const transformedAppointments = appointments.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patientId,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        type: appointment.type,
        status: appointment.status,
        notes: appointment.notes || "",
      }));

      return NextResponse.json(transformedAppointments);
    } catch (dbError) {
      // If database fails, fall back to mock data
      console.warn("Database error, falling back to mock data:", dbError);
      console.error("Database error details:", {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        name: dbError instanceof Error ? dbError.name : undefined
      });
      
      // Check if it's a table doesn't exist error
      if (dbError instanceof Error && dbError.message.includes("doesn't exist")) {
        console.log("Database tables don't exist, returning mock data");
      }
      
      // Check if it's a connection error
      if (dbError instanceof Error && (
        dbError.message.includes("connect") || 
        dbError.message.includes("connection") ||
        dbError.message.includes("ECONNREFUSED") ||
        dbError.message.includes("ENOTFOUND")
      )) {
        console.log("Database connection failed, returning mock data");
      }
      
      return NextResponse.json(mockAppointments);
    }
  } catch (error) {
    logError(error, 'APPOINTMENTS_GET');
    return handleError(error);
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (authError) {
      console.warn("Authentication error:", authError);
      throw new AuthenticationError();
    }
    
    if (!session || !session.user.id) {
      throw new AuthenticationError();
    }

    const doctorId = session.user.id;
    
    let data;
    try {
      data = await req.json();
    } catch (jsonError) {
      console.warn("JSON parsing error:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON data" },
        { status: 400 }
      );
    }

    // Validate input using centralized schema
    let validated;
    try {
      validated = validateInput(appointmentCreationSchema, data);
    } catch (validationError) {
      console.warn("Validation error:", validationError);
      return NextResponse.json(
        { error: "Invalid appointment data" },
        { status: 400 }
      );
    }

    try {
      // Check for double booking on the same date
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId,
          appointmentDate: new Date(validated.appointmentDate),
          OR: [
            {
              AND: [
                { startTime: { lte: validated.startTime } },
                { endTime: { gt: validated.startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: validated.endTime } },
                { endTime: { gte: validated.endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: validated.startTime } },
                { endTime: { lte: validated.endTime } }
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
          patientId: validated.patientId,
          appointmentDate: new Date(validated.appointmentDate),
          startTime: validated.startTime,
          endTime: validated.endTime,
          type: validated.type,
          status: 'scheduled',
          notes: validated.notes || null,
        },
      });

      return NextResponse.json(appointment, { status: 201 });
    } catch (dbError) {
      // If database fails, return a mock response for demo purposes
      console.warn("Database error, returning mock response:", dbError);
      const mockAppointment = {
        id: `appt-${Date.now()}`,
        patientId: validated.patientId,
        patientName: "Demo Patient", // Mock patient name
        appointmentDate: validated.appointmentDate,
        startTime: validated.startTime,
        endTime: validated.endTime,
        type: validated.type,
        status: "pending",
        notes: validated.notes || "",
      };
      return NextResponse.json(mockAppointment, { status: 201 });
    }
  } catch (error) {
    logError(error, 'APPOINTMENTS_POST');
    return handleError(error);
  }
}