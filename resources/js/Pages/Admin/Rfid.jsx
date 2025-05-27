import React, { useState, useEffect } from "react";
import {
    Clock,
    Calendar,
    User,
    Users,
    Briefcase,
    Barcode,
    CheckCircle,
    XCircle,
    LogIn,
    LogOut,
    CheckSquare,
    Fingerprint,
    Smartphone,
    Lock,
    School,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { Head } from "@inertiajs/react";

const AttendanceSystem = () => {
    const [selectedEvent, setSelectedEvent] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [rfidInput, setRfidInput] = useState("");
    const [currentStudent, setCurrentStudent] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [events, setEvents] = useState([]);
    const [scanAnimation, setScanAnimation] = useState(false);
    const [scanStatus, setScanStatus] = useState("IN"); // Default status is IN
    const [todayEvent, setTodayEvent] = useState(null); // Store today's event
    const [imageError, setImageError] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const [debugInfo, setDebugInfo] = useState(null);
    const [forceRecord, setForceRecord] = useState(false);
    const [noEventsMessage, setNoEventsMessage] = useState("");
    const [scanStatusAutoUpdated, setScanStatusAutoUpdated] = useState(false); // Track if scan status was auto-updated
    const [settings, setSettings] = useState({
        image: "",
        schoolname: "",
        department: "",
    });
    const [markingAbsent, setMarkingAbsent] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (todayEvent) {
            updateScanStatusBasedOnTime(todayEvent);
        }
    }, [currentTime, todayEvent]);

    useEffect(() => {
        // Fetch today's events when component mounts
        fetchTodayEvents();
        // Fetch school settings
        fetchSettings();
        setMounted(true);
        
        // Add particle animation to background
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
        script.async = true;
        document.body.appendChild(script);
        
        let particlesInitialized = false;
        
        script.onload = () => {
            if (window.particlesJS) {
                window.particlesJS('particles-js', {
                    particles: {
                        number: { value: 30, density: { enable: true, value_area: 800 } },
                        color: { value: '#15803d' },
                        shape: { type: 'circle' },
                        opacity: { value: 0.3, random: true },
                        size: { value: 3, random: true },
                        line_linked: { enable: true, distance: 150, color: '#15803d', opacity: 0.2, width: 1 },
                        move: { enable: true, speed: 1, direction: 'none', random: true, straight: false, out_mode: 'out' }
                    },
                    interactivity: {
                        detect_on: 'canvas',
                        events: {
                            onhover: { enable: true, mode: 'grab' },
                            onclick: { enable: true, mode: 'push' },
                            resize: true
                        },
                        modes: {
                            grab: { distance: 140, line_linked: { opacity: 0.5 } },
                            push: { particles_nb: 3 }
                        }
                    },
                    retina_detect: true
                });
                particlesInitialized = true;
            }
        };
        
        return () => {
            setMounted(false);
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            
            // Destroy particles instance if it was initialized
            if (particlesInitialized && window.pJSDom && window.pJSDom.length > 0) {
                try {
                    window.pJSDom[0].pJS.fn.vendors.destroypJS();
                    window.pJSDom = [];
                } catch (e) {
                    console.error('Error cleaning up particles:', e);
                }
            }
        };
    }, []);

    useEffect(() => {
        // Check if we need to update the attendance records when events or time changes
        const intervalId = setInterval(() => {
            // Auto-switch scan type based on time windows
            if (selectedEvent && events.length > 0) {
                const event = events.find((e) => e.id == selectedEvent);
                if (event) {
                    // Check if the event is for today
                    const today = new Date().toISOString().split("T")[0];
                    const isEventToday = event.date === today;

                    // Only apply auto-switching logic if the event is for today
                    if (isEventToday) {
                        const currentHour = currentTime.getHours();
                        const currentMinute = currentTime.getMinutes();
                        const currentTimeString = `${currentHour
                            .toString()
                            .padStart(2, "0")}:${currentMinute
                            .toString()
                            .padStart(2, "0")}:00`;

                        // Check if we're in AM period
                        if (currentHour >= 0 && currentHour < 12) {
                            if (event.timeInAM && event.timeInAMDuration) {
                                const startTime = event.timeInAM;
                                // Parse duration and add to start time to get end time
                                const [durationHours, durationMinutes] =
                                    event.timeInAMDuration
                                        .split(":")
                                        .map(Number);
                                const [startHours, startMinutes] = startTime
                                    .split(":")
                                    .map(Number);

                                // Calculate end time
                                let endHours = startHours + durationHours;
                                let endMinutes = startMinutes + durationMinutes;

                                if (endMinutes >= 60) {
                                    endHours += Math.floor(endMinutes / 60);
                                    endMinutes = endMinutes % 60;
                                }

                                const endTimeString = `${endHours
                                    .toString()
                                    .padStart(2, "0")}:${endMinutes
                                    .toString()
                                    .padStart(2, "0")}:00`;

                                // If current time is past the end time of AM Time In window, switch to OUT
                                if (
                                    currentTimeString >= endTimeString &&
                                    scanStatus === "IN"
                                ) {
                                    console.log(
                                        "Auto-switching to OUT mode as AM Time In window has ended"
                                    );
                                    setScanStatus("OUT");
                                    showScanTypeNotification(
                                        "OUT",
                                        "AM Time In period has ended"
                                    );
                                }

                                // If current time is within the AM Time In window, switch to IN
                                if (
                                    currentTimeString >= startTime &&
                                    currentTimeString < endTimeString &&
                                    scanStatus === "OUT"
                                ) {
                                    console.log(
                                        "Auto-switching to IN mode as we're in AM Time In window"
                                    );
                                    setScanStatus("IN");
                                    showScanTypeNotification(
                                        "IN",
                                        "AM Time In period has started"
                                    );
                                }
                            }
                        }
                        // Check if we're in PM period
                        else if (currentHour >= 12 && currentHour < 18) {
                            if (event.timeInPM && event.timeInPMDuration) {
                                const startTime = event.timeInPM;
                                // Parse duration and add to start time to get end time
                                const [durationHours, durationMinutes] =
                                    event.timeInPMDuration
                                        .split(":")
                                        .map(Number);
                                const [startHours, startMinutes] = startTime
                                    .split(":")
                                    .map(Number);

                                // Calculate end time
                                let endHours = startHours + durationHours;
                                let endMinutes = startMinutes + durationMinutes;

                                if (endMinutes >= 60) {
                                    endHours += Math.floor(endMinutes / 60);
                                    endMinutes = endMinutes % 60;
                                }

                                const endTimeString = `${endHours
                                    .toString()
                                    .padStart(2, "0")}:${endMinutes
                                    .toString()
                                    .padStart(2, "0")}:00`;

                                // If current time is past the end time of PM Time In window, switch to OUT
                                if (
                                    currentTimeString >= endTimeString &&
                                    scanStatus === "IN"
                                ) {
                                    console.log(
                                        "Auto-switching to OUT mode as PM Time In window has ended"
                                    );
                                    setScanStatus("OUT");
                                    showScanTypeNotification(
                                        "OUT",
                                        "PM Time In period has ended"
                                    );
                                }

                                // If current time is within the PM Time In window, switch to IN
                                if (
                                    currentTimeString >= startTime &&
                                    currentTimeString < endTimeString &&
                                    scanStatus === "OUT"
                                ) {
                                    console.log(
                                        "Auto-switching to IN mode as we're in PM Time In window"
                                    );
                                    setScanStatus("IN");
                                    showScanTypeNotification(
                                        "IN",
                                        "PM Time In period has started"
                                    );
                                }
                            }
                        }
                        // Check if we're in Night period
                        else if (currentHour >= 18) {
                            if (
                                event.timeInNight &&
                                event.timeInNightDuration
                            ) {
                                const startTime = event.timeInNight;
                                // Parse duration and add to start time to get end time
                                const [durationHours, durationMinutes] =
                                    event.timeInNightDuration
                                        .split(":")
                                        .map(Number);
                                const [startHours, startMinutes] = startTime
                                    .split(":")
                                    .map(Number);

                                // Calculate end time
                                let endHours = startHours + durationHours;
                                let endMinutes = startMinutes + durationMinutes;

                                if (endMinutes >= 60) {
                                    endHours += Math.floor(endMinutes / 60);
                                    endMinutes = endMinutes % 60;
                                }

                                const endTimeString = `${endHours
                                    .toString()
                                    .padStart(2, "0")}:${endMinutes
                                    .toString()
                                    .padStart(2, "0")}:00`;

                                // If current time is past the end time of Night Time In window, switch to OUT
                                if (
                                    currentTimeString >= endTimeString &&
                                    scanStatus === "IN"
                                ) {
                                    console.log(
                                        "Auto-switching to OUT mode as Night Time In window has ended"
                                    );
                                    setScanStatus("OUT");
                                    showScanTypeNotification(
                                        "OUT",
                                        "Night Time In period has ended"
                                    );
                                }

                                // If current time is within the Night Time In window, switch to IN
                                if (
                                    currentTimeString >= startTime &&
                                    currentTimeString < endTimeString &&
                                    scanStatus === "OUT"
                                ) {
                                    console.log(
                                        "Auto-switching to IN mode as we're in Night Time In window"
                                    );
                                    setScanStatus("IN");
                                    showScanTypeNotification(
                                        "IN",
                                        "Night Time In period has started"
                                    );
                                }
                            }
                        }
                    } else {
                        // If event is not today, show a message in debug info
                        if (debugMode) {
                            setDebugInfo((prevInfo) => ({
                                ...prevInfo,
                                message:
                                    "Auto time window switching disabled - event is not for today",
                            }));
                        }
                    }
                }
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(intervalId);
    }, [currentTime, selectedEvent, events, scanStatus]);

    useEffect(() => {
        // Reset image error state when student changes
        setImageError(false);
    }, [currentStudent]);

    // Function to automatically update scan status based on current time
    const updateScanStatusBasedOnTime = (event) => {
        if (!event) return;
        
        // Get current time as a string in HH:MM:SS format
        const currentTimeStr = currentTime.toLocaleTimeString('en-PH', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false
        });
        
        let newScanStatus = scanStatus;
        let reason = "";
        
        // Check for morning time periods
        if (event.timeInAM && currentTimeStr >= event.timeInAM && currentTimeStr < event.timeOutAM) {
            newScanStatus = "IN";
            reason = "Morning check-in time period";
        } else if (event.timeOutAM && currentTimeStr >= event.timeOutAM) {
            newScanStatus = "OUT";
            reason = "Morning check-out time period";
        }
        
        // Check for afternoon time periods
        if (event.timeInPM && currentTimeStr >= event.timeInPM && currentTimeStr < event.timeOutPM) {
            newScanStatus = "IN";
            reason = "Afternoon check-in time period";
        } else if (event.timeOutPM && currentTimeStr >= event.timeOutPM) {
            newScanStatus = "OUT";
            reason = "Afternoon check-out time period";
        }
        
        // Check for night time periods
        if (event.timeInNight && currentTimeStr >= event.timeInNight && currentTimeStr < event.timeOutNight) {
            newScanStatus = "IN";
            reason = "Evening check-in time period";
        } else if (event.timeOutNight && currentTimeStr >= event.timeOutNight) {
            newScanStatus = "OUT";
            reason = "Evening check-out time period";
        }
        
        // Update scan status if it has changed
        if (newScanStatus !== scanStatus) {
            setScanStatus(newScanStatus);
            setScanStatusAutoUpdated(true);
            showScanTypeNotification(newScanStatus, `Automatically changed to ${newScanStatus}: ${reason}`);
        }
    };

    // Fetch today's events from the backend
    const fetchTodayEvents = async (date = null) => {
        try {
            // Build the URL with optional date parameter
            let url = "/api/attendance/today-events";
            if (date) {
                url += `?date=${date}`;
            }

            const response = await axios.get(url);
            console.log("Events API response:", response.data); // Debug log

            if (response.data.success) {
                // Set events from the response
                setEvents(response.data.events);

                // Get today's date in YYYY-MM-DD format for comparison
                const today = new Date().toISOString().split("T")[0];
                console.log("Today is:", today);
                console.log("Events received:", response.data.events);

                // If we have any events, select the first one by default
                if (response.data.events.length > 0) {
                    // Select the first event
                    const firstEvent = response.data.events[0];
                    setSelectedEvent(firstEvent.id);
                    setTodayEvent(firstEvent);

                    // Automatically update scan status based on current time
                    updateScanStatusBasedOnTime(firstEvent);

                    // Check if these are today's events
                    if (response.data.is_today) {
                        setNoEventsMessage("");
                    } else if (date) {
                        // If we're showing events for a specific requested date
                        setNoEventsMessage(`Showing events for ${date}`);
                    }
                } else {
                    // No events found
                    setNoEventsMessage(
                        response.data.message || "No Events Found"
                    );
                    setTodayEvent(null);
                    setSelectedEvent("");

                    if (!date) {
                        // Only show alert for today's events
                        Swal.fire({
                            icon: "info",
                            title: "No Events Found",
                            text: "There are no events scheduled for today.",
                            timer: 3000,
                            showConfirmButton: false,
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to fetch events",
            });
        }
    };

    // Function to fetch school settings
    const fetchSettings = async () => {
        try {
            const response = await axios.get("api/admin/settings");
            setSettings(response.data);
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    const isValidRfid = (rfid) => /^[A-Fa-f0-9]{10}$/.test(rfid);

    const recordAttendance = async (rfid) => {
        if (!selectedEvent) {
            Swal.fire({
                icon: "warning",
                title: "No Event Selected",
                text: "Please select an event to record attendance.",
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }

        // Check if the selected event is for today
        const event = events.find((e) => e.id == selectedEvent);
        if (event) {
            // Format today's date in YYYY-MM-DD format, ensuring we use local timezone
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            console.log("Today's date (local):", today);
            console.log("Event date:", event.date);
            const isEventToday = event.date === today;

            // If the event is not for today and force record is not enabled, show a warning
            if (!isEventToday && !forceRecord) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Not Today's Event",
                    html: `You are recording attendance for an event dated <strong>${event.date}</strong>, which is not today.<br><br>Do you want to continue?`,
                    showCancelButton: true,
                    confirmButtonText: "Yes, record anyway",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                });

                if (result.isDismissed) {
                    return;
                }
            }
        }

        try {
            // Determine the current time period based on the hour
            const now = new Date();
            const currentHour = now.getHours();
            let timePeriod = "";

            if (currentHour >= 0 && currentHour < 12) {
                timePeriod = "AM";
            } else if (currentHour >= 12 && currentHour < 18) {
                timePeriod = "PM";
            } else {
                timePeriod = "Night";
            }

            console.log(
                "Current time period:",
                timePeriod,
                "Hour:",
                currentHour
            );

            const requestData = {
                rfid: rfid,
                event_id: selectedEvent,
                scan_type: scanStatus,
                client_time: now.toISOString(),
                client_hour: currentHour,
                client_period: timePeriod, // Send the determined period
                force_record: forceRecord,
            };

            console.log("Sending attendance data:", requestData);

            const response = await axios.post(
                "/api/attendance/record",
                requestData
            );

            console.log("Attendance response:", response.data);

            // Store debug info if available
            if (response.data.debug_info) {
                setDebugInfo(response.data.debug_info);
            }

            if (response.data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Success",
                    text: response.data.message,
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: response.data.message,
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            console.error("Error recording attendance:", error);
            console.error("Error details:", error.response?.data);

            // Show more detailed error message
            let errorMessage = "Failed to record attendance";
            let errorTitle = "Error";
            let errorIcon = "error";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;

                // Check if it's a configuration error (time fields not set)
                if (errorMessage.includes("not configured for this event")) {
                    errorTitle = "Configuration Error";
                    errorIcon = "warning";

                    // Add a more helpful message for administrators
                    errorMessage +=
                        ". Please configure the time fields for this event in the Event Management section.";
                }
            }

            // Store debug info if available
            if (error.response?.data?.debug_info) {
                setDebugInfo(error.response.data.debug_info);
            }

            Swal.fire({
                icon: errorIcon,
                title: errorTitle,
                text: errorMessage,
                showConfirmButton: true,
            });
        }
    };

    const handleRfidInput = async (e) => {
        const value = e.target.value;
        setRfidInput(value);

        // If the input is a valid RFID (10 hex characters), process it
        if (isValidRfid(value)) {
            try {
                // Fetch student information by RFID
                const response = await axios.get(
                    `/api/attendance/student/${value}`
                );

                if (response.data.success) {
                    setCurrentStudent(response.data.student);
                    setScanAnimation(true);

                    // Record attendance
                    await recordAttendance(value);

                    // Reset animation after 2 seconds
                    setTimeout(() => {
                        setScanAnimation(false);
                        setRfidInput(""); // Clear input field
                        setCurrentStudent(null); // Clear current student
                    }, 2000);
                } else {
                    // Student not found
                    setCurrentStudent(null);
                    setScanAnimation(false);
                    setRfidInput(""); // Clear input field

                    Swal.fire({
                        icon: "info",
                        title: "Student Not Found",
                        text: "No student found with this RFID card.",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                }
            } catch (error) {
                console.error("Error processing RFID:", error);
                setCurrentStudent(null);
                setScanAnimation(false);
                setRfidInput(""); // Clear input field

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text:
                        error.response?.data?.message ||
                        "Failed to process RFID",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        }
    };

    // Toggle between IN and OUT status
    const toggleScanStatus = () => {
        setScanStatus((prevStatus) => (prevStatus === "IN" ? "OUT" : "IN"));
        setScanStatusAutoUpdated(false); // Reset the auto-updated flag when manually toggled
    };

    // Function to show notification when scan type changes automatically
    const showScanTypeNotification = (newType, reason) => {
        Swal.fire({
            icon: "info",
            title: `Scan Type Changed to ${newType}`,
            text: reason,
            timer: 3000,
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            customClass: {
                popup: 'swal-toast',
                title: 'swal-toast-title',
                content: 'swal-toast-content'
            }
        });
    };

    // Toggle debug mode
    const toggleDebugMode = () => {
        setDebugMode(!debugMode);
    };

    // Toggle force record option
    const toggleForceRecord = () => {
        setForceRecord(!forceRecord);
    };
    
    // Check if the configured time durations have expired for the selected event
    const isTimeToMarkAbsent = () => {
        if (!selectedEvent || events.length === 0) {
            return false;
        }
        
        const event = events.find((e) => e.id == selectedEvent);
        if (!event) {
            return false;
        }
        
        // Check if the event is for today
        const localToday = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
        const isEventToday = event.date === localToday;
        
        if (!isEventToday) {
            return false;
        }
        
        // Get current time as a string in HH:MM:SS format
        const currentTimeStr = currentTime.toLocaleTimeString('en-PH', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false
        });
        
        console.log('Current time:', currentTimeStr);
        
        // Direct comparison with duration fields
        // If any duration field is configured, check if current time has passed it
        
        // Check if timeOutAMDuration is configured and not expired
        if (event.timeOutAMDuration) {
            console.log('AM Out Duration:', event.timeOutAMDuration);
            if (currentTimeStr < event.timeOutAMDuration) {
                console.log('AM Out Duration not expired yet');
                return false;
            }
        }
        
        // Check if timeOutPMDuration is configured and not expired
        if (event.timeOutPMDuration) {
            console.log('PM Out Duration:', event.timeOutPMDuration);
            if (currentTimeStr < event.timeOutPMDuration) {
                console.log('PM Out Duration not expired yet');
                return false;
            }
        }
        
        // Check if timeOutNightDuration is configured and not expired
        if (event.timeOutNightDuration) {
            console.log('Night Out Duration:', event.timeOutNightDuration);
            if (currentTimeStr < event.timeOutNightDuration) {
                console.log('Night Out Duration not expired yet');
                return false;
            }
        }
        
        // All configured durations have expired, so enable the button
        console.log('All configured durations have expired');
        return true;
    };
    
    // Handle marking absent students
    const handleMarkAbsent = async () => {
        if (!selectedEvent) {
            Swal.fire({
                icon: "warning",
                title: "No Event Selected",
                text: "Please select an event to mark absent students.",
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }
        
        // Check if all configured time periods have expired
        if (!isTimeToMarkAbsent()) {
            Swal.fire({
                icon: "warning",
                title: "Time Period Not Expired",
                text: "You cannot mark students as absent until all configured time periods have expired.",
                timer: 3000,
                showConfirmButton: false,
            });
            return;
        }
        
        // Confirm before proceeding
        const result = await Swal.fire({
            icon: "warning",
            title: "Mark Absent Students",
            text: "This will mark all students who haven't tapped their card as absent for this event. Continue?",
            showCancelButton: true,
            confirmButtonText: "Yes, mark them absent",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
        });
        
        if (result.isConfirmed) {
            try {
                setMarkingAbsent(true);
                
                const response = await axios.post("/api/attendance/mark-absent", {
                    event_id: selectedEvent,
                });
                
                if (response.data.success) {
                    Swal.fire({
                        icon: "success",
                        title: "Success",
                        text: response.data.message,
                        timer: 3000,
                        showConfirmButton: false,
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: response.data.message || "Failed to mark absent students",
                        showConfirmButton: true,
                    });
                }
            } catch (error) {
                console.error("Error marking absent students:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.response?.data?.message || "Failed to mark absent students",
                    showConfirmButton: true,
                });
            } finally {
                setMarkingAbsent(false);
            }
        }
    };

    // Handle image load error
    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-green-800">
            <Head title="RFID Attendance" />
            
            {/* Particles Background */}
            <div id="particles-js" className="absolute inset-0 z-0"></div>
            
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 overflow-hidden opacity-10 z-0">
                <div className="absolute w-full h-full">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"></path>
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#grid-pattern)"></rect>
                    </svg>
                </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {/* Animated Circles */}
                <motion.div 
                    className="absolute h-64 w-64 rounded-full bg-gradient-to-r from-green-400/10 to-emerald-500/10 blur-xl"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ top: '10%', left: '15%' }}
                />
                <motion.div 
                    className="absolute h-96 w-96 rounded-full bg-gradient-to-r from-teal-400/10 to-green-500/10 blur-xl"
                    animate={{
                        x: [0, -40, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ bottom: '5%', right: '10%' }}
                />
                <motion.div 
                    className="absolute h-72 w-72 rounded-full bg-gradient-to-r from-emerald-300/10 to-teal-400/10 blur-xl hidden md:block"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ top: '30%', right: '25%' }}
                />
            </div>
            
            {/* Decorative Icons Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {/* Top Row Icons */}
                <motion.div 
                    className="absolute -top-4 -left-4 transform"
                    initial={{ rotate: 12, opacity: 0 }}
                    animate={{ rotate: 12, opacity: 0.1 }}
                    whileHover={{ rotate: 45, scale: 1.1 }}
                    transition={{ duration: 0.7 }}
                >
                    <Fingerprint className="h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 text-green-100" />
                </motion.div>
                <motion.div 
                    className="absolute top-0 left-1/4 transform hidden sm:block"
                    initial={{ rotate: -12, opacity: 0 }}
                    animate={{ rotate: -12, opacity: 0.1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    <Users className="h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24 text-green-100" />
                </motion.div>
                <motion.div 
                    className="absolute top-0 left-2/4 transform hidden md:block"
                    initial={{ rotate: 45, opacity: 0 }}
                    animate={{ rotate: 45, opacity: 0.1 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                >
                    <Calendar className="h-16 w-16 md:h-20 md:w-20 text-green-100" />
                </motion.div>
                <motion.div 
                    className="absolute -top-4 -right-4 transform"
                    initial={{ rotate: -12, opacity: 0 }}
                    animate={{ rotate: -12, opacity: 0.1 }}
                    whileHover={{ rotate: -45, scale: 1.1 }}
                    transition={{ duration: 0.7 }}
                >
                    <School className="h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 text-green-100" />
                </motion.div>

                {/* Bottom Row Icons */}
                <motion.div 
                    className="absolute bottom-1/4 -left-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                >
                    <Smartphone className="h-16 w-16 sm:h-20 sm:w-20 md:h-28 md:w-28 text-green-100" />
                </motion.div>
                <motion.div 
                    className="absolute -bottom-4 -right-4 transform"
                    initial={{ rotate: 45, opacity: 0 }}
                    animate={{ rotate: 45, opacity: 0.1 }}
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    transition={{ duration: 0.7 }}
                >
                    <Lock className="h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 text-green-100" />
                </motion.div>
            </div>
            
            <main className="flex-grow p-6 overflow-auto relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/3 w-full flex flex-col items-center bg-white p-6 rounded-xl shadow-lg border border-green-100 gap-6 transition-all duration-300">
                            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-5 py-3 rounded-lg text-center w-full font-bold tracking-wider shadow-md flex items-center justify-between">
                                <span>ATTENDANCE SCANNER</span>
                                <div
                                    className={`flex items-center px-3 py-1 rounded-lg cursor-pointer ${
                                        scanStatus === "IN"
                                            ? "bg-green-500"
                                            : "bg-orange-500"
                                    }`}
                                    onClick={toggleScanStatus}
                                >
                                    {scanStatus === "IN" ? (
                                        <LogIn className="mr-1" size={16} />
                                    ) : (
                                        <LogOut className="mr-1" size={16} />
                                    )}
                                    <span>{scanStatus}</span>
                                </div>
                            </div>

                            <div
                                className={`relative w-full overflow-hidden rounded-xl shadow-md transition-all duration-300 ${
                                    scanAnimation
                                        ? "ring-4 ring-green-500 ring-opacity-50"
                                        : ""
                                }`}
                            >
                                {currentStudent && !imageError ? (
                                    <img
                                        src={`/storage/${currentStudent.image}`}
                                        alt="Profile Picture"
                                        className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105"
                                        onError={handleImageError}
                                    />
                                ) : currentStudent && imageError ? (
                                    <div className="w-full h-80 flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 rounded-xl">
                                        <User className="w-32 h-32 text-green-500 mb-2" />
                                        <p className="text-green-700 font-semibold text-xl">
                                            {currentStudent.name}
                                        </p>
                                        <p className="text-green-600 text-sm">
                                            Student ID:{" "}
                                            {currentStudent.studentNo}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="w-full h-80 flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl">
                                        <Barcode className="w-20 h-20 text-gray-400 mb-4" />
                                        <p className="text-gray-500 text-center px-6">
                                            Scan an RFID card to display student
                                            information
                                        </p>
                                    </div>
                                )}
                                {scanAnimation && (
                                    <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                                        <div className="bg-white bg-opacity-90 p-4 rounded-full">
                                            <CheckCircle className="w-12 h-12 text-green-600 animate-pulse" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-2 rounded-lg text-center w-full shadow-md transform transition-all duration-300 hover:shadow-lg">
                                <p className="font-bold text-xl mb-1">
                                    {currentStudent?.name ||
                                        "No student selected"}
                                </p>
                                <p className="text-green-200 flex items-center justify-center">
                                    <User className="mr-2" size={16} />
                                    {currentStudent?.studentNo || "N/A"}
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-3 rounded-lg text-center w-full shadow-md">
                                <div className="flex items-center justify-center">
                                    <span className="font-medium">
                                        Year {currentStudent?.year || "N/A"}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span className="font-medium">
                                        Section{" "}
                                        {currentStudent?.section || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-2/3 w-full flex flex-col">
                            <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-xl shadow-xl mb-8 p-8 text-white">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-8">
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-green-700 rounded-full opacity-50 group-hover:opacity-100 transition duration-500 group-hover:blur"></div>
                                            <img
                                                src={
                                                    settings.image
                                                        ? `/storage/${settings.image}`
                                                        : "https://via.placeholder.com/150"
                                                }
                                                alt="School Logo"
                                                className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-2 border-green-600 shadow-xl bg-white transform transition duration-500 group-hover:scale-105 object-center object-fit"
                                            />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h1 className="text-4xl font-bold mb-2 tracking-tight">
                                                {settings.schoolname ||
                                                    "School Name"}
                                            </h1>
                                            <p className="text-xl text-green-100 font-medium">
                                                {settings.department ||
                                                    "Department"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-72 h-72 bg-white bg-opacity-10 rounded-full -mt-24 -mr-24 blur-3xl animate-pulse"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-10 rounded-full -mb-12 -ml-12 blur-3xl animate-pulse delay-1000"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                <div className="bg-white border border-green-100 p-5 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-bold text-green-800">
                                            RFID NUMBER
                                        </p>
                                        <Barcode
                                            className="text-green-600"
                                            size={20}
                                        />
                                    </div>
                                    <p className="text-4xl font-mono text-green-700 tracking-wider">
                                        {currentStudent?.rfid || "------------"}
                                    </p>
                                </div>

                                <div className="bg-white border border-green-100 p-5 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-bold text-green-800 flex items-center">
                                            <Calendar
                                                className="mr-2"
                                                size={18}
                                            />
                                            {currentTime
                                                .toLocaleString("en-US", {
                                                    weekday: "long",
                                                })
                                                .toUpperCase()}
                                        </p>
                                    </div>
                                    <p className="text-3xl mb-1 text-green-700 flex items-center">
                                        <Clock
                                            className="mr-2 text-green-600"
                                            size={24}
                                        />
                                        {currentTime.toLocaleTimeString(
                                            "en-PH",
                                            {
                                                hour: "numeric",
                                                minute: "numeric",
                                                second: "numeric",
                                                hour12: false,
                                            }
                                        )}
                                    </p>
                                    <p className="text-gray-600">
                                        {currentTime.toLocaleDateString(
                                            "en-PH",
                                            {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            }
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="relative mb-3">
                                <div className="bg-white border border-green-100 py-2 px-4 rounded-xl shadow-md flex items-center justify-between transition-all duration-300 hover:shadow-lg">
                                    <span className="font-bold text-green-800 flex items-center">
                                        <Briefcase
                                            className="mr-2 text-green-600"
                                            size={18}
                                        />
                                        CURRENT EVENT:
                                    </span>
                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                                        {todayEvent
                                            ? todayEvent.eventname
                                            : "No Event Today"}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="bg-white border border-green-100 p-5 rounded-xl shadow-md">
                                    <input
                                        id="rfidInput"
                                        type="text"
                                        value={rfidInput}
                                        onChange={handleRfidInput}
                                        placeholder="RFID Card ID (e.g., 04A5B9C2)"
                                        className="w-full p-3 border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                                        autoFocus
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Place the RFID card on the reader or
                                        enter the ID manually
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <button
                                    onClick={handleMarkAbsent}
                                    disabled={!selectedEvent || markingAbsent || !isTimeToMarkAbsent()}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium shadow-md transition-all duration-300 ${!selectedEvent || markingAbsent || !isTimeToMarkAbsent() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                >
                                    {markingAbsent ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare size={20} />
                                            Done - Mark Absent Students
                                        </>
                                    )}
                                </button>
                                <p className="mt-2 text-xs text-gray-500 text-center">
                                    Click when finished to mark all students without attendance as absent. Button is disabled until all configured time periods have expired.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AttendanceSystem;
