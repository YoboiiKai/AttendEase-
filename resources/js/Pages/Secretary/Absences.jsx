import React, { useState, useEffect } from 'react';
import { Calendar, Users, Search, Filter, Download, AlertCircle, CheckCircle, XCircle, Clock, DollarSign, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import SecretaryLayout from '@/Layouts/SecretaryLayout';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Absences({ auth }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [absenceRecords, setAbsenceRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  
  useEffect(() => {
    fetchAbsenceRecords();
  }, [selectedMonth]);

  const fetchAbsenceRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/secretary/api/absence-records', {
        params: { month: selectedMonth }
      });
      
      if (response.data.success) {
        // The records are already grouped by student with total absence count
        setAbsenceRecords(response.data.records || []);
        console.log('Fetched absence records:', response.data.records);
      } else {
        console.error('Failed to fetch absence records:', response.data.message);
        setAbsenceRecords([]);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch absence records. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error fetching absence records:', error);
      setAbsenceRecords([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch absence records. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get filtered records based on search term and status filter
  const filteredRecords = absenceRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === 'All' || 
      record.payment_status?.toLowerCase() === filterStatus.toLowerCase();
      
    return matchesSearch && matchesStatus;
  });
  
  // Get current records for pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  
  // Pagination functions
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredRecords.length / recordsPerPage)));
  const goToLastPage = () => setCurrentPage(Math.ceil(filteredRecords.length / recordsPerPage));

  const handlePaymentStatusChange = async (recordId, newStatus) => {
    try {
      console.log('Updating payment status:', { recordId, newStatus });
      
      const response = await axios.patch(`/secretary/api/absence-records/${recordId}`, {
        payment_status: newStatus
      });
      
      if (response.data.success) {
        // Update the local state
        const updatedRecords = absenceRecords.map(record => {
          if (record.id === recordId) {
            return { ...record, payment_status: newStatus };
          }
          return record;
        });
        
        setAbsenceRecords(updatedRecords);
        
        Swal.fire({
          title: 'Success!',
          text: 'Payment status updated successfully',
          icon: 'success',
          confirmButtonColor: '#15803d'
        });
        
        // Refresh the data to ensure we have the latest information
        fetchAbsenceRecords();
      } else {
        Swal.fire({
          title: 'Error',
          text: response.data.message || 'Failed to update payment status',
          icon: 'error',
          confirmButtonColor: '#15803d'
        });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update payment status. Please try again.',
        icon: 'error',
        confirmButtonColor: '#15803d'
      });
    }
  };

  const handleGenerateInvoice = async (record) => {
    try {
      console.log('Generating invoice for record:', record);
      const response = await axios.post('/secretary/api/absence-records/invoice', {
        record_id: record.id
      }, { responseType: 'blob' });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${record.student_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Swal.fire({
        title: 'Success!',
        text: 'Invoice generated successfully',
        icon: 'success',
        confirmButtonColor: '#15803d'
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      Swal.fire({
        title: 'Error',
        text: 'An error occurred while generating the invoice',
        icon: 'error',
        confirmButtonColor: '#15803d'
      });
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    // Convert to lowercase for case-insensitive comparison
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  return (
    <SecretaryLayout user={auth.user}>
      <Head title="Absence Records" />
      <div className="container mx-auto py-6">
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-md">
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-green-800" size={18} />
              </div>
              <input
                type="text"
                placeholder="Search by student name or ID..."
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
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Unpaid">Unpaid</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="text-gray-400" size={18} />
              </div>
            </div>
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="text-green-800" size={18} />
              </div>
              <select
                className="appearance-none bg-white pl-10 pr-10 py-3 rounded-lg border border-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent shadow-sm w-full"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="All">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="text-gray-400" size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Records Table */}
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
                  Total Absences
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center items-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {absenceRecords.length === 0 
                      ? "No absence records found. Records will appear here when students have absences."
                      : "No matching records found. Try adjusting your search or filter."}
                  </td>
                </tr>
              ) : (
                currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.student_name}</div>
                          <div className="text-sm text-gray-500">{record.student_id}</div>
                          <div className="text-xs text-gray-500">{record.year}-{record.section}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Absence</div>
                      <div className="text-xs text-gray-500">
                        {record.date_range ? `Period: ${record.date_range}` : 'Multiple dates'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">{record.absence_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₱{parseFloat(record.amount).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">₱{(parseFloat(record.amount) / record.absence_count).toFixed(2)} per absence</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(record.payment_status)}`}>
                        {record.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePaymentStatusChange(record.id, 'Paid')}
                          className="text-xs bg-green-100 hover:bg-green-200 text-green-800 py-1 px-2 rounded-md transition-colors duration-200"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleGenerateInvoice(record)}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded-md transition-colors duration-200 flex items-center"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Invoice
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
        {!loading && filteredRecords.length > recordsPerPage && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-2">
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
                {[...Array(Math.min(5, Math.ceil(filteredRecords.length / recordsPerPage)))].map((_, i) => {
                  // Calculate page number to display
                  let pageNum;
                  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
                  
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
                disabled={currentPage === Math.ceil(filteredRecords.length / recordsPerPage)}
                className={`p-1.5 rounded-md ${
                  currentPage === Math.ceil(filteredRecords.length / recordsPerPage)
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-green-800 hover:bg-green-100"
                }`}
              >
                <ChevronRight size={18} />
              </button>
              
              <button
                onClick={goToLastPage}
                disabled={currentPage === Math.ceil(filteredRecords.length / recordsPerPage)}
                className={`p-1.5 rounded-md ${
                  currentPage === Math.ceil(filteredRecords.length / recordsPerPage)
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
    </SecretaryLayout>
  );
}
