"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

type SettingsFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  theme: string;
  language: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SettingsFormData>();
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setValue('firstName', data.firstName || '');
          setValue('lastName', data.lastName || '');
          setValue('email', data.email || '');
          setValue('phone', data.phone || '');
          setValue('clinicName', data.clinicName || '');
          setValue('clinicAddress', data.clinicAddress || '');
          setValue('clinicPhone', data.clinicPhone || '');
          setValue('emailNotifications', data.emailNotifications || false);
          setValue('smsNotifications', data.smsNotifications || false);
          setValue('theme', data.theme || 'light');
          setValue('language', data.language || 'en');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      }
    };
    
    fetchSettings();
  }, [setValue]);
  
  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success('Settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('An error occurred while updating settings');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">Profile</button>
          <button className="px-4 py-2 bg-gray-200 rounded">Clinic</button>
          <button className="px-4 py-2 bg-gray-200 rounded">Notifications</button>
          <button className="px-4 py-2 bg-gray-200 rounded">Appearance</button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2">First Name</label>
                <input
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  className="w-full p-2 border rounded"
                />
                {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
              </div>
              
              <div>
                <label className="block mb-2">Last Name</label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className="w-full p-2 border rounded"
                />
                {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
              </div>
              
              <div>
                <label className="block mb-2">Email</label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full p-2 border rounded"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>
              
              <div>
                <label className="block mb-2">Phone</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block mb-2">Clinic Name</label>
                <input
                  type="text"
                  {...register('clinicName')}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block mb-2">Clinic Address</label>
                <input
                  type="text"
                  {...register('clinicAddress')}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block mb-2">Clinic Phone</label>
                <input
                  type="tel"
                  {...register('clinicPhone')}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block mb-2">Language</label>
                <select
                  {...register('language')}
                  className="w-full p-2 border rounded"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-2">Theme</label>
                <select
                  {...register('theme')}
                  className="w-full p-2 border rounded"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    {...register('emailNotifications')}
                    className="mr-2"
                  />
                  <label htmlFor="emailNotifications">Email Notifications</label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    {...register('smsNotifications')}
                    className="mr-2"
                  />
                  <label htmlFor="smsNotifications">SMS Notifications</label>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}