import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { handleError, logError, AuthenticationError } from "@/lib/error-handler";

// Mock dashboard data for guest mode
const mockDashboardData = {
  stats: {
    totalPatients: 42,
    appointmentsThisWeek: 15,
    pendingInvoices: 7,
  },
  todayAppointments: [
    {
      id: "appt-1",
      patientName: "John Smith",
      time: "9:00 AM",
      type: "Check-up",
      status: "Scheduled",
    },
    {
      id: "appt-2",
      patientName: "Sarah Johnson",
      time: "10:30 AM",
      type: "Follow-up",
      status: "Scheduled",
    },
    {
      id: "appt-3",
      patientName: "Michael Brown",
      time: "1:15 PM",
      type: "Consultation",
      status: "Scheduled",
    },
  ],
  recentActivity: [
    {
      id: "1",
      type: "New Patient",
      description: "Emily Wilson registered as a new patient",
      time: "2 hours ago",
    },
    {
      id: "2",
      type: "Completed Visit",
      description: "Completed check-up with Robert Davis",
      time: "Yesterday",
    },
    {
      id: "3",
      type: "Invoice Paid",
      description: "Invoice #1234 paid by Jennifer Lee",
      time: "Yesterday",
    },
  ],
};

// GET /api/dashboard - Get dashboard statistics and recent data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // If no session, return mock data (for guest mode)
    if (!session || !session.user.id) {
      return NextResponse.json(mockDashboardData);
    }

    const doctorId = session.user.id;
    
    // Get all dashboard data in parallel
    const [stats, todayAppointments, recentActivity] = await Promise.all([
      // Get statistics
      Promise.all([
        prisma.patient.count({ where: { doctorId } }),
        prisma.appointment.count({
          where: {
            doctorId,
            appointmentDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            }
          }
        }),
        prisma.invoice.count({
          where: {
            doctorId,
            status: { not: 'paid' }
          }
        }),
      ]),
      
      // Get today's appointments
      prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      }),
      
      // Get recent activity (last 5 appointments)
      prisma.appointment.findMany({
        where: {
          doctorId,
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ]);

    return NextResponse.json({
      stats: {
        totalPatients: stats[0],
        appointmentsThisWeek: stats[1],
        pendingInvoices: stats[2],
      },
      todayAppointments: todayAppointments.map(appointment => ({
        id: appointment.id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        time: appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: appointment.type,
        status: appointment.status,
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: "Appointment",
        description: `Appointment with ${activity.patient.firstName} ${activity.patient.lastName}`,
        time: activity.createdAt.toLocaleDateString(),
      })),
    });
  } catch (error) {
    logError(error, 'DASHBOARD_GET');
    return handleError(error);
  }
}