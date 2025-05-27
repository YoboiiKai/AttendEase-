<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SecretaryController;
use App\Http\Controllers\FinesController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventRfidController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\StudentFinesController;
use App\Http\Controllers\AbsentFinesController;
use App\Http\Controllers\ReportController;
use GuzzleHttp\Middleware;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Bylaws Route
Route::get('/bylaws', function () {
    return Inertia::render('Bylaws');
})->name('bylaws');

// Dashboard Route
Route::get('/dashboard', function () {
    // Get counts of users by role
    $studentCount = \App\Models\User::where('role', 'student')->count();
    $adminCount = \App\Models\User::where('role', 'admin')->count();
    $secretaryCount = \App\Models\User::where('role', 'secretary')->count();
    $eventCount = \App\Models\Event::count(); // Assuming you have an Event model
    $paidViolationsCount = \App\Models\StudentFines::where('status', 'paid')->count();
    $unpaidViolationsCount = \App\Models\StudentFines::where('status', 'unpaid')->count();

    return Inertia::render('Dashboard', [
        'userCounts' => [
            'students' => $studentCount,
            'admins' => $adminCount,
            'secretaries' => $secretaryCount,
            'events' => $eventCount,
            'paidViolations' => $paidViolationsCount,
            'unpaidViolations' => $unpaidViolationsCount,
        ],
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Student routes
Route::middleware(['auth', 'verified', 'role:student'])->prefix('student')->group(function () {
    Route::get('/', [StudentController::class, 'index'])->name('student.dashboard');
    Route::get('/attendance', [AttendanceController::class, 'getStudentAttendance'])->name('student.attendance');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('student.profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('student.profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('student.profile.destroy');
    
    // Student API routes
    Route::get('/api/my-absent-count', [AttendanceController::class, 'getStudentAbsentCount'])->name('student.absent-count');
    Route::get('/api/my-fines', [StudentFinesController::class, 'getStudentFines'])->name('student.fines');
    Route::get('/api/upcoming-events', [EventController::class, 'getUpcomingEvents'])->name('student.upcoming-events');
});

// Admin Routes Group
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->group(function () {// yung Role:admin naman dto ay yun yung makaka access lang ng route tdo sa baba

    //Routes for Sidebar
    Route::get('/student', fn () => Inertia::render('Admin/Student'))->name('admin.student');
    Route::get('/admin', fn () => Inertia::render('Admin/Admin'))->name('admin.admin');
    Route::get('/secretary', fn () => Inertia::render('Admin/Secretary'))->name('admin.secreatry');
    Route::get('/event', fn () => Inertia::render('Admin/Event'))->name('admin.event');
    Route::get('/rfid', fn () => Inertia::render('Admin/Rfid'))->name('admin.rfid');
    Route::get('/fines', fn () => Inertia::render('Admin/Fines'))->name('admin.fines');
    Route::get('/feedback', fn () => Inertia::render('Admin/Feedback'))->name('admin.feedback');
    Route::get('/report', fn () => Inertia::render('Admin/Report'))->name('admin.report');
    Route::get('/absent-fine-report', fn () => Inertia::render('Admin/AbsentFineReport'))->name('admin.absent-fine-report');
    Route::get('/dress-code-fine-report', fn () => Inertia::render('Admin/DressCodeFineReport'))->name('admin.dress-code-fine-report');
    Route::get('/settings', fn () => Inertia::render('Admin/Settings'))->name('admin.settings');

    // API routes for reports
    Route::get('/api/attendance-reports', [ReportController::class, 'getAttendanceReports'])->name('admin.attendance-reports');
    Route::get('/api/event-attendance-report/{eventId}', [ReportController::class, 'getEventAttendanceReport'])->name('admin.event-attendance-report');
    Route::get('/api/attendance-details', [ReportController::class, 'getAttendanceDetails'])->name('admin.attendance-details');
    Route::get('/api/absent-fine-reports', [AbsentFinesController::class, 'getAbsentFineReports'])->name('admin.absent-fine-reports');
    Route::get('/api/absent-fine-details', [AbsentFinesController::class, 'getAbsentFineDetails'])->name('admin.absent-fine-details');
    Route::get('/api/dress-code-fine-reports', [StudentFinesController::class, 'getDressCodeFineReports'])->name('admin.dress-code-fine-reports');
    Route::get('/api/dress-code-fine-details', [StudentFinesController::class, 'getDressCodeFineDetails'])->name('admin.dress-code-fine-details');

    Route::get('/api/financial-reports', [\App\Http\Controllers\Admin\FinancialReportController::class, 'getFinancialReports'])->name('admin.financial-reports');
    Route::get('/api/financial-details', [\App\Http\Controllers\Admin\FinancialReportController::class, 'getFinancialDetails'])->name('admin.financial-details');
    Route::get('/api/financial-absent-fines', [\App\Http\Controllers\Admin\FinancialReportController::class, 'getAbsentFines'])->name('admin.financial-absent-fines');
    Route::get('/api/financial-student-fines', [\App\Http\Controllers\Admin\FinancialReportController::class, 'getStudentFines'])->name('admin.financial-student-fines');
    Route::get('/api/attendance-by-year', [ReportController::class, 'getAttendanceByYear'])->name('admin.attendance-by-year');
    Route::get('/api/fines-by-year', [ReportController::class, 'getFinesByYear'])->name('admin.fines-by-year');
    Route::get('/api/absence-fines', [ReportController::class, 'getAbsenceFines'])->name('admin.absence-fines');

    Route::apiResource('/api/admin/student', StudentController::class); ////eto yung nasabi ko na isang line ng code may index,store,update,delete na
    Route::apiResource('/api/admin/admin', AdminController::class);
    Route::apiResource('/api/admin/secretary', SecretaryController::class);
    Route::apiResource('/api/admin/event', EventController::class);
    Route::apiResource('/api/admin/fines', FinesController::class);
    Route::apiResource('/api/admin/rfid', RfidController::class);
    Route::apiResource('/api/admin/feedback', FeedbackController::class);
    Route::apiResource('/api/admin/report', ReportController::class);
    Route::apiResource('/api/admin/settings', SettingsController::class);


    Route::post('/api/admin/student/import', [StudentController::class, 'import'])->name('admin.student.import');
    Route::post('/api/admin/secretary/import', [SecretaryController::class, 'import'])->name('admin.secretary.import');

    
});

// Secretary routes
Route::middleware(['auth', 'verified', 'role:secretary'])->prefix('secretary')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Secretary/Dashboard'))->name('secretary.dashboard');
    Route::get('/addfines', fn () => Inertia::render('Secretary/AddFines'))->name('secretary.addfines');
    Route::get('/absentfines', fn () => Inertia::render('Secretary/AbsentFines'))->name('secretary.absentfines');
    Route::get('/absences', fn () => Inertia::render('Secretary/Absences'))->name('secretary.absences');
    
    // API routes for secretary
    Route::get('/api/section-students', [StudentController::class, 'getSectionStudents'])->name('secretary.section-students');
    
    // Student Fines API routes
    Route::get('/api/student-fines', [StudentFinesController::class, 'index'])->name('secretary.student-fines.index');
    Route::post('/api/student-fines', [StudentFinesController::class, 'store'])->name('secretary.student-fines.store');
    Route::get('/api/student-fines/{id}', [StudentFinesController::class, 'show'])->name('secretary.student-fines.show');
    Route::put('/api/student-fines/{id}', [StudentFinesController::class, 'update'])->name('secretary.student-fines.update');
    Route::delete('/api/student-fines/{id}', [StudentFinesController::class, 'destroy'])->name('secretary.student-fines.destroy');
    Route::put('/api/student-fines/{id}/mark-as-paid', [StudentFinesController::class, 'markAsPaid'])->name('secretary.student-fines.mark-as-paid');
    Route::get('/api/search-students', [StudentFinesController::class, 'searchStudents'])->name('secretary.search-students');
    Route::get('/api/fine-types', [StudentFinesController::class, 'getFineTypes'])->name('secretary.fine-types');
    
    // Absence records API routes
    Route::get('/api/absence-records', [AbsentFinesController::class, 'getAbsenceRecords'])->name('secretary.absence-records');
    Route::patch('/api/absence-records/{id}', [AbsentFinesController::class, 'updatePaymentStatus'])->name('secretary.update-absence-status');
    Route::post('/api/absence-records/invoice', [AbsentFinesController::class, 'generateInvoice'])->name('secretary.generate-invoice');
});

// Student routes
Route::middleware(['auth', 'verified', 'role:student'])->prefix('student')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Student/Dashboard'))->name('student.dashboard');
    Route::get('/profile', fn () => Inertia::render('Student/Profile'))->name('student.profile');
    Route::get('/event', fn () => Inertia::render('Student/Event'))->name('student.event');
    Route::get('/attendance', fn () => Inertia::render('Student/Attendance'))->name('student.attendance');
    Route::get('/feedback', fn () => Inertia::render('Student/Feedback'))->name('student.feedback');
    Route::get('/fines', fn () => Inertia::render('Student/Fines'))->name('student.fines');

    // Student API routes
    Route::get('/api/my-fines', [StudentFinesController::class, 'getStudentFines'])->name('student.my-fines');
    Route::get('/api/events', [EventController::class, 'getStudentEvents'])->name('student.events');
    Route::get('/api/my-absent-count', [StudentController::class, 'getStudentAbsentCount'])->name('student.absent-count');
    Route::get('/api/attendance', [AttendanceController::class, 'getStudentAttendance'])->name('student.attendance.view');
    Route::get('/api/fine-types', [StudentFinesController::class, 'getFineTypes'])->name('student.fine-types');
});


// Attendance API Routes
Route::prefix('api/attendance')->group(function () {
    Route::get('/today-events', [AttendanceController::class, 'getTodayEvents']);
    Route::get('/student/{rfid}', [AttendanceController::class, 'getStudentByRfidApi']);
    Route::get('/student-by-id/{studentId}', [AttendanceController::class, 'getStudentByIdApi']);
    Route::post('/record', [AttendanceController::class, 'recordAttendance']);
    Route::post('/mark-absent', [AttendanceController::class, 'markAbsentStudents']);
    Route::get('/records', [AttendanceController::class, 'getAttendanceRecords']);
});

Route::apiResource('/api/admin/settings', SettingsController::class);

require __DIR__.'/auth.php';