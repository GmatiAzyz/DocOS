import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// Mock doctor data
const mockDoctor = {
  id: "doctor-123",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@example.com",
  phone: "+1 (555) 123-4567",
  specialization: "Cardiology",
  clinicName: "Smith Medical Center",
  clinicAddress: "123 Medical Plaza, Suite 100, New York, NY 10001",
  clinicPhone: "+1 (555) 987-6543",
  clinicEmail: "info@smithmedical.com",
  bio: "Dr. John Smith is a board-certified cardiologist with over 15 years of experience in treating heart conditions.",
  imageUrl: "",
  emailNotifications: true,
  smsNotifications: false,
  language: "en",
  theme: "light",
};

// GET /api/settings - Get settings for the logged-in doctor
export async function GET(request: NextRequest) {
  try {
    // Return mock data instead of querying database
    return NextResponse.json(mockDoctor);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings for the logged-in doctor
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Just return the updated data as if it was saved
    return NextResponse.json({
      ...mockDoctor,
      ...data
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { message: "Failed to update settings" },
      { status: 500 }
    );
  }
}