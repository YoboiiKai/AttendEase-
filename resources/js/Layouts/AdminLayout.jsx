import { Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Users,
    Calendar,
    CheckCircle,
    Wifi,
    Fingerprint,
    QrCode,
    MessageSquare,
    FileText,
    Settings,
    Menu,
    X,
    ChevronDown,
    Lock,
    Shield,
    UserCog,
    UserPen,
    Cog,
    HandCoins,
} from "lucide-react";

const MenuItem = ({ icon: Icon, text, href }) => {
    const { url } = usePage();
    const isActive = url.startsWith(href);

    return (
        <Link
            href={href}
            className={`flex items-center px-4 py-2 ${
                isActive ? "text-white" : "text-green-300"
            }`}
        >
            <div
                className={`flex items-center justify-center w-10 h-10 rounded-md mr-3 ${
                    isActive
                        ? "bg-green-700 text-white"
                        : "bg-green-900/50 text-green-300 hover:bg-green-800/70"
                }`}
            >
                <Icon className={`w-5 h-5`} />
            </div>
            <span>{text}</span>
        </Link>
    );
};

const getInitials = (name) => {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
};

export default function AdminLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen bg-green-950">
            {/* Sidebar */}
            <aside
                className={`bg-gradient-to-b from-green-950 via-green-900 to-green-950 w-64 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 md:static absolute z-50 border-r border-green-800/30`}
            >
                <a className="flex items-center px-4 py-4 justify-start">
                    <div className="flex items-center justify-center h-10 w-10 bg-green-800/50 rounded-md">
                        <Fingerprint className="h-6 w-6 text-green-300" />
                    </div>
                    <span className="ml-3 text-xl font-semibold text-white">
                        AttendEase
                    </span>
                </a>
                <button
                    onClick={() => setSidebarOpen(false)}   
                    className="absolute top-2 right-4 text-green-300 hover:text-white focus:outline-none md:hidden"
                >
                    <X className="h-5 w-5" />
                </button>
                <nav className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-green-950 [&::-webkit-scrollbar-thumb]:bg-green-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-green-700">
                    <MenuItem
                        icon={LayoutDashboard}
                        text="Dashboard"
                        href="/dashboard"
                    />
                    <div>
                        <details>
                            <summary className="flex items-center text-green-300 cursor-pointer hover:bg-green-800/30 w-full">
                                <MenuItem
                                    icon={Users}
                                    text="Users"
                                    href="#"
                                />
                                <ChevronDown className="w-4 h-4 ml-10" />
                            </summary>

                            <div className="pl-7 mt-2 bg-green-900/20">
                            <MenuItem icon={Users} text="Students" href="/admin/student" />
                                <MenuItem icon={UserCog} text="Admin" href="/admin/admin" />
                                <MenuItem icon={UserPen} text="Secretary" href="/admin/secretary" />
                            </div>
                        </details>
                    </div>
                    <MenuItem icon={Calendar} text="Events" href="/admin/event" />
                    <div>
                        <details>
                            <summary className="flex items-center text-green-300 cursor-pointer hover:bg-green-800/30 w-full">
                                <MenuItem
                                    icon={CheckCircle}
                                    text="Attendance"
                                    href="#"
                                />
                                <ChevronDown className="w-4 h-4 ml-10" />
                            </summary>

                            <div className="pl-7 mt-2 bg-green-900/20">
                                <MenuItem
                                    icon={Wifi}
                                    text="RFID"
                                    href="/admin/rfid"
                                />
                            </div>
                        </details>
                    </div>
                    <MenuItem icon={HandCoins} text="Fines" href="/admin/fines" />
                    <div>
                        <details>
                            <summary className="flex items-center text-green-300 cursor-pointer hover:bg-green-800/30 w-full">
                                <MenuItem
                                    icon={FileText}
                                    text="Reports"
                                    href="#"
                                />
                                <ChevronDown className="w-4 h-4 ml-10" />
                            </summary>

                            <div className="pl-7 mt-2 bg-green-900/20">
                                <MenuItem
                                    icon={FileText}
                                    text="Attendance Report"
                                    href="/admin/report"
                                />
                                <MenuItem
                                    icon={HandCoins}
                                    text="Absent Fine Report"
                                    href="/admin/absent-fine-report"
                                />
                                <MenuItem
                                    icon={FileText}
                                    text="Dress Code Fine Report"
                                    href="/admin/dress-code-fine-report"
                                />
                            </div>
                        </details>
                    </div>
                    <MenuItem icon={Cog} text="Settings" href="/admin/settings" />
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <header className="bg-gradient-to-r from-green-950 to-green-800 shadow-lg py-4 px-6 flex items-center justify-between border-b border-green-800/30">
                    <button
                        onClick={toggleSidebar}
                        className="text-green-300 hover:text-white focus:outline-none focus:text-white md:hidden"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* Right-aligned user info */}
                    <div className="relative ml-auto">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center space-x-2 focus:outline-none"
                        >
                            {user.image && !imageError ? (
                                <img
                                    src={`/storage/${user.image}`}
                                    alt={user.name}
                                    className="h-10 w-10 rounded-full object-cover border-2 border-green-700"
                                    onError={(e) => {
                                        console.error(
                                            "Image failed to load:",
                                            e.target.src
                                        );
                                        setImageError(true);
                                    }}
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-green-800/50 flex items-center justify-center">
                                    <span className="text-sm font-medium text-green-300">
                                        {getInitials(user.name)}
                                    </span>
                                </div>
                            )}
                            <div className="flex flex-col items-start space-y-1">
                                <span className="text-sm font-semibold text-white">
                                    {user.name}
                                </span>

                            </div>
                            <ChevronDown
                                className={`h-4 w-4 text-green-300 transition-transform ${
                                    isDropdownOpen ? "transform rotate-180" : ""
                                }`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 py-2 bg-gradient-to-r from-green-950 to-green-800 rounded-md shadow-lg border border-green-800/30 z-30">
                                <div className="px-4 py-3 border-b border-green-800/30">
                                    {user.image && !imageError ? (
                                        <img
                                            src={`/storage/${user.image}`}
                                            alt={user.name}
                                            className="h-16 w-16 rounded-full object-cover border-2 border-green-700 mx-auto mb-2"
                                            onError={(e) => {
                                                console.error(
                                                    "Image failed to load:",
                                                    e.target.src
                                                );
                                                setImageError(true);
                                            }}
                                        />
                                    ) : (
                                        <div className="h-16 w-16 rounded-full bg-green-800/50 flex items-center justify-center mx-auto mb-2">
                                            <span className="text-lg font-medium text-green-300">
                                                {getInitials(user.name)}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-sm font-semibold text-white text-center">
                                        {user.name}
                                    </p>
                                    <p className="text-xs text-green-300 text-center truncate">
                                        {user.email}
                                    </p>
                                </div>
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="block w-full text-left px-4 py-2 text-sm text-green-300 hover:bg-green-800/50"
                                >
                                    Log Out
                                </Link>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-6 relative z-25">
                    {/* Background Icons */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {/* Top Row Icons */}
                        <div className="absolute top-4 left-4 transform rotate-12">
                            <Fingerprint className="h-24 w-24 text-green-50" />
                        </div>
                        <div className="absolute top-1/4 right-4 transform -rotate-12">
                            <Users className="h-20 w-20 text-green-50" />
                        </div>

                        {/* Middle Row Icons */}
                        <div className="absolute top-1/2 left-1/3 transform translate-y-[-50%]">
                            <Calendar className="h-16 w-16 text-green-50" />
                        </div>
                        <div className="absolute top-1/2 right-1/3 transform translate-y-[-50%]">
                            <QrCode className="h-16 w-16 text-green-50" />
                        </div>

                        {/* Bottom Row Icons */}
                        <div className="absolute bottom-4 left-1/4">
                            <Settings className="h-20 w-20 text-green-50" />
                        </div>
                        <div className="absolute bottom-4 right-1/4">
                            <CheckCircle className="h-20 w-20 text-green-50" />
                        </div>

                        {/* Floating Icons */}
                        <div className="absolute top-1/3 left-1/2 animate-pulse">
                            <Shield className="h-12 w-12 text-green-50" />
                        </div>
                        <div className="absolute bottom-1/3 right-1/2 animate-pulse delay-300">
                            <Lock className="h-12 w-12 text-green-50" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-1">{children}</div>
                </main>
            </div>
        </div>
    );
}
