import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/invoices - Get all invoices for the logged-in doctor
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    
    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '10', 10)), 100);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    
    // Build where clause
    const whereClause: any = { doctorId };
    
    if (status) {
      whereClause.status = status.toUpperCase();
    }
    
    if (patientId) {
      whereClause.patientId = patientId;
    }
    
    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMethod: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where: whereClause })
    ]);

    return NextResponse.json({
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;
    const data = await req.json();
    
    // Validate required fields
    if (!data.patientId || !data.dueDate || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Calculate total amount
    const totalAmount = data.items.reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0
    );

    // Create the invoice
    const invoice = await prisma.invoice.create({
      data: {
        doctorId: doctorId,
        patientId: data.patientId,
        invoiceNumber: data.invoiceNumber,
        dueDate: new Date(data.dueDate),
        amount: totalAmount,
        status: "Draft",
        items: data.items,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}