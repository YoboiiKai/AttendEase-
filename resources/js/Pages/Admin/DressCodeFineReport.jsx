import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, ChevronDown, Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, Download, X, FileText, Layers, Printer, DollarSign, Shirt } from 'lucide-react';
import { saveAs } from 'file-saver';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DressCodeFineReport({ auth }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dressCodeFineData, setDressCodeFineData] = useState([]);
  const [filteredDressCodeFineData, setFilteredDressCodeFineData] = useState([]);
  const [studentSummary, setStudentSummary] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [yearFilter, setYearFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [availableYears, setAvailableYears] = useState(['All']);
  const [availableSections, setAvailableSections] = useState(['All']);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchDressCodeFineReports();
  }, [filterPeriod]);

  const fetchDressCodeFineReports = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/admin/api/dress-code-fine-reports', {
        params: { period: filterPeriod }
      });
      
      if (response.data.success) {
        setReports(response.data.reports || []);
      } else {
        console.error('Failed to fetch dress code fine reports:', response.data.message);
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching dress code fine reports:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to filter dress code fine data based on year, section, and payment status
  useEffect(() => {
    if (dressCodeFineData.length > 0) {
      let filtered = [...dressCodeFineData];
      
      // Extract available years and sections on first load
      if (yearFilter === 'All' && sectionFilter === 'All') {
        const years = new Set();
        const sections = new Set();
        
        dressCodeFineData.forEach(record => {
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
      
      if (statusFilter !== 'All') {
        filtered = filtered.filter(record => record.payment_status === statusFilter);
      }
      
      setFilteredDressCodeFineData(filtered);
    } else {
      setFilteredDressCodeFineData([]);
    }
  }, [dressCodeFineData, yearFilter, sectionFilter, statusFilter]);
  
  const handlePreviewDownload = async (report) => {
    setSelectedReport(report);
    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);
    setYearFilter('All');
    setSectionFilter('All');
    setStatusFilter('All');
    
    try {
      // Log the report ID being sent to the backend
      console.log('Fetching details for violation type:', report.violation, 'with ID:', report.id);
      
      const response = await axios.get('/admin/api/dress-code-fine-details', {
        params: { event_id: report.id }
      });
      
      if (response.data.success) {
        const fineDetails = response.data.fineDetails || [];
        const summaryData = response.data.studentSummary || [];
        
        // Log the number of records returned
        console.log(`Received ${fineDetails.length} records for violation type: ${report.violation}`);
        
        // Ensure we're only showing records that match the selected violation type
        const filteredDetails = fineDetails.filter(detail => 
          detail.violation.toLowerCase() === report.violation.toLowerCase()
        );
        
        console.log(`Filtered to ${filteredDetails.length} records that exactly match '${report.violation}'`);
        
        setDressCodeFineData(filteredDetails);
        setFilteredDressCodeFineData(filteredDetails);
        setStudentSummary(Object.values(summaryData));
      } else {
        console.error('Failed to fetch dress code fine details:', response.data.message);
        setDressCodeFineData([]);
        setFilteredDressCodeFineData([]);
        setStudentSummary([]);
      }
    } catch (error) {
      console.error('Error fetching dress code fine details:', error);
      setDressCodeFineData([]);
      setFilteredDressCodeFineData([]);
      setStudentSummary([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  const handleDownload = () => {
    if (!selectedReport) return;
    
    // Generate CSV data
    const csvData = [];
    
    // Add headers
    csvData.push(['Name', 'Student ID', 'Year', 'Section', 'Violation', 'Fine Amount', 'Date', 'Payment Status']);
    
    // Add data rows
    filteredDressCodeFineData.forEach(record => {
      csvData.push([
        record.name,
        record.student_id,
        record.year,
        record.section,
        record.violation,
        record.fineamount,
        record.date,
        record.payment_status
      ]);
    });
    
    // Convert to CSV format
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Create a blob and save the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `dress_code_fines_${selectedReport.event.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  };
  
  const generateDocumentReport = () => {
    if (!selectedReport || filteredDressCodeFineData.length === 0) return;
    
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add document title and violation information
      doc.setFontSize(18);
      doc.setTextColor(0, 100, 0); // Dark green color
      doc.text('AttendEase System - Dress Code Fine Report', 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Violation Type: ${selectedReport.violation}`, 14, 25);
      doc.text(`First Recorded: ${new Date(selectedReport.date).toLocaleDateString()}`, 14, 32);
      doc.text(`Total Violations: ${selectedReport.violation_count}`, 14, 39);
      doc.text(`Payment Rate: ${selectedReport.payment_rate}%`, 14, 46);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 53);
      
      // Add filter information
      if (yearFilter !== 'All' || sectionFilter !== 'All' || statusFilter !== 'All') {
        let filterText = 'Filters: ';
        if (yearFilter !== 'All') filterText += 'Year: ' + yearFilter + ' ';
        if (sectionFilter !== 'All') filterText += 'Section: ' + sectionFilter + ' ';
        if (statusFilter !== 'All') filterText += 'Status: ' + statusFilter;
        doc.text(filterText.trim(), 14, 53);
      }

      const headers = [['Name', 'Student ID', 'Year', 'Section', 'Violation', 'Fine Amount', 'Date', 'Payment Status']];

      const tableData = filteredDressCodeFineData.map(record => {
        // Safely access properties with fallbacks to prevent errors
        const fineAmount = parseFloat(record.fineamount || 0).toFixed(2);
        
        return [
          record.name || '',
          record.student_id || '',
          record.year || '',
          record.section || '',
          record.violation || '',
          `₱${fineAmount}`,
          record.date || '',
          record.payment_status || 'Pending'
        ];
      });
      
      // Generate the table with all data using the autoTable plugin
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
        doc.setTextColor(100);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      doc.save(`dress_code_fines_${selectedReport.violation.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating document report:', error);
    }
  };
  
  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedReport(null);
    setDressCodeFineData([]);
    setFilteredDressCodeFineData([]);
  };
  
  // Helper function to get payment status badge class
  const getPaymentStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter reports based on search term
  const filteredReports = reports.filter(report => {
    const searchLower = searchTerm.toLowerCase();
    return (
      report.event?.toLowerCase().includes(searchLower) ||
      report.date?.toLowerCase().includes(searchLower) ||
      report.location?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminLayout user={auth.user}>
      <Head title="Dress Code Fine Report" />
      
      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-900 to-green-800 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Shirt className="text-white" size={20} />
                <h2 className="text-white text-lg font-semibold">
                  {selectedReport?.violation} - Dress Code Violations
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
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-green-800 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading dress code fine details...</p>
                </div>
              ) : filteredDressCodeFineData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} className="text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No dress code fine records found</h3>
                  <p className="text-gray-600">There are no dress code fine records available for this event.</p>
                </div>
                ) : (
                <div>
                  <div className="mb-4">
                    <div className="mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                        <p className="text-sm text-gray-600">
                          {filteredDressCodeFineData.length} of {dressCodeFineData.length} records shown
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
                        
                        <div className="relative w-full sm:w-auto flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="text-green-800" size={18} />
                          </div>
                          <select
                            id="statusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none bg-white pl-10 pr-10 py-3 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm w-full"
                          >
                            <option value="All">All Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
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
                          <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Violation</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Year</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Section</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Fine Amount</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDressCodeFineData.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">{record.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{record.student_id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Shirt size={16} className="mr-2 text-green-800" />
                                <div className="text-sm font-medium text-gray-900">{record.violation}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">{record.year}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">{record.section}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">₱{parseFloat(record.fineamount).toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadgeClass(record.payment_status)}`}>
                                {record.payment_status}
                              </span>
                            </td>
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
                disabled={filteredDressCodeFineData.length === 0}
                className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-700 disabled:hover:to-green-600"
              >
                <FileText size={16} />
                <span>Download Document</span>
              </button>
              <button
                onClick={() => {
                  handleDownload();
                  closePreviewModal();
                }}
                disabled={filteredDressCodeFineData.length === 0}
                className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-900 disabled:hover:to-green-800"
              >
                <Download size={16} />
                <span>Download CSV</span>
              </button>
              <button
                onClick={closePreviewModal}
                className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dress Code Fine Reports</h1>
        
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
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
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
                  <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
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
                      <h2 className="text-xl font-bold text-gray-800 mb-2 truncate group-hover:text-green-600 transition-colors duration-300">
                        <Shirt size={20} className="inline mr-2 text-green-800" />
                        {report.violation}
                      </h2>
                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <Calendar size={16} className="mr-2 text-green-800" />
                        First recorded: {new Date(report.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Users size={16} className="mr-2 text-green-800" />
                        {report.violation_count} {report.violation_count === 1 ? 'Student' : 'Students'}
                      </div>
                    </div>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                  </div>

                    {/* Progress bar for payment rate */}
                    <div className="mb-5">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span className="font-medium">Payment Rate</span>
                        <span className="font-bold">{report.payment_rate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-900 to-green-800 h-2.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${report.payment_rate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Total fine amount */}
                    <div className="mb-5">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span className="font-medium">Total Fine Amount</span>
                        <span className="font-bold">₱{parseFloat(report.total_fine_amount).toFixed(2)}</span>
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
                )
              ))
            }
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
