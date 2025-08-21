"use client";

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  resource: Appointment;
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        console.log("Fetching appointments...");
        const response = await fetch("/api/appointments");
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response not ok:", response.status, errorText);
          throw new Error(`Failed to fetch appointments: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Appointments data:", data);
        setAppointments(data);
        
        // Convert appointments to calendar events
        const calendarEvents = data.map((appointment: Appointment) => {
          try {
            const [year, month, day] = appointment.appointmentDate.split("-").map(Number);
            const [startHour, startMinute] = appointment.startTime.split(":").map(Number);
            const [endHour, endMinute] = appointment.endTime.split(":").map(Number);
            
            const start = new Date(year, month - 1, day, startHour, startMinute);
            const end = new Date(year, month - 1, day, endHour, endMinute);
            
            // Validate dates
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              console.warn("Invalid date for appointment:", appointment);
              return null;
            }
            
            return {
              id: appointment.id,
              title: `${appointment.patientName} - ${appointment.type}`,
              start,
              end,
              status: appointment.status,
              resource: appointment,
            };
          } catch (error) {
            console.warn("Error processing appointment:", appointment, error);
            return null;
          }
        }).filter(Boolean); // Remove any null events
        
        console.log("Calendar events:", calendarEvents);
        setEvents(calendarEvents);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        // Set empty arrays on error to prevent UI issues
        setAppointments([]);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/dashboard/appointments/${event.id}`);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3174ad"; // Default blue
    
    switch (event.status.toLowerCase()) {
      case "completed":
        backgroundColor = "#4caf50"; // Green
        break;
      case "cancelled":
        backgroundColor = "#f44336"; // Red
        break;
      case "no-show":
        backgroundColor = "#ff9800"; // Orange
        break;
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
        <div className="flex space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setView("calendar")}
              className={`px-3 py-1 rounded ${
                view === "calendar"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1 rounded ${
                view === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              List
            </button>
          </div>
          <Link
            href="/dashboard/appointments/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            New Appointment
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : view === "calendar" ? (
        <div className="bg-white rounded-lg shadow p-4" style={{ height: "75vh" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            onSelectEvent={handleEventClick}
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "day"]}
            defaultView="week"
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.patientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{appointment.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/appointments/${appointment.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/appointments/${appointment.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'no-show':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}