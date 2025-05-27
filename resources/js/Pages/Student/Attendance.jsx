import { Head } from "@inertiajs/react";
import StudentLayout from "@/Layouts/StudentLayout";
import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import axios from "axios";

export default function StudentAttendance({ auth }) {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use route helper to get the correct URL
        axios.get(route('student.attendance.view'))
            .then(response => {
                console.log('Attendance data:', response.data);
                if (response.data.success) {
                    setAttendanceData(response.data.attendance || []);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching attendance:', error);
                setLoading(false);
            });
    }, []);

    // Helper function to render the attendance cell
    const renderAttendanceCell = (value) => {
        if (value === null) {
            return (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-50">
                    <Clock className="w-4 h-4 text-gray-400" />
                </span>
            );
        } else if (value === 'Absent') {
            return (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white">
                    <XCircle className="w-4 h-4" />
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
                    <CheckCircle2 className="w-4 h-4" />
                </span>
            );
        }
    };

    return (
        <StudentLayout user={auth.user}>
            <div className="container mx-auto py-6">
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gradient-to-l from-green-900 to-green-800">
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                                    Morning In
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                                    Morning Out
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                                    Afternoon In
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                                    Afternoon Out
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                                    Night In
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                                    Night Out
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center">
                                        <div className="animate-pulse">
                                            <div className="w-32 h-4 bg-gray-200 rounded-full mb-4"></div>
                                            <div className="w-24 h-4 bg-gray-200 rounded-full"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : attendanceData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                                        <div className="space-y-4">
                                            <Calendar className="w-8 h-8 mx-auto text-gray-400" />
                                            <p>No attendance records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                attendanceData.map((record, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{record.event.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900">{record.date}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {renderAttendanceCell(record.time_in_am)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {renderAttendanceCell(record.time_out_am)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {renderAttendanceCell(record.time_in_pm)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {renderAttendanceCell(record.time_out_pm)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {renderAttendanceCell(record.time_in_night)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {renderAttendanceCell(record.time_out_night)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </StudentLayout>
    );
}