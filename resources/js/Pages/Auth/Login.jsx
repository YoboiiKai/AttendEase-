import React, { useState, useEffect } from "react";
import { Head, useForm } from "@inertiajs/react";
import axios from "axios";
import { 
    Eye, 
    EyeOff, 
    Mail, 
    Lock, 
    Fingerprint, 
    Smartphone, 
    Shield, 
    BarChart,
    Key,
    UserCheck,
    Users,
    Calendar,
    Clock,
    CheckCircle,
    Settings,
    Database,
    LogIn,
    School,
    AlertCircle,
} from "lucide-react";
import PageLoader from '@/Components/PageLoader';
import { motion } from 'framer-motion';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [settings, setSettings] = useState({ schoolname: '', department: '' });
    const [formFocus, setFormFocus] = useState({
        email: false,
        password: false
    });
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [showTip, setShowTip] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    useEffect(() => {
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
        return () => {
            reset("password");
        };
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('api/admin/settings');
                setSettings(response.data);
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };

        fetchSettings();
    }, []);

    const submit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginAttempts(prev => prev + 1);
        
        post(route("login"), {
            onFinish: () => {
                reset("password");
                setIsLoading(false);
                
                // Show password tip after multiple failed attempts
                if (errors.email || errors.password) {
                    if (loginAttempts >= 2) {
                        setShowTip(true);
                    }
                }
            },
        });
    };

    // Helper function for field focus animations
    const handleFocus = (field) => {
        setFormFocus(prev => ({ ...prev, [field]: true }));
    };

    const handleBlur = (field) => {
        setFormFocus(prev => ({ ...prev, [field]: false }));
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-green-800 px-4 sm:px-6 lg:px-8">
            {processing && <PageLoader />}
            <Head title="Login" />
            
            {/* Particles Background */}
            <div id="particles-js" className="absolute inset-0 z-0"></div>
            
            {/* Animated Background Pattern - Added from Welcome page */}
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
            
            {/* Floating Elements - Added from Welcome page */}
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
            
            {/* Decorative Icons Background - Enhanced with animations */}
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
            
            {/* Login Form Container */}
            <motion.div 
                className="w-full max-w-lg relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                    duration: 0.8,
                    delay: 0.3,
                    type: "spring",
                    damping: 20
                }}
            >
                <div className="bg-white/10 backdrop-blur-xl shadow-2xl rounded-xl px-6 sm:px-8 pt-6 pb-8 mb-4 border border-green-500/20 overflow-hidden">
                    {/* Animated Gradient Border */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <div className="absolute -inset-[2px] bg-gradient-to-r from-green-500 via-emerald-400 to-green-600 rounded-xl opacity-30 blur-sm animate-gradient-x"></div>
                    </div>
                    
                    {/* Single column layout */}
                    <div className="flex flex-col items-center relative z-10">
                        {/* Logo with hover effect */}
                        <motion.div 
                            className="flex justify-center mb-6 relative z-10"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-full opacity-50 group-hover:opacity-100 transition duration-500 group-hover:blur"></div>
                                <img 
                                    src={settings.image ? `/storage/${settings.image}` : "/images/default-logo.svg"} 
                                    alt="School Logo" 
                                    className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover border-2 border-green-600 shadow-lg bg-white transform transition duration-500 group-hover:scale-105 object-center object-fit"
                                />
                            </div>
                        </motion.div>

                        {/* Title with animation */}
                        <motion.div 
                            className="text-center mb-6 relative z-10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            <h1 className="text-2xl sm:text-3xl font-extrabold">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-teal-200">
                                    {settings.schoolname || 'AttendEase System'}
                                </span>
                            </h1>
                            <p className="mt-2 text-sm sm:text-base text-green-300">
                                {settings.department || 'Welcome Back'}
                            </p>
                        </motion.div>

                        {/* Status Message with animation */}
                        {status && (
                            <motion.div 
                                className="mb-6 p-3 bg-green-900/40 border border-green-800/40 rounded-lg relative overflow-hidden w-full max-w-md"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent animate-pulse"></div>
                                <p className="text-sm font-medium text-green-300 text-center relative z-10 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {status}
                                </p>
                            </motion.div>
                        )}
                        
                        {/* Form or Sign In Button */}
                        <div className="w-full max-w-md">
                            {!showLoginForm ? (
                                <motion.div
                                    className="flex flex-col items-center justify-center mt-8"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7, duration: 0.5 }}
                                >
                                    <p className="text-green-200 text-center mb-6 max-w-md">
                                        Welcome to the AttendEase System. Please sign in to access your attendance records and manage your account.
                                    </p>
                                    <motion.button
                                        onClick={() => setShowLoginForm(true)}
                                        className="relative overflow-hidden group bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-xl flex items-center justify-center"
                                        whileHover={{ 
                                            scale: 1.05,
                                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="relative z-10 flex items-center">
                                            Sign In
                                            <LogIn className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                        <span className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Form Title with back button */}
                                    <motion.div
                                        className="mb-6 flex items-center justify-between"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 }}
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold text-green-100">Sign In to Your Account</h2>
                                            <p className="text-sm text-green-300/80 mt-1">Enter your credentials to access the system</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowLoginForm(false)}
                                            className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-green-800/30 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </motion.div>
                                    {/* Login Form */}
                                    <motion.form 
                                        onSubmit={submit} 
                                        className="space-y-5 relative z-10"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8, duration: 0.5 }}
                                    >
                                        {/* Email Field */}
                                        <motion.div 
                                            className={`group transition-all duration-300 ${formFocus.email ? 'scale-[1.02]' : ''}`}
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <label
                                                htmlFor="email"
                                                className="block text-sm font-medium text-white mb-1.5 flex items-center"
                                            >
                                                <Mail className="h-4 w-4 mr-1.5 text-green-400" />
                                                Email Address
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    className={`block w-full px-4 py-3 text-sm text-white placeholder-green-400/60 bg-white/10 border ${errors.email ? 'border-red-500' : formFocus.email ? 'border-green-400' : 'border-green-500/30'} focus:border-green-400 focus:ring focus:ring-green-400/20 rounded-lg transition-all duration-200`}
                                                    placeholder="name@example.com"
                                                    value={data.email}
                                                    onChange={(e) => setData("email", e.target.value)}
                                                    onFocus={() => handleFocus('email')}
                                                    onBlur={() => handleBlur('email')}
                                                />
                                                {errors.email && (
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                                    </div>
                                                )}
                                            </div>
                                            {errors.email && (
                                                <motion.p 
                                                    className="mt-1 text-sm text-red-400 flex items-center"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    {errors.email}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        {/* Password Field */}
                                        <motion.div 
                                            className={`group transition-all duration-300 ${formFocus.password ? 'scale-[1.02]' : ''}`}
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <label
                                                htmlFor="password"
                                                className="block text-sm font-medium text-white mb-1.5 flex items-center"
                                            >
                                                <Key className="h-4 w-4 mr-1.5 text-green-400" />
                                                Password
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    className={`block w-full px-4 py-3 text-sm text-white placeholder-green-400/60 bg-white/10 border ${errors.password ? 'border-red-500' : formFocus.password ? 'border-green-400' : 'border-green-500/30'} focus:border-green-400 focus:ring focus:ring-green-400/20 rounded-lg transition-all duration-200 pr-10`}
                                                    placeholder="••••••••"
                                                    value={data.password}
                                                    onChange={(e) => setData("password", e.target.value)}
                                                    onFocus={() => handleFocus('password')}
                                                    onBlur={() => handleBlur('password')}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="text-green-400 hover:text-green-300 focus:outline-none"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-5 w-5" />
                                                        ) : (
                                                            <Eye className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            {errors.password && (
                                                <motion.p 
                                                    className="mt-1 text-sm text-red-400 flex items-center"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    {errors.password}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        {/* Remember Me & Forgot Password */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <input
                                                    id="remember"
                                                    name="remember"
                                                    type="checkbox"
                                                    className="h-4 w-4 text-green-500 focus:ring-green-400 border-green-500/30 rounded bg-white/10"
                                                    checked={data.remember}
                                                    onChange={(e) => setData("remember", e.target.checked)}
                                                />
                                                <label
                                                    htmlFor="remember"
                                                    className="ml-2 block text-sm text-green-200"
                                                >
                                                    Remember me
                                                </label>
                                            </div>
                                            {canResetPassword && (
                                                <div className="text-sm">
                                                    <a
                                                        href={route("password.request")}
                                                        className="font-medium text-green-400 hover:text-green-300 transition-colors duration-200 hover:underline"
                                                    >
                                                        Forgot Password?
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Login Button */}
                                        <div className="pt-2">
                                            <motion.button
                                                type="submit"
                                                disabled={processing}
                                                className="relative w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
                                                whileHover={{ 
                                                    scale: 1.03,
                                                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
                                                }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-gradient-to-r from-green-500/40 to-transparent group-hover:translate-x-full group-hover:scale-102"></span>
                                                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-12 bg-gradient-to-l from-green-500/40 to-transparent group-hover:translate-x-full group-hover:scale-102"></span>
                                                <span className="relative flex items-center">
                                                    {processing ? (
                                                        <>
                                                            <svg
                                                                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <circle
                                                                    className="opacity-25"
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="10"
                                                                    stroke="currentColor"
                                                                    strokeWidth="4"
                                                                ></circle>
                                                                <path
                                                                    className="opacity-75"
                                                                    fill="currentColor"
                                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                ></path>
                                                            </svg>
                                                            Signing in...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <LogIn className="h-5 w-5 mr-2" />
                                                            Sign In
                                                        </>
                                                    )}
                                                </span>
                                            </motion.button>
                                        </div>
                                    </motion.form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}