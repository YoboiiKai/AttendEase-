import React, { useState, useEffect, useRef } from "react";
import { Edit, Trash2, Plus, Upload, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Layers, X } from "lucide-react";
import AdminLayout from "@/Layouts/AdminLayout";
import AddSecretaryModal from "@/Components/AddSecretaryModal";
import UpdateSecretaryModal from "@/Components/UpdateSecretaryModal";
import axios from 'axios';
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import Papa from "papaparse";

const Secretary = ({ auth }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("All");
    const [filterSection, setFilterSection] = useState("All");
    const [yearOptions, setYearOptions] = useState(["All"]);
    const [sectionOptions, setSectionOptions] = useState(["All"]);
    const [isAddSecretaryModalOpen, setIsAddSecretaryModalOpen] = useState(false);
    const [secretaries, setSecretaries] = useState([]);
    const [isUpdateSecretaryModalOpen, setIsUpdateSecretaryModalOpen] = useState(false);
    const [selectedSecretary, setSelectedSecretary] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [secretariesPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [fileData, setFileData] = useState([]);
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchSecretaries();
    }, []);

    const fetchSecretaries = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get("api/admin/secretary");
            setSecretaries(response.data);
            
            // Extract unique years from secretary data
            const uniqueYears = [...new Set(response.data.map(secretary => secretary.year).filter(year => year !== null))].sort();
            setYearOptions(["All", ...uniqueYears]);
            
            // Extract unique sections from secretary data
            const uniqueSections = [...new Set(response.data.map(secretary => secretary.section).filter(section => section !== null))].sort();
            setSectionOptions(["All", ...uniqueSections]);
            
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching secretaries:", error);
            setIsLoading(false);
        }
    };

    const handleDeleteSecretary = async (id) => {
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
                await axios.delete(`api/admin/secretary/${id}`);
                fetchSecretaries();
                Swal.fire('Deleted!', 'The secretary has been deleted.', 'success');
            } catch (error) {
                console.error('Error deleting secretary:', error);
                Swal.fire('Error', 'Failed to delete secretary', 'error');
            }
        }
    };

    // Filter secretaries based on search term and filters
    const filteredSecretaries = secretaries.filter((secretary) => {
        const matchesSearch = secretary.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());
        
        const matchesYear =
            filterRole === "All" || (secretary.year && secretary.year.toString() === filterRole);
        
        const matchesSection =
            filterSection === "All" || (secretary.section && secretary.section === filterSection);
        
        return matchesSearch && matchesYear && matchesSection;
    });
    
    // Get current secretaries for pagination
    const indexOfLastSecretary = currentPage * secretariesPerPage;
    const indexOfFirstSecretary = indexOfLastSecretary - secretariesPerPage;
    const currentSecretaries = filteredSecretaries.slice(indexOfFirstSecretary, indexOfLastSecretary);
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Go to first, previous, next, or last page
    const goToFirstPage = () => setCurrentPage(1);
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredSecretaries.length / secretariesPerPage)));
    const goToLastPage = () => setCurrentPage(Math.ceil(filteredSecretaries.length / secretariesPerPage));

    // Handle file upload button click
    const handleUploadButtonClick = () => {
        fileInputRef.current.click();
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'csv') {
            // Parse CSV
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setFileData(results.data);
                    setIsPreviewModalOpen(true);
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                    Swal.fire('Error', 'Failed to parse CSV file', 'error');
                }
            });
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            // Parse Excel
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const parsedData = XLSX.utils.sheet_to_json(worksheet);
                    setFileData(parsedData);
                    setIsPreviewModalOpen(true);
                } catch (error) {
                    console.error('Error parsing Excel:', error);
                    Swal.fire('Error', 'Failed to parse Excel file', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            Swal.fire('Invalid File', 'Please upload a CSV or Excel file', 'error');
        }

        // Reset the file input
        e.target.value = '';
    };

    // Save data from file to database
    const handleSaveFileData = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post('api/admin/secretary/import', { secretaries: fileData });
            setIsPreviewModalOpen(false);
            fetchSecretaries();
            Swal.fire('Success', `${response.data.imported} secretaries imported successfully`, 'success');
        } catch (error) {
            console.error('Error importing secretaries:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to import secretaries', 'error');
        } finally {
            setIsLoading(false);
        }
    };

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
                                placeholder="Search by secretary name..."
                                className="pl-10 pr-4 py-3 w-full sm:w-80 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
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
                                                : `${year}`}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <ChevronDown className="text-gray-400" size={18} />
                                </div>
                            </div>
                            
                            <div className="relative w-full sm:w-auto">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Layers className="text-green-800" size={18} />
                                </div>
                                <select
                                    className="appearance-none bg-white pl-10 pr-10 py-3 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm w-full"
                                    value={filterSection}
                                    onChange={(e) => setFilterSection(e.target.value)}
                                >
                                    {sectionOptions.map((section) => (
                                        <option key={section} value={section}>
                                            {section === "All" 
                                                ? "All Sections" 
                                                : `${section}`}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <ChevronDown className="text-gray-400" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 w-full md:w-auto mt-4 md:mt-0">
                        <button
                            onClick={() => setIsAddSecretaryModalOpen(true)}
                            className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-5 py-3 rounded-lg shadow-md transition-all duration-300 flex items-center space-x-2 w-full md:w-auto justify-center font-medium"
                        >
                            <Plus size={18} />
                            <span>Add Secretary</span>
                        </button>
                        <button
                            onClick={handleUploadButtonClick}
                            className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-5 py-3 rounded-lg shadow-md transition-all duration-300 flex items-center space-x-2 w-full md:w-auto justify-center font-medium"
                        >
                            <Upload size={18} />
                            <span>Upload CSV</span>
                        </button>
                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                        />
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
                                    Year
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Section
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentSecretaries.length > 0 ? (
                                currentSecretaries.map((secretary) => (
                                    <tr
                                        key={secretary.id}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{secretary.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{secretary.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Year {secretary.year}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {secretary.section}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                <button
                                                    className="p-1.5 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors duration-200 flex items-center justify-center"
                                                    onClick={() => {
                                                        setSelectedSecretary(secretary);
                                                        setIsUpdateSecretaryModalOpen(true);
                                                    }}
                                                >
                                                    <Edit
                                                        size={16}
                                                        className="text-blue-600"
                                                    />
                                                </button>
                                                <button
                                                    className="p-1.5 bg-red-100 rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center justify-center"
                                                    onClick={() => handleDeleteSecretary(secretary.id)}
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
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                        No secretaries found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {filteredSecretaries.length > 0 && (
                    <div className="mt-4 flex justify-end items-center">
                        <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-md">
                            <p className="text-sm text-gray-700 mr-4">
                                Showing <span className="font-medium">{indexOfFirstSecretary + 1}</span> to{" "}
                                <span className="font-medium">
                                    {Math.min(indexOfLastSecretary, filteredSecretaries.length)}
                                </span>{" "}
                                of <span className="font-medium">{filteredSecretaries.length}</span> secretaries
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
                                {[...Array(Math.min(5, Math.ceil(filteredSecretaries.length / secretariesPerPage)))].map((_, i) => {
                                    // Calculate page number to display
                                    let pageNum;
                                    const totalPages = Math.ceil(filteredSecretaries.length / secretariesPerPage);
                                    
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
                                disabled={currentPage === Math.ceil(filteredSecretaries.length / secretariesPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredSecretaries.length / secretariesPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronRight size={18} />
                            </button>
                            
                            <button
                                onClick={goToLastPage}
                                disabled={currentPage === Math.ceil(filteredSecretaries.length / secretariesPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredSecretaries.length / secretariesPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
                
                <AddSecretaryModal
                    isOpen={isAddSecretaryModalOpen}
                    onRequestClose={() => setIsAddSecretaryModalOpen(false)}
                    onClose={() => setIsAddSecretaryModalOpen(false)}
                    onSecretariesUpdate={fetchSecretaries}
                />
                <UpdateSecretaryModal
                    isOpen={isUpdateSecretaryModalOpen}
                    onRequestClose={() => setIsUpdateSecretaryModalOpen(false)}
                    onClose={() => setIsUpdateSecretaryModalOpen(false)}
                    secretaryData={selectedSecretary}
                    onSecretariesUpdate={fetchSecretaries}
                />

                {/* File Preview Modal */}
                {isPreviewModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[80vh] flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Preview Data from {fileName}
                                </h2>
                                <button
                                    onClick={() => setIsPreviewModalOpen(false)}
                                    className="p-1 rounded-full hover:bg-gray-200"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="overflow-auto flex-1 p-4">
                                {fileData.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    {Object.keys(fileData[0]).map((header, index) => (
                                                        <th
                                                            key={index}
                                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                        >
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {fileData.slice(0, 100).map((row, rowIndex) => (
                                                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        {Object.values(row).map((cell, cellIndex) => (
                                                            <td
                                                                key={cellIndex}
                                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                            >
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {fileData.length > 100 && (
                                            <p className="text-gray-500 text-sm mt-4 italic">
                                                Showing first 100 rows of {fileData.length} total rows
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No data found in file</p>
                                )}
                            </div>
                            <div className="p-4 border-t flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsPreviewModalOpen(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveFileData}
                                    className="px-4 py-2 bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white rounded-lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : 'Save to Database'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Secretary;
