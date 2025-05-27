'use client'

import React, { useState, useEffect } from 'react'
import { X, Scale, User, PhilippinePeso, BookOpenText } from 'lucide-react'
import Swal from "sweetalert2"
import axios from 'axios'
import { usePage } from '@inertiajs/react'

const InputWithIcon = ({ icon: Icon, placeholder, name, value, onChange, type = "text" }) => (
  <div className="relative mb-4">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
      <Icon size={18} />
    </div>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
    />
  </div>
);

const SelectWithIcon = ({ icon: Icon, name, value, onChange, options, placeholder, disabled = false }) => (
  <div className="relative mb-4">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
      <Icon size={18} />
    </div>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default function AddStudentFinesModal({ isOpen, onClose, onFinesUpdate }) {
  const { auth } = usePage().props;
  const [formData, setFormData] = useState({
    student_id: "",
    fines_id: "",
    amount: "",
    reason: "",
    status: "unpaid"
  });

  const [students, setStudents] = useState([]);
  const [fineTypes, setFineTypes] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [errors, setErrors] = useState({});
  const [secretaryYear, setSecretaryYear] = useState(auth.user.year);
  const [secretarySection, setSecretarySection] = useState(auth.user.section);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state when component mounts
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Fetch students and fine types when component mounts
  useEffect(() => {
    if (isOpen && isMounted) {
      console.log('Modal opened, fetching students and fine types');
      console.log('Secretary details:', auth.user.year, auth.user.section);
      fetchSectionStudents();
      fetchFineTypes();
    }
  }, [isOpen, isMounted]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        student_id: "",
        fines_id: "",
        amount: "",
        reason: "",
        status: "unpaid"
      });
      setSelectedStudent(null);
      setErrors({});
    }
  }, [isOpen]);

  // Fetch students from the secretary's section
  const fetchSectionStudents = async () => {
    try {
      console.log('Fetching students from section...');
      const response = await axios.get('/secretary/api/section-students');
      console.log('API Response:', response.data);
      
      if (response.data.success && response.data.students && response.data.students.length > 0) {
        console.log('Students found:', response.data.students.length);
        setStudents(response.data.students);
      } else {
        console.log('No students found in the response');
        setStudents([]);
        Swal.fire({
          icon: 'warning',
          title: 'No Students Found',
          text: `No students found in your section (Year ${auth.user.year} - Section ${auth.user.section}). Please contact an administrator.`
        });
      }
    } catch (error) {
      console.error('Error fetching section students:', error);
      setStudents([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch students. Please try again.'
      });
    }
  };

  // Fetch fine types from the API
  const fetchFineTypes = async () => {
    try {
      console.log('Fetching fine types...');
      const response = await axios.get('/secretary/api/fine-types');
      console.log('Fine types response:', response.data);
      
      let fineTypesList = [];
      if (response.data.success && response.data.data) {
        console.log('Fine types found:', response.data.data.length);
        fineTypesList = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Handle case where the API returns an array directly
        console.log('Fine types found (array format):', response.data.length);
        fineTypesList = response.data;
      }
      
      // Filter out the 'absent' violation type
      const filteredFineTypes = fineTypesList.filter(fineType => {
        const violation = fineType.violation ? fineType.violation.toLowerCase() : '';
        return !violation.includes('absent');
      });
      
      if (filteredFineTypes.length > 0) {
        setFineTypes(filteredFineTypes);
      } else {
        console.log('No fine types found in the response');
        setFineTypes([]);
        Swal.fire({
          icon: 'warning',
          title: 'No Fine Types Found',
          text: 'No fine types are available. Please contact an administrator.'
        });
      }
    } catch (error) {
      console.error('Error fetching fine types:', error);
      setFineTypes([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch fine types. Please try again.'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'student_id' && value) {
      const student = students.find(s => s.id.toString() === value);
      setSelectedStudent(student);
    }
    
    if (name === 'fines_id' && value) {
      const selectedFine = fineTypes.find(fine => fine.id.toString() === value);
      if (selectedFine) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          amount: selectedFine.amount,
          reason: selectedFine.description || `Fine for ${selectedFine.violation}`
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = {};
    if (!formData.student_id) validationErrors.student_id = 'Please select a student';
    if (!formData.fines_id) validationErrors.fines_id = 'Please select a fine type';
    if (!formData.amount) validationErrors.amount = 'Please enter an amount';
    if (!formData.reason) validationErrors.reason = 'Please enter a reason';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      console.log('Submitting form data:', formData);
      const response = await axios.post('/secretary/api/student-fines', formData);
      
      if (response.data.success) {
        console.log('Fine added successfully:', response.data);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Student fine has been added successfully!'
        });

        // Reset form
        setFormData({
          student_id: '',
          fines_id: '',
          amount: '',
          reason: '',
          status: 'unpaid'
        });
        setSelectedStudent(null);
        setErrors({});
        
        onClose();
        if (typeof onFinesUpdate === 'function') {
          onFinesUpdate();
        }
      }
    } catch (error) {
      console.error('Error adding fine:', error);
      
      // Handle validation errors from the server
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to add fine. Please try again.'
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-green-900 to-green-800">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
            <PhilippinePeso className="mr-2" size={24} />
            Add Student Fine
          </h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 bg-green-950/40 hover:bg-green-950/60 rounded-full p-2 transition-all duration-200"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          <form onSubmit={handleSubmit} className="flex flex-col p-5 gap-6">
            <div className="w-full space-y-4">
              <div className="mb-4">
                <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-3">
                  <p className="text-sm text-green-700">
                    <strong>Note:</strong> Only students from your assigned section (Year {auth.user.year} - Section {auth.user.section}) are shown below.
                  </p>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <SelectWithIcon
                  icon={User}
                  name="student_id"
                  placeholder="Select a student"
                  value={formData.student_id}
                  onChange={handleChange}
                  disabled={(students && students.length === 0)}
                  options={(students || []).map(student => ({
                    id: student.id,
                    label: `${student.name}`
                  }))}
                />
                {students && students.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-600">
                    No students found in your section. Please contact an administrator.
                  </p>
                )}
                {errors.student_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.student_id}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fine Type</label>
                <SelectWithIcon
                  icon={Scale}
                  name="fines_id"
                  placeholder="Select fine type"
                  value={formData.fines_id}
                  onChange={handleChange}
                  options={fineTypes.map(fineType => ({
                    id: fineType.id,
                    label: `${fineType.violation} - ₱${fineType.amount}`
                  }))}
                />
                {errors.fines_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.fines_id}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
                <InputWithIcon
                  icon={PhilippinePeso}
                  name="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleChange}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <InputWithIcon
                  icon={BookOpenText}
                  name="reason"
                  placeholder="Enter reason for the fine"
                  value={formData.reason}
                  onChange={handleChange}
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-900 to-green-800 text-white rounded-lg px-4 py-3 hover:from-green-800 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all duration-300 font-medium flex items-center justify-center"
                >
                  <PhilippinePeso className="mr-2" size={18} />
                  Add Student Fine
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
