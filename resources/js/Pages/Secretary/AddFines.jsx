import React, { useState, useEffect } from 'react';
import { PlusCircle, DollarSign, X, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import SecretaryLayout from '@/Layouts/SecretaryLayout';
import AddStudentFinesModal from '@/Components/AddStudentFinesModal';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function AddFines({ auth }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [studentFines, setStudentFines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [finesPerPage] = useState(10);
    
    // Fetch existing student fines when component mounts
    useEffect(() => {
        fetchStudentFines();
    }, []);
    
    // Fetch student fines from the API
    const fetchStudentFines = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/secretary/api/student-fines');
            if (response.data.success) {
                setStudentFines(response.data.data);
            } else {
                setStudentFines([]);
            }
        } catch (error) {
            console.error('Error fetching student fines:', error);
            setStudentFines([]);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch student fines. Please try again.'
            });
        } finally {
            setLoading(false);
        }
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
    
    // Handle marking a fine as paid
    const handleMarkAsPaid = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'Mark as Paid?',
                text: 'Are you sure you want to mark this fine as paid?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, mark as paid'
            });
            
            if (result.isConfirmed) {
                const response = await axios.put(`/secretary/api/student-fines/${id}/mark-as-paid`);
                
                if (response.data.success) {
                    Swal.fire('Success', 'Fine has been marked as paid', 'success');
                    fetchStudentFines();
                } else {
                    Swal.fire('Error', response.data.message || 'Failed to update fine status', 'error');
                }
            }
        } catch (error) {
            console.error('Error marking fine as paid:', error);
            Swal.fire('Error', 'Failed to update fine status. Please try again.', 'error');
        }
    };
    
    // Handle deleting a fine
    const handleDeleteFine = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'Delete Fine?',
                text: 'Are you sure you want to delete this fine? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it'
            });
            
            if (result.isConfirmed) {
                const response = await axios.delete(`/secretary/api/student-fines/${id}`);
                
                if (response.data.success) {
                    Swal.fire('Deleted!', 'Fine has been deleted.', 'success');
                    fetchStudentFines();
                } else {
                    Swal.fire('Error', response.data.message || 'Failed to delete fine', 'error');
                }
            }
        } catch (error) {
            console.error('Error deleting fine:', error);
            Swal.fire('Error', 'Failed to delete fine. Please try again.', 'error');
        }
    };
    
    // Get status badge class
    const getStatusBadgeClass = (status) => {
        return status === 'paid' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200';
    };

    // Filter fines based on search term and status
    const filteredFines = studentFines.filter((fine) => {
        // If search term is empty, don't filter by search
        if (!searchTerm.trim()) {
            return filterStatus === 'All' || fine.status === filterStatus;
        }
        
        // Check if any field contains the search term
        const matchesSearch = 
            (fine.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fine.user?.studentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fine.fine?.violation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fine.reason?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus =
            filterStatus === 'All' || fine.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Get current fines for pagination
    const indexOfLastFine = currentPage * finesPerPage;
    const indexOfFirstFine = indexOfLastFine - finesPerPage;
    const currentFines = filteredFines.slice(indexOfFirstFine, indexOfLastFine);
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Go to first, previous, next, or last page
    const goToFirstPage = () => setCurrentPage(1);
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredFines.length / finesPerPage)));
    const goToLastPage = () => setCurrentPage(Math.ceil(filteredFines.length / finesPerPage));

    return (
        <SecretaryLayout user={auth.user}>
            <Head title="Student Fines Management" />
            <div className="container mx-auto py-6">
                <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-md">
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                        <div className="relative w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-green-800" size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search students, fines or reasons..."
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
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <ChevronDown className="text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 w-full md:w-auto mt-4 md:mt-0">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-5 py-3 rounded-lg shadow-md transition-all duration-300 flex items-center space-x-2 w-full md:w-auto justify-center font-medium"
                        >
                            <PlusCircle size={18} />
                            <span>Add Student Fine</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gradient-to-l from-green-900 to-green-800">
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Fine Type
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Reason
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Date Given
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                        <div className="flex justify-center items-center">
                                            <span className="animate-spin mr-2">⏳</span>
                                            Loading...
                                        </div>
                                    </td>
                                </tr>
                            ) : currentFines.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                        {studentFines.length === 0 
                                            ? "No student fines found. Add a new fine to get started."
                                            : "No matching fines found. Try adjusting your search or filter."}
                                    </td>
                                </tr>
                            ) : (
                                currentFines.map((fine) => (
                                    <tr key={fine.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {fine.user.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {fine.fine.violation}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₱{fine.amount}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                            {fine.reason}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(fine.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(fine.status)}`}>
                                                {fine.status.charAt(0).toUpperCase() + fine.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                {fine.status === 'unpaid' && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(fine.id)}
                                                        className="p-1.5 bg-green-100 rounded-lg hover:bg-green-200 transition-colors duration-200 flex items-center justify-center"
                                                        title="Mark as Paid"
                                                    >
                                                        <DollarSign size={16} className="text-green-600" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteFine(fine.id)}
                                                    className="p-1.5 bg-red-100 rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center justify-center"
                                                    title="Delete Fine"
                                                >
                                                    <X size={16} className="text-red-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {filteredFines.length > 0 && (
                    <div className="mt-4 flex justify-end items-center">
                        <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-md">
                            <p className="text-sm text-gray-700 mr-4">
                                Showing <span className="font-medium">{indexOfFirstFine + 1}</span> to{" "}
                                <span className="font-medium">
                                    {Math.min(indexOfLastFine, filteredFines.length)}
                                </span>{" "}
                                of <span className="font-medium">{filteredFines.length}</span> fines
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
                                {[...Array(Math.min(5, Math.ceil(filteredFines.length / finesPerPage)))].map((_, i) => {
                                    // Calculate page number to display
                                    let pageNum;
                                    const totalPages = Math.ceil(filteredFines.length / finesPerPage);
                                    
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
                                disabled={currentPage === Math.ceil(filteredFines.length / finesPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredFines.length / finesPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronRight size={18} />
                            </button>
                            
                            <button
                                onClick={goToLastPage}
                                disabled={currentPage === Math.ceil(filteredFines.length / finesPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredFines.length / finesPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Add Student Fines Modal */}
            <AddStudentFinesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onFinesUpdate={fetchStudentFines}
            />
        </SecretaryLayout>
    );
}