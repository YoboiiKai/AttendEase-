import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Swal from 'sweetalert2';
import axios from 'axios';
import { Image, School, BookOpen, Upload, Settings as SettingsIcon } from 'lucide-react';

const Settings = ({ auth }) => {
    const [formData, setFormData] = useState({ image: null, schoolname: '', department: '' });
    const [imagePreview, setImagePreview] = useState(null);

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

    const handleUpload = async () => {
        if (!formData.image) {
            Swal.fire({
                title: 'Missing Image',
                text: 'Please select a logo to upload.',
                icon: 'warning',
                confirmButtonColor: '#0f5132'
            });
            return;
        }
        // Here you would typically upload the logo to the server
        // For demonstration, we will just show a success message
        Swal.fire({
            title: 'Success!',
            text: 'School logo and information updated successfully!',
            icon: 'success',
            confirmButtonColor: '#0f5132'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('Form Data being sent:', formData);
    
        try {
          const formDataToSend = new FormData();
          
          formDataToSend.append('image', formData.image);
          formDataToSend.append('schoolname', formData.schoolname);
          formDataToSend.append('department', formData.department);
    
          for (let pair of formDataToSend.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
          }
    
          const response = await axios.post('api/admin/settings', formDataToSend, {
            headers: { 
              'Content-Type': 'multipart/form-data',
              'Accept': 'application/json'
            }
          });
    
          if (response.data.success) {
            Swal.fire('Success', 'Settings updated successfully', 'success');
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
              error.response?.data?.message || 'Failed to update settings',
              'error'
            );
          }
        }
      };

    return (
        <AdminLayout user={auth.user}>
            <div className="container mx-auto py-8 px-4 max-w-5xl">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-900 to-green-800 px-6 py-4 flex items-center space-x-2">
                        <SettingsIcon className="text-white" size={24} />
                        <h1 className="text-2xl font-bold text-white">School Settings</h1>
                    </div>
                    
                    <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col md:flex-row md:space-x-8 space-y-6 md:space-y-0">
                            {/* Left Column - Logo Upload */}
                            <div className="md:w-2/5">
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <Image className="mr-2 text-green-800" size={20} />
                                        School Logo
                                    </h2>
                                    
                                    <div className="flex justify-center mb-4">
                                        <div className="w-48 h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-white">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <Image className="mx-auto h-20 w-20 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500">No logo uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-center space-x-2">
                                        <label htmlFor="image" className="cursor-pointer px-4 py-2 bg-gradient-to-r from-green-900 to-green-800 text-white rounded-md hover:from-green-800 hover:to-green-700 transition-colors duration-200 flex items-center">
                                            <Upload size={16} className="mr-1" />
                                            <span>{imagePreview ? 'Change Logo' : 'Upload Logo'}</span>
                                            <input id="image" name="image" type="file" accept="image/*" className="sr-only" onChange={handleChange} />
                                        </label>
                                        
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setFormData(prevState => ({ ...prevState, image: null }));
                                                }}
                                                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors duration-200"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    
                                    <p className="text-xs text-gray-500 text-center mt-3">
                                        Recommended: Square image, PNG or JPG format
                                    </p>
                                </div>
                            </div>
                            
                            {/* Right Column - School Information */}
                            <div className="md:w-3/5">
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 h-full">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <School className="mr-2 text-green-800" size={20} />
                                        School Information
                                    </h2>
                                    
                                    <div className="space-y-5">
                                        <div>
                                            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                                                School Name
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    id="schoolname"
                                                    name="schoolname"
                                                    placeholder="Enter school name"
                                                    className="pl-3 pr-3 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                                    value={formData.schoolname}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="Department" className="block text-sm font-medium text-gray-700 mb-1">
                                                Department
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    id="department"
                                                    name="department"
                                                    placeholder="Enter department name"
                                                    className="pl-3 pr-3 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                                    value={formData.department}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Save Button */}
                        <div className="mt-8 flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-br from-green-900 to-green-800 text-white rounded-lg hover:from-green-800 hover:to-green-700 transition-all duration-200 font-medium flex items-center shadow-md"
                            >
                                <Upload className="mr-2" size={18} />
                                Save Settings
                            </button>
                        </div>
                    </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Settings;