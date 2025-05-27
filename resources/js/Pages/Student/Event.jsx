import StudentLayout from "@/Layouts/StudentLayout";
import { Head, usePage } from "@inertiajs/react";
import { Download, PieChart, ChevronDown, Filter, Search, Calendar, MapPin, Users, X, Bell, Tag, Calendar as CalendarIcon, CheckCircle, AlertCircle, Info, ArrowRight, Clock, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function StudentEvent() {
    const { auth } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('/student/api/events');
            
            if (response.data.success) {
                const formattedEvents = response.data.data.map(event => ({
                    ...event,
                    timeDetails: {
                        morning: {
                            timeIn: formatTime(event.timeInAM),
                            timeInDuration: event.timeInAMDuration,
                            timeOut: formatTime(event.timeOutAM),
                            timeOutDuration: event.timeOutAMDuration,
                        },
                        afternoon: {
                            timeIn: formatTime(event.timeInPM),
                            timeInDuration: event.timeInPMDuration,
                            timeOut: formatTime(event.timeOutPM),
                            timeOutDuration: event.timeOutPMDuration,
                        },
                        night: {
                            timeIn: formatTime(event.timeInNight),
                            timeInDuration: event.timeInNightDuration,
                            timeOut: formatTime(event.timeOutNight),
                            timeOutDuration: event.timeOutNightDuration,
                        },
                    }
                }));
                setEvents(formattedEvents);
            } else {
                setEvents([]);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.data.message || 'Failed to fetch events data'
                });
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
            setIsLoading(false);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch events. Please try again later.'
            });
        }
    };

    const handleDownloadPDF = (event) => {
        // Implement download logic for specific event
        window.location.href = `/events/download/${event.id}`;
    };

    // Group events by event name
    const groupedByEvent = events.reduce((acc, event) => {
        if (!acc[event.eventname]) {
            acc[event.eventname] = [];
        }
        acc[event.eventname].push(event);
        return acc;
    }, {});

    // Filter events based on search term and filter type
    const filteredEvents = Object.entries(groupedByEvent).filter(([event]) => 
        event.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterType === 'All' || event.toLowerCase().includes(filterType.toLowerCase()))
    );

    const openModal = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <StudentLayout user={auth.user}>
            <Head title="Student Events" />
            
            {/* Search and Filter */}
            <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-md">
                <div className="relative w-full md:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-green-800" size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="pl-10 pr-4 py-3 w-full md:w-80 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center space-x-4 w-full md:w-auto">
                    <div className="relative w-full md:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="text-green-800" size={18} />
                        </div>
                        <select
                            className="appearance-none bg-white pl-10 pr-10 py-3 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm w-full"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option>All</option>
                            <option>Upcoming</option>
                            <option>Past</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown className="text-gray-400" size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((_, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 animate-pulse">
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-gray-200 h-2 rounded-full w-1/2 animate-pulse"></div>
                            </div>
                            <div className="flex space-x-2 mt-4">
                                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Events Grid */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
                    {filteredEvents.map(([event, eventDetails]) => (
                        <div 
                            key={event} 
                            className="group overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 transform hover:-translate-y-1"
                        >
                            <div className="h-2 bg-gradient-to-r from-green-600 to-green-800"></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-300">
                                        {event}
                                    </h3>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Tag className="w-3 h-3 mr-1" />
                                        Event
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center text-gray-800">
                                        <Calendar className="w-5 h-5 mr-3 text-green-800" />
                                        <span className="text-sm">
                                            {formatDate(eventDetails[0].date)}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-800">
                                        <Clock className="w-5 h-5 mr-3 text-green-800" />
                                        <span className="text-sm">{eventDetails[0].timeDetails.morning.timeIn} - {eventDetails[0].timeDetails.afternoon.timeOut}</span>
                                    </div>
                                    <div className="flex items-center text-gray-800">
                                        <MapPin className="w-5 h-5 mr-3 text-green-800" />
                                        <span className="text-sm">{eventDetails[0].location}</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button 
                                        onClick={() => openModal(eventDetails[0])}
                                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 rounded-md text-white transition-colors duration-300"
                                    >
                                        View Details
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No results message */}
            {!isLoading && filteredEvents.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-md">
                    <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                        <Search size={40} className="text-indigo-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No matching events found</h3>
                    <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
            )}

            {/* Event Details Modal */}
            {isModalOpen && selectedEvent && (
                <div className="fixed inset-0 z-50  overflow-y-auto bg-black/60 backdrop-blur-sm">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div 
                            className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-0 transform transition-all duration-300 scale-100"
                        >
                            <div className="h-3 bg-gradient-to-r from-green-600 to-green-800 rounded-t-xl"></div>
                            
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 hover:bg-gray-100 transition-colors duration-200"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {selectedEvent.eventname}
                                </h2>
                                
                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-4">
                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                    {new Date(selectedEvent.date) >= new Date() ? 'Upcoming Event' : 'Past Event'}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                                        <Calendar className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-xs text-gray-500">Date</p>
                                            <p className="font-medium">{formatDate(selectedEvent.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                                        <MapPin className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-xs text-gray-500">Location</p>
                                            <p className="font-medium">{selectedEvent.location}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 bg-gray-50 p-4 rounded-lg">
                                    {/* Morning Schedule */}
                                    {selectedEvent.timeDetails.morning.timeIn && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                                                <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2 py-0.5 rounded">Morning</span>
                                                Schedule
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white p-2 rounded-lg">
                                                    <p className="text-xs text-gray-500">Time In:</p>
                                                    <p className="text-sm font-medium flex items-center">
                                                        <ArrowRight className="w-3 h-3 mr-1 text-green-600" />
                                                        {selectedEvent.timeDetails.morning.timeIn}
                                                        <span className="ml-1 text-xs text-gray-500">({selectedEvent.timeDetails.morning.timeInDuration})</span>
                                                    </p>
                                                </div>
                                                <div className="bg-white p-2 rounded-lg">
                                                    <p className="text-xs text-gray-500">Time Out:</p>
                                                    <p className="text-sm font-medium flex items-center">
                                                        <ArrowRight className="w-3 h-3 mr-1 text-red-500" />
                                                        {selectedEvent.timeDetails.morning.timeOut}
                                                        <span className="ml-1 text-xs text-gray-500">({selectedEvent.timeDetails.morning.timeOutDuration})</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Afternoon Schedule */}
                                    {selectedEvent.timeDetails.afternoon.timeIn && (
                                        <div className="mt-3">
                                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium me-2 px-2 py-0.5 rounded">Afternoon</span>
                                                Schedule
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white p-2 rounded-lg">
                                                    <p className="text-xs text-gray-500">Time In:</p>
                                                    <p className="text-sm font-medium flex items-center">
                                                        <ArrowRight className="w-3 h-3 mr-1 text-green-600" />
                                                        {selectedEvent.timeDetails.afternoon.timeIn}
                                                        <span className="ml-1 text-xs text-gray-500">({selectedEvent.timeDetails.afternoon.timeInDuration})</span>
                                                    </p>
                                                </div>
                                                <div className="bg-white p-2 rounded-lg">
                                                    <p className="text-xs text-gray-500">Time Out:</p>
                                                    <p className="text-sm font-medium flex items-center">
                                                        <ArrowRight className="w-3 h-3 mr-1 text-red-500" />
                                                        {selectedEvent.timeDetails.afternoon.timeOut}
                                                        <span className="ml-1 text-xs text-gray-500">({selectedEvent.timeDetails.afternoon.timeOutDuration})</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Night Schedule */}
                                    {selectedEvent.timeDetails.night.timeIn && (
                                        <div className="mt-3">
                                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                                                <span className="bg-purple-100 text-purple-800 text-xs font-medium me-2 px-2 py-0.5 rounded">Evening</span>
                                                Schedule
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white p-2 rounded-lg">
                                                    <p className="text-xs text-gray-500">Time In:</p>
                                                    <p className="text-sm font-medium flex items-center">
                                                        <ArrowRight className="w-3 h-3 mr-1 text-green-600" />
                                                        {selectedEvent.timeDetails.night.timeIn}
                                                        <span className="ml-1 text-xs text-gray-500">({selectedEvent.timeDetails.night.timeInDuration})</span>
                                                    </p>
                                                </div>
                                                <div className="bg-white p-2 rounded-lg">
                                                    <p className="text-xs text-gray-500">Time Out:</p>
                                                    <p className="text-sm font-medium flex items-center">
                                                        <ArrowRight className="w-3 h-3 mr-1 text-red-500" />
                                                        {selectedEvent.timeDetails.night.timeOut}
                                                        <span className="ml-1 text-xs text-gray-500">({selectedEvent.timeDetails.night.timeOutDuration})</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4 flex justify-end">
                                    <button 
                                        onClick={() => setIsModalOpen(false)}
                                        className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
}