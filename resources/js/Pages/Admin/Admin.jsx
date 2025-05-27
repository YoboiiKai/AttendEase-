import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Trash2, Plus, Upload, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/Layouts/AdminLayout";
import AddAdminModal from "@/Components/AddAdminModal";
import UpdateAdminModal from "@/Components/UpdateAdminModal";

const Admin = ({ auth }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("All");
    const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
    const [isUpdateAdminModalOpen, setIsUpdateAdminModalOpen] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [yearOptions, setYearOptions] = useState(["All"]);
    const [currentPage, setCurrentPage] = useState(1);
    const [adminsPerPage] = useState(10);

    const fetchAdmins = async () => {
        console.log('Fetching admins...');
        try {
            const response = await axios.get("api/admin/admin");
            setAdmins(response.data);
            // Extract unique years
            const years = [...new Set(response.data.map(admin => admin.year).filter(year => year !== null))].sort();
            setYearOptions(["All", ...years]);
        } catch (error) {
            console.error("Error fetching admins:", error);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleDeleteAdmin = async (id) => {
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
                await axios.delete(`api/admin/admin/${id}`);
                fetchAdmins();
                Swal.fire('Deleted!', 'The admin has been deleted.', 'success');
            } catch (error) {
                console.error('Error deleting admin:', error);
                Swal.fire('Error', 'Failed to delete admin', 'error');
            }
        }
    };

    // Filter admins based on search term and role
    const filteredAdmins = admins.filter((admin) => {
        const matchesSearch =
            admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesYear =
            filterRole === "All" || admin.year === filterRole;
        
        return matchesSearch && matchesYear;
    });
    
    // Get current admins for pagination
    const indexOfLastAdmin = currentPage * adminsPerPage;
    const indexOfFirstAdmin = indexOfLastAdmin - adminsPerPage;
    const currentAdmins = filteredAdmins.slice(indexOfFirstAdmin, indexOfLastAdmin);
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Go to first, previous, next, or last page
    const goToFirstPage = () => setCurrentPage(1);
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredAdmins.length / adminsPerPage)));
    const goToLastPage = () => setCurrentPage(Math.ceil(filteredAdmins.length / adminsPerPage));

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
                                placeholder="Search admins..."
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
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year === "All"
                                            ? "All Years"
                                            : `Year ${year}`}
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
                            onClick={() => setIsAddAdminModalOpen(true)}
                            className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-5 py-3 rounded-lg shadow-md transition-all duration-300 flex items-center space-x-2 w-full md:w-auto justify-center font-medium"
                        >
                            <Plus size={18} />
                            <span>Add Admin</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gradient-to-l from-green-900 to-green-800">
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentAdmins.length > 0 ? (
                                currentAdmins.map((admin) => (
                                    <tr
                                        key={admin.id}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{admin.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                <button
                                                    className="p-1.5 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors duration-200 flex items-center justify-center"
                                                    onClick={() => {
                                                        setSelectedAdmin(admin);
                                                        setIsUpdateAdminModalOpen(true);
                                                    }}
                                                >
                                                    <Edit
                                                        size={16}
                                                        className="text-blue-600"
                                                    />
                                                </button>
                                                <button
                                                    className="p-1.5 bg-red-100 rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center justify-center"
                                                    onClick={() => handleDeleteAdmin(admin.id)}
                                                >
                                                    <Trash2
                                                        size={16}
                                                        className="text-red-600"
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-10 text-center text-gray-500">
                                        No admins found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {filteredAdmins.length > 0 && (
                    <div className="mt-4 flex justify-end items-center">
                        <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-md">
                            <p className="text-sm text-gray-700 mr-4">
                                Showing <span className="font-medium">{indexOfFirstAdmin + 1}</span> to{" "}
                                <span className="font-medium">
                                    {Math.min(indexOfLastAdmin, filteredAdmins.length)}
                                </span>{" "}
                                of <span className="font-medium">{filteredAdmins.length}</span> admins
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
                                {[...Array(Math.min(5, Math.ceil(filteredAdmins.length / adminsPerPage)))].map((_, i) => {
                                    // Calculate page number to display
                                    let pageNum;
                                    const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);
                                    
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
                                disabled={currentPage === Math.ceil(filteredAdmins.length / adminsPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredAdmins.length / adminsPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronRight size={18} />
                            </button>
                            
                            <button
                                onClick={goToLastPage}
                                disabled={currentPage === Math.ceil(filteredAdmins.length / adminsPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredAdmins.length / adminsPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
                
                <AddAdminModal
                    isOpen={isAddAdminModalOpen}
                    onRequestClose={() => setIsAddAdminModalOpen(false)}
                    onClose={() => setIsAddAdminModalOpen(false)}
                    onAdminsUpdate={fetchAdmins}
                />
                <UpdateAdminModal
                    isOpen={isUpdateAdminModalOpen}
                    onRequestClose={() => setIsUpdateAdminModalOpen(false)}
                    onClose={() => setIsUpdateAdminModalOpen(false)}
                    adminData={selectedAdmin}
                    onAdminsUpdate={fetchAdmins}
                />
            </div>
        </AdminLayout>
    );
};

export default Admin;