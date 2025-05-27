import StudentLayout from "@/Layouts/StudentLayout";
import { Head } from "@inertiajs/react";
import { User, IdCard, GraduationCap, Users, CreditCard, QrCode, Mail, Phone, MapPin, Calendar, Shield, BookOpen } from "lucide-react";
import QRCode from "react-qr-code";
import { useState } from 'react';

export default function StudentProfile({ auth }) {
    // Using auth.user data
    const student = auth.user;

    const [activeTab, setActiveTab] = useState('profile');

    return (
        <StudentLayout>
            <Head title="Profile" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <div className="bg-gradient-to-l from-green-700 to-green-800 rounded-xl shadow-xl mb-8 p-6 text-white">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="relative mb-6 md:mb-0 md:mr-8">
                            <img
                                src={student.image ? `/storage/${student.image}` : "https://via.placeholder.com/150"}
                                alt="Student"
                                className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-lg"
                            />
                            <div className="absolute bottom-0 right-0 bg-green-500 p-1 rounded-full border-2 border-white">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{student.name}</h1>
                            <div className="flex items-center mt-2">
                                <IdCard className="w-5 h-5 mr-2" />
                                <span className="text-lg">{student.studentNo}</span>
                            </div>
                            <div className="flex items-center mt-2">
                                <GraduationCap className="w-5 h-5 mr-2" />
                                <span>Year {student.year}, Section {student.section}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex mb-6 bg-white rounded-lg shadow-md p-1">
                    <button 
                        className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center ${activeTab === 'profile' ? 'bg-gradient-to-l from-green-600 to-green-800 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User className="w-5 h-5 mr-2" />
                        <span>Profile</span>
                    </button>
                    <button 
                        className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center ${activeTab === 'qrcode' ? 'bg-gradient-to-l from-green-600 to-green-800 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('qrcode')}
                    >
                        <QrCode className="w-5 h-5 mr-2" />
                        <span>QR Code</span>
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'profile' ? (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <User className="w-6 h-6 mr-2 text-green-600" />
                                Student Information
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2">
                                        <IdCard className="w-5 h-5 text-green-600 mr-3" />
                                        <h3 className="text-sm font-medium text-gray-500">Student ID</h3>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-800 ml-8">{student.studentNo}</p>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2">
                                        <GraduationCap className="w-5 h-5 text-green-600 mr-3" />
                                        <h3 className="text-sm font-medium text-gray-500">Year Level</h3>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-800 ml-8">{student.year}</p>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2">
                                        <Users className="w-5 h-5 text-green-600 mr-3" />
                                        <h3 className="text-sm font-medium text-gray-500">Section</h3>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-800 ml-8">{student.section}</p>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2">
                                        <CreditCard className="w-5 h-5 text-green-600 mr-3" />
                                        <h3 className="text-sm font-medium text-gray-500">RFID Number</h3>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-800 ml-8">{student.rfid}</p>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2">
                                        <Mail className="w-5 h-5 text-green-600 mr-3" />
                                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-800 ml-8">{student.email}</p>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2">
                                        <BookOpen className="w-5 h-5 text-green-600 mr-3" />
                                        <h3 className="text-sm font-medium text-gray-500">Program</h3>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-800 ml-8">{student.program || 'Bachelor of Science in Information Technology'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <QrCode className="w-6 h-6 mr-2 text-green-600" />
                                Identification QR Code
                            </h2>
                            
                            <div className="flex flex-col items-center justify-center">
                                <div className="bg-white p-4 rounded-lg border-2 border-green-100 shadow-md mb-4">
                                    <QRCode
                                        value={student.studentNo || ''}
                                        size={200}
                                        level="H"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium text-gray-800 mb-2">
                                        {student.name}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Student ID: {student.studentNo}
                                    </p>
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <p className="text-sm text-green-800 flex items-center justify-center">
                                            <Shield className="w-4 h-4 mr-2" />
                                            Scan this QR code for quick identification
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}