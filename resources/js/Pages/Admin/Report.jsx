import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, ChevronDown, Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, Download, X, FileText, Layers, Printer } from 'lucide-react';
import { saveAs } from 'file-saver';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Report({ auth }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredAttendanceData, setFilteredAttendanceData] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [yearFilter, setYearFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [availableYears, setAvailableYears] = useState(['All']);
  const [availableSections, setAvailableSections] = useState(['All']);

  useEffect(() => {
    fetchAttendanceReports();
  }, [filterPeriod]);

  const fetchAttendanceReports = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/admin/api/attendance-reports', {
        params: { period: filterPeriod }
      });
      
      if (response.data.success) {
        setReports(response.data.reports || []);
      } else {
        console.error('Failed to fetch attendance reports:', response.data.message);
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching attendance reports:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const [eventTimePeriods, setEventTimePeriods] = useState({ morning: true, afternoon: true, night: false });

  // Function to filter attendance data based on year and section
  const filterAttendanceData = useEffect(() => {
    if (attendanceData.length > 0) {
      let filtered = [...attendanceData];
      
      // Extract available years and sections on first load
      if (yearFilter === 'All' && sectionFilter === 'All') {
        const years = new Set();
        const sections = new Set();
        
        attendanceData.forEach(record => {
          // Use direct year and section fields
          if (record.year && record.year !== 'N/A') {
            years.add(record.year);
          }
          if (record.section && record.section !== 'N/A') {
            sections.add(record.section);
          }
        });
        
        setAvailableYears(['All', ...Array.from(years).sort()]);
        setAvailableSections(['All', ...Array.from(sections).sort()]);
      }
      
      // Apply filters
      if (yearFilter !== 'All') {
        filtered = filtered.filter(record => record.year === yearFilter);
      }
      
      if (sectionFilter !== 'All') {
        filtered = filtered.filter(record => record.section === sectionFilter);
      }
      
      setFilteredAttendanceData(filtered);
    } else {
      setFilteredAttendanceData([]);
    }
  }, [attendanceData, yearFilter, sectionFilter]);

  const handlePreviewDownload = async (report) => {
    setSelectedReport(report);
    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);
    setYearFilter('All');
    setSectionFilter('All');
    
    try {
      const response = await axios.get('/admin/api/attendance-details', {
        params: { event_id: report.id }
      });
      
      if (response.data.success) {
        const attendanceDetails = response.data.attendanceDetails || [];
        setAttendanceData(attendanceDetails);
        setFilteredAttendanceData(attendanceDetails);
        
        // Extract available years and sections
        const years = new Set();
        const sections = new Set();
        
        attendanceDetails.forEach(record => {
          // Use direct year and section fields
          if (record.year && record.year !== 'N/A') {
            years.add(record.year);
          }
          if (record.section && record.section !== 'N/A') {
            sections.add(record.section);
          }
        });
        
        setAvailableYears(['All', ...Array.from(years).sort()]);
        setAvailableSections(['All', ...Array.from(sections).sort()]);
        
        // Set which time periods are available for this event
        if (response.data.timePeriods) {
          setEventTimePeriods(response.data.timePeriods);
        }
      } else {
        console.error('Failed to fetch attendance details:', response.data.message);
        setAttendanceData([]);
        setFilteredAttendanceData([]);
      }
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      setAttendanceData([]);
      setFilteredAttendanceData([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  const handleDownload = () => {
    if (!selectedReport || filteredAttendanceData.length === 0) return;
    
    // Create CSV content - dynamically build headers based on time periods
    const baseHeaders = ['Name', 'Student ID', 'Event', 'Year', 'Section'];
    let headers = [...baseHeaders];
    
    if (eventTimePeriods.morning) {
      headers.push('Morning In', 'Morning Out');
    }
    
    if (eventTimePeriods.afternoon) {
      headers.push('Afternoon In', 'Afternoon Out');
    }
    
    if (eventTimePeriods.night) {
      headers.push('Night In', 'Night Out');
    }
    
    let csvContent = headers.join(',') + '\n';
    
    // Use filtered data instead of all attendance data
    filteredAttendanceData.forEach(record => {
      const getStatusText = (status) => {
        if (status === null) return 'Not Recorded';
        return status; // Present, Absent, or Late
      };
      
      // Start with base data
      const row = [
        `"${record.name}"`, // Add quotes to handle commas in names
        record.student_id,
        `"${selectedReport?.event}"`, // Add event name
        record.year,
        record.section
      ];
      
      // Add time period data based on which periods are active
      if (eventTimePeriods.morning) {
        row.push(
          getStatusText(record.morning_in_status),
          getStatusText(record.morning_out_status)
        );
      }
      
      if (eventTimePeriods.afternoon) {
        row.push(
          getStatusText(record.afternoon_in_status),
          getStatusText(record.afternoon_out_status)
        );
      }
      
      if (eventTimePeriods.night) {
        row.push(
          getStatusText(record.night_in_status),
          getStatusText(record.night_out_status)
        );
      }
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedReport.event.replace(/\s+/g, '_')}_attendance.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const generateDocumentReport = () => {
    if (!selectedReport || filteredAttendanceData.length === 0) return;
    
    try {
      // Helper function to format attendance status
      const getStatusText = (status) => {
        if (status === null) return 'Not Recorded';
        return status; // Present, Absent, or Late
      };
      
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add document title and event information
      doc.setFontSize(18);
      doc.setTextColor(0, 100, 0); // Dark green color
      doc.text('AttendEase System - Attendance Report', 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Event: ${selectedReport.event}`, 14, 25);
      doc.text(`Date: ${selectedReport.date}`, 14, 32);
      doc.text(`Location: ${selectedReport.location || 'Not specified'}`, 14, 39);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 46);
      
      // Add filter information
      if (yearFilter !== 'All' || sectionFilter !== 'All') {
        doc.text(`Filters: ${yearFilter !== 'All' ? 'Year: ' + yearFilter : ''} ${sectionFilter !== 'All' ? 'Section: ' + sectionFilter : ''}`.trim(), 14, 53);
      }
      
      // Create table headers based on time periods
      const headers = [['Name', 'Student ID', 'Event', 'Year', 'Section']];
      
      if (eventTimePeriods.morning) {
        headers[0].push('Morning In', 'Morning Out');
      }
      
      if (eventTimePeriods.afternoon) {
        headers[0].push('Afternoon In', 'Afternoon Out');
      }
      
      if (eventTimePeriods.night) {
        headers[0].push('Night In', 'Night Out');
      }
      
      // Create table data - using ALL attendance data
      const tableData = filteredAttendanceData.map(record => {
        // Start with base data
        const row = [
          record.name,
          record.student_id,
          selectedReport.event,
          record.year,
          record.section
        ];
        
        // Add time period data if available
        if (eventTimePeriods.morning) {
          row.push(
            getStatusText(record.morning_in_status),
            getStatusText(record.morning_out_status)
          );
        }
        
        if (eventTimePeriods.afternoon) {
          row.push(
            getStatusText(record.afternoon_in_status),
            getStatusText(record.afternoon_out_status)
          );
        }
        
        if (eventTimePeriods.night) {
          row.push(
            getStatusText(record.night_in_status),
            getStatusText(record.night_out_status)
          );
        }
        
        return row;
      });
      
      // Generate the table with all attendance data using the autoTable plugin
      autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [0, 100, 0], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 60 },
        styles: { overflow: 'linebreak', cellPadding: 3 },
      });
      
      // Add footer with date and page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated by AttendEase System on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
      }
      
      // Save the document
      doc.save(`${selectedReport.event}_attendance_report.pdf`);
      
    } catch (error) {
      console.error('Error generating document report:', error);
      alert('There was an error generating the document. Please try the regular CSV option instead.');
      closePreviewModal();
    }
  };
  
  // Removed the duplicate PDF generation function since it's now part of generateDocumentReport
  
  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedReport(null);
    setAttendanceData([]);
  };

  // Filter reports based on search term
  const filteredReports = reports.filter(report => 
    report.event.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Helper function to render attendance status
  const renderAttendanceStatus = (status) => {
    // Handle both null and undefined cases
    if (status === null || status === undefined) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-50">
          <Clock className="w-4 h-4 text-gray-400" />
        </span>
      );
    }
    
    switch (status) {
      case 'Present':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        );
      case 'Absent':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white">
            <XCircle className="w-4 h-4" />
          </span>
        );
      case 'Late':
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white">
            <Clock className="w-4 h-4" />
          </span>
        );
      default:
        // For any other unhandled status
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-50">
            <Clock className="w-4 h-4 text-gray-400" />
          </span>
        );
    }
  };
  
  // Helper function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Ongoing':
        return 'bg-green-100 text-green-800';
      case 'Upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <Head title="Attendance Reports" />
      
      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-900 to-green-800 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="text-white" size={20} />
                <h2 className="text-white text-lg font-semibold">
                  {selectedReport?.event} - Attendance Records
                </h2>
              </div>
              <button 
                onClick={closePreviewModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-12 h-12 border-4 border-green-800 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading attendance records...</p>
                </div>
              ) : attendanceData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} className="text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                  <p className="text-gray-600">There are no attendance records available for this event.</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <div className="mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                        <p className="text-sm text-gray-600">
                          {filteredAttendanceData.length} of {attendanceData.length} records shown
                        </p>
                      </div>
                    </div>
                    
                    {/* Filter controls */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-4 flex flex-wrap gap-4">
                      <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <div className="relative w-full sm:w-auto flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="text-green-800" size={18} />
                          </div>
                          <select
                            id="yearFilter"
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="appearance-none bg-white pl-10 pr-10 py-3 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm w-full"
                          >
                            {availableYears.map(year => (
                              <option key={year} value={year}>
                                {year === 'All' ? 'All Years' : `Year ${year}`}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown className="text-gray-400" size={18} />
                          </div>
                        </div>
                        
                        <div className="relative w-full sm:w-auto flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Layers className="text-green-800" size={18} />
                          </div>
                          <select
                            id="sectionFilter"
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                            className="appearance-none bg-white pl-10 pr-10 py-3 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm w-full"
                          >
                            {availableSections.map(section => (
                              <option key={section} value={section}>
                                {section === 'All' ? 'All Sections' : `Section ${section}`}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown className="text-gray-400" size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gradient-to-l from-green-900 to-green-800">
                          <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Student ID</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Event</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Year</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Section</th>
                          {eventTimePeriods.morning && (
                            <>
                              <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Morning In</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Morning Out</th>
                            </>
                          )}
                          {eventTimePeriods.afternoon && (
                            <>
                              <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Afternoon In</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Afternoon Out</th>
                            </>
                          )}
                          {eventTimePeriods.night && (
                            <>
                              <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Night In</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Night Out</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAttendanceData.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">{record.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{record.student_id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Calendar size={16} className="mr-2 text-green-800" />
                                <div className="text-sm font-medium text-gray-900">{selectedReport?.event}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">{record.year}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">{record.section}</div>
                            </td>
                            {eventTimePeriods.morning && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {renderAttendanceStatus(record.morning_in_status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {renderAttendanceStatus(record.morning_out_status)}
                                </td>
                              </>
                            )}
                            {eventTimePeriods.afternoon && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {renderAttendanceStatus(record.afternoon_in_status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {renderAttendanceStatus(record.afternoon_out_status)}
                                </td>
                              </>
                            )}
                            {eventTimePeriods.night && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {renderAttendanceStatus(record.night_in_status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  {renderAttendanceStatus(record.night_out_status)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-4">
              <button
                onClick={() => {
                  generateDocumentReport();
                  closePreviewModal();
                }}
                className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-300 flex items-center space-x-2"
              >
                <FileText size={16} />
                <span>Download Document</span>
              </button>
              <button
                onClick={() => {
                  handleDownload();
                  closePreviewModal();
                }}
                className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-300 flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Attendance Reports</h1>
        
        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-md">
          <div className="relative w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-green-800" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search reports..."
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
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <option>All</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Annual</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="text-gray-400" size={18} />
              </div>
            </div>
            
            {/* Print Preview button removed */}
          </div>
        </div>
        
        {/* Event Cards */}
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-3/4">
                      <div className="h-6 bg-gray-200 rounded w-full mb-3 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-10 animate-pulse"></div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-gray-200 h-2 rounded-full w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-10 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.length === 0 ? (
                <div className="col-span-3 text-center py-12 bg-white rounded-xl shadow-md">
                  <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                    <Search size={40} className="text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No matching events found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                filteredReports.map((report, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg hover:translate-y-[-4px] transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2 truncate group-hover:text-green-600 transition-colors duration-300">{report.event}</h2>
                        <div className="flex items-center text-gray-500 text-sm mb-2">
                          <Calendar size={16} className="mr-2 text-green-800" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Users size={16} className="mr-2 text-green-800" />
                          {report.attendees} Attendees
                        </div>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mb-5">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span className="font-medium">Attendance Rate</span>
                        <span className="font-bold">{report.attendance_rate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-900 to-green-800 h-2.5 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${report.attendance_rate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePreviewDownload(report)}
                        className="w-full bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-4 py-2.5 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center space-x-2"
                      >
                        <Download size={16} />
                        <span>Download Records</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        }
      </div>
    </AdminLayout>
  );
}