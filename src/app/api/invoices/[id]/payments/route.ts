import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/invoices/[id]/payments - Add a payment to an invoice
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const invoiceId = params.id;
    const { amount, paymentMethod, paymentDate } = await request.json();

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { message: "Payment method is required" },
        { status: 400 }
      );
    }

    // Check if invoice exists and belongs to the doctor
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        patient: {
          doctorId: session.user.id,
        },
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Check if invoice is already paid or cancelled
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      return NextResponse.json(
        { message: `Cannot add payment to an invoice with status: ${invoice.status}` },
        { status: 400 }
      );
    }

    // Calculate total paid amount including the new payment
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0) + amount;
    
    // Determine new invoice status
    let newStatus = invoice.status;
    if (totalPaid >= invoice.totalAmount) {
      newStatus = "PAID";
    } else if (totalPaid > 0) {
      newStatus = "PARTIALLY_PAID";
    }

    // Create payment and update invoice status in a transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Create the payment
      const newPayment = await tx.payment.create({
        data: {
          amount,
          paymentMethod,
          paymentDate: paymentDate || new Date(),
          invoiceId,
        },
      });

      // Update invoice status
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });

      return newPayment;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error adding payment:", error);
    return NextResponse.json(
      { message: "Failed to add payment" },
      { status: 500 }
    );
  }
}

// GET /api/invoices/[id]/payments - Get all payments for an invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const invoiceId = params.id;

    // Check if invoice exists and belongs to the doctor
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        patient: {
          doctorId: session.user.id,
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Get all payments for the invoice
    const payments = await prisma.payment.findMany({
      where: {
        invoiceId,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { message: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}