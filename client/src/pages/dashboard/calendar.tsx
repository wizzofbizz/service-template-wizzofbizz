import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ArrowLeft } from "lucide-react";
import { formatDateSA } from "@/lib/date-utils";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

type JobStatus = "draft" | "scheduled" | "in_progress" | "completed" | "cancelled";

interface Job {
  id: string;
  businessId: string;
  contactId: string;
  quoteId?: string;
  assignedTo?: string;
  jobNumber: string;
  title: string;
  description?: string;
  status: JobStatus;
  scheduledDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  locationAddress?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  jobType?: string;
  serviceType?: string;
}

interface Contact {
  id: string;
  fullName: string;
  address?: string;
  email?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Job;
}

const statusColors: Record<JobStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<JobStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function CalendarPage() {
  const pageStyle = { fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' };
  const [, setLocation] = useLocation();
  const isMobile = window.innerWidth < 768;
  const [calendarView, setCalendarView] = useState<View>(isMobile ? "day" : "month");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: businessData } = useQuery<any>({
    queryKey: ["/api/business"],
  });

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesJobType = jobTypeFilter === "all" || job.jobType === jobTypeFilter;
      return matchesStatus && matchesJobType;
    });
  }, [jobs, statusFilter, jobTypeFilter]);

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return filteredJobs.map((job) => {
      const contactName = job.contactName || contacts.find((c) => c.id === job.contactId)?.fullName || "Unknown";
      const startTime = job.scheduledStartTime || "09:00";
      const endTime = job.scheduledEndTime || "10:00";

      return {
        id: job.id,
        title: `${contactName} - ${job.title}`,
        start: new Date(`${job.scheduledDate}T${startTime}`),
        end: new Date(`${job.scheduledDate}T${endTime}`),
        resource: job,
      };
    });
  }, [filteredJobs, contacts]);

  // Scroll to current time on mount for day/week views
  useEffect(() => {
    if ((calendarView === "day" || calendarView === "week") && !isMobile) {
      const scrollToTime = setTimeout(() => {
        const timeSlots = document.querySelector('.rbc-time-content');
        if (timeSlots) {
          const now = new Date();
          const hours = now.getHours();
          const minutes = now.getMinutes();
          const scrollPosition = ((hours * 60 + minutes) / (24 * 60)) * timeSlots.scrollHeight - 100;
          timeSlots.scrollTop = Math.max(0, scrollPosition);
        }
      }, 100);
      return () => clearTimeout(scrollToTime);
    }
  }, [calendarView, isMobile]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    const colors: Record<JobStatus, { backgroundColor: string; color: string }> = {
      draft: { backgroundColor: "#e5e7eb", color: "#1f2937" },
      scheduled: { backgroundColor: "#dbeafe", color: "#1e40af" },
      in_progress: { backgroundColor: "#fed7aa", color: "#c2410c" },
      completed: { backgroundColor: "#bbf7d0", color: "#15803d" },
      cancelled: { backgroundColor: "#fecaca", color: "#991b1b" },
    };
    return { style: colors[status] };
  };

  // Style time slots based on working hours
  const slotPropGetter = (date: Date) => {
    if (!businessData?.calendarHours) {
      return {};
    }

    const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' }) as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    const dayHours = businessData.calendarHours[dayName];

    if (!dayHours) {
      return {
        className: 'rbc-off-hours',
        style: {
          backgroundColor: '#f9fafb',
        }
      };
    }

    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    const [startHour, startMinute] = dayHours.start.split(':').map(Number);
    const [endHour, endMinute] = dayHours.end.split(':').map(Number);
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;

    if (timeInMinutes < startInMinutes || timeInMinutes >= endInMinutes) {
      return {
        className: 'rbc-off-hours',
        style: {
          backgroundColor: '#f9fafb',
        }
      };
    }

    // Add 1 hour padding before and after
    let earliestStart = startInMinutes;
    let latestEnd = endInMinutes;

    // Determine the earliest and latest times for the entire week to set the overall calendar range
    let overallEarliestStart = 24 * 60; // Initialize with a value greater than any possible start time
    let overallLatestEnd = 0; // Initialize with a value less than any possible end time

    Object.values(businessData.calendarHours).forEach((hours: any) => {
      if (hours && hours.start && hours.end) {
        const [currentStartHour, currentStartMinute] = hours.start.split(':').map(Number);
        const [currentEndHour, currentEndMinute] = hours.end.split(':').map(Number);
        const currentStartInMinutes = currentStartHour * 60 + currentStartMinute;
        const currentEndInMinutes = currentEndHour * 60 + currentEndMinute;

        overallEarliestStart = Math.min(overallEarliestStart, currentStartInMinutes);
        overallLatestEnd = Math.max(overallLatestEnd, currentEndInMinutes);
      }
    });

    // Apply padding to the overall earliest start and latest end
    earliestStart = Math.max(0, overallEarliestStart - 60);
    latestEnd = Math.min(22 * 60, overallLatestEnd + 60); // Cap at 22:00 (10pm) to avoid empty space

    const minHour = Math.floor(earliestStart / 60);
    const minMinute = earliestStart % 60;
    const maxHour = Math.floor(latestEnd / 60);
    const maxMinute = latestEnd % 60;

    // This part is for styling the slot itself, not for setting the calendar's min/max time.
    // The calendar's min/max time is handled by the `minTime` and `maxTime` props on the Calendar component itself.
    // If you want to adjust the calendar's visible range based on business hours, you'd typically do it outside of slotPropGetter,
    // possibly by calculating minTime and maxTime based on `businessData.calendarHours` and passing them as props to the Calendar.
    // For now, we return an empty object, meaning no specific style is applied by this getter to the slot itself.
    return {};
  };


  // Calculate minTime and maxTime for the calendar based on business hours
  const calendarTimes = useMemo(() => {
    if (!businessData?.calendarHours) {
      return {
        minTime: new Date(0, 0, 0, 9, 0, 0), // Default to 9 AM
        maxTime: new Date(0, 0, 0, 17, 0, 0), // Default to 5 PM
      };
    }

    let earliestStart = 24 * 60; // Initialize with a value greater than any possible start time
    let latestEnd = 0; // Initialize with a value less than any possible end time

    Object.values(businessData.calendarHours).forEach((hours: any) => {
      if (hours && hours.start && hours.end) {
        const [startHour, startMinute] = hours.start.split(':').map(Number);
        const [endHour, endMinute] = hours.end.split(':').map(Number);
        const startInMinutes = startHour * 60 + startMinute;
        const endInMinutes = endHour * 60 + endMinute;

        earliestStart = Math.min(earliestStart, startInMinutes);
        latestEnd = Math.max(latestEnd, endInMinutes);
      }
    });

    // Add 1 hour padding before and after
    earliestStart = Math.max(0, earliestStart - 60);
    latestEnd = Math.min(22 * 60, latestEnd + 60); // Cap at 22:00 (10pm) to avoid empty space

    const minHour = Math.floor(earliestStart / 60);
    const minMinute = earliestStart % 60;
    const maxHour = Math.floor(latestEnd / 60);
    const maxMinute = latestEnd % 60;

    return {
      minTime: new Date(0, 0, 0, minHour, minMinute, 0),
      maxTime: new Date(0, 0, 0, maxHour, maxMinute, 0),
    };
  }, [businessData?.calendarHours]);


  return (
    <div className="space-y-6" style={pageStyle}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage your scheduled jobs</p>
        </div>
        <Button onClick={() => setLocation("/dashboard/jobs/new")} style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
          <Plus className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="quote_visit">Quote Visit</SelectItem>
                <SelectItem value="regular_job">Regular Job</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: isMobile ? 500 : 700 }}
            view={calendarView}
            onView={setCalendarView}
            date={currentDate}
            onNavigate={setCurrentDate}
            onSelectEvent={(event) => setSelectedJob(event.resource)}
            eventPropGetter={eventStyleGetter}
            slotPropGetter={slotPropGetter}
            views={["month", "week", "day", "agenda"]}
            defaultView={isMobile ? "day" : "month"}
            step={30}
            timeslots={2}
            scrollToTime={new Date()}
            toolbar={true}
            min={calendarTimes.minTime}
            max={calendarTimes.maxTime}
          />
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Job Details - {selectedJob.jobNumber}
                <Badge className={statusColors[selectedJob.status]}>
                  {statusLabels[selectedJob.status]}
                </Badge>
                {selectedJob.serviceType && (
                  <Badge variant="outline">
                    {selectedJob.serviceType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Customer</Label>
                <p className="text-sm">
                  {selectedJob.contactName || contacts.find((c) => c.id === selectedJob.contactId)?.fullName || "Unknown"}
                </p>
              </div>
              <div>
                <Label>Title</Label>
                <p className="text-sm">{selectedJob.title}</p>
              </div>
              {selectedJob.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedJob.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Scheduled Date</Label>
                  <p className="text-sm">{selectedJob.scheduledDate ? formatDateSA(selectedJob.scheduledDate) : "Not scheduled"}</p>
                </div>
                <div>
                  <Label>Time</Label>
                  <p className="text-sm">
                    {selectedJob.scheduledStartTime || "Not set"} - {selectedJob.scheduledEndTime || "Not set"}
                  </p>
                </div>
              </div>
              {selectedJob.locationAddress && (
                <div>
                  <Label>Location</Label>
                  <p className="text-sm">{selectedJob.locationAddress}</p>
                </div>
              )}
              {selectedJob.internalNotes && (
                <div>
                  <Label>Internal Notes</Label>
                  <p className="text-sm">{selectedJob.internalNotes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              <Button onClick={() => setLocation(`/dashboard/jobs/${selectedJob.id}/edit`)} style={{ backgroundColor: '#612fff', borderColor: '#612fff' }}>
                Edit Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}