<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Event;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    /**
     * Get attendance reports grouped by event
     */
    public function getAttendanceReports(Request $request)
    {
        try {
            $query = Event::with(['attendances']);
            
            // Apply filters if provided
            if ($request->has('period')) {
                $period = $request->period;
                
                switch ($period) {
                    case 'Daily':
                        $query->whereDate('date', Carbon::today());
                        break;
                    case 'Weekly':
                        $query->whereBetween('date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                        break;
                    case 'Monthly':
                        $query->whereMonth('date', Carbon::now()->month)
                              ->whereYear('date', Carbon::now()->year);
                        break;
                    case 'Quarterly':
                        $query->whereBetween('date', [Carbon::now()->startOfQuarter(), Carbon::now()->endOfQuarter()]);
                        break;
                    case 'Annual':
                        $query->whereYear('date', Carbon::now()->year);
                        break;
                }
            }
            
            $events = $query->orderBy('date', 'desc')->get();
            
            $reports = [];
            
            foreach ($events as $event) {
                // Get attendance count for this event
                $attendeeCount = Attendance::where('event_id', $event->id)
                    ->distinct('user_id')
                    ->count('user_id');
                
                // Calculate attendance rate
                $capacity = 50; // Default capacity if not set
                $attendanceRate = $capacity > 0 ? ($attendeeCount / $capacity) * 100 : 0;
                
                // Determine status based on date
                $today = Carbon::today();
                $eventDate = Carbon::parse($event->date);
                $status = $eventDate->isPast() ? 'Completed' : ($eventDate->isToday() ? 'Ongoing' : 'Upcoming');
                
                $reports[] = [
                    'id' => $event->id,
                    'event' => $event->eventname,
                    'date' => $event->date,
                    'attendees' => $attendeeCount,
                    'capacity' => $capacity,
                    'attendance_rate' => round($attendanceRate, 2),
                    'status' => $status
                ];
            }
            
            return response()->json([
                'success' => true,
                'reports' => $reports
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating attendance reports: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate attendance reports: ' . $e->getMessage()
            ], 500);
        }
    }
    

    /**
     * Get detailed attendance report for a specific event
     */
    public function getEventAttendanceReport($eventId)
    {
        try {
            $event = Event::findOrFail($eventId);
            
            $attendances = Attendance::where('event_id', $eventId)
                ->with('user')
                ->get();
                
            $attendanceDetails = [];
            
            foreach ($attendances as $attendance) {
                // Calculate attendance status for each time slot
                $morningStatus = $this->getAttendanceStatus($attendance->time_in_am, $attendance->time_out_am);
                $afternoonStatus = $this->getAttendanceStatus($attendance->time_in_pm, $attendance->time_out_pm);
                $nightStatus = $this->getAttendanceStatus($attendance->time_in_night, $attendance->time_out_night);
                
                $attendanceDetails[] = [
                    'student_id' => $attendance->user_id,
                    'student_name' => $attendance->user->name,
                    'student_no' => $attendance->user->studentNo,
                    'date' => $attendance->date,
                    'morning' => [
                        'in' => $attendance->time_in_am,
                        'out' => $attendance->time_out_am,
                        'status' => $morningStatus
                    ],
                    'afternoon' => [
                        'in' => $attendance->time_in_pm,
                        'out' => $attendance->time_out_pm,
                        'status' => $afternoonStatus
                    ],
                    'night' => [
                        'in' => $attendance->time_in_night,
                        'out' => $attendance->time_out_night,
                        'status' => $nightStatus
                    ]
                ];
            }
            
            // Calculate statistics
            $totalStudents = count($attendanceDetails);
            $presentCount = 0;
            $absentCount = 0;
            $lateCount = 0;
            
            foreach ($attendanceDetails as $detail) {
                if ($detail['morning']['status'] === 'Present' || 
                    $detail['afternoon']['status'] === 'Present' || 
                    $detail['night']['status'] === 'Present') {
                    $presentCount++;
                }
                
                if ($detail['morning']['status'] === 'Absent' && 
                    $detail['afternoon']['status'] === 'Absent' && 
                    $detail['night']['status'] === 'Absent') {
                    $absentCount++;
                }
                
                if ($detail['morning']['status'] === 'Late' || 
                    $detail['afternoon']['status'] === 'Late' || 
                    $detail['night']['status'] === 'Late') {
                    $lateCount++;
                }
            }
            
            return response()->json([
                'success' => true,
                'event' => [
                    'id' => $event->id,
                    'name' => $event->eventname,
                    'date' => $event->date,
                    'location' => $event->location
                ],
                'statistics' => [
                    'total_students' => $totalStudents,
                    'present' => $presentCount,
                    'absent' => $absentCount,
                    'late' => $lateCount,
                    'attendance_rate' => $totalStudents > 0 ? round(($presentCount / $totalStudents) * 100, 2) : 0
                ],
                'attendances' => $attendanceDetails
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating event attendance report: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate event attendance report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Helper method to determine attendance status
     */
    private function getAttendanceStatus($timeIn, $timeOut)
    {
        if ($timeIn === 'Absent' || $timeIn === null) {
            return 'Absent';
        }
        
        // Check if the student was late (assuming timeIn is a time string)
        if (is_string($timeIn) && preg_match('/^\d{2}:\d{2}:\d{2}$/', $timeIn)) {
            $scheduledTimeIn = '08:00:00'; // Example scheduled time
            if (strtotime($timeIn) > strtotime($scheduledTimeIn)) {
                return 'Late';
            }
        }
        
        return 'Present';
    }

    /**
     * Get attendance details for a specific event for download
     */
    public function getAttendanceDetails(Request $request)
    {
        try {
            $eventId = $request->input('event_id');
            
            if (!$eventId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Event ID is required'
                ], 400);
            }
            
            $event = Event::findOrFail($eventId);
            
            // Get all attendances for this event
            $attendances = Attendance::where('event_id', $eventId)
                ->with(['user' => function($query) {
                    $query->select('id', 'name', 'studentNo', 'year', 'section');
                }])
                ->get();
            
            $attendanceDetails = [];
            
            foreach ($attendances as $attendance) {
                // Get status for each time period
                $morningInStatus = $attendance->time_in_am === null ? null : 
                                  ($attendance->time_in_am === 'Absent' ? 'Absent' : 'Present');
                                  
                $morningOutStatus = $attendance->time_out_am === null ? null : 
                                   ($attendance->time_out_am === 'Absent' ? 'Absent' : 'Present');
                                   
                $afternoonInStatus = $attendance->time_in_pm === null ? null : 
                                    ($attendance->time_in_pm === 'Absent' ? 'Absent' : 'Present');
                                    
                $afternoonOutStatus = $attendance->time_out_pm === null ? null : 
                                     ($attendance->time_out_pm === 'Absent' ? 'Absent' : 'Present');
                
                // Add night status fields
                $nightInStatus = $attendance->time_in_night === null ? null : 
                                ($attendance->time_in_night === 'Absent' ? 'Absent' : 'Present');
                                
                $nightOutStatus = $attendance->time_out_night === null ? null : 
                                 ($attendance->time_out_night === 'Absent' ? 'Absent' : 'Present');
                
                // Check for lateness
                if (is_string($attendance->time_in_am) && $attendance->time_in_am !== 'Absent' && 
                    preg_match('/^\d{2}:\d{2}:\d{2}$/', $attendance->time_in_am)) {
                    $scheduledTimeIn = '08:00:00'; // Example scheduled time
                    if (strtotime($attendance->time_in_am) > strtotime($scheduledTimeIn)) {
                        $morningInStatus = 'Late';
                    }
                }
                
                if (is_string($attendance->time_in_pm) && $attendance->time_in_pm !== 'Absent' && 
                    preg_match('/^\d{2}:\d{2}:\d{2}$/', $attendance->time_in_pm)) {
                    $scheduledTimeIn = '13:00:00'; // Example scheduled time
                    if (strtotime($attendance->time_in_pm) > strtotime($scheduledTimeIn)) {
                        $afternoonInStatus = 'Late';
                    }
                }
                
                // Get year and section separately
                $year = $attendance->user->year ?? 'N/A';
                $section = $attendance->user->section ?? 'N/A';
                
                // Keep the combined format for backward compatibility
                $yearSection = $attendance->user->year && $attendance->user->section 
                    ? 'Year ' . $attendance->user->year . ' - ' . $attendance->user->section 
                    : 'N/A';
                
                $attendanceDetails[] = [
                    'student_id' => $attendance->user->studentNo,
                    'name' => $attendance->user->name,
                    'year' => $year,
                    'section' => $section,
                    'year_section' => $yearSection,
                    'morning_in_status' => $morningInStatus,
                    'morning_out_status' => $morningOutStatus,
                    'afternoon_in_status' => $afternoonInStatus,
                    'afternoon_out_status' => $afternoonOutStatus,
                    'night_in_status' => $nightInStatus,
                    'night_out_status' => $nightOutStatus
                ];
            }
            
            // Determine which time periods are set for this event
            $timePeriods = [
                'morning' => !empty($event->timeInAM) || !empty($event->timeOutAM),
                'afternoon' => !empty($event->timeInPM) || !empty($event->timeOutPM),
                'night' => !empty($event->timeInNight) || !empty($event->timeOutNight)
            ];
            
            return response()->json([
                'success' => true,
                'eventName' => $event->eventname,
                'eventDate' => $event->date,
                'timePeriods' => $timePeriods,
                'attendanceDetails' => $attendanceDetails
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attendance details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance data by year for all events
     */
    public function getAttendanceByYear()
    {
        try {
            // Get all years that have students
            $years = User::where('role', 'student')
                ->distinct('year')
                ->pluck('year')
                ->filter()
                ->values();
            
            $attendanceData = [];
            
            foreach ($years as $year) {
                // Get all students in this year
                $studentIds = User::where('role', 'student')
                    ->where('year', $year)
                    ->pluck('id');
                
                // Get all events
                $events = Event::orderBy('date')->get();
                
                $yearData = [
                    'year' => $year,
                    'events' => []
                ];
                
                foreach ($events as $event) {
                    // Count attendances for this event and year
                    $attendanceCount = Attendance::where('event_id', $event->id)
                        ->whereIn('user_id', $studentIds)
                        ->count();
                    
                    // Count total students in this year
                    $totalStudents = count($studentIds);
                    
                    // Calculate percentage
                    $percentage = $totalStudents > 0 ? round(($attendanceCount / $totalStudents) * 100, 2) : 0;
                    
                    $yearData['events'][] = [
                        'event_id' => $event->id,
                        'event_name' => $event->eventname,
                        'attendance_count' => $attendanceCount,
                        'total_students' => $totalStudents,
                        'percentage' => $percentage
                    ];
                }
                
                $attendanceData[] = $yearData;
            }
            
            return response()->json([
                'success' => true,
                'data' => $attendanceData
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance by year: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attendance by year: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get fines data by year
     */
    public function getFinesByYear()
    {
        try {
            // Get all years that have students
            $years = User::where('role', 'student')
                ->distinct('year')
                ->pluck('year')
                ->filter()
                ->values();
            
            $finesData = [];
            
            foreach ($years as $year) {
                // Get all students in this year
                $studentIds = User::where('role', 'student')
                    ->where('year', $year)
                    ->pluck('id');
                
                // Get total fines for this year
                $totalFines = DB::table('student_fines')
                    ->whereIn('user_id', $studentIds)
                    ->sum('amount');
                
                // Get paid fines for this year
                $paidFines = DB::table('student_fines')
                    ->whereIn('user_id', $studentIds)
                    ->where('status', 'paid')
                    ->sum('amount');
                
                // Get unpaid fines for this year
                $unpaidFines = DB::table('student_fines')
                    ->whereIn('user_id', $studentIds)
                    ->where('status', 'unpaid')
                    ->sum('amount');
                
                $finesData[] = [
                    'year' => $year,
                    'total_fines' => $totalFines,
                    'paid_fines' => $paidFines,
                    'unpaid_fines' => $unpaidFines
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => $finesData
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching fines by year: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch fines by year: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get absence fines data
     */
    public function getAbsenceFines()
    {
        try {
            // Get all years that have students
            $years = User::where('role', 'student')
                ->distinct('year')
                ->pluck('year')
                ->filter()
                ->values();
            
            // Get the fine for absences
            $absenceFine = DB::table('fines')
                ->where('violation', 'like', '%absent%')
                ->orWhere('description', 'like', '%absent%')
                ->first();
            
            $absenceFineAmount = $absenceFine ? $absenceFine->amount : 50; // Default to 50 if not found
            
            $absenceFinesData = [];
            
            foreach ($years as $year) {
                // Get all students in this year
                $studentIds = User::where('role', 'student')
                    ->where('year', $year)
                    ->pluck('id');
                
                // Count absences for this year
                $absentCount = Attendance::whereIn('user_id', $studentIds)
                    ->where(function($query) {
                        $query->where('time_in_am', 'Absent')
                            ->orWhere('time_in_pm', 'Absent')
                            ->orWhere('time_in_night', 'Absent');
                    })
                    ->count();
                
                // Calculate total absence fines
                $totalAbsenceFines = $absentCount * $absenceFineAmount;
                
                // Get absence fines that have been recorded in student_fines
                $recordedAbsenceFines = DB::table('student_fines')
                    ->whereIn('user_id', $studentIds)
                    ->where(function($query) {
                        $query->where('reason', 'like', '%absent%')
                            ->orWhere('reason', 'like', '%attendance%');
                    })
                    ->sum('amount');
                
                // Calculate paid and unpaid absence fines
                $paidAbsenceFines = DB::table('student_fines')
                    ->whereIn('user_id', $studentIds)
                    ->where(function($query) {
                        $query->where('reason', 'like', '%absent%')
                            ->orWhere('reason', 'like', '%attendance%');
                    })
                    ->where('status', 'paid')
                    ->sum('amount');
                
                $unpaidAbsenceFines = $recordedAbsenceFines - $paidAbsenceFines;
                
                $absenceFinesData[] = [
                    'year' => $year,
                    'absent_count' => $absentCount,
                    'fine_amount' => $absenceFineAmount,
                    'total_absence_fines' => $totalAbsenceFines,
                    'recorded_absence_fines' => $recordedAbsenceFines,
                    'paid_absence_fines' => $paidAbsenceFines,
                    'unpaid_absence_fines' => $unpaidAbsenceFines
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => $absenceFinesData
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching absence fines: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch absence fines: ' . $e->getMessage()
            ], 500);
        }
    }
}
