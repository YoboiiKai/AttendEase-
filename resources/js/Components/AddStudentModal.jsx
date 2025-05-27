'use client'

import React, { useState } from 'react'
import { X, User, Hash, Calendar, Users, CreditCard, Mail, Lock, Image, Fingerprint, QrCode, Eye, EyeOff } from 'lucide-react'
import ReactQRCode from 'react-qr-code'
import Swal from "sweetalert2"
import axios from 'axios'

export default function AddStudentModal({ isOpen, onClose, onStudentsUpdate }) {
  const [formData, setFormData] = useState({
    image: "",
    name: "",
    studentNo: "",
    year: "",
    section: "",
    rfid: "",
    email: "",
    password: "",
    password_confirmation: "",
    qrcode: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        setFormData(prevState => ({ ...prevState, [name]: file }));
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      setFormData(prevState => ({ ...prevState, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form Data being sent:', formData);

    if (formData.password !== formData.password_confirmation) {
      Swal.fire('Error', 'Passwords do not match', 'error');
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('studentNo', formData.studentNo);
      formDataToSend.append('year', formData.year);
      formDataToSend.append('section', formData.section);
      formDataToSend.append('rfid', formData.rfid);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('password_confirmation', formData.password_confirmation);
      
      if (formData.image instanceof File) {
        formDataToSend.append('image', formData.image);
      }
      
      if (qrCodeGenerated && qrCodeData) {
        formDataToSend.append('qrcode', qrCodeData);
      }

      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await axios.post('api/admin/student', formDataToSend, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        Swal.fire('Success', 'Student added successfully', 'success');
        onClose();
        console.log('Student added, refreshing list...');
        if (typeof onStudentsUpdate === 'function') {
          onStudentsUpdate();
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
          error.response?.data?.message || 'Failed to add student',
          'error'
        );
      }
    }
  };

  const handleQRCode = () => {
    const qrData = `${formData.name}-${formData.studentNo}`;
    setQrCodeData(qrData);
    setQrCodeGenerated(true);
    setFormData(prevState => ({ ...prevState, qrcode: qrData }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-green-900 to-green-800">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
            <User className="mr-2" size={24} />
            Add New Student
          </h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 bg-green-950/40 hover:bg-green-950/60 rounded-full p-2 transition-all duration-200"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-4rem)] p-2">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row p-5 gap-6">
            {/* Left column - Profile & QR */}
            <div className="w-full md:w-1/3 space-y-6">
              {/* Profile Image Upload */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-4 w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-green-800 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-gray-400" size={48} />
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <label htmlFor="image" className="cursor-pointer px-3 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium flex items-center">
                      <Image size={16} className="mr-1" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                      <input id="image" name="image" type="file" accept="image/*" className="sr-only" onChange={handleChange} />
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null)
                          setFormData(prevState => ({ ...prevState, image: '' }))
                        }}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200 text-sm font-medium flex items-center"
                      >
                        <X size={16} className="mr-1" />
                        Remove Image
                      </button>
                    )}
                  </div>
                  {!imagePreview && <p className="text-xs text-gray-500 mt-2 text-center">PNG, JPG, GIF up to 10MB</p>}
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    QR Code
                  </label>
                  <button
                    type="button"
                    onClick={handleQRCode}
                    className="px-3 py-1.5 bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-xs font-medium flex items-center"
                    disabled={!formData.name || !formData.studentNo}
                  >
                    <QrCode size={14} className="mr-1" />
                    Generate
                  </button>
                </div>
                <div className="flex justify-center items-center bg-white p-4 rounded-lg border border-gray-200 min-h-[150px]">
                  {qrCodeGenerated ? (
                    <div className="text-center">
                      <ReactQRCode value={qrCodeData} size={128} className="mx-auto" />
                      <p className="mt-2 text-xs text-gray-500">
                        {qrCodeData}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <QrCode className="mx-auto h-12 w-12 mb-2" />
                      <p className="text-sm">
                        {!formData.name || !formData.studentNo 
                          ? "Fill name and student number first" 
                          : "Click Generate to create QR Code"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column - Form Fields */}
            <div className="w-full md:w-2/3 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <InputField
                    icon={<User size={18} />}
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                  <InputField
                    icon={<Hash size={18} />}
                    name="studentNo"
                    placeholder="Student Number"
                    value={formData.studentNo}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <InputField
                    icon={<Calendar size={18} />}
                    name="year"
                    placeholder="Year"
                    value={formData.year}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <InputField
                    icon={<Users size={18} />}
                    name="section"
                    placeholder="Section"
                    value={formData.section}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RFID</label>
                <InputField
                  icon={<Fingerprint size={18} />}
                  name="rfid"
                  placeholder="RFID"
                  value={formData.rfid}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <InputField
                  icon={<Mail size={18} />}
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="password_confirmation"
                    placeholder="Confirm Password"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-900 to-green-800 text-white rounded-lg px-4 py-3 hover:from-green-800 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all duration-300 font-medium flex items-center justify-center"
                >
                  <User size={18} className="mr-2" />
                  Add Student
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function InputField({ icon, name, placeholder, value, onChange, type = "text" }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
      />
    </div>
  )
}
