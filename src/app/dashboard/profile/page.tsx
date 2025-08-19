"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

type DoctorProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  bio: string;
  imageUrl: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          toast.error('Failed to load profile');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Doctor Profile</h1>
        <Link href="/dashboard/settings" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Edit Profile
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Full Name</p>
            <p className="font-medium">Dr. {profile?.firstName} {profile?.lastName}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Email</p>
            <p className="font-medium">{profile?.email}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Phone</p>
            <p className="font-medium">{profile?.phone || "Not provided"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Specialization</p>
            <p className="font-medium">{profile?.specialization || "Not provided"}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Clinic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Clinic Name</p>
            <p className="font-medium">{profile?.clinicName || "Not provided"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Clinic Phone</p>
            <p className="font-medium">{profile?.clinicPhone || "Not provided"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Clinic Email</p>
            <p className="font-medium">{profile?.clinicEmail || "Not provided"}</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <p className="text-gray-500 text-sm">Clinic Address</p>
            <p className="font-medium">{profile?.clinicAddress || "Not provided"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}