"use client";

import { useState, useMemo, useEffect } from "react";
import { addDays, startOfWeek, format, isToday, parseISO, isSameDay, getHours, getMinutes, setHours, setMinutes, getDate, getMonth, getYear, addMonths, subMonths } from "date-fns";
import { enUS } from 'date-fns/locale'; // Ensure English locale is imported
import React from "react";
import { useAppointments, AppointmentEvent } from "@/hooks/useAppointments";

const HOURS = Array.from({ length: 14 }, (_, i) => 8 + i); // 8:00-21:00
const WEEKDAYS_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date()); // Set initial date to today
  const [viewMode, setViewMode] = useState('week');

  // Mini calendar state
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date()); // Initially set to current month

  // Use real appointments data
  const { events: dbEvents, loading, error } = useAppointments();
  
  // New: Event state and modal state
  const [calendarEvents, setCalendarEvents] = useState<AppointmentEvent[]>([]);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    color: 'bg-blue-500' // Default color
  });

  // Update calendar events when database events are loaded
  useEffect(() => {
    if (!loading && dbEvents) {
      setCalendarEvents(dbEvents);
    }
  }, [dbEvents, loading]);

  // Handle new event input changes
  const handleNewEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  // Handle saving new events
  const handleSaveNewEvent = () => {
    if (newEvent.title && newEvent.start && newEvent.end) {
      const newId = `event-${Date.now()}`;
      const eventToAdd: AppointmentEvent = { 
        ...newEvent, 
        id: newId,
        service: 'manual',
        user: 'Manual Entry',
        status: 'confirmed'
      };
      setCalendarEvents((prev: AppointmentEvent[]) => [...prev, eventToAdd]);
      setShowCreateEventModal(false);
      setNewEvent({
        title: '',
        start: '',
        end: '',
        description: '',
        color: 'bg-blue-500'
      });
    } else {
      alert('Please fill in event title, start, and end times.');
    }
  };

  // Calculate date range based on current date and view mode
  const { datesToDisplay, headerFormat, gridColsClass, showTimeColumn } = useMemo(() => {
    let dates: Date[] = [];
    let headerFmt = '';
    let colsClass = '';
    let showTime = true;

    switch (viewMode) {
      case 'day':
        dates = [currentDate];
        headerFmt = 'MMM dd, yyyy (EEEE)'; 
        colsClass = 'grid-cols-2'; 
        break;
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday as week start, matching Google Calendar
        dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
        headerFmt = 'MMM dd - MMM dd, yyyy';
        colsClass = 'grid-cols-8'; 
        break;
              case 'month': // Month view: display 12 months of a full year
        dates = []; // Handle months separately in rendering section
        headerFmt = 'yyyy'; // Only display year
        colsClass = ''; // Main grid no longer uses this class, will render month grids internally
        showTime = false;
        break;
    }
    return { datesToDisplay: dates, headerFormat: headerFmt, gridColsClass: colsClass, showTimeColumn: showTime };
  }, [currentDate, viewMode]);

  // Handle date navigation
  const handlePrev = () => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day': return addDays(prev, -1);
        case 'week': return addDays(prev, -7);
        case 'month': return new Date(prev.getFullYear() - 1, 0, 1); // Month view switches years
        default: return prev;
      }
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      switch (viewMode) {
        case 'day': return addDays(prev, 1);
        case 'week': return addDays(prev, 7);
        case 'month': return new Date(prev.getFullYear() + 1, 0, 1); // Month view switches years
        default: return prev;
      }
    });
  };

  // Filter events for current view
  const eventsInView = useMemo(() => {
    // For month view, we filter events by month rather than the entire datesToDisplay
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      return calendarEvents.filter(event => {
        const eventStart = parseISO(event.start);
        return getYear(eventStart) === year;
      });
    }
    return calendarEvents.filter(event => {
      const eventStart = parseISO(event.start);
      return datesToDisplay.some(day => isSameDay(day, eventStart));
    });
  }, [datesToDisplay, viewMode, currentDate, calendarEvents]);

  // Real-time display of current timeline
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const currentHour = getHours(now);
  const currentMinute = getMinutes(now);
  const currentDayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday...
  const isTodayDisplayedInWeek = datesToDisplay.some(day => isToday(day));

  // Calculate time axis labels (8 AM, 9 AM, 10 AM, 11 AM, 12 PM, 1 PM...)
  const formatTime = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  // Calculate event styles (top and height)
  const getEventStyle = (event: AppointmentEvent) => {
    const start = parseISO(event.start);
    const end = parseISO(event.end);
    const startMinutes = getHours(start) * 60 + getMinutes(start);
    const endMinutes = getHours(end) * 60 + getMinutes(end);
    
    const durationMinutes = endMinutes - startMinutes;
    // Ensure minimum 30-minute display height, even if appointment is shorter
    const minDurationMinutes = Math.max(durationMinutes, 30);
    
    // Calculate position within current hour (0-60 minutes)
    const minutesIntoHour = getMinutes(start);
    const topPercentage = (minutesIntoHour / 60) * 100;
    
    // Calculate height, minimum 30 minutes, maximum no more than 2 hours
    const maxDurationMinutes = Math.min(minDurationMinutes, 120);
    const heightPercentage = Math.min((maxDurationMinutes / 60) * 100, 95);

    return {
      top: `${topPercentage}%`,
      height: `${heightPercentage}%`,
      zIndex: 2,
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading appointments...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-lg text-red-600">Error loading appointments: {error}</div>
      </div>
    );
  }

  return (
        <div className="flex-1 flex bg-gray-50"> {/* Remove ml-64, handled by layout.tsx */}
      {/* Calendar-specific sidebar */}
      <aside className="w-64 bg-white p-4 shadow-md mr-4 rounded-lg flex-shrink-0">
        {/* Create button */}
        <button
          className="flex items-center gap-2 bg-[#6C5DD3] text-white px-4 py-2 rounded-full mb-4 shadow-md hover:opacity-90"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            console.log("Create button clicked, attempting to show modal.");
            setShowCreateEventModal(true);
          }}
          type="button" // Explicitly specify as button type to prevent accidental form submission
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/></svg>
          Create
        </button>

        {/* Mini calendar */}
        <div className="mb-6 p-2 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2 text-gray-700">
            <h3 className="font-semibold">{format(miniCalendarMonth, 'MMMM yyyy', { locale: enUS })}</h3>
            <div className="flex gap-1">
              <button onClick={() => setMiniCalendarMonth(subMonths(miniCalendarMonth, 1))} className="p-1 rounded-full hover:bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/></svg></button>
              <button onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, 1))} className="p-1 rounded-full hover:bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg></button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
            {WEEKDAYS_SHORT_EN.map((day, i) => <div key={i} className="font-semibold">{day[0]}</div>)}
          </div>
          <div className="grid grid-cols-7 text-center text-sm">
            {Array.from({ length: getDate(new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth() + 1, 0)) }, (_, i) => i + 1).map(dayNum => {
              const dayDate = new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth(), dayNum);
              const isSelectedDay = isSameDay(dayDate, currentDate);
              const isTodayMini = isToday(dayDate);
              const classes = `w-7 h-7 flex items-center justify-center rounded-full cursor-pointer ${isSelectedDay ? 'bg-blue-500 text-white' : isTodayMini ? 'border border-blue-400 text-blue-600' : 'hover:bg-gray-200'}`;
              return (
                <div key={dayNum} className="flex justify-center items-center py-0.5">
                  <div className={classes} onClick={() => setCurrentDate(dayDate)}>
                    {dayNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search for people */}
        <div className="mb-6">
          <div className="relative">
            <input type="text" placeholder="Search for people" className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] text-sm" />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
          </div>
        </div>
      </aside>

      {/* Main content area: Calendar view */}
      <main className="flex-1 p-8 bg-white rounded-lg shadow-sm">
                  {/* Top control bar */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/></svg></button>
            <h2 className="text-2xl font-bold text-gray-800">
              {format(currentDate, headerFormat, { locale: enUS })}
            </h2>
            <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg></button>
          </div>
          <div className="text-sm text-gray-500 font-medium">GMT+01</div> {/* Timezone label */}
          {/* View toggle buttons */}
          <div className="flex gap-2 border border-gray-300 rounded-lg overflow-hidden">
            <button className={`px-4 py-2 text-sm ${viewMode === 'day' ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`} onClick={() => setViewMode('day')}>Day</button>
            <button className={`px-4 py-2 text-sm ${viewMode === 'week' ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`} onClick={() => setViewMode('week')}>Week</button>
            <button className={`px-4 py-2 text-sm ${viewMode === 'month' ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-700'}`} onClick={() => setViewMode('month')}>Month</button>
          </div>
        </div>

        {/* Calendar grid */} 
        {viewMode === 'month' ? (
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 12 }, (_, i) => i).map(monthIndex => {
              const monthStart = new Date(currentDate.getFullYear(), monthIndex, 1);
              const daysInMonth = Array.from({ length: getDate(new Date(currentDate.getFullYear(), monthIndex + 1, 0)) }, (_, j) => j + 1);
              const firstDayOfMonth = monthStart.getDay(); // 0 for Sunday, 1 for Monday...
              const yearEvents = eventsInView.filter(event => getMonth(parseISO(event.start)) === monthIndex && getYear(parseISO(event.start)) === currentDate.getFullYear());

              return (
                <div key={monthIndex} className="bg-white rounded-lg shadow border border-gray-200 p-3">
                  <h4 className="text-center font-semibold text-gray-800 mb-2">{format(monthStart, 'MMMM', { locale: enUS })}</h4>
                  <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
                    {WEEKDAYS_SHORT_EN.map((day, i) => <div key={i}>{day[0]}</div>)}
                  </div>
                  <div className="grid grid-cols-7 text-center text-sm">
                    {Array.from({ length: firstDayOfMonth }, (_, i) => (
                      <div key={`empty-${i}`} className="h-7"></div> // Empty placeholder
                    ))}
                    {daysInMonth.map(dayNum => {
                      const dayDate = new Date(currentDate.getFullYear(), monthIndex, dayNum);
                      const isTodayMonthView = isToday(dayDate);
                      const hasEvents = yearEvents.some(event => isSameDay(parseISO(event.start), dayDate));
                      const classes = `w-7 h-7 flex items-center justify-center rounded-full cursor-pointer ${isTodayMonthView ? 'bg-[#6C5DD3] text-white' : hasEvents ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-200'}`;
                      return (
                        <div key={dayNum} className="flex justify-center items-center py-0.5">
                          <div className={classes}>
                            {dayNum}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`grid ${gridColsClass} border border-gray-200 overflow-hidden`}>
            {/* Time column and date headers */}
            <div className="col-span-1 border-r border-b border-gray-200 bg-white py-3 text-center text-sm font-semibold text-gray-600"></div>
            {datesToDisplay.map((day, index) => (
              <div key={index} className={`col-span-1 border-b border-r border-gray-200 py-3 text-center text-sm font-semibold ${isToday(day) ? '' : 'text-gray-600'}`}>
                <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-[#6C5DD3] text-white' : ''}`}>{WEEKDAYS_SHORT_EN[day.getDay()]}</div>
                <div className={`text-lg font-bold ${isToday(day) ? 'text-[#6C5DD3]' : ''}`}>{format(day, 'd', { locale: enUS })}</div>
              </div>
            ))}

            {/* Time axis and event area */}
            {HOURS.map(hour => {
              const currentDayOfNow = datesToDisplay.find(day => isSameDay(day, now));
              const isCurrentHourAndDay = isSameDay(now, currentDayOfNow || new Date()) && hour === currentHour && (viewMode === 'week' || viewMode === 'day');

              return (
                <React.Fragment key={hour}>
                  <div key={`time-${hour}`} className="col-span-1 border-r border-b border-gray-200 p-2 text-right text-xs text-gray-500 relative">
                    {formatTime(hour)}
                    {isCurrentHourAndDay && (
                      <div className="absolute -right-1 top-1/2 w-full border-t border-red-500 z-10" style={{ top: `${currentMinute / 60 * 100}%` }}>
                        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {datesToDisplay.map((day, dayIndex) => {
                    const eventsForThisHour = eventsInView.filter(event => {
                      const eventStart = parseISO(event.start);
                      return isSameDay(eventStart, day) && getHours(eventStart) === hour;
                    });

                    return (
                      <div key={`cell-${hour}-${dayIndex}`} className={`relative col-span-1 border-b border-r border-gray-200 h-24 ${
                        isToday(day) && viewMode !== 'month' ? 'bg-purple-50' : ''
                      }`}>
                        {eventsForThisHour.map(event => (
                          <div
                            key={event.id}
                            className={`absolute left-1 right-1 rounded-lg px-3 py-2 text-white text-sm font-medium shadow-lg border-l-4 border-white cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 ${event.color}`}
                            style={{...getEventStyle(event), minHeight: '40px'}}
                            title={`${event.title}\n${event.service} for ${event.user}\nStatus: ${event.status}`}
                          >
                            <div className="font-bold text-sm leading-tight mb-1">{event.title}</div>
                            <div className="text-xs opacity-90 font-medium">
                              {format(parseISO(event.start), 'h:mm a', { locale: enUS })} - {format(parseISO(event.end), 'h:mm a', { locale: enUS })}
                            </div>
                            {event.user && (
                              <div className="text-xs opacity-85 font-medium mt-1 flex items-center">
                                <span className="mr-1">👤</span>
                                <span className="truncate">{event.user}</span>
                              </div>
                            )}
                            <div className="text-xs opacity-75 font-medium mt-1">
                              📅 {event.service}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out transform scale-100 opacity-100">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 ease-out scale-100 opacity-100 animate-zoomIn">
            <h2 className="text-2xl font-bold mb-4">Create New Event</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveNewEvent();
            }}>
              <div className="mb-4">
                <label htmlFor="event-title" className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                <input
                  type="text"
                  id="event-title"
                  name="title"
                  value={newEvent.title}
                  onChange={handleNewEventChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="event-start" className="block text-gray-700 text-sm font-bold mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  id="event-start"
                  name="start"
                  value={newEvent.start}
                  onChange={handleNewEventChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="event-end" className="block text-gray-700 text-sm font-bold mb-2">End Time</label>
                <input
                  type="datetime-local"
                  id="event-end"
                  name="end"
                  value={newEvent.end}
                  onChange={handleNewEventChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="event-description" className="block text-gray-700 text-sm font-bold mb-2">Description (Optional)</label>
                <textarea
                  id="event-description"
                  name="description"
                  value={newEvent.description}
                  onChange={handleNewEventChange}
                  rows={3}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                ></textarea>
              </div>
              <div className="mb-6">
                <label htmlFor="event-color" className="block text-gray-700 text-sm font-bold mb-2">Color</label>
                <select
                  id="event-color"
                  name="color"
                  value={newEvent.color}
                  onChange={handleNewEventChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-green-500">Green</option>
                  <option value="bg-red-500">Red</option>
                  <option value="bg-yellow-500">Yellow</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-orange-500">Orange</option>
                  <option value="bg-sky-500">Sky</option>
                </select>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#6C5DD3] hover:bg-[#5A4BC4] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 