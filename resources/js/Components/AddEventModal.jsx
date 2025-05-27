'use client'

import React, { useState } from 'react';
import { X, Calendar, MapPin, Sun, Clock, Moon } from 'lucide-react';
import Swal from "sweetalert2";
import axios from 'axios';

const InputWithIcon = ({ icon: Icon, label, ...props }) => (
    <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon size={18} />
        </div>
        <input
            {...props}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        />
        {label && (
            <label className="absolute -top-6 left-0 text-sm font-medium text-gray-700">
                {label}
            </label>
        )}
    </div>
);

const AddEventModal = ({ isOpen, onClose, onEventsUpdate, onUpdate }) => {
    const [formData, setFormData] = useState({
        eventname: "",
        date: "",
        location: "",
        timeInAM: "",
        timeInAMDuration: "",
        timeOutAM: "",
        timeOutAMDuration: "",
        timeInPM: "",
        timeInPMDuration: "",
        timeOutPM: "",
        timeOutPMDuration: "",
        timeInNight: "",
        timeInNightDuration: "",
        timeOutNight: "",
        timeOutNightDuration: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('Form Data being sent:', formData);

        try {
            const response = await axios.post('api/admin/event', formData, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                Swal.fire('Success', 'Event added successfully', 'success');
                onClose();
                if (typeof onUpdate === 'function') {
                    onUpdate();  // Call the function to refresh the table
                }
                if (typeof onEventsUpdate === 'function') {
                    onEventsUpdate();
                }
            } else {
                Swal.fire(
                    'Error',
                    response.data.message || 'Failed to add event',
                    'error'
                );
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
                    error.response?.data?.message || 'Failed to add event',
                    'error'
                );
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-green-900 to-green-800">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
                        <Calendar className="mr-2" size={24} />
                        Add New Event
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                                    <InputWithIcon 
                                        icon={Calendar}
                                        name="eventname"
                                        placeholder="Event Name"
                                        value={formData.eventname}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                                    <InputWithIcon 
                                        icon={Calendar}
                                        name="date"
                                        type="date"
                                        placeholder="Event Date"
                                        value={formData.date}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <InputWithIcon 
                                        icon={MapPin}
                                        name="location"
                                        placeholder="Location"
                                        value={formData.location}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4 mb-2">
                                <h3 className="text-md font-medium text-gray-800 mb-3">Morning Schedule (AM)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time In</label>
                                        <InputWithIcon 
                                            icon={Sun}
                                            name="timeInAM"
                                            type="time"
                                            value={formData.timeInAM}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (In)</label>
                                        <InputWithIcon 
                                            icon={Clock}
                                            name="timeInAMDuration"
                                            type="time"
                                            value={formData.timeInAMDuration}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Out</label>
                                        <InputWithIcon 
                                            icon={Sun}
                                            name="timeOutAM"
                                            type="time"
                                            value={formData.timeOutAM}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Out)</label>
                                        <InputWithIcon 
                                            icon={Clock}
                                            name="timeOutAMDuration"
                                            type="time"
                                            value={formData.timeOutAMDuration}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4 mb-2">
                                <h3 className="text-md font-medium text-gray-800 mb-3">Afternoon Schedule (PM)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time In</label>
                                        <InputWithIcon 
                                            icon={Sun}
                                            name="timeInPM"
                                            type="time"
                                            value={formData.timeInPM}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (In)</label>
                                        <InputWithIcon 
                                            icon={Clock}
                                            name="timeInPMDuration"
                                            type="time"
                                            value={formData.timeInPMDuration}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Out</label>
                                        <InputWithIcon 
                                            icon={Sun}
                                            name="timeOutPM"
                                            type="time"
                                            value={formData.timeOutPM}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Out)</label>
                                        <InputWithIcon 
                                            icon={Clock}
                                            name="timeOutPMDuration"
                                            type="time"
                                            value={formData.timeOutPMDuration}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4 mb-2">
                                <h3 className="text-md font-medium text-gray-800 mb-3">Evening Schedule (Night)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time In</label>
                                        <InputWithIcon 
                                            icon={Moon}
                                            name="timeInNight"
                                            type="time"
                                            value={formData.timeInNight}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (In)</label>
                                        <InputWithIcon 
                                            icon={Clock}
                                            name="timeInNightDuration"
                                            type="time"
                                            value={formData.timeInNightDuration}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Out</label>
                                        <InputWithIcon 
                                            icon={Moon}
                                            name="timeOutNight"
                                            type="time"
                                            value={formData.timeOutNight}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Out)</label>
                                        <InputWithIcon 
                                            icon={Clock}
                                            name="timeOutNightDuration"
                                            type="time"
                                            value={formData.timeOutNightDuration}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-green-900 to-green-800 text-white rounded-lg px-4 py-3 hover:from-green-800 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all duration-300 font-medium flex items-center justify-center"
                                >
                                    <Calendar className="mr-2" size={18} />
                                    Add Event
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddEventModal;
