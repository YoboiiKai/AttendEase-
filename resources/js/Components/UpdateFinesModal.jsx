'use client'

import React, { useState, useEffect } from 'react'
import { X, PhilippinePeso, Scale, BookOpenText } from 'lucide-react'
import Swal from "sweetalert2"
import axios from 'axios'

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
      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
    />
  </div>
);

export default function UpdateFines({ isOpen, onClose, onFinesUpdate, fineData }) {
  const [formData, setFormData] = useState({
    violation: "",
    description: "",
    amount: "",
  });

  useEffect(() => {
    if (fineData) {
      setFormData({
        violation: fineData.violation,
        description: fineData.description,
        amount: fineData.amount,
      });
    }
  }, [fineData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form Data being sent:', formData);

    try {
      const response = await axios.put(`api/admin/fines/${fineData.id}`, formData, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        Swal.fire('Success', 'Fine updated successfully', 'success');
        onClose();
        if (typeof onFinesUpdate === 'function') {
          onFinesUpdate();
        }
      }
    } catch (error) {
      console.error('Full error:', error);
      
      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        
        Swal.fire({
          title: 'Validation Error',
          text: errorMessages,
          icon: 'error',
          customClass: {
            content: 'text-left'
          }
        });
      } else {
        Swal.fire(
          'Error',
          error.response?.data?.message || 'Failed to update fine',
          'error'
        );
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-green-900 to-green-800">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
            <Scale className="mr-2" size={24} />
            Update Fines
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Violation</label>
                <InputWithIcon
                  icon={Scale}
                  name="violation"
                  placeholder="Enter violation"
                  value={formData.violation}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <InputWithIcon
                  icon={BookOpenText}
                  name="description"
                  type="text"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <InputWithIcon
                  icon={PhilippinePeso}
                  name="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleChange}
                />
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-900 to-green-800 text-white rounded-lg px-4 py-3 hover:from-green-800 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all duration-300 font-medium flex items-center justify-center"
                >
                  <Scale className="mr-2" size={18} />
                  Update Fines
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}