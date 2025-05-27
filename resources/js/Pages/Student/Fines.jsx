import StudentLayout from "@/Layouts/StudentLayout";
import { Head, usePage } from "@inertiajs/react";
import { DollarSign, AlertCircle, CheckCircle, Calendar, Users, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function StudentFines() {
    const { auth } = usePage().props;
    const [fines, setFines] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [absentCount, setAbsentCount] = useState(0);
    const [absentFineAmount, setAbsentFineAmount] = useState(0);
    const [eventAbsences, setEventAbsences] = useState([]);
    
    // Fetch student fines and attendance data when component mounts
    useEffect(() => {
        fetchStudentFines();
        fetchAttendanceData();
        fetchAbsentFineAmount();
    }, []);
    
    // Calculate absent count whenever attendance data changes
    useEffect(() => {
        calculateAbsentCount();
        groupAttendanceByEvent();
    }, [attendanceData, absentFineAmount]);
    
    // Fetch fines from the API
    const fetchStudentFines = async () => {
        try {
            const response = await axios.get('/student/api/my-fines');
            
            if (response.data.success) {
                setFines(response.data.data);
            } else {
                setFines([]);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.data.message || 'Failed to fetch fines data'
                });
            }
        } catch (error) {
            console.error('Error fetching fines:', error);
            setFines([]);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch your fines. Please try again later.'
            });
        }
    };
    
    // Fetch attendance data from the API
    const fetchAttendanceData = async () => {
        try {
            const response = await axios.get(route('student.attendance.view'));
            
            if (response.data.success) {
                setAttendanceData(response.data.attendance || []);
            } else {
                console.error('Failed to fetch attendance data:', response.data.message);
                setAttendanceData([]);
            }
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            setAttendanceData([]);
        }
    };
    
    // Fetch the absent fine amount from the fines table
    const fetchAbsentFineAmount = async () => {
        try {
            // Get all fines including the 'absent' fine type
            const response = await axios.get('/student/api/my-absent-count');
            
            if (response.data.success) {
                // Use student-specific endpoint instead of admin endpoint
                const finesResponse = await axios.get('/student/api/fine-types');
                
                if (finesResponse.data.success && finesResponse.data.data && finesResponse.data.data.length > 0) {
                    // Find the fine for absences (case insensitive search)
                    const absentFine = finesResponse.data.data.find(fine => {
                        const violation = fine.violation ? fine.violation.toLowerCase() : '';
                        const description = fine.description ? fine.description.toLowerCase() : '';
                        return violation.includes('absent') || description.includes('absent');
                    });
                    
                    if (absentFine) {
                        setAbsentFineAmount(parseFloat(absentFine.amount));
                    } else {
                        // Default amount if no specific absent fine is found
                        setAbsentFineAmount(50); // Default to 50 pesos if no absent fine is defined
                    }
                } else {
                    // Default amount if no fines are found
                    setAbsentFineAmount(50); // Default to 50 pesos
                }
            }
        } catch (error) {
            console.error('Error fetching fine amount for absences:', error);
            // Default amount if there's an error
            setAbsentFineAmount(50); // Default to 50 pesos
        }
    };
    
    // Calculate the number of absences from attendance data
    const calculateAbsentCount = () => {
        if (!attendanceData.length) return;
        
        // Count all time slots marked as 'Absent'
        let count = 0;
        
        attendanceData.forEach(record => {
            // Check morning attendance
            if (record.time_in_am === 'Absent') count++;
            if (record.time_out_am === 'Absent') count++;
            
            // Check afternoon attendance
            if (record.time_in_pm === 'Absent') count++;
            if (record.time_out_pm === 'Absent') count++;
            
            // Check night attendance
            if (record.time_in_night === 'Absent') count++;
            if (record.time_out_night === 'Absent') count++;
        });
        
        setAbsentCount(count);
    };
    
    // Group attendance data by event and calculate absences and fines
    const groupAttendanceByEvent = () => {
        if (!attendanceData.length) return;
        
        // Create a map to group attendance by event
        const eventMap = new Map();
        
        attendanceData.forEach(record => {
            // Extract event information - check all possible field structures
            let eventName = 'Regular Attendance';
            
            // Handle different data structures for event information
            if (typeof record.event === 'object' && record.event !== null) {
                // If event is an object, try to get the name property
                eventName = record.event.name || record.event.title || record.event.event_name || eventName;
            } else if (record.event_name) {
                // If event_name exists directly on the record
                eventName = record.event_name;
            } else if (record.eventName) {
                // Alternative property name
                eventName = record.eventName;
            } else if (record.event_title) {
                // Another alternative property name
                eventName = record.event_title;
            } else if (typeof record.event === 'string' && record.event.trim() !== '') {
                // If event is a string
                eventName = record.event;
            }
            
            const eventDate = formatDate(record.date);
            const key = eventName;
            
            if (!eventMap.has(key)) {
                eventMap.set(key, {
                    eventName,
                    eventDate,
                    absences: 0,
                    totalAmount: 0,
                    records: []
                });
            }
            
            const eventData = eventMap.get(key);
            let absencesInThisRecord = 0;
            
            // Check morning attendance
            if (record.time_in_am === 'Absent') absencesInThisRecord++;
            if (record.time_out_am === 'Absent') absencesInThisRecord++;
            
            // Check afternoon attendance
            if (record.time_in_pm === 'Absent') absencesInThisRecord++;
            if (record.time_out_pm === 'Absent') absencesInThisRecord++;
            
            // Check night attendance
            if (record.time_in_night === 'Absent') absencesInThisRecord++;
            if (record.time_out_night === 'Absent') absencesInThisRecord++;
            
            eventData.absences += absencesInThisRecord;
            eventData.totalAmount += absencesInThisRecord * absentFineAmount;
            eventData.records.push({
                ...record,
                absencesInRecord: absencesInThisRecord
            });
            
            eventMap.set(key, eventData);
        });
        
        // Convert map to array and sort by date (most recent first)
        const eventArray = Array.from(eventMap.values())
            .filter(event => event.absences > 0) // Only include events with absences
            .sort((a, b) => {
                // Sort by event name
                return a.eventName.localeCompare(b.eventName);
            });
        
        setEventAbsences(eventArray);
    };
    
    // Format date to readable format
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'unpaid':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-red-100 text-red-800 border-red-200';
        }
    };
    
    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid':
                return <CheckCircle size={16} className="text-green-600" />;
            case 'unpaid':
                return <AlertCircle size={16} className="text-yellow-600" />;
            default:
                return <AlertCircle size={16} className="text-red-600" />;
        }
    };
    
    // Check if any fines have been paid for absences
    const getEventPaymentStatus = (eventName) => {
        // Check if there are any fines with this event name that have been paid
        const eventFines = fines.filter(fine => 
            fine.reason && fine.reason.includes(eventName)
        );
        
        if (eventFines.length === 0) {
            return 'unpaid';
        }
        
        const paidFines = eventFines.filter(fine => fine.status === 'paid');
        if (paidFines.length === eventFines.length) {
            return 'paid';
        } else if (paidFines.length > 0) {
            return 'partially_paid';
        } else {
            return 'unpaid';
        }
    };
    
    return (
        <StudentLayout user={auth.user}>
            <Head title="My Fines" />
            
            <div className="container mx-auto py-6 px-4">
                {/* Fines Summary */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
                    {/* Total Fines Card */}
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-blue-800 mb-1">Total Fines</p>
                                <p className="text-3xl font-bold text-blue-900">
                                    ₱{(fines.reduce((total, fine) => total + parseFloat(fine.amount), 0) + (absentCount * absentFineAmount)).toFixed(2)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Includes {absentCount} absence(s) at ₱{absentFineAmount} each
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl shadow-md">
                                <DollarSign className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-blue-200 opacity-20"></div>
                    </div>

                    {/* Paid Fines Card */}
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-green-800 mb-1">Paid Fines</p>
                                <p className="text-3xl font-bold text-green-900">
                                    ₱{fines.filter(fine => fine.status === 'paid').reduce((total, fine) => total + parseFloat(fine.amount), 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl shadow-md">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-green-200 opacity-20"></div>
                    </div>
                    
                    {/* Unpaid Fines Card */}
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-yellow-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-yellow-800 mb-1">Unpaid Fines</p>
                                <p className="text-3xl font-bold text-yellow-900">
                                    ₱{(fines.filter(fine => fine.status === 'unpaid').reduce((total, fine) => total + parseFloat(fine.amount), 0) + (absentCount * absentFineAmount)).toFixed(2)}
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                    Includes absence fines
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-md">
                                <AlertCircle className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-yellow-200 opacity-20"></div>
                    </div>
                </div>
                
                {/* Absence by Event Table */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden mb-8">
                    <div className="px-6 py-4 bg-gradient-to-l from-green-900 to-green-800 flex items-center">
                        <Calendar className="h-5 w-5 text-green-200 mr-2" />
                        <h2 className="text-lg font-semibold text-white">Absences by Event</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-green-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                        Event Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                        Total Absences
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                        Total Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {eventAbsences.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No absences recorded for any events.
                                        </td>
                                    </tr>
                                ) : (
                                    eventAbsences.map((event, index) => {
                                        const status = getEventPaymentStatus(event.eventName);
                                        return (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    <div className="flex items-center">
                                                        {event.eventName === 'Regular Attendance' ? 
                                                            <span>Regular Class Attendance</span> : 
                                                            <span title={`Event on ${event.eventDate}`}>{event.eventName}</span>
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {event.absences} time{event.absences !== 1 ? 's' : ''}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₱{event.totalAmount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center ${getStatusBadgeClass(status)}`}>
                                                            {getStatusIcon(status)}
                                                            <span className="ml-1">
                                                                {status === 'partially_paid' ? 'Partially Paid' : 
                                                                 status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Fines Table */}
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-l from-green-900 to-green-800 flex items-center">
                        <DollarSign className="h-5 w-5 text-green-200 mr-2" />
                        <h2 className="text-lg font-semibold text-white">Individual Fines</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-green-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                        Fine Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                        Date Given
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {fines.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                            You don't have any fines at the moment.
                                        </td>
                                    </tr>
                                ) : (
                                    fines.map((fine) => (
                                        <tr key={fine.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {fine.fine?.violation || 'Unknown Fine Type'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ₱{parseFloat(fine.amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                {fine.reason}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(fine.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center ${getStatusBadgeClass(fine.status)}`}>
                                                        {getStatusIcon(fine.status)}
                                                        <span className="ml-1">{fine.status.charAt(0).toUpperCase() + fine.status.slice(1)}</span>
                                                    </span>
                                                    {fine.payment_date && (
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            Paid on {formatDate(fine.payment_date)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Payment Instructions */}
                <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Instructions</h2>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                        <p className="text-sm text-blue-700">
                            To pay your fines, please visit the ITS Office during office hours (8:00 AM - 5:00 PM, Monday to Friday).
                            Bring your student ID and reference the fine details shown above.
                        </p>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}