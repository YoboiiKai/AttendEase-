import { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import AdminLayout from "@/Layouts/AdminLayout";
import AddEventModal from "@/Components/AddEventModal";
import UpdateEventModal from "@/Components/UpdateEventModal";
import Swal from "sweetalert2";
import axios from 'axios';

const Event = ({ auth }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterLocation, setFilterLocation] = useState("All");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [eventData, setEventData] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [locationOptions, setLocationOptions] = useState(["All"]);
    const [currentPage, setCurrentPage] = useState(1);
    const [eventsPerPage] = useState(10);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        // Extract unique locations from events and add to filter options
        if (eventData.length > 0) {
            const uniqueLocations = [...new Set(eventData.map(event => event.location))];
            setLocationOptions(["All", ...uniqueLocations]);
        }
    }, [eventData]);

    const fetchEvents = async () => {
        try {
            const response = await axios.get("api/admin/event");
            setEventData(response.data);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    const openUpdateModal = (event) => {
        setSelectedEventId(event.id);
        setSelectedEvent(event);
        setIsUpdateModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleCloseUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setSelectedEventId(null);
        setSelectedEvent(null);
    };

    const handleDeleteEvent = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`api/admin/event/${id}`);
                fetchEvents();
                Swal.fire('Deleted!', 'The event has been deleted.', 'success');
            } catch (error) {
                console.error('Error deleting event:', error);
                Swal.fire('Error', 'Failed to delete event', 'error');
            }
        }
    };

    const onUpdate = () => {
        fetchEvents();  // Refresh the event data
    };

    // Filter events based on search term and location
    const filteredEvents = eventData.filter((event) => {
        const matchesSearch = event.eventname
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesLocation = 
            filterLocation === "All" || event.location === filterLocation;
        
        return matchesSearch && matchesLocation;
    });

    // Get current events for pagination
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Go to first, previous, next, or last page
    const goToFirstPage = () => setCurrentPage(1);
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredEvents.length / eventsPerPage)));
    const goToLastPage = () => setCurrentPage(Math.ceil(filteredEvents.length / eventsPerPage));

    return (
        <AdminLayout user={auth.user}>
            <div className="container mx-auto py-6">
                <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-md">
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                        <div className="relative w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-green-800" size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by event name..."
                                className="pl-10 pr-4 py-3 w-full sm:w-80 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="text-green-800" size={18} />
                            </div>
                            <select
                                className="appearance-none bg-white pl-10 pr-10 py-3 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm w-full"
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                            >
                                {locationOptions.map((location) => (
                                    <option key={location} value={location}>
                                        {location === "All" ? "All Locations" : location}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <ChevronDown className="text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 w-full md:w-auto mt-4 md:mt-0">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-5 py-3 rounded-lg shadow-md transition-all duration-300 flex items-center space-x-2 w-full md:w-auto justify-center font-medium"
                        >
                            <Plus size={18} />
                            <span>Add Event</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gradient-to-l from-green-900 to-green-800">
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    In (AM)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    In Dur (AM)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Out (AM)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Out Dur (AM)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    In (PM)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    In Dur (PM)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Out (PM)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Out Dur (PM)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    In (Night)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    In Dur (Night)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Out (Night)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Out Dur (Night)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentEvents.length > 0 ? (
                                currentEvents.map((event) => (
                                    <tr key={event.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.eventname}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.location}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeInAM || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeInAMDuration || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeOutAM || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeOutAMDuration || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeInPM || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeInPMDuration || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeOutPM || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeOutPMDuration || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeInNight || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeInNightDuration || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeOutNight || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.timeOutNightDuration || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => openUpdateModal(event)}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-lg hover:bg-blue-200 transition-all duration-200"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-lg hover:bg-red-200 transition-all duration-200"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="18" className="px-6 py-4 text-center text-gray-500">
                                        No events found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredEvents.length > 0 && (
                    <div className="mt-4 flex justify-end items-center">
                        <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-md">
                            <p className="text-sm text-gray-700 mr-4">
                                Showing <span className="font-medium">{indexOfFirstEvent + 1}</span> to{" "}
                                <span className="font-medium">
                                    {Math.min(indexOfLastEvent, filteredEvents.length)}
                                </span>{" "}
                                of <span className="font-medium">{filteredEvents.length}</span> events
                            </p>
                            
                            <button
                                onClick={goToFirstPage}
                                disabled={currentPage === 1}
                                className={`p-1.5 rounded-md ${
                                    currentPage === 1
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronsLeft size={18} />
                            </button>
                            
                            <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className={`p-1.5 rounded-md ${
                                    currentPage === 1
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            
                            <div className="flex space-x-1">
                                {[...Array(Math.min(5, Math.ceil(filteredEvents.length / eventsPerPage)))].map((_, i) => {
                                    // Calculate page number to display
                                    let pageNum;
                                    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
                                    
                                    if (totalPages <= 5) {
                                        // If 5 or fewer pages, show all
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        // If near start, show first 5 pages
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        // If near end, show last 5 pages
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        // Otherwise show current page and 2 on each side
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => paginate(pageNum)}
                                            className={`px-3 py-1 rounded-md ${
                                                currentPage === pageNum
                                                    ? "bg-green-800 text-white"
                                                    : "text-green-800 hover:bg-green-100"
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === Math.ceil(filteredEvents.length / eventsPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredEvents.length / eventsPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronRight size={18} />
                            </button>
                            
                            <button
                                onClick={goToLastPage}
                                disabled={currentPage === Math.ceil(filteredEvents.length / eventsPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredEvents.length / eventsPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <AddEventModal
                    isOpen={isAddModalOpen}
                    onClose={handleCloseAddModal}
                    onUpdate={onUpdate}
                />
                <UpdateEventModal
                    isOpen={isUpdateModalOpen}
                    onClose={handleCloseUpdateModal}
                    event={selectedEvent}
                    onUpdate={onUpdate}
                />
            </div>
        </AdminLayout>
    );
};

export default Event;
