import React, { useEffect } from "react";
import { Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Fingerprint, ArrowLeft, BookOpen, Shield, CheckCircle } from "lucide-react";

export default function Bylaws() {
    useEffect(() => {
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
                window.particlesJS('bylaws-particles-js', {
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
    
    return (
        <motion.div 
            className="flex flex-col min-h-screen bg-gradient-to-br from-green-100 to-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            <motion.header 
                className="bg-gradient-to-r from-green-900 to-green-800 backdrop-blur-md text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-green-700/30 shadow-lg"
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
                    <Link href="/" className="flex items-center group">
                        <div className="bg-gradient-to-br from-green-600 to-teal-600 p-2 rounded-lg mr-3 shadow-md transition-transform group-hover:scale-110">
                            <Fingerprint className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-100 to-teal-200">
                                AttendEase
                            </span>
                            <span className="text-xs text-green-300/80">Attendance Management System</span>
                        </div>
                    </Link>
                    
                    <Link 
                        href="/"
                        className="flex items-center text-green-100 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </motion.header>

            <main className="flex-grow">
                {/* Hero Section with Particles */}
                <section className="relative bg-gradient-to-br from-green-950 via-green-900 to-green-800 text-white overflow-hidden py-16">
                    {/* Particles.js Container */}
                    <div id="bylaws-particles-js" className="absolute inset-0 z-0"></div>
                    
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
                    </div>
                    
                    <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-xl shadow-xl overflow-hidden"
                        >
                        <div className="bg-gradient-to-r from-green-900 to-green-800 px-6 py-8">
                            <div className="flex items-center justify-center mb-4">
                                <BookOpen className="h-12 w-12 text-green-200" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-center text-white">
                                Mindoro State University
                            </h1>
                            <h2 className="text-xl md:text-2xl font-semibold text-center text-green-200 mt-2">
                                Information Technology Society Bylaws
                            </h2>
                        </div>

                        <div className="p-6 md:p-8 space-y-8 overflow-y-auto">
                            <div className="prose prose-green max-w-none">
                                <section className="mb-8">
                                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        PREAMBLE
                                    </h3>
                                    <div className="pl-7 mt-4 space-y-4">
                                        <p className="text-gray-700">
                                            We, the Bachelor of Science in Information Technology (BSIT) students of MinSU-Bongabong Campus imploring the aid of the Divine Providence, in order to establish an independent student governing organization that shall embody our ideals and aspirations, secure an atmosphere through which we pursue academic excellence, the virtue of being vibrant, forward looking, equitable and responsible under the laws of constitution, do ordain and promulgate this constitution.
                                        </p>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        ARTICLE I: NAME OF ORGANIZATION
                                    </h3>
                                    <div className="pl-7 mt-4 space-y-4">
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 1.</strong> The organization shall be called "INFORMATION TECHNOLOGY SOCIETY" (IT SOCIETY) in Mindoro State University - Bongabong Campus (MBC).
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 2.</strong> The official logo of the organization is followed:
                                        </p>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        ARTICLE II: AIMS AND OBJECTIVES
                                    </h3>
                                    <div className="pl-7 mt-4 space-y-4">
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 1.</strong> To promote general welfare of IT students by finding their needs and complaints.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 2.</strong> To provide a channel and an outlet for the development of the student's skills and talents through extracurricular activities.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 3.</strong> To help the students to participate in duly recognized outside activities like conventions, conferences, seminars and the like.
                                        </p>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        ARTICLE III: MEMBERSHIP
                                    </h3>
                                    <div className="pl-7 mt-4 space-y-4">
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 1.</strong> Qualified members of the IT society are those who are officially enrolled in the BSIT course of MINSU-Bongabong Campus.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 2.</strong> Membership fee of Php 25.00 shall be collected to new member of association which will be added to the fund of the organization.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">2.1</strong> IT Society members are required to acquire an ITS card priced at Php 25.00. This amount will be added to the association's fund and the ITS Card will be used as their official attendance record.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 3.</strong> The Membership shall be acquired only at the time the student is officially enrolled in BSIT course.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 4.</strong> The membership will be lost temporarily in case of student suspension, however if the member shift to other course, transfer to other school, expulsion and finished the BSIT course, his or her membership will be terminated.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 5.</strong> Members of the association should participate in its activities.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">5.1</strong> Any member who is absent in any IT Society meeting and activities will not sign or stamp in their ITS card and will pay an amount of Php 50.00 as fine which will be added to the fund of the association.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 6.</strong> Members are required to wear their department shirt/ corporate attire during wash day and other distinguished events.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">6.1</strong> PHP 50.00 fine will be collected in case of violation. Three consecutive violations are equal to 8 hours' community service to the department.
                                        </p>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        ARTICLE IV: OFFICERS, QUALFICATIONS, TERMS OF OFFICE AND DUTIES
                                    </h3>
                                    <div className="pl-7 mt-4 space-y-4">
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 1.</strong> The officers of the organization shall be composed of President, Vice-President, Secretary, Treasurer, Assistant Treasurer, Auditor, Committee on External and Internal Affairs, Committee on Socio Cultural, Committee on Sports, Committee on Civic/Peace and Order, Committee on Finance and Production, Committee on Ways and Means, Committee on Press and Advertisement, GAD Representatives and Representatives for each curriculum year.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">1.1</strong> Eligible candidates for position of president, vice president, secretary, treasurer and auditor of the Information Technology Society (ITS) are limited to 2nd and 3rd year BSIT students who are former elected officers of the said organization.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">1.2</strong> All members of the association can run for any position.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">1.3</strong> The term of office of the officer shall be a period of one year only.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">1.4</strong> The president shall be disqualified from holding any position to other organization.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 2.</strong> The duties of the officers shall be as follows:
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">President-</strong> The president shall call a meeting and act as the presiding officers of over the meeting. Sign all communication, resolution and papers of the department, represents the department in and out of the campus activities, in all occasions and every event where the organization needs such representations.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">Vice President-</strong> The vice-president shall act as the presiding officer in case of the president's absence.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">Secretary-</strong> The secretary shall keep all the minutes of the meetings, resolution and other papers, connected to the transaction made by the students.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">Treasurer-</strong> The treasurer shall keep and collect all funds. And he/she also makes and presents financial statement of the organization.
                                        </p>
                                        <p className="text-gray-700 pl-4">
                                            <strong className="text-green-700">Auditor-</strong> The Auditor shall audit all the incoming and outgoing financial obligations and monitors the financial transactions of the organization.
                                        </p>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        ARTICLE V: ADVISERS QUALIFICATION AND DUTIES
                                    </h3>
                                    <div className="pl-7 mt-4 space-y-4">
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 1.</strong> The adviser shall preferably be a BSIT instructor appointed by the Director for the Students Welfare Services.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 2.</strong> The IT Society adviser shall monitor all programs, projects, activities, and meetings of the association at all time.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 3.</strong> The adviser must see to it that the purpose of the association is not against the existing rules and regulation provided by the school administration.
                                        </p>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        ARTICLE VI: MEETINGS
                                    </h3>
                                    <div className="pl-7 mt-4 space-y-4">
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 1.</strong> The president shall call a regular meeting every first Thursday of the month to find the needs of the association and discuss with other officers the things needed to attain its objectives.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 2.</strong> The president shall call an emergency meeting or special meeting anytime it's needed.
                                        </p>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        ARTICLE VII: FINANCE
                                    </h3>
                                    <div className="pl-7 mt-4 space-y-4">
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 1.</strong> Any good move to the fund raising shall be laid by the President to other officers and proceeds of which shall go to the fund of the association.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 2.</strong> A member shall be asked to give contribution in case of financial shortage through an assembly and to decide for the matter.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 3.</strong> Any excess fund at the end of the academic year shall be deposited in bank.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 4.</strong> Excess fund shall be added to the revolving fund of the association for the following semester.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 5.</strong> Every member of the organization is entitled to apply for student loans as prescribed to the implementing rules and regulations of the organization.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 6.</strong> Financial statements shall be posted in the bulletin board at the end of every semester.
                                        </p>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                                        <Shield className="mr-2 h-5 w-5" />
                                        ARTICLE VIII: AMENDMENTS
                                    </h3>
                                    <div className="pl-7 mt-4 space-y-4">
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 1.</strong> Any amendments or revision of the constitution shall be proposed by the officers of the organization and must be presented to the general assembly for ratification.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 2.</strong> All proposal amendments must be submitted to the advisers for their approval.
                                        </p>
                                        <p className="text-gray-700">
                                            <strong className="text-green-700">Section 3.</strong> Two-third of votes are needed to implement the proposed amendments.
                                        </p>
                                    </div>
                                </section>
                            </div>

                            <div className="mt-10 border-t pt-6">
                                <p className="text-center text-gray-600 italic">
                                    Last updated: May 25, 2025
                                </p>
                                <div className="flex justify-center mt-4">
                                    <div className="flex items-center text-green-700">
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        <span>Official Document of Mindoro State University ITS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                </section>
            </main>

            <footer className="bg-gradient-to-br from-green-950 via-green-900 to-green-800 text-white py-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-green-100/80">
                        &copy; {new Date().getFullYear()} Mindoro State University - Information Technology Society
                    </p>
                </div>
            </footer>
        </motion.div>
    );
}
