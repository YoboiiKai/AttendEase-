import AdminLayout from "@/Layouts/AdminLayout";
import StudentLayout from "@/Layouts/StudentLayout";
import SecretaryLayout from "@/Layouts/SecretaryLayout";
import { Head } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { UserCircle, Calendar, Clock, Users, UserCog, UserPen, BookOpen, DollarSign, TrendingUp, Award, UserX, BarChart, PieChart } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import InteractiveChart from "@/Components/ui/interactive-chart";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
    const { userCounts } = usePage().props;
    const [attendanceData, setAttendanceData] = useState([]);
    const [finesData, setFinesData] = useState([]);
    const [absenceFinesData, setAbsenceFinesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchChartData = async () => {
            setLoading(true);
            try {
                // Fetch attendance data by year
                const attendanceResponse = await axios.get('/admin/api/attendance-by-year');
                if (attendanceResponse.data.success) {
                    setAttendanceData(attendanceResponse.data.data);
                }
                
                // Fetch fines data by year
                const finesResponse = await axios.get('/admin/api/fines-by-year');
                if (finesResponse.data.success) {
                    setFinesData(finesResponse.data.data);
                }
                
                // Fetch absence fines data
                const absenceFinesResponse = await axios.get('/admin/api/absence-fines');
                if (absenceFinesResponse.data.success) {
                    setAbsenceFinesData(absenceFinesResponse.data.data);
                }
            } catch (error) {
                console.error('Error fetching chart data:', error);
                setError('Failed to load chart data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchChartData();
    }, []);
    
    // Prepare data for attendance chart
    const prepareAttendanceChartData = () => {
        if (!attendanceData || attendanceData.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }
        
        // Green color palette for bar chart
        const greenColors = [
            'rgba(34, 197, 94, 0.8)',   // Green-500
            'rgba(16, 185, 129, 0.8)',  // Emerald-500
            'rgba(20, 184, 166, 0.8)',  // Teal-500
            'rgba(5, 150, 105, 0.8)',   // Emerald-600
            'rgba(22, 163, 74, 0.8)',   // Green-600
            'rgba(21, 128, 61, 0.8)',   // Green-700
            'rgba(4, 120, 87, 0.8)',    // Emerald-700
            'rgba(15, 118, 110, 0.8)',  // Teal-700
            'rgba(6, 95, 70, 0.8)',     // Emerald-800
            'rgba(22, 101, 52, 0.8)',   // Green-800
        ];
        
        // Get all unique event names
        const allEvents = [];
        attendanceData.forEach(yearData => {
            yearData.events.forEach(event => {
                if (!allEvents.includes(event.event_name)) {
                    allEvents.push(event.event_name);
                }
            });
        });
        
        // Sort events alphabetically
        allEvents.sort();
        
        // Create datasets for each year
        const datasets = attendanceData.map((yearData, index) => {
            const yearLabel = `Year ${yearData.year}`;
            const yearColor = greenColors[index % greenColors.length];
            
            // Create data array matching the order of allEvents
            const data = allEvents.map(eventName => {
                const eventData = yearData.events.find(e => e.event_name === eventName);
                return eventData ? eventData.percentage : 0;
            });
            
            return {
                label: yearLabel,
                data: data,
                backgroundColor: yearColor,
                borderColor: yearColor.replace('0.8', '1'),
                borderWidth: 1
            };
        });
        
        return {
            labels: allEvents,
            datasets: datasets
        };
    };
    
    // Prepare data for fines chart with green colors
    const prepareFinesChartData = () => {
        if (!finesData || finesData.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }
        
        // Sort years numerically
        const sortedData = [...finesData].sort((a, b) => a.year - b.year);
        
        return {
            labels: sortedData.map(item => `Year ${item.year}`),
            datasets: [
                {
                    label: 'Paid Fines',
                    data: sortedData.map(item => item.paid_fines),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',  // Green-500
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)',
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Unpaid Fines',
                    data: sortedData.map(item => item.unpaid_fines),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',  // Emerald-500
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }
            ]
        };
    };
    
    // Helper function to generate consistent colors based on year with green palette
    const getRandomColor = (seed) => {
        // Green color palette
        const colors = [
            'rgba(34, 197, 94, 0.8)',  // Green-500
            'rgba(16, 185, 129, 0.8)', // Emerald-500
            'rgba(20, 184, 166, 0.8)', // Teal-500
            'rgba(6, 148, 162, 0.8)',  // Cyan-600
            'rgba(5, 150, 105, 0.8)',  // Emerald-600
            'rgba(22, 163, 74, 0.8)',  // Green-600
            'rgba(21, 128, 61, 0.8)',  // Green-700
            'rgba(4, 120, 87, 0.8)',   // Emerald-700
            'rgba(15, 118, 110, 0.8)', // Teal-700
            'rgba(56, 189, 248, 0.8)', // Light Blue (for contrast)
        ];
        
        // Use seed to pick a color deterministically
        const index = seed % colors.length;
        return colors[index];
    };
    
    // Options for the attendance chart with modern styling
    const attendanceChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: 'Student Attendance Percentage by Year and Event',
                font: {
                    family: "'Inter', sans-serif",
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    bottom: 25
                },
                color: '#334155'
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#334155',
                bodyColor: '#334155',
                bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 12
                },
                titleFont: {
                    family: "'Inter', sans-serif",
                    size: 14,
                    weight: 'bold'
                },
                padding: 12,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                displayColors: true,
                boxPadding: 3,
                usePointStyle: true,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.raw}%`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                border: {
                    display: false
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    color: '#64748b',
                    padding: 8
                },
                title: {
                    display: true,
                    text: 'Attendance Percentage (%)',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 13,
                        weight: 'bold'
                    },
                    color: '#475569',
                    padding: {
                        bottom: 10
                    }
                }
            },
            x: {
                border: {
                    display: false
                },
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    color: '#64748b',
                    padding: 8,
                    maxRotation: 45,
                    minRotation: 45
                },
                title: {
                    display: true,
                    text: 'Events',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 13,
                        weight: 'bold'
                    },
                    color: '#475569',
                    padding: {
                        top: 10
                    }
                }
            }
        },
        elements: {
            bar: {
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)'
            }
        },
        layout: {
            padding: 10
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    };
    
    // Prepare data for absence fines chart with modern colors
    const prepareAbsenceFinesChartData = () => {
        if (!absenceFinesData || absenceFinesData.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }
        
        // Sort years numerically
        const sortedData = [...absenceFinesData].sort((a, b) => a.year - b.year);
        
        return {
            labels: sortedData.map(item => `Year ${item.year}`),
            datasets: [
                {
                    label: 'Total Absence Fines',
                    data: sortedData.map(item => item.total_absence_fines),
                    backgroundColor: 'rgba(71, 120, 194, 0.8)',  // Blue
                    borderColor: 'rgba(71, 120, 194, 1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(71, 120, 194, 0.9)',
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Paid Absence Fines',
                    data: sortedData.map(item => item.paid_absence_fines),
                    backgroundColor: 'rgba(94, 190, 156, 0.8)',  // Teal
                    borderColor: 'rgba(94, 190, 156, 1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(94, 190, 156, 0.9)',
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Unpaid Absence Fines',
                    data: sortedData.map(item => item.unpaid_absence_fines),
                    backgroundColor: 'rgba(239, 85, 85, 0.8)',  // Red
                    borderColor: 'rgba(239, 85, 85, 1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(239, 85, 85, 0.9)',
                    barPercentage: 0.6,
                    categoryPercentage: 0.8
                }
            ]
        };
    };
    
    // Options for the absence fines chart with modern styling
    const absenceFinesChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: 'Absence Fines by Year',
                font: {
                    family: "'Inter', sans-serif",
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    bottom: 25
                },
                color: '#334155'
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#334155',
                bodyColor: '#334155',
                bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 12
                },
                titleFont: {
                    family: "'Inter', sans-serif",
                    size: 14,
                    weight: 'bold'
                },
                padding: 12,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                displayColors: true,
                boxPadding: 3,
                usePointStyle: true,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ₱${context.raw.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                border: {
                    display: false
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    color: '#64748b',
                    padding: 8,
                    callback: function(value) {
                        return '₱' + value.toLocaleString();
                    }
                },
                title: {
                    display: true,
                    text: 'Amount (₱)',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 13,
                        weight: 'bold'
                    },
                    color: '#475569',
                    padding: {
                        bottom: 10
                    }
                }
            },
            x: {
                border: {
                    display: false
                },
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    color: '#64748b',
                    padding: 8
                },
                title: {
                    display: true,
                    text: 'Year Level',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 13,
                        weight: 'bold'
                    },
                    color: '#475569',
                    padding: {
                        top: 10
                    }
                }
            }
        },
        elements: {
            bar: {
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)'
            }
        },
        layout: {
            padding: 10
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    };
    
    // Prepare data for attendance pie chart
    const prepareAttendancePieChartData = () => {
        if (!attendanceData || attendanceData.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }
        
        // Count total attendance by year
        const totalByYear = {};
        
        // Green color palette for pie chart
        const greenColors = [
            'rgba(34, 197, 94, 0.8)',   // Green-500
            'rgba(16, 185, 129, 0.8)',  // Emerald-500
            'rgba(20, 184, 166, 0.8)',  // Teal-500
            'rgba(5, 150, 105, 0.8)',   // Emerald-600
            'rgba(22, 163, 74, 0.8)',   // Green-600
            'rgba(21, 128, 61, 0.8)',   // Green-700
            'rgba(4, 120, 87, 0.8)',    // Emerald-700
            'rgba(15, 118, 110, 0.8)',  // Teal-700
            'rgba(6, 95, 70, 0.8)',     // Emerald-800
            'rgba(22, 101, 52, 0.8)',   // Green-800
        ];
        
        attendanceData.forEach((yearData, index) => {
            const yearLabel = `Year ${yearData.year}`;
            
            // Calculate average attendance percentage for this year
            let totalPercentage = 0;
            yearData.events.forEach(event => {
                totalPercentage += event.percentage;
            });
            
            const averagePercentage = yearData.events.length > 0 ? 
                totalPercentage / yearData.events.length : 0;
            
            totalByYear[yearLabel] = averagePercentage;
        });
        
        // Get the labels in order
        const labels = Object.keys(totalByYear);
        
        return {
            labels: labels,
            datasets: [{
                data: Object.values(totalByYear),
                backgroundColor: labels.map((_, i) => greenColors[i % greenColors.length]),
                borderColor: labels.map((_, i) => greenColors[i % greenColors.length].replace('0.8', '1')),
                borderWidth: 1,
                hoverBackgroundColor: labels.map((_, i) => greenColors[i % greenColors.length].replace('0.8', '0.9')),
                hoverBorderColor: labels.map((_, i) => greenColors[i % greenColors.length].replace('0.8', '1')),
            }]
        };
    };
    
    // Options for the attendance pie chart with modern styling
    const attendancePieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            },
            title: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#334155',
                bodyColor: '#334155',
                bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 12
                },
                titleFont: {
                    family: "'Inter', sans-serif",
                    size: 14,
                    weight: 'bold'
                },
                padding: 12,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                displayColors: true,
                boxPadding: 3,
                usePointStyle: true,
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.raw.toFixed(1)}%`;
                    }
                }
            }
        },
        animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1000,
            easing: 'easeOutQuart'
        },
        cutout: '50%',
        elements: {
            arc: {
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.5)'
            }
        }
    };
    
    // Prepare data for fines pie chart
    const prepareFinesPieChartData = () => {
        if (!finesData || finesData.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }
        
        // Count total fines by year
        const totalByYear = {};
        
        // Green color palette for pie chart (slightly different shades for variety)
        const greenColors = [
            'rgba(22, 163, 74, 0.8)',   // Green-600
            'rgba(5, 150, 105, 0.8)',   // Emerald-600
            'rgba(13, 148, 136, 0.8)',  // Teal-600
            'rgba(34, 197, 94, 0.8)',   // Green-500
            'rgba(16, 185, 129, 0.8)',  // Emerald-500
            'rgba(20, 184, 166, 0.8)',  // Teal-500
            'rgba(21, 128, 61, 0.8)',   // Green-700
            'rgba(4, 120, 87, 0.8)',    // Emerald-700
            'rgba(15, 118, 110, 0.8)',  // Teal-700
            'rgba(22, 101, 52, 0.8)',   // Green-800
        ];
        
        finesData.forEach(yearData => {
            const yearLabel = `Year ${yearData.year}`;
            totalByYear[yearLabel] = yearData.total_fines;
        });
        
        // Get the labels in order
        const labels = Object.keys(totalByYear);
        
        return {
            labels: labels,
            datasets: [{
                data: Object.values(totalByYear),
                backgroundColor: labels.map((_, i) => greenColors[i % greenColors.length]),
                borderColor: labels.map((_, i) => greenColors[i % greenColors.length].replace('0.8', '1')),
                borderWidth: 1,
                hoverBackgroundColor: labels.map((_, i) => greenColors[i % greenColors.length].replace('0.8', '0.9')),
                hoverBorderColor: labels.map((_, i) => greenColors[i % greenColors.length].replace('0.8', '1')),
            }]
        };
    };
    
    // Options for the fines pie chart with modern styling
    const finesPieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            },
            title: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#334155',
                bodyColor: '#334155',
                bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 12
                },
                titleFont: {
                    family: "'Inter', sans-serif",
                    size: 14,
                    weight: 'bold'
                },
                padding: 12,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                displayColors: true,
                boxPadding: 3,
                usePointStyle: true,
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ₱${context.raw.toLocaleString()}`;
                    }
                }
            }
        },
        animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1000,
            easing: 'easeOutQuart'
        },
        cutout: '50%',
        elements: {
            arc: {
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.5)'
            }
        }
    };
    
    // Options for the fines chart with modern styling
    const finesChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: 'Student Fines by Year',
                font: {
                    family: "'Inter', sans-serif",
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    bottom: 25
                },
                color: '#334155'
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#334155',
                bodyColor: '#334155',
                bodyFont: {
                    family: "'Inter', sans-serif",
                    size: 12
                },
                titleFont: {
                    family: "'Inter', sans-serif",
                    size: 14,
                    weight: 'bold'
                },
                padding: 12,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                displayColors: true,
                boxPadding: 3,
                usePointStyle: true,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ₱${context.raw.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                border: {
                    display: false
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    color: '#64748b',
                    padding: 8,
                    callback: function(value) {
                        return '₱' + value.toLocaleString();
                    }
                },
                title: {
                    display: true,
                    text: 'Amount (₱)',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 13,
                        weight: 'bold'
                    },
                    color: '#475569',
                    padding: {
                        bottom: 10
                    }
                }
            },
            x: {
                border: {
                    display: false
                },
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    color: '#64748b',
                    padding: 8
                },
                title: {
                    display: true,
                    text: 'Year Level',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 13,
                        weight: 'bold'
                    },
                    color: '#475569',
                    padding: {
                        top: 10
                    }
                }
            }
        },
        elements: {
            bar: {
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)'
            }
        },
        layout: {
            padding: 10
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    };

    return (
        <div className="mx-auto max-w-7xl">
            <Head title="Admin Dashboard" />
            
            {/* Welcome Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-xl shadow-xl mb-8 p-8 text-white">
                <div className="relative z-10">
                    <div className="flex items-center">
                        <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-xl">
                            <UserCog className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Welcome back, Admin!</h1>
                            <p className="text-green-100">Track your events, hours, and upcoming activities all in one place.</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -mt-20 -mr-20 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white bg-opacity-10 rounded-full -mb-10 -ml-10 blur-xl"></div>
            </div>

            {/* Stats Cards */}
            <div className="w-full z-0 mb-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Admin Stats Cards */}
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-green-800 mb-1">Total Events</p>
                                <p className="text-3xl font-bold text-green-900">{userCounts.events}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl shadow-md">
                                <Calendar className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-green-200 opacity-20"></div>
                    </div>

                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-blue-800 mb-1">Total Students</p>
                                <p className="text-3xl font-bold text-blue-900">{userCounts.students}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl shadow-md">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-blue-200 opacity-20"></div>
                    </div>
                    
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-yellow-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-yellow-800 mb-1">Total Secretaries</p>
                                <p className="text-3xl font-bold text-yellow-900">{userCounts.secretaries}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-md">
                                <UserPen className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-yellow-200 opacity-20"></div>
                    </div>

                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-purple-800 mb-1">Total Admins</p>
                                <p className="text-3xl font-bold text-purple-900">{userCounts.admins}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl shadow-md">
                                <UserCog className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-purple-200 opacity-20"></div>
                    </div>
                </div>
            </div>
            
            {/* Charts Section - with shadcn UI styling */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Interactive Attendance Pie Chart */}
                <InteractiveChart
                    chartType="pie"
                    title="Student Attendance Distribution"
                    icon={<PieChart className="w-6 h-6 text-white" />}
                    data={prepareAttendancePieChartData()}
                    options={attendancePieChartOptions}
                    loading={loading}
                    error={error}
                />
                
                {/* Interactive Fines Pie Chart */}
                <InteractiveChart
                    chartType="pie"
                    title="Student Fines Distribution"
                    icon={<DollarSign className="w-6 h-6 text-white" />}
                    data={prepareFinesPieChartData()}
                    options={finesPieChartOptions}
                    loading={loading}
                    error={error}
                />
            </div>
        </div>
    );
};

const StudentDashboard = ({ auth }) => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [showEventDetails, setShowEventDetails] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [absentCount, setAbsentCount] = useState(0);
    const [studentFines, setStudentFines] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendancePercentage, setAttendancePercentage] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const [attendanceData, setAttendanceData] = useState([]);
    const [absentFineAmount, setAbsentFineAmount] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch absent count
                const absentResponse = await axios.get('/student/api/my-absent-count');
                if (absentResponse.data.success) {
                    setAbsentCount(absentResponse.data.count);
                }
                
                // Fetch student fines
                const finesResponse = await axios.get('/student/api/my-fines');
                setStudentFines(Array.isArray(finesResponse.data.data) ? finesResponse.data.data : []);
                
                // Fetch upcoming events
                const eventsResponse = await axios.get('/student/api/upcoming-events');
                if (eventsResponse.data.success) {
                    setUpcomingEvents(eventsResponse.data.events);
                }
                
                // Fetch attendance data
                const attendanceResponse = await axios.get(route('student.attendance.view'));
                if (attendanceResponse.data.success) {
                    setAttendanceData(attendanceResponse.data.attendance || []);
                }
                
                // Fetch absent fine amount
                try {
                    const finesTypesResponse = await axios.get('/api/admin/fines');
                    
                    if (finesTypesResponse.data && finesTypesResponse.data.length > 0) {
                        // Find the fine for absences (case insensitive search)
                        const absentFine = finesTypesResponse.data.find(fine => {
                            const violation = fine.violation ? fine.violation.toLowerCase() : '';
                            const description = fine.description ? fine.description.toLowerCase() : '';
                            return violation.includes('absent') || description.includes('absent');
                        });
                        
                        if (absentFine) {
                            setAbsentFineAmount(parseFloat(absentFine.amount));
                        } else {
                            // Default amount if no specific absent fine is found
                            setAbsentFineAmount(50); // Default to 50 pesos
                        }
                    } else {
                        setAbsentFineAmount(50); // Default to 50 pesos
                    }
                } catch (error) {
                    console.error('Error fetching fine amount for absences:', error);
                    setAbsentFineAmount(50); // Default to 50 pesos
                }
                
                // Calculate attendance percentage (for progress bar)
                // We're using a fixed value for now, but this could be calculated from the API
                setAttendancePercentage(60); // 60% attendance
                setTotalEvents(10); // Example total events
                
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                // Set default values in case of error
                setAbsentCount(0);
                setStudentFines([]);
                setUpcomingEvents([
                    { id: 1, title: 'Community Service', date: 'Feb 27, 2025', time: '9:00 AM', location: 'City Park', description: 'Join us for a community cleanup event at the local park. Bring gloves and water.' },
                    { id: 2, title: 'Workshop: Leadership Skills', date: 'Mar 3, 2025', time: '2:00 PM', location: 'Room 302', description: 'Learn essential leadership skills from industry professionals.' },
                    { id: 3, title: 'Charity Run', date: 'Mar 10, 2025', time: '7:00 AM', location: 'University Track', description: 'Annual charity run to raise funds for the local children\'s hospital.' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);
    
    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setShowEventDetails(true);
    };
    
    const closeEventDetails = () => {
        setShowEventDetails(false);
    };

    return (
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-xl shadow-xl mb-8 p-8 text-white w-full">
                    <div className="relative z-10">
                        <div className="flex items-center">
                            <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-xl">
                                <UserCircle className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Welcome back, Student!</h1>
                                <p className="text-green-100">Track your events, hours, and upcoming activities all in one place.</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -mt-20 -mr-20 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white bg-opacity-10 rounded-full -mb-10 -ml-10 blur-xl"></div>
                </div>
            
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Upcoming Events Card */}
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-blue-800 mb-1">Upcoming Events</p>
                                <p className="text-3xl font-bold text-blue-900">{upcomingEvents.length}</p>
                                <p className="text-xs text-blue-700 mt-2">
                                    {upcomingEvents.length > 0 
                                        ? `Next: ${upcomingEvents[0].title} on ${upcomingEvents[0].date}` 
                                        : "No upcoming events"}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl shadow-md">
                                <Calendar className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-blue-200 opacity-20"></div>
                    </div>

                    {/* Total Absences Card */}
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-red-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-red-800 mb-1">Total Absences</p>
                                <p className="text-3xl font-bold text-red-900">{absentCount}</p>
                                <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${attendancePercentage}%` }}></div>
                                </div>
                                <p className="text-xs text-red-700 mt-1">{attendancePercentage}% of semester requirement</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl shadow-md">
                                <UserX className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-red-200 opacity-20"></div>
                    </div>

                    {/* Student Fines Card */}
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-purple-800 mb-1">Student Fines</p>
                                <p className="text-3xl font-bold text-purple-900">₱{(studentFines.reduce((acc, fine) => acc + (Number(fine.amount) || 0), 0) + (absentCount * absentFineAmount)).toFixed(2)}</p>
                                <p className="text-xs text-purple-700 mt-2">Includes {absentCount} absence(s) at ₱{absentFineAmount} each</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl shadow-md">
                                <DollarSign className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-purple-200 opacity-20"></div>
                    </div>
                </div>
            </div>
    );
};

const SecretaryDashboard = () => {
    const { userCounts, auth } = usePage().props;
    const [sectionStudentCount, setSectionStudentCount] = useState(0);
    
    // Fetch students that match the secretary's year and section
    useEffect(() => {
        const fetchSectionStudents = async () => {
            try {
                // Get the year and section from the logged-in user
                const { year, section } = auth.user;
                
                if (year && section) {
                    // Use the correct API endpoint for secretaries
                    const response = await axios.get('/secretary/api/section-students');
                    
                    if (response.data && response.data.success) {
                        setSectionStudentCount(response.data.count);
                    }
                }
            } catch (error) {
                console.error("Error fetching section students:", error);
            }
        };
        
        fetchSectionStudents();
    }, []);
    
    return (
        <div className="py-4">
            <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-xl shadow-xl mb-8 p-8 text-white w-full">
                <div className="relative z-10">
                    <div className="flex items-center">
                        <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-xl">
                            <UserCircle className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Welcome back, Secretary!</h1>
                            <p className="text-green-100">Manage student records, fines, and attendance all in one place.</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -mt-20 -mr-20 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white bg-opacity-10 rounded-full -mb-10 -ml-10 blur-xl"></div>
            </div>

            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Secretary Stats Cards */}
                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-blue-800 mb-1">Students in Your Section</p>
                                <p className="text-3xl font-bold text-blue-900">{sectionStudentCount}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl shadow-md">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-blue-200 opacity-20"></div>
                    </div>

                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-green-800 mb-1">Paid Student Violations</p>
                                <p className="text-3xl font-bold text-green-900">{userCounts.paidViolations}</p>
                                <div className="flex items-center mt-2 text-xs text-green-700">
                                    <Award className="w-3 h-3 mr-1" />
                                    <span>100% paid</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl shadow-md">
                                <DollarSign className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-green-200 opacity-20"></div>
                    </div>

                    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-red-100">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-red-800 mb-1">Unpaid Student Violations</p>
                                <p className="text-3xl font-bold text-red-900">{userCounts.unpaidViolations}</p>
                                <div className="flex items-center mt-2 text-xs text-red-700">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    <span>+2 from last week</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl shadow-md">
                                <Clock className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-red-200 opacity-20"></div>
                    </div>
                </div>

                {/* Secretary Task Section */}
                <div className="mt-8 bg-white rounded-xl shadow-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900">Tasks</h3>
                        <div className="mt-4 space-y-4">
                            {/* Task items */}
                            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0">
                                    <BookOpen className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Prepare Meeting Agenda</p>
                                    <p className="text-sm text-gray-500">Due today at 3:00 PM</p>
                                </div>
                            </div>
                            {/* Add more task items as needed */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { auth } = usePage().props;
    const role = auth.user.role;

    const Layout = role === 'admin' ? AdminLayout : role === 'secretary' ? SecretaryLayout : StudentLayout;
    const DashboardContent = role === 'admin' ? AdminDashboard : role === 'secretary' ? SecretaryDashboard : StudentDashboard;

    return (
        <Layout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />
            <DashboardContent />
        </Layout>
    );
}