import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/invoices/[id] - Get a specific invoice
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
    const invoiceId = params.id;
    
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        doctorId: doctorId, // Ensure the invoice belongs to the logged-in doctor
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            method: true,
            transactionId: true,
          },
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update an invoice
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
    const invoiceId = params.id;
    const data = await req.json();
    
    // Check if invoice exists and belongs to the doctor
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        doctorId: doctorId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Calculate total amount if items are provided
    let totalAmount = existingInvoice.totalAmount;
    if (data.items && data.items.length > 0) {
      totalAmount = data.items.reduce(
        (sum: number, item: { amount: number }) => sum + item.amount,
        0
      );
    }

    // Update the invoice
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        totalAmount: totalAmount,
        status: data.status || undefined,
        items: data.items || undefined,
        notes: data.notes,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
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
    const invoiceId = params.id;
    
    // Check if invoice exists and belongs to the doctor
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        doctorId: doctorId,
      },
      include: {
        payments: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if invoice has payments
    if (existingInvoice.payments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete invoice with payments" },
        { status: 400 }
      );
    }

    // Delete the invoice
    await prisma.invoice.delete({
      where: {
        id: invoiceId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}