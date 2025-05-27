import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
    Fingerprint,
    Users,
    Calendar,
    Shield,
    ArrowRight,
    Clock,
    Filter,
    Search,
    CheckCircle,
    BookOpen,
} from "lucide-react";

export default function Home({ events }) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        
        // Add particle animation to background
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
        script.async = true;
        document.body.appendChild(script);
        
        let particlesInitialized = false;
        
        script.onload = () => {
            if (window.particlesJS && !particlesInitialized) {
                particlesInitialized = true;
                // Initialize hero section particles
                window.particlesJS('hero-particles-js', {
                    particles: {
                        number: { value: 50, density: { enable: true, value_area: 800 } },
                        color: { value: '#22c55e' },
                        shape: { type: 'circle' },
                        opacity: { value: 0.3, random: true },
                        size: { value: 3, random: true },
                        line_linked: { enable: true, distance: 150, color: '#22c55e', opacity: 0.2, width: 1 },
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
                            push: { particles_nb: 4 }
                        }
                    },
                    retina_detect: true
                });
            }
        };
        
        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    const { scrollYProgress } = useScroll();
    const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

    return (
        <motion.div 
            className="flex flex-col min-h-screen bg-gradient-to-br from-green-100 to-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <motion.header 
                className="bg-gradient-to-r from-green-900 to-green-800 backdrop-blur-md text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-green-700/30 shadow-lg"
                style={{ opacity: headerOpacity }}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ 
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                    delay: 0.2
                }}
            >
                <div className="container mx-auto flex items-center justify-between">
                    <a className="flex items-center group" href="#">
                        <div className="bg-gradient-to-br from-green-600 to-teal-600 p-2 rounded-lg mr-3 shadow-md transition-transform group-hover:scale-110">
                            <Fingerprint className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-100 to-teal-200">
                                AttendEase
                            </span>
                            <span className="text-xs text-green-300/80 -mt-1">Attendance Management System</span>
                        </div>
                    </a>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/login"
                            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all hover:shadow-lg flex items-center"
                        >
                            <span>Login</span>
                        </Link>
                    </div>
                </div>
            </motion.header>

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative min-h-[90vh] bg-gradient-to-br from-green-950 via-green-900 to-green-800 text-white overflow-hidden py-40">
                    {/* Particles.js Container */}
                    <div id="hero-particles-js" className="absolute inset-0 z-0"></div>
                    
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 overflow-hidden opacity-10">
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
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* Animated Circles */}
                        <motion.div 
                            className="absolute h-96 w-96 rounded-full bg-gradient-to-r from-green-400/10 to-emerald-500/10 blur-xl"
                            animate={{
                                x: [0, 30, 0],
                                y: [0, 50, 0],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{ top: '20%', left: '10%' }}
                        />
                        <motion.div 
                            className="absolute h-80 w-80 rounded-full bg-gradient-to-r from-teal-400/10 to-green-500/10 blur-xl"
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

                        {/* Decorative Icons - Strategically placed */}
                        <div className="absolute top-1/4 left-10 transform rotate-12 opacity-20">
                            <Fingerprint className="h-20 w-20 md:h-32 md:w-32 text-green-100" />
                        </div>
                        <div className="absolute bottom-1/4 right-10 transform -rotate-12 opacity-20">
                            <Calendar className="h-20 w-20 md:h-32 md:w-32 text-green-100" />
                        </div>
                        <div className="absolute top-1/3 right-1/4 transform rotate-45 opacity-20 hidden lg:block">
                            <Users className="h-16 w-16 md:h-24 md:w-24 text-green-100" />
                        </div>
                        <div className="absolute bottom-1/3 left-1/4 transform -rotate-12 opacity-20 hidden lg:block">
                            <Shield className="h-16 w-16 md:h-24 md:w-24 text-green-100" />
                        </div>
                    </div>

                    <div className="container mx-auto px-6 pl-8 md:px-6 md:pl-20 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Text Content */}
                            <motion.div 
                                className="flex flex-col space-y-8"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ 
                                    duration: 0.8,
                                    delay: 0.3,
                                    type: "spring",
                                    damping: 20
                                }}
                            >
                                <div>
                                    <motion.h1 
                                        className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            type: "spring",
                                            damping: 20,
                                            stiffness: 100,
                                            delay: 0.5
                                        }}
                                    >
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-100 to-teal-200">
                                            AttendEase
                                        </span>
                                        <br />
                                        <span className="text-green-50">
                                           Dynamic Attendance System
                                        </span>
                                    </motion.h1>
                                </div>
                                
                                <motion.p 
                                    className="text-lg md:text-xl text-green-100/90 max-w-xl leading-relaxed"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        type: "spring",
                                        damping: 20,
                                        stiffness: 100,
                                        delay: 0.7
                                    }}
                                >
                                    Streamline your attendance tracking with our cutting-edge technology. 
                                    AttendEase combines Fingerprint and RFID for seamless, reliable 
                                    attendance management in educational institutions.
                                </motion.p>
                                
                                <motion.div 
                                    className="flex flex-col sm:flex-row gap-5 pt-4"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        type: "spring",
                                        damping: 20,
                                        stiffness: 100,
                                        delay: 0.9
                                    }}
                                >
                                    <Link 
                                        href="/login"
                                        className="relative overflow-hidden group bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-xl flex items-center justify-center"
                                    >
                                        <span className="relative z-10 flex items-center">
                                            Get Started
                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                        <span className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </Link>
                                    
                                    <Link 
                                        href="/bylaws"
                                        className="relative overflow-hidden group bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-xl text-lg shadow-md flex items-center justify-center hover:bg-white hover:text-green-700 hover:border-green-700 transition-colors duration-300"
                                    >
                                        <span className="relative z-10 flex items-center">
                                            Bylaws
                                            <BookOpen className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                                        </span>
                                        {/* Hover styles are handled by Tailwind classes */}
                                    </Link>
                                </motion.div>
                            </motion.div>

                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <motion.footer 
                className="bg-gradient-to-br from-green-950 via-green-900 to-green-800 text-white py-16 relative overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                        {/* Brand */}
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <div className="bg-gradient-to-br from-green-600 to-teal-600 p-2 rounded-lg mr-3">
                                    <Fingerprint className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-100 to-teal-200">
                                        AttendEase
                                    </h2>
                                    <p className="text-sm text-green-300/80">Attendance Management System</p>
                                </div>
                            </div>
                            <p className="text-green-100/80 max-w-xs">
                                Modern attendance tracking solution for educational institutions. Streamline your processes with our cutting-edge technology.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Features</h3>
                            <ul className="space-y-2">
                                {[
                                    'Fingerprint Scanner',
                                    'RFID Integration',
                                    'Real-time Tracking'
                                ].map((item, index) => (
                                    <motion.li 
                                        key={item}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ 
                                            opacity: 1, 
                                            x: 0,
                                            transition: { delay: index * 0.1 }
                                        }}
                                        viewport={{ once: true }}
                                    >
                                        <span className="text-green-100/80">
                                            {item}
                                        </span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="pt-8 mt-8 border-t border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <p className="text-green-100/60 text-sm">
                                {new Date().getFullYear()} AttendEase. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.footer>
        </motion.div>
    );
}
