import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Edit, Trash2, Plus, Upload, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Layers, X, Printer, Download} from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/Layouts/AdminLayout";
import AddStudentModal from "@/Components/AddStudentModal";
import UpdateStudentModal from "@/Components/UpdateStudentModal";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Student = ({ auth }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("All");
    const [filterSection, setFilterSection] = useState("All");
    const [yearOptions, setYearOptions] = useState(["All"]);
    const [sectionOptions, setSectionOptions] = useState(["All"]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [studentsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isDocPreviewModalOpen, setIsDocPreviewModalOpen] = useState(false);
    const [fileData, setFileData] = useState([]);
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef(null);
    const [previewDocData, setPreviewDocData] = useState(null);
    const [isIdCardPreviewModalOpen, setIsIdCardPreviewModalOpen] = useState(false);
    const [selectedStudentForId, setSelectedStudentForId] = useState(null);

    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get("api/admin/student");
            setStudents(response.data);
            
            // Extract unique years from student data
            const uniqueYears = [...new Set(response.data.map(student => student.year))];
            setYearOptions(["All", ...uniqueYears.sort()]);
            
            // Extract unique sections from student data
            const uniqueSections = [...new Set(response.data.map(student => student.section))];
            setSectionOptions(["All", ...uniqueSections.sort()]);
            
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching students:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleUpdateStudent = async (student) => {
        const { value: formValues } = await Swal.fire({
            title: "Update Student",
            html:
                `<input id="swal-input1" class="swal2-input" placeholder="Name" value="${student.name}">` +
                `<input id="swal-input2" class="swal2-input" placeholder="Student No" value="${student.studentNo}">` +
                `<input id="swal-input3" class="swal2-input" placeholder="Year" value="${student.year}">` +
                `<input id="swal-input4" class="swal2-input" placeholder="Section" value="${student.section}">` +
                `<input id="swal-input5" class="swal2-input" placeholder="RFID" value="${student.rfid}">` +
                `<input id="swal-input6" class="swal2-input" placeholder="Email" value="${student.email}">`,
            focusConfirm: false,
            preConfirm: () => {
                return {
                    name: document.getElementById("swal-input1").value,
                    studentNo: document.getElementById("swal-input2").value,
                    year: document.getElementById("swal-input3").value,
                    section: document.getElementById("swal-input4").value,
                    rfid: document.getElementById("swal-input5").value,
                    email: document.getElementById("swal-input6").value,
                };
            },
        });

        if (formValues) {
            try {
                await axios.put(`api/admin/student/${student.id}`, formValues);
                fetchStudents();
                Swal.fire(
                    "Updated!",
                    "The student has been updated.",
                    "success"
                );
            } catch (error) {
                console.error("Error updating student:", error);
                Swal.fire("Error", "Failed to update student", "error");
            }
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`api/admin/student/${id}`);
                fetchStudents();
                Swal.fire(
                    "Deleted!",
                    "The student has been deleted.",
                    "success"
                );
            } catch (error) {
                console.error("Error deleting student:", error);
                Swal.fire("Error", "Failed to delete student", "error");
            }
        }
    };

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
            const response = await axios.post('api/admin/student/import', { students: fileData });
            setIsPreviewModalOpen(false);
            fetchStudents();
            Swal.fire('Success', `${response.data.imported} students imported successfully`, 'success');
        } catch (error) {
            console.error('Error importing students:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to import students', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Preview student information document
    const handlePreviewDocument = () => {
        try {
            // Prepare the preview data
            const date = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString();
            
            // Get filter information
            let filterInfo = '';
            if (filterRole !== 'All' || filterSection !== 'All' || searchTerm) {
                filterInfo += 'Filters applied: ';
                if (filterRole !== 'All') filterInfo += `Year ${filterRole}, `;
                if (filterSection !== 'All') filterInfo += `Section ${filterSection}, `;
                if (searchTerm) filterInfo += `Search: "${searchTerm}", `;
                filterInfo = filterInfo.slice(0, -2); // Remove trailing comma and space
            }
            
            // Format the data for preview
            const headers = ['Name', 'Student No', 'Year', 'Section', 'RFID', 'Email'];
            const previewData = filteredStudents.slice(0, 10); // Show only first 10 records in preview
            
            // Set the preview data
            setPreviewDocData({
                date,
                time,
                filterInfo,
                headers,
                data: previewData,
                totalCount: filteredStudents.length
            });
            
            // Open the preview modal
            setIsDocPreviewModalOpen(true);
        } catch (error) {
            console.error('Error generating document preview:', error);
            Swal.fire('Error', 'Failed to generate document preview', 'error');
        }
    };
    
    // Close the document preview modal
    const closeDocPreviewModal = () => {
        setIsDocPreviewModalOpen(false);
        setPreviewDocData(null);
    };
    
    // Open ID card preview modal
    const openIdCardPreview = (student) => {
        setSelectedStudentForId(student);
        setIsIdCardPreviewModalOpen(true);
    };
    
    // Close ID card preview modal
    const closeIdCardPreviewModal = () => {
        setIsIdCardPreviewModalOpen(false);
        setSelectedStudentForId(null);
    };

    // Generate and download the PDF document
    const generateAndDownloadPDF = () => {
        try {
            // Create a new PDF document
            const doc = new jsPDF();
            
            // Add document title and header
            doc.setFontSize(18);
            doc.setTextColor(0, 100, 0); // Dark green color
            doc.text('AttendEase System - Student Information', 105, 15, { align: 'center' });
            
            // Add date and time
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            const date = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString();
            doc.text(`Generated on: ${date} at ${time}`, 14, 25);
            
            // Add filter information if filters are applied
            let filterText = '';
            if (filterRole !== 'All' || filterSection !== 'All' || searchTerm) {
                filterText += 'Filters applied: ';
                if (filterRole !== 'All') filterText += `Year ${filterRole}, `;
                if (filterSection !== 'All') filterText += `Section ${filterSection}, `;
                if (searchTerm) filterText += `Search: "${searchTerm}", `;
                filterText = filterText.slice(0, -2); // Remove trailing comma and space
                doc.text(filterText, 14, 32);
            }
            
            // Get the students to download (filtered or all)
            const studentsToDownload = filteredStudents;
            
            // Format the data for the table
            const headers = [['Name', 'Student No', 'Year', 'Section', 'RFID', 'Email']];
            const tableData = [];
            
            // Add data to rows
            studentsToDownload.forEach(student => {
                const studentData = [
                    student.name,
                    student.studentNo,
                    student.year,
                    student.section,
                    student.rfid,
                    student.email
                ];
                tableData.push(studentData);
            });
            
            // Calculate the startY position based on whether filters are applied
            const startY = filterText ? 39 : 32;
            
            // Create the table with jspdf-autotable
            autoTable(doc, {
                head: headers,
                body: tableData,
                startY: startY,
                theme: 'grid',
                headStyles: { fillColor: [0, 100, 0], textColor: 255 },
                alternateRowStyles: { fillColor: [240, 240, 240] },
                margin: { top: 35 },
                styles: { overflow: 'linebreak', cellPadding: 3 },
            });
            
            // Add total count
            const finalY = doc.lastAutoTable.finalY || startY;
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Students: ${tableData.length}`, 14, finalY + 10);
            
            // Add footer with page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Generated by AttendEase System on ${date} | Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
            }
            
            // Generate timestamp for unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            // Save the PDF with a unique filename
            doc.save(`student-information-${timestamp}.pdf`);
            
            // Show success message
            Swal.fire({
                title: 'Success!',
                text: 'Student information has been downloaded as PDF',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error downloading student document:', error);
            
            // Attempt to provide a CSV fallback if PDF generation fails
            try {
                // Create CSV content
                const headers = ['Name', 'Student No', 'Year', 'Section', 'RFID', 'Email'];
                let csvContent = headers.join(',') + '\n';
                
                filteredStudents.forEach(student => {
                    const row = [
                        `"${student.name}"`, // Add quotes to handle commas in names
                        student.studentNo,
                        student.year,
                        student.section,
                        student.rfid,
                        student.email
                    ];
                    csvContent += row.join(',') + '\n';
                });
                
                // Create a blob and download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `student-information-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                Swal.fire({
                    title: 'PDF Generation Failed',
                    text: 'Student information has been downloaded as CSV instead',
                    icon: 'warning',
                    timer: 3000,
                    showConfirmButton: true
                });
            } catch (csvError) {
                console.error('Error creating CSV fallback:', csvError);
                Swal.fire('Error', 'Failed to download student information', 'error');
            }
        }
    };
    
    // Download student information as document (always show preview first)
    const handlePrintStudents = () => {
        // If the document preview modal is already open, the user clicked the download button in the preview
        if (isDocPreviewModalOpen) {
            generateAndDownloadPDF();
        } else {
            // Otherwise, show the preview first
            handlePreviewDocument();
        }
    };

    // Filter students based on search term and filter
    const filteredStudents = students.filter((student) => {
        const matchesSearch = student.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        
        const matchesYear =
            filterRole === "All" || student.year === filterRole;
        
        const matchesSection =
            filterSection === "All" || student.section === filterSection;
        
        return matchesSearch && matchesYear && matchesSection;
    });
    
    // Get current students for pagination
    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Go to first, previous, next, or last page
    const goToFirstPage = () => setCurrentPage(1);
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredStudents.length / studentsPerPage)));
    const goToLastPage = () => setCurrentPage(Math.ceil(filteredStudents.length / studentsPerPage));

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
                                placeholder="Search by student name..."
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
                                            : `Section ${section}`}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <ChevronDown className="text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-4 py-3 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto font-medium text-sm"
                        >
                            <Plus size={16} className="flex-shrink-0" />
                            <span className="whitespace-nowrap">Register Student</span>
                        </button>
                        <button
                            onClick={handleUploadButtonClick}
                            className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-4 py-3 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto font-medium text-sm"
                        >
                            <Upload size={16} className="flex-shrink-0" />
                            <span className="whitespace-nowrap">Upload CSV</span>
                        </button>
                        <button
                            onClick={handlePrintStudents}
                            className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-4 py-3 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto font-medium text-sm"
                        >
                            <Download size={16} className="flex-shrink-0" />
                            <span className="whitespace-nowrap">Download</span>
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
                                    Student No
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Year
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Section
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    RFID
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
                            {currentStudents.length > 0 ? (
                                currentStudents.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                           <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.studentNo}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Year {student.year}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.section}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.rfid}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{student.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                <button
                                                    className="p-1.5 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors duration-200 flex items-center justify-center"
                                                    onClick={() => {
                                                        setSelectedStudentId(
                                                            student.id
                                                        );
                                                        setIsUpdateModalOpen(true);
                                                    }}
                                                >
                                                    <Edit
                                                        size={16}
                                                        className="text-blue-600"
                                                    />
                                                </button>
                                                <button
                                                    className="p-1.5 bg-red-100 rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center justify-center"
                                                    onClick={() =>
                                                        handleDelete(student.id)
                                                    }
                                                >
                                                    <Trash2
                                                        size={16}
                                                        className="text-red-600"
                                                    />
                                                </button>
                                                <button
                                                    className="p-1.5 bg-green-100 rounded-lg hover:bg-green-200 transition-colors duration-200 flex items-center justify-center"
                                                    onClick={() => openIdCardPreview(student)}
                                                >
                                                    <Printer
                                                        size={16}
                                                        className="text-green-600"
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                        No students found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {filteredStudents.length > 0 && (
                    <div className="mt-4 flex justify-end items-center">
                        <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-md">
                            <p className="text-sm text-gray-700 mr-4">
                                Showing <span className="font-medium">{indexOfFirstStudent + 1}</span> to{" "}
                                <span className="font-medium">
                                    {Math.min(indexOfLastStudent, filteredStudents.length)}
                                </span>{" "}
                                of <span className="font-medium">{filteredStudents.length}</span> students
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
                                {[...Array(Math.min(5, Math.ceil(filteredStudents.length / studentsPerPage)))].map((_, i) => {
                                    // Calculate page number to display
                                    let pageNum;
                                    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
                                    
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
                                disabled={currentPage === Math.ceil(filteredStudents.length / studentsPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredStudents.length / studentsPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronRight size={18} />
                            </button>
                            
                            <button
                                onClick={goToLastPage}
                                disabled={currentPage === Math.ceil(filteredStudents.length / studentsPerPage)}
                                className={`p-1.5 rounded-md ${
                                    currentPage === Math.ceil(filteredStudents.length / studentsPerPage)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-800 hover:bg-green-100"
                                }`}
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
                
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
                
                <AddStudentModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onStudentsUpdate={() => fetchStudents()}
                />
                <UpdateStudentModal
                    isOpen={isUpdateModalOpen}
                    onClose={() => {
                        setIsUpdateModalOpen(false);
                        setSelectedStudentId(null);
                    }}
                />
                {/* Document Preview Modal */}
                {isDocPreviewModalOpen && previewDocData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-900 to-green-800 text-white">
                                <h2 className="text-xl font-bold">Student Information Preview</h2>
                                <button
                                    onClick={closeDocPreviewModal}
                                    className="p-1 rounded-full hover:bg-green-700 transition-colors duration-200"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-grow">
                                <div className="mb-8 text-center">
                                    <h1 className="text-2xl font-bold text-green-900 mb-2">AttendEase System - Student Information</h1>
                                    <p className="text-gray-600">Generated on: {previewDocData.date} at {previewDocData.time}</p>
                                    
                                    {previewDocData.filterInfo && (
                                        <p className="text-gray-600 mt-2">{previewDocData.filterInfo}</p>
                                    )}
                                </div>
                                
                                <div className="overflow-x-auto mb-6">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                        <thead>
                                            <tr className="bg-green-900 text-white">
                                                {previewDocData.headers.map((header, index) => (
                                                    <th key={index} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {previewDocData.data.map((student, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.studentNo}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.year}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.section}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rfid}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="text-gray-600 mb-4">
                                    <p className="font-medium">Showing {previewDocData.data.length} of {previewDocData.totalCount} total students</p>
                                    {previewDocData.data.length < previewDocData.totalCount && (
                                        <p className="text-sm italic">Download the document to see all students</p>
                                    )}
                                </div>
                                
                                <div className="text-gray-500 text-sm border-t pt-4 mt-4">
                                    <p>This is a preview of the document that will be generated. The actual document will include all students and may span multiple pages.</p>
                                </div>
                            </div>
                            
                            <div className="p-4 border-t flex justify-end space-x-3 bg-gray-50">
                                <button
                                    onClick={closeDocPreviewModal}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePrintStudents}
                                    className="px-4 py-2 bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white rounded-lg shadow-md transition-colors duration-200 flex items-center"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Document
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <AddStudentModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onStudentsUpdate={() => fetchStudents()}
                />
                <UpdateStudentModal
                    isOpen={isUpdateModalOpen}
                    onClose={() => {
                        setIsUpdateModalOpen(false);
                        setSelectedStudentId(null);
                    }}
                    studentId={selectedStudentId}
                    onStudentsUpdate={fetchStudents}
                />
                
                {/* ID Card Preview Modal */}
                {isIdCardPreviewModalOpen && selectedStudentForId && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Student ID Card Preview</h2>
                                    <button
                                        onClick={closeIdCardPreviewModal}
                                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                
                                <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                                    {/* Front of ID Card */}
                                    <div className="bg-blue-50 w-[256px] h-[162px] rounded-lg shadow-md overflow-hidden border-2 border-green-800 flex flex-col relative">
                                        <div className="bg-green-800 text-white text-center py-1">
                                            <p className="text-xs font-bold">MINDORO STATE UNIVERSITY</p>
                                            <p className="text-[10px]">INFORMATION TECHNOLOGY SOCIETY</p>
                                        </div>
                                        <div className="text-[8px] text-center text-gray-600">
                                            <p>LABASAN, BONGABONG ORIENTAL MINDORO</p>
                                        </div>
                                        <div className="text-center mt-2">
                                            <p className="text-lg font-bold text-green-800">ITS CARD</p>
                                        </div>
                                        <div className="mx-auto mt-1 w-16 h-16 border border-gray-400 bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {selectedStudentForId.image ? (
                                                <img 
                                                    src={`/storage/${selectedStudentForId.image}`} 
                                                    alt={selectedStudentForId.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                        e.target.parentNode.innerHTML = '<p class="text-[8px] text-gray-400">PHOTO</p>';
                                                    }}
                                                />
                                            ) : (
                                                <p className="text-[8px] text-gray-400">PHOTO</p>
                                            )}
                                        </div>
                                        <div className="absolute bottom-2 w-full text-center">
                                            <p className="text-xs font-bold">{selectedStudentForId.name.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Back of ID Card */}
                                    <div className="bg-blue-50 w-[256px] h-[162px] rounded-lg shadow-md overflow-hidden border-2 border-green-800 flex flex-col relative p-2">
                                        <div className="text-center mb-1">
                                            <p className="text-xs font-bold text-green-800">STUDENT INFORMATION</p>
                                        </div>
                                        <div className="text-[10px] flex flex-col gap-1">
                                            <div className="flex">
                                                <p className="font-bold w-24">Student ID:</p>
                                                <p>{selectedStudentForId.rfid || 'N/A'}</p>
                                            </div>
                                            <div className="flex">
                                                <p className="font-bold w-24">Name:</p>
                                                <p>{selectedStudentForId.name}</p>
                                            </div>
                                            <div className="flex">
                                                <p className="font-bold w-24">Year Level:</p>
                                                <p>Year {selectedStudentForId.year}</p>
                                            </div>
                                            <div className="flex">
                                                <p className="font-bold w-24">Section:</p>
                                                <p>{selectedStudentForId.section}</p>
                                            </div>
                                            <div className="flex">
                                                <p className="font-bold w-24">Email:</p>
                                                <p>{selectedStudentForId.email}</p>
                                            </div>
                                        </div>
                                        <div className="absolute right-2 bottom-2 w-16 h-16 border border-gray-400 bg-gray-100 flex items-center justify-center">
                                            <p className="text-[8px] text-gray-400">QR CODE</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-4 text-sm text-gray-500 text-center">
                                    <p>This is a preview of the ID card that will be generated.</p>
                                </div>
                            </div>
                            
                            <div className="p-4 border-t flex justify-end space-x-3 bg-gray-50">
                                <button
                                    onClick={closeIdCardPreviewModal}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            // Create a new PDF document in landscape A4 format
                                            const doc = new jsPDF({
                                                orientation: 'landscape',
                                                unit: 'mm',
                                                format: 'a4' // A4 paper size
                                            });
                                            
                                            // A4 landscape dimensions (297mm x 210mm)
                                            const pageWidth = doc.internal.pageSize.getWidth();
                                            const pageHeight = doc.internal.pageSize.getHeight();
                                            
                                            // Standard ID card size (CR80 size - 85.6mm x 54mm)
                                            const cardWidth = 85.6;
                                            const cardHeight = 54;
                                            
                                            // Calculate margins to position cards with equal spacing
                                            const horizontalSpacing = (pageWidth - (cardWidth * 2)) / 3; // Divide remaining space into 3 parts
                                            const verticalMargin = (pageHeight - cardHeight) / 2;
                                            
                                            // Position cards on the page
                                            const leftCardX = horizontalSpacing; // First column (front side)
                                            const rightCardX = horizontalSpacing * 2 + cardWidth; // Second column (back side)
                                            const cardsY = verticalMargin;
                                            
                                            // Front of ID card (left column)
                                            // Add background color
                                            doc.setFillColor(240, 248, 255); // Light blue background
                                            doc.rect(leftCardX, cardsY, cardWidth, cardHeight, 'F');
                                            
                                            // Add border
                                            doc.setDrawColor(0, 100, 0);
                                            doc.setLineWidth(0.5);
                                            doc.rect(leftCardX + 2, cardsY + 2, cardWidth - 4, cardHeight - 4);
                                            
                                            // Calculate center point for text alignment on front card
                                            const frontCenterX = leftCardX + (cardWidth / 2);

                                            doc.setFontSize(10);
                                            doc.setFont('helvetica', 'bold');
                                            doc.setTextColor(0, 100, 0); // Dark green color
                                            doc.text('MINDORO STATE UNIVERSITY', frontCenterX, cardsY + 8, { align: 'center' });
                                            
                                            doc.setFontSize(8);
                                            doc.text('INFORMATION TECHNOLOGY SOCIETY', frontCenterX, cardsY + 12, { align: 'center' });
                                            
                                            doc.setFontSize(7);
                                            doc.text('LABASAN, BONGABONG ORIENTAL MINDORO', frontCenterX, cardsY + 16, { align: 'center' });
                                            
                                            doc.setFontSize(14);
                                            doc.setTextColor(0, 100, 0);
                                            doc.text('ITS CARD', frontCenterX, cardsY + 25, { align: 'center' });
                                            
                                            const photoX = leftCardX + (cardWidth / 2) - 10;
                                            const photoY = cardsY + 28;
                                            doc.setDrawColor(100, 100, 100);
                                            doc.setLineWidth(0.2);
                                            doc.rect(photoX, photoY, 20, 20);
                                            
                                            try {
                                                if (selectedStudentForId.image) {
                                                    const img = new Image();
                                                    img.crossOrigin = 'Anonymous';
                                                    img.src = `/storage/${selectedStudentForId.image}`;
                                                    
                                                    // Wait for image to load
                                                    await new Promise((resolve, reject) => {
                                                        img.onload = resolve;
                                                        img.onerror = reject;
                                                        // Set a timeout in case the image doesn't load
                                                        setTimeout(reject, 3000);
                                                    });
                                                    
                                                    // Add image to PDF
                                                    doc.addImage(img, 'JPEG', photoX, photoY, 20, 20);
                                                } else {
                                                    throw new Error('No image available');
                                                }
                                            } catch (error) {
                                                console.log('Using placeholder image:', error);
                                                // Fallback to placeholder if image loading fails
                                                // Add a simple user icon as placeholder
                                                doc.setFillColor(200, 200, 200);
                                                // Head
                                                doc.circle(photoX + 10, photoY + 6, 4, 'F');
                                                // Body
                                                doc.setFillColor(200, 200, 200);
                                                doc.roundedRect(photoX + 5, photoY + 11, 10, 8, 1, 1, 'F');
                                                
                                                doc.setFontSize(5);
                                                doc.setTextColor(100, 100, 100);
                                                doc.text('PHOTO', photoX + 10, photoY + 17, { align: 'center' });
                                            }
                                            
                                            // Add student name on front card
                                            doc.setFontSize(9);
                                            doc.setFont('helvetica', 'bold');
                                            doc.setTextColor(0, 0, 0);
                                            doc.text(selectedStudentForId.name.toUpperCase(), frontCenterX, cardsY + 52, { align: 'center' });
                                            
                                            // Back of ID card (right column)
                                            // Add background color
                                            doc.setFillColor(240, 248, 255); // Light blue background
                                            doc.rect(rightCardX, cardsY, cardWidth, cardHeight, 'F');
                                            
                                            // Add border
                                            doc.setDrawColor(0, 100, 0);
                                            doc.setLineWidth(0.5);
                                            doc.rect(rightCardX + 2, cardsY + 2, cardWidth - 4, cardHeight - 4);
                                            
                                            // Calculate center point for text alignment on back card
                                            const backCenterX = rightCardX + (cardWidth / 2);
                                            
                                            // Add student information on back card
                                            doc.setFontSize(8);
                                            doc.setFont('helvetica', 'bold');
                                            doc.setTextColor(0, 100, 0);
                                            doc.text('STUDENT INFORMATION', backCenterX, cardsY + 8, { align: 'center' });
                                            
                                            doc.setFontSize(7);
                                            doc.setFont('helvetica', 'normal');
                                            doc.setTextColor(0, 0, 0);
                                            
                                            // Student details on back card
                                            const details = [
                                                { label: 'Student ID:', value: selectedStudentForId.rfid || 'N/A' },
                                                { label: 'Name:', value: selectedStudentForId.name },
                                                { label: 'Year Level:', value: `Year ${selectedStudentForId.year}` },
                                                { label: 'Section:', value: selectedStudentForId.section },
                                                { label: 'Email:', value: selectedStudentForId.email }
                                            ];
                                            
                                            let yPos = cardsY + 15;
                                            details.forEach(detail => {
                                                doc.setFont('helvetica', 'bold');
                                                doc.text(detail.label, rightCardX + 8, yPos);
                                                doc.setFont('helvetica', 'normal');
                                                doc.text(detail.value, rightCardX + 28, yPos);
                                                yPos += 6;
                                            });
                                            
                                            // Add QR code placeholder with pattern on back card
                                            const qrX = rightCardX + 55;
                                            const qrY = cardsY + 25;
                                            doc.setDrawColor(100, 100, 100);
                                            doc.setLineWidth(0.2);
                                            doc.rect(qrX, qrY, 20, 20);
                                            
                                            // Draw a simple QR code pattern
                                            doc.setFillColor(100, 100, 100);
                                            // Outer frame
                                            doc.rect(qrX + 2, qrY + 2, 16, 16, 'S');
                                            // Corner squares
                                            doc.setFillColor(50, 50, 50);
                                            doc.rect(qrX + 3, qrY + 3, 4, 4, 'F');
                                            doc.rect(qrX + 11, qrY + 3, 4, 4, 'F');
                                            doc.rect(qrX + 3, qrY + 11, 4, 4, 'F');
                                            // Inner pattern
                                            doc.setFillColor(100, 100, 100);
                                            doc.rect(qrX + 8, qrY + 8, 2, 2, 'F');
                                            doc.rect(qrX + 10, qrY + 10, 2, 2, 'F');
                                            doc.rect(qrX + 6, qrY + 10, 2, 2, 'F');
                                            
                                            doc.setFontSize(6);
                                            doc.setTextColor(100, 100, 100);
                                            doc.text('QR CODE', qrX + 10, cardsY + 48, { align: 'center' });
                                            
                                            // Save the PDF with the student's name
                                            doc.save(`${selectedStudentForId.name.replace(/\s+/g, '_')}_ID_Card.pdf`);
                                            
                                            closeIdCardPreviewModal();
                                            
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Success',
                                                text: `ID card for ${selectedStudentForId.name} has been generated successfully.`,
                                            });
                                        } catch (error) {
                                            console.error('Error generating ID card:', error);
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Error',
                                                text: 'Failed to generate ID card. Please try again.',
                                            });
                                        }
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white rounded-lg shadow-md transition-colors duration-200 flex items-center"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Generate ID Card
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Student;
