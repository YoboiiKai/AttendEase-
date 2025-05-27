<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Event;
use App\Models\Attendance;
use App\Models\AbsentFine;
use App\Models\Fines;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AttendanceController extends Controller
{
    /**
     * Get absent students for a specific event
     * Used by secretaries to process absent fines
     */
    public function getAbsentStudents($eventId)
    {
        try {
            // Get the authenticated secretary
            $secretary = auth()->user();
            
            // Verify the event exists
            $event = Event::findOrFail($eventId);
            
            // Get all students in the secretary's year and section
            $students = User::where('role', 'student')
                ->where('year', $secretary->year)
                ->where('section', $secretary->section)
                ->get();
            
            // Get students who have attendance records for this event
            $presentStudentIds = Attendance::where('event_id', $eventId)
                ->pluck('user_id')
                ->toArray();
            
            // Filter out students who were present
            $absentStudents = $students->filter(function($student) use ($presentStudentIds) {
                return !in_array($student->id, $presentStudentIds);
            })->values();
            
            // Map to the required format
            $absentStudents = $absentStudents->map(function($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'studentNo' => $student->studentNo,
                    'year' => $student->year,
                    'section' => $student->section
                ];
            });
            
            return response()->json([
                'success' => true,
                'students' => $absentStudents
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve absent students: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get student's attendance records
     */
    public function getStudentAttendance()
    {
        try {
            $student = auth()->user();
            $attendances = Attendance::where('user_id', $student->id)
                ->with('event')
                ->orderBy('date', 'desc')
                ->get()
                ->map(function ($attendance) {
                    return [
                        'id' => $attendance->id,
                        'event' => [
                            'id' => $attendance->event->id,
                            'name' => $attendance->event->eventname
                        ],
                        'date' => $attendance->date,
                        'time_in_am' => $attendance->time_in_am,
                        'time_out_am' => $attendance->time_out_am,
                        'time_in_pm' => $attendance->time_in_pm,
                        'time_out_pm' => $attendance->time_out_pm,
                        'time_in_night' => $attendance->time_in_night,
                        'time_out_night' => $attendance->time_out_night,
                        'status' => [
                            'morning' => $this->determineStatus($attendance->time_in_am, $attendance->time_out_am),
                            'afternoon' => $this->determineStatus($attendance->time_in_pm, $attendance->time_out_pm),
                            'night' => $this->determineStatus($attendance->time_in_night, $attendance->time_out_night)
                        ]
                    ];
                });
            $stats = [
                'totalEvents' => $attendances->count(),
                'totalPresent' => $attendances->filter(function ($attendance) {
                    return collect($attendance['status'])->contains('present');
                })->count(),
                'totalLate' => $attendances->filter(function ($attendance) {
                    return collect($attendance['status'])->contains('late');
                })->count(),
                'totalAbsent' => $attendances->filter(function ($attendance) {
                    return collect($attendance['status'])->contains('absent');
                })->count()
            ];

            return response()->json([
                'success' => true,
                'attendance' => $attendances,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching student attendance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attendance records'
            ], 500);
        }
    }

    /**
     * Determine the status of attendance based on time in and time out
     */
    private function determineStatus($timeIn, $timeOut)
    {
        if ($timeIn === null || $timeIn === 'Absent') return 'absent';
        if (strtotime($timeIn) > strtotime('08:00:00')) return 'late';
        return 'present';
    }

    /**
     * Get today's events or events for a specific date
     */
    public function getTodayEvents(Request $request)
    {
        try {
            $now = Carbon::now('Asia/Manila');
            
            $requestedDate = $request->input('date');
            $today = $now->toDateString();
            $targetDate = $requestedDate ? Carbon::parse($requestedDate)->toDateString() : $today;
            
            Log::info('DETAILED EVENT FETCHING', [
                'current_time' => $now->toDateTimeString(),
                'requested_date' => $requestedDate,
                'today_date' => $today,
                'target_date' => $targetDate,
                'timezone' => $now->tzName
            ]);
            
            $events = Event::whereDate('date', $targetDate)->get();
            
            $query = Event::whereDate('date', $targetDate)->toSql();
            Log::info('SQL Query for events: ' . $query);
            
            Log::info('Found ' . $events->count() . ' events for date (' . $targetDate . ')');
            
            return response()->json([
                'success' => true,
                'events' => $events,
                'date' => $targetDate,
                'is_today' => $targetDate === $today,
                'included_yesterday' => false,
                'message' => $events->isEmpty() ? 'No events found for ' . $targetDate : null
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching events: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch events',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get student by RFID (public API endpoint)
     */
    public function getStudentByRfidApi($rfid)
    {
        try {
            $student = User::where('rfid', $rfid)
                          ->where('role', 'student')
                          ->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'No student found with this RFID'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'student' => $student
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching student by RFID: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch student information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Record student attendance
     */
    public function recordAttendance(Request $request)
    {
        try {
            $request->validate([
                'rfid' => 'required|string',
                'event_id' => 'required|exists:events,id',
                'scan_type' => 'required|in:IN,OUT',
                'client_time' => 'nullable|string',
                'client_hour' => 'nullable|integer',
                'client_period' => 'nullable|string|in:AM,PM,Night',
                'force_record' => 'nullable|boolean'
            ]);
            
            $student = User::where('rfid', $request->rfid)
                          ->where('role', 'student')
                          ->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'No student found with this RFID'
                ], 404);
            }
            
            $event = Event::find($request->event_id);
            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Event not found'
                ], 404);
            }
            
            $scanType = $request->scan_type;
            
            $clientTime = null;
            $clientHour = null;
            $clientDateTime = null;
            
            if ($request->has('client_time') && !empty($request->client_time)) {
                try {
                    $clientDateTime = Carbon::parse($request->client_time);
                    $clientTime = $clientDateTime->format('H:i:s');
                    $clientHour = $clientDateTime->hour;
                    
                    Log::info('Parsed client time', [
                        'raw_client_time' => $request->client_time,
                        'parsed_time' => $clientTime,
                        'parsed_hour' => $clientHour
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to parse client time: ' . $e->getMessage());
                }
            }
            
            $now = Carbon::now('Asia/Manila');
            
            if ($request->has('client_hour') && is_numeric($request->client_hour)) {
                $clientHour = (int)$request->client_hour;
                
                if ($clientDateTime) {
                    $now = Carbon::now('Asia/Manila')
                        ->setHour($clientHour)
                        ->setMinute($clientDateTime->minute)
                        ->setSecond($clientDateTime->second);
                } else {
                    $now = Carbon::now('Asia/Manila')->setHour($clientHour);
                }
                
                Log::info('Using client-provided hour: ' . $clientHour);
            } else if ($clientDateTime) {
                $now = Carbon::now('Asia/Manila')
                    ->setHour($clientDateTime->hour)
                    ->setMinute($clientDateTime->minute)
                    ->setSecond($clientDateTime->second);
            }
            
            $currentTime = $now->format('H:i:s');
            
            $forceRecord = $request->has('force_record') && $request->force_record === true;
            
            $period = null;
            
            if ($request->has('client_period') && in_array($request->client_period, ['AM', 'PM', 'Night'])) {
                $period = $request->client_period;
                Log::info('Using client-provided time period: ' . $period);
            } else {
                $hour = $now->hour;
                
                if ($hour >= 0 && $hour < 12) {
                    $period = 'AM';
                } elseif ($hour >= 12 && $hour < 18) {
                    $period = 'PM';
                } else {
                    $period = 'Night';
                }
                
                Log::info('Determined time period based on hour: ' . $period);
            }
            
            $today = $now->toDateString();
            
            $columnToCheck = null;
            if ($scanType === 'IN') {
                if ($period === 'AM') {
                    $columnToCheck = 'time_in_am';
                } else if ($period === 'PM') {
                    $columnToCheck = 'time_in_pm';
                } else if ($period === 'Night') {
                    $columnToCheck = 'time_in_night';
                }
            } else { // OUT
                if ($period === 'AM') {
                    $columnToCheck = 'time_out_am';
                } else if ($period === 'PM') {
                    $columnToCheck = 'time_out_pm';
                } else if ($period === 'Night') {
                    $columnToCheck = 'time_out_night';
                }
            }
            
            Log::info('Checking for existing attendance', [
                'user_id' => $student->id,
                'event_id' => $event->id,
                'date' => $today,
                'column_to_check' => $columnToCheck,
                'scan_type' => $scanType,
                'period' => $period
            ]);
            
            // Check if there's already a value in the specific column
            $existingAttendance = Attendance::where('user_id', $student->id)
                ->where('event_id', $event->id)
                ->where('date', $today)
                ->where($columnToCheck, '!=', 'Absent')
                ->first();
                
            if ($existingAttendance) {
                return response()->json([
                    'success' => false,
                    'message' => "You have already recorded {$scanType} attendance for the {$period} period",
                    'debug_info' => [
                        'current_time' => $currentTime,
                        'event_date' => $today,
                        'scan_type' => $scanType,
                        'period' => $period,
                        'allowed' => false,
                        'reason' => "Duplicate attendance record",
                        'existing_record' => [
                            'id' => $existingAttendance->id,
                            'column' => $columnToCheck,
                            'value' => $existingAttendance->$columnToCheck,
                            'created_at' => $existingAttendance->created_at
                        ]
                    ]
                ], 400);
            }
            
            date_default_timezone_set('Asia/Manila');
            
            $debugInfo = [
                'current_time' => $currentTime,
                'event_date' => $today,
                'scan_type' => $scanType,
                'period' => null,
                'allowed' => false,
                'reason' => null
            ];
            
            $forceRecord = $request->force_record ?? false;
            
            if (!$forceRecord) {
                $period = null;
                
                if ($request->has('client_period') && in_array($request->client_period, ['AM', 'PM', 'Night'])) {
                    $period = $request->client_period;
                    Log::info('Using client-provided time period: ' . $period);
                } else {
                    $hour = $now->hour;
                    
                    if ($hour >= 0 && $hour < 12) {
                        $period = 'AM';
                        Log::info('Detected time period: AM (hour: ' . $hour . ')');
                    } elseif ($hour >= 12 && $hour < 18) {
                        $period = 'PM';
                        Log::info('Detected time period: PM (hour: ' . $hour . ')');
                    } elseif ($hour >= 18) {
                        $period = 'Night';
                        Log::info('Detected time period: Night (hour: ' . $hour . ')');
                    } else {
                        Log::warning('Could not determine time period for time: ' . $currentTime . ' with hour: ' . $hour);
                    }
                }
                
                $debugInfo['period'] = $period;
                
                Log::info('All event time fields', [
                    'event_id' => $event->id,
                    'event_name' => $event->eventname,
                    'timeInAM' => $event->timeInAM,
                    'timeInAMDuration' => $event->timeInAMDuration,
                    'timeOutAM' => $event->timeOutAM,
                    'timeOutAMDuration' => $event->timeOutAMDuration,
                    'timeInPM' => $event->timeInPM,
                    'timeInPMDuration' => $event->timeInPMDuration,
                    'timeOutPM' => $event->timeOutPM,
                    'timeOutPMDuration' => $event->timeOutPMDuration,
                    'timeInNight' => $event->timeInNight,
                    'timeInNightDuration' => $event->timeInNightDuration,
                    'timeOutNight' => $event->timeOutNight,
                    'timeOutNightDuration' => $event->timeOutNightDuration
                ]);
                
                $isAllowed = false;
                $reason = null;
                
                if ($request->scan_type === 'IN') {
                        // For IN scans, check the appropriate timeIn field based on period
                    switch ($period) {
                        case 'AM':
                            if (empty($event->timeInAM)) {
                                $isAllowed = false;
                                $reason = 'Time In AM is not configured for this event';
                            } else {
                                // Get the raw time values directly from the database
                                $timeInAM = $event->timeInAM;
                                $timeInAMDuration = $event->timeInAMDuration;
                                
                                // Log all time fields for debugging
                                Log::info('AM TIME IN FIELDS', [
                                    'timeInAM' => $timeInAM,
                                    'timeInAMDuration' => $timeInAMDuration
                                ]);
                                
                                // DIRECT APPROACH: Calculate the end time - use duration directly
                                $startParts = explode(':', $timeInAM);
                                $durationParts = explode(':', $timeInAMDuration);
                                
                                $startHour = (int)$startParts[0];
                                $startMinute = (int)$startParts[1];
                                $endHour = (int)$durationParts[0];
                                $endMinute = (int)$durationParts[1];
                                
                                // Format for display
                                $formattedStartTime = sprintf('%02d:%02d:00', $startHour, $startMinute);
                                $formattedEndTime = sprintf('%02d:%02d:00', $endHour, $endMinute);
                                
                                // Get current time
                                $currentHour = $now->hour;
                                $currentMinute = $now->minute;
                                
                                // Log all calculated values
                                Log::info('DIRECT TIME CALCULATION - AM TIME IN', [
                                    'raw_start_time' => $timeInAM,
                                    'raw_duration' => $timeInAMDuration,
                                    'start_hour' => $startHour,
                                    'start_minute' => $startMinute,
                                    'end_hour' => $endHour,
                                    'end_minute' => $endMinute,
                                    'formatted_start_time' => $formattedStartTime,
                                    'formatted_end_time' => $formattedEndTime,
                                    'current_hour' => $currentHour,
                                    'current_minute' => $currentMinute
                                ]);
                                
                                // Simple time comparison
                                $currentTotalMinutes = $currentHour * 60 + $currentMinute;
                                $startTotalMinutes = $startHour * 60 + $startMinute;
                                $endTotalMinutes = $endHour * 60 + $endMinute;
                                
                                // Handle midnight crossing
                                if ($endHour < $startHour) {
                                    // End time is on the next day
                                    $endTotalMinutes += 24 * 60; // Add a full day of minutes
                                }
                                
                                $isTooEarly = $currentTotalMinutes < $startTotalMinutes;
                                $isTooLate = $currentTotalMinutes > $endTotalMinutes;
                                
                                // Handle special case for midnight crossing
                                if ($endHour < $startHour && $currentHour < $startHour) {
                                    // Current time is after midnight but before end time
                                    $isTooEarly = false;
                                    $isTooLate = $currentTotalMinutes > $endTotalMinutes - 24 * 60;
                                }
                                
                                Log::info('FINAL TIME COMPARISON - AM TIME IN', [
                                    'current_total_minutes' => $currentTotalMinutes,
                                    'start_total_minutes' => $startTotalMinutes,
                                    'end_total_minutes' => $endTotalMinutes,
                                    'is_too_early' => $isTooEarly,
                                    'is_too_late' => $isTooLate,
                                    'formatted_end_time' => $formattedEndTime
                                ]);
                                
                                if ($isTooEarly) {
                                    $isAllowed = false;
                                    $reason = 'Too early for AM Time In';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                } elseif ($isTooLate) {
                                    $isAllowed = false;
                                    $reason = 'Too late for AM Time In';
                                    $debugInfo['end_time'] = $formattedEndTime;
                                } else {
                                    $isAllowed = true;
                                    $reason = 'Within AM Time In window';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                    $debugInfo['end_time'] = $formattedEndTime;
                                }
                            }
                            break;
                            
                        case 'PM':
                            if (empty($event->timeInPM) || empty($event->timeInPMDuration)) {
                                $isAllowed = false;
                                $reason = 'PM Time In is not configured for this event';
                            } else {
                                // Get the raw time values directly from the database
                                $timeInPM = $event->timeInPM;
                                $timeInPMDuration = $event->timeInPMDuration;
                                
                                // Log all time fields for debugging
                                Log::info('PM TIME IN FIELDS', [
                                    'timeInPM' => $timeInPM,
                                    'timeInPMDuration' => $timeInPMDuration
                                ]);
                                
                                // DIRECT APPROACH: Calculate the end time - use duration directly
                                $startParts = explode(':', $timeInPM);
                                $durationParts = explode(':', $timeInPMDuration);
                                
                                $startHour = (int)$startParts[0];
                                $startMinute = (int)$startParts[1];
                                $endHour = (int)$durationParts[0];
                                $endMinute = (int)$durationParts[1];
                                
                                // Format for display
                                $formattedStartTime = sprintf('%02d:%02d:00', $startHour, $startMinute);
                                $formattedEndTime = sprintf('%02d:%02d:00', $endHour, $endMinute);
                                
                                // Get current time
                                $currentHour = $now->hour;
                                $currentMinute = $now->minute;
                                
                                // Log all calculated values
                                Log::info('DIRECT TIME CALCULATION - PM TIME IN', [
                                    'raw_start_time' => $timeInPM,
                                    'raw_duration' => $timeInPMDuration,
                                    'start_hour' => $startHour,
                                    'start_minute' => $startMinute,
                                    'end_hour' => $endHour,
                                    'end_minute' => $endMinute,
                                    'formatted_start_time' => $formattedStartTime,
                                    'formatted_end_time' => $formattedEndTime,
                                    'current_hour' => $currentHour,
                                    'current_minute' => $currentMinute
                                ]);
                                
                                // Simple time comparison
                                $currentTotalMinutes = $currentHour * 60 + $currentMinute;
                                $startTotalMinutes = $startHour * 60 + $startMinute;
                                $endTotalMinutes = $endHour * 60 + $endMinute;
                                
                                // Handle midnight crossing
                                if ($endHour < $startHour) {
                                    // End time is on the next day
                                    $endTotalMinutes += 24 * 60; // Add a full day of minutes
                                }
                                
                                $isTooEarly = $currentTotalMinutes < $startTotalMinutes;
                                $isTooLate = $currentTotalMinutes > $endTotalMinutes;
                                
                                // Handle special case for midnight crossing
                                if ($endHour < $startHour && $currentHour < $startHour) {
                                    // Current time is after midnight but before end time
                                    $isTooEarly = false;
                                    $isTooLate = $currentTotalMinutes > $endTotalMinutes - 24 * 60;
                                }
                                
                                Log::info('FINAL TIME COMPARISON - PM TIME IN', [
                                    'current_total_minutes' => $currentTotalMinutes,
                                    'start_total_minutes' => $startTotalMinutes,
                                    'end_total_minutes' => $endTotalMinutes,
                                    'is_too_early' => $isTooEarly,
                                    'is_too_late' => $isTooLate,
                                    'formatted_end_time' => $formattedEndTime
                                ]);
                                
                                if ($isTooEarly) {
                                    $isAllowed = false;
                                    $reason = 'Too early for PM Time In';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                } elseif ($isTooLate) {
                                    $isAllowed = false;
                                    $reason = 'Too late for PM Time In';
                                    $debugInfo['end_time'] = $formattedEndTime;
                                } else {
                                    $isAllowed = true;
                                    $reason = 'Within PM Time In window';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                    $debugInfo['end_time'] = $formattedEndTime;
                                }
                            }
                            break;
                            
                        case 'Night':
                            if (empty($event->timeInNight)) {
                                $isAllowed = false;
                                $reason = 'Time In Night is not configured for this event';
                            } else {
                                // Get the raw time values directly from the database
                                $timeInNight = $event->timeInNight;
                                $timeInNightDuration = $event->timeInNightDuration;
                                
                                // Log all time fields for debugging
                                Log::info('ALL TIME FIELDS FOR EVENT', [
                                    'event_id' => $event->id,
                                    'event_name' => $event->eventname,
                                    'timeInAM' => $event->timeInAM,
                                    'timeInAMDuration' => $event->timeInAMDuration,
                                    'timeOutAM' => $event->timeOutAM,
                                    'timeOutAMDuration' => $event->timeOutAMDuration,
                                    'timeInPM' => $event->timeInPM,
                                    'timeInPMDuration' => $event->timeInPMDuration,
                                    'timeOutPM' => $event->timeOutPM,
                                    'timeOutPMDuration' => $event->timeOutPMDuration,
                                    'timeInNight' => $event->timeInNight,
                                    'timeInNightDuration' => $event->timeInNightDuration,
                                    'timeOutNight' => $event->timeOutNight,
                                    'timeOutNightDuration' => $event->timeOutNightDuration
                                ]);
                                
                                // DIRECT APPROACH: Calculate the end time - use duration directly
                                $startParts = explode(':', $timeInNight);
                                $durationParts = explode(':', $timeInNightDuration);
                                
                                $startHour = (int)$startParts[0];
                                $startMinute = (int)$startParts[1];
                                $endHour = (int)$durationParts[0];
                                $endMinute = (int)$durationParts[1];
                                
                                // Format for display
                                $formattedStartTime = sprintf('%02d:%02d:00', $startHour, $startMinute);
                                $formattedEndTime = sprintf('%02d:%02d:00', $endHour, $endMinute);
                                
                                // Get current time
                                $currentHour = $now->hour;
                                $currentMinute = $now->minute;
                                $formattedCurrentTime = sprintf('%02d:%02d:00', $currentHour, $currentMinute);
                                
                                // Log all calculated values
                                Log::info('DIRECT TIME CALCULATION - NIGHT TIME IN', [
                                    'raw_start_time' => $timeInNight,
                                    'raw_duration' => $timeInNightDuration,
                                    'start_hour' => $startHour,
                                    'start_minute' => $startMinute,
                                    'end_hour' => $endHour,
                                    'end_minute' => $endMinute,
                                    'formatted_start_time' => $formattedStartTime,
                                    'formatted_end_time' => $formattedEndTime,
                                    'current_hour' => $currentHour,
                                    'current_minute' => $currentMinute
                                ]);
                                
                                // Simple time comparison
                                $currentTotalMinutes = $currentHour * 60 + $currentMinute;
                                $startTotalMinutes = $startHour * 60 + $startMinute;
                                $endTotalMinutes = $endHour * 60 + $endMinute;
                                
                                // Handle midnight crossing
                                if ($endHour < $startHour) {
                                    // End time is on the next day
                                    $endTotalMinutes += 24 * 60; // Add a full day of minutes
                                }
                                
                                $isTooEarly = $currentTotalMinutes < $startTotalMinutes;
                                $isTooLate = $currentTotalMinutes > $endTotalMinutes;
                                
                                // Handle special case for midnight crossing
                                if ($endHour < $startHour && $currentHour < $startHour) {
                                    // Current time is after midnight but before end time
                                    $isTooEarly = false;
                                    $isTooLate = $currentTotalMinutes > $endTotalMinutes - 24 * 60;
                                }
                                
                                Log::info('FINAL TIME COMPARISON - NIGHT TIME IN', [
                                    'current_total_minutes' => $currentTotalMinutes,
                                    'start_total_minutes' => $startTotalMinutes,
                                    'end_total_minutes' => $endTotalMinutes,
                                    'is_too_early' => $isTooEarly,
                                    'is_too_late' => $isTooLate,
                                    'formatted_end_time' => $formattedEndTime
                                ]);
                                
                                // Set the validation result
                                if ($isTooEarly) {
                                    $isAllowed = false;
                                    $reason = 'Too early for Night Time In';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                } elseif ($isTooLate) {
                                    $isAllowed = false;
                                    $reason = 'Too late for Night Time In';
                                    
                                    // CRITICAL: Set the correct end time in the debug info
                                    $debugInfo['end_time'] = $formattedEndTime;
                                    
                                    // Double-check that we're using the right value
                                    Log::info('SETTING END TIME IN DEBUG INFO', [
                                        'end_time_value' => $formattedEndTime,
                                        'raw_end_hour' => $endHour,
                                        'raw_end_minute' => $endMinute
                                    ]);
                                } else {
                                    $isAllowed = true;
                                    $reason = 'Within Night Time In window';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                    $debugInfo['end_time'] = $formattedEndTime;
                                }
                            }
                            break;
                    }
                } else if ($request->scan_type === 'OUT') {
                    // For OUT scans, check the appropriate timeOut field based on period
                    switch ($period) {
                        case 'AM':
                            if (empty($event->timeOutAM) || empty($event->timeOutAMDuration)) {
                                $isAllowed = false;
                                $reason = 'AM Time Out is not configured for this event';
                            } else {
                                // Get the raw time values directly from the database
                                $timeOutAM = $event->timeOutAM;
                                $timeOutAMDuration = $event->timeOutAMDuration;
                                
                                // Log all time fields for debugging
                                Log::info('AM TIME OUT FIELDS', [
                                    'timeOutAM' => $timeOutAM,
                                    'timeOutAMDuration' => $timeOutAMDuration
                                ]);
                                
                                // DIRECT APPROACH: Calculate the end time - use duration directly
                                $startParts = explode(':', $timeOutAM);
                                $durationParts = explode(':', $timeOutAMDuration);
                                
                                $startHour = (int)$startParts[0];
                                $startMinute = (int)$startParts[1];
                                $endHour = (int)$durationParts[0];
                                $endMinute = (int)$durationParts[1];
                                
                                // Format for display
                                $formattedStartTime = sprintf('%02d:%02d:00', $startHour, $startMinute);
                                $formattedEndTime = sprintf('%02d:%02d:00', $endHour, $endMinute);
                                
                                // Get current time
                                $currentHour = $now->hour;
                                $currentMinute = $now->minute;
                                
                                // Log all calculated values
                                Log::info('DIRECT TIME CALCULATION - AM TIME OUT', [
                                    'raw_start_time' => $timeOutAM,
                                    'raw_duration' => $timeOutAMDuration,
                                    'start_hour' => $startHour,
                                    'start_minute' => $startMinute,
                                    'end_hour' => $endHour,
                                    'end_minute' => $endMinute,
                                    'formatted_start_time' => $formattedStartTime,
                                    'formatted_end_time' => $formattedEndTime,
                                    'current_hour' => $currentHour,
                                    'current_minute' => $currentMinute
                                ]);
                                
                                // Simple time comparison
                                $currentTotalMinutes = $currentHour * 60 + $currentMinute;
                                $startTotalMinutes = $startHour * 60 + $startMinute;
                                $endTotalMinutes = $endHour * 60 + $endMinute;
                                
                                // Handle midnight crossing
                                if ($endHour < $startHour) {
                                    // End time is on the next day
                                    $endTotalMinutes += 24 * 60; // Add a full day of minutes
                                }
                                
                                $isTooEarly = $currentTotalMinutes < $startTotalMinutes;
                                $isTooLate = $currentTotalMinutes > $endTotalMinutes;
                                
                                // Handle special case for midnight crossing
                                if ($endHour < $startHour && $currentHour < $startHour) {
                                    // Current time is after midnight but before end time
                                    $isTooEarly = false;
                                    $isTooLate = $currentTotalMinutes > $endTotalMinutes - 24 * 60;
                                }
                                
                                Log::info('FINAL TIME COMPARISON - AM TIME OUT', [
                                    'current_total_minutes' => $currentTotalMinutes,
                                    'start_total_minutes' => $startTotalMinutes,
                                    'end_total_minutes' => $endTotalMinutes,
                                    'is_too_early' => $isTooEarly,
                                    'is_too_late' => $isTooLate,
                                    'formatted_end_time' => $formattedEndTime
                                ]);
                                
                                if ($isTooEarly) {
                                    $isAllowed = false;
                                    $reason = 'Too early for AM Time Out';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                } elseif ($isTooLate) {
                                    $isAllowed = false;
                                    $reason = 'Too late for AM Time Out';
                                    $debugInfo['end_time'] = $formattedEndTime;
                                } else {
                                    $isAllowed = true;
                                    $reason = 'Within AM Time Out window';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                    $debugInfo['end_time'] = $formattedEndTime;
                                }
                            }
                            break;
                            
                        case 'PM':
                            if (empty($event->timeOutPM) || empty($event->timeOutPMDuration)) {
                                $isAllowed = false;
                                $reason = 'PM Time Out is not configured for this event';
                            } else {
                                // Get the raw time values directly from the database
                                $timeOutPM = $event->timeOutPM;
                                $timeOutPMDuration = $event->timeOutPMDuration;
                                
                                // Log all time fields for debugging
                                Log::info('PM TIME OUT FIELDS', [
                                    'timeOutPM' => $timeOutPM,
                                    'timeOutPMDuration' => $timeOutPMDuration
                                ]);
                                
                                // DIRECT APPROACH: Calculate the end time - use duration directly
                                $startParts = explode(':', $timeOutPM);
                                $durationParts = explode(':', $timeOutPMDuration);
                                
                                $startHour = (int)$startParts[0];
                                $startMinute = (int)$startParts[1];
                                $endHour = (int)$durationParts[0];
                                $endMinute = (int)$durationParts[1];
                                
                                // Format for display
                                $formattedStartTime = sprintf('%02d:%02d:00', $startHour, $startMinute);
                                $formattedEndTime = sprintf('%02d:%02d:00', $endHour, $endMinute);
                                
                                // Get current time
                                $currentHour = $now->hour;
                                $currentMinute = $now->minute;
                                
                                // Log all calculated values
                                Log::info('DIRECT TIME CALCULATION - PM TIME OUT', [
                                    'raw_start_time' => $timeOutPM,
                                    'raw_duration' => $timeOutPMDuration,
                                    'start_hour' => $startHour,
                                    'start_minute' => $startMinute,
                                    'end_hour' => $endHour,
                                    'end_minute' => $endMinute,
                                    'formatted_start_time' => $formattedStartTime,
                                    'formatted_end_time' => $formattedEndTime,
                                    'current_hour' => $currentHour,
                                    'current_minute' => $currentMinute
                                ]);
                                
                                // Simple time comparison
                                $currentTotalMinutes = $currentHour * 60 + $currentMinute;
                                $startTotalMinutes = $startHour * 60 + $startMinute;
                                $endTotalMinutes = $endHour * 60 + $endMinute;
                                
                                // Handle midnight crossing
                                if ($endHour < $startHour) {
                                    // End time is on the next day
                                    $endTotalMinutes += 24 * 60; // Add a full day of minutes
                                }
                                
                                $isTooEarly = $currentTotalMinutes < $startTotalMinutes;
                                $isTooLate = $currentTotalMinutes > $endTotalMinutes;
                                
                                // Handle special case for midnight crossing
                                if ($endHour < $startHour && $currentHour < $startHour) {
                                    // Current time is after midnight but before end time
                                    $isTooEarly = false;
                                    $isTooLate = $currentTotalMinutes > $endTotalMinutes - 24 * 60;
                                }
                                
                                Log::info('FINAL TIME COMPARISON - PM TIME OUT', [
                                    'current_total_minutes' => $currentTotalMinutes,
                                    'start_total_minutes' => $startTotalMinutes,
                                    'end_total_minutes' => $endTotalMinutes,
                                    'is_too_early' => $isTooEarly,
                                    'is_too_late' => $isTooLate,
                                    'formatted_end_time' => $formattedEndTime
                                ]);
                                
                                if ($isTooEarly) {
                                    $isAllowed = false;
                                    $reason = 'Too early for PM Time Out';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                } elseif ($isTooLate) {
                                    $isAllowed = false;
                                    $reason = 'Too late for PM Time Out';
                                    $debugInfo['end_time'] = $formattedEndTime;
                                } else {
                                    $isAllowed = true;
                                    $reason = 'Within PM Time Out window';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                    $debugInfo['end_time'] = $formattedEndTime;
                                }
                            }
                            break;
                            
                        case 'Night':
                            if (empty($event->timeOutNight)) {
                                $isAllowed = false;
                                $reason = 'Time Out Night is not configured for this event';
                            } else {
                                // Get the raw time values directly from the database
                                $timeOutNight = $event->timeOutNight;
                                $timeOutNightDuration = $event->timeOutNightDuration;
                                
                                // Log all time fields for debugging
                                Log::info('ALL TIME FIELDS FOR EVENT', [
                                    'event_id' => $event->id,
                                    'event_name' => $event->eventname,
                                    'timeInAM' => $event->timeInAM,
                                    'timeInAMDuration' => $event->timeInAMDuration,
                                    'timeOutAM' => $event->timeOutAM,
                                    'timeOutAMDuration' => $event->timeOutAMDuration,
                                    'timeInPM' => $event->timeInPM,
                                    'timeInPMDuration' => $event->timeInPMDuration,
                                    'timeOutPM' => $event->timeOutPM,
                                    'timeOutPMDuration' => $event->timeOutPMDuration,
                                    'timeInNight' => $event->timeInNight,
                                    'timeInNightDuration' => $event->timeInNightDuration,
                                    'timeOutNight' => $event->timeOutNight,
                                    'timeOutNightDuration' => $event->timeOutNightDuration
                                ]);
                                
                                // DIRECT APPROACH: Calculate the end time - use duration directly
                                $startParts = explode(':', $timeOutNight);
                                $durationParts = explode(':', $timeOutNightDuration);
                                
                                $startHour = (int)$startParts[0];
                                $startMinute = (int)$startParts[1];
                                $endHour = (int)$durationParts[0];
                                $endMinute = (int)$durationParts[1];
                                
                                // Format for display
                                $formattedStartTime = sprintf('%02d:%02d:00', $startHour, $startMinute);
                                $formattedEndTime = sprintf('%02d:%02d:00', $endHour, $endMinute);
                                
                                // Get current time
                                $currentHour = $now->hour;
                                $currentMinute = $now->minute;
                                $formattedCurrentTime = sprintf('%02d:%02d:00', $currentHour, $currentMinute);
                                
                                // Log all calculated values
                                Log::info('DIRECT TIME CALCULATION - NIGHT TIME OUT', [
                                    'raw_start_time' => $timeOutNight,
                                    'raw_duration' => $timeOutNightDuration,
                                    'start_hour' => $startHour,
                                    'start_minute' => $startMinute,
                                    'end_hour' => $endHour,
                                    'end_minute' => $endMinute,
                                    'formatted_start_time' => $formattedStartTime,
                                    'formatted_end_time' => $formattedEndTime,
                                    'current_hour' => $currentHour,
                                    'current_minute' => $currentMinute
                                ]);
                                
                                // Simple time comparison
                                $currentTotalMinutes = $currentHour * 60 + $currentMinute;
                                $startTotalMinutes = $startHour * 60 + $startMinute;
                                $endTotalMinutes = $endHour * 60 + $endMinute;
                                
                                // Handle midnight crossing
                                if ($endHour < $startHour) {
                                    // End time is on the next day
                                    $endTotalMinutes += 24 * 60; // Add a full day of minutes
                                }
                                
                                $isTooEarly = $currentTotalMinutes < $startTotalMinutes;
                                $isTooLate = $currentTotalMinutes > $endTotalMinutes;
                                
                                // Handle special case for midnight crossing
                                if ($endHour < $startHour && $currentHour < $startHour) {
                                    // Current time is after midnight but before end time
                                    $isTooEarly = false;
                                    $isTooLate = $currentTotalMinutes > $endTotalMinutes - 24 * 60;
                                }
                                
                                Log::info('FINAL TIME COMPARISON - NIGHT TIME OUT', [
                                    'current_total_minutes' => $currentTotalMinutes,
                                    'start_total_minutes' => $startTotalMinutes,
                                    'end_total_minutes' => $endTotalMinutes,
                                    'is_too_early' => $isTooEarly,
                                    'is_too_late' => $isTooLate,
                                    'formatted_end_time' => $formattedEndTime
                                ]);
                                
                                // Set the validation result
                                if ($isTooEarly) {
                                    $isAllowed = false;
                                    $reason = 'Too early for Night Time Out';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                } elseif ($isTooLate) {
                                    $isAllowed = false;
                                    $reason = 'Too late for Night Time Out';
                                    
                                    // CRITICAL: Set the correct end time in the debug info
                                    $debugInfo['end_time'] = $formattedEndTime;
                                    
                                    // Double-check that we're using the right value
                                    Log::info('SETTING END TIME IN DEBUG INFO', [
                                        'end_time_value' => $formattedEndTime,
                                        'raw_end_hour' => $endHour,
                                        'raw_end_minute' => $endMinute
                                    ]);
                                } else {
                                    $isAllowed = true;
                                    $reason = 'Within Night Time Out window';
                                    $debugInfo['start_time'] = $formattedStartTime;
                                    $debugInfo['end_time'] = $formattedEndTime;
                                }
                            }
                            break;
                    }
                }
                
                $debugInfo['allowed'] = $isAllowed;
                $debugInfo['reason'] = $reason;
                
                Log::info('Time window validation result', [
                    'is_allowed' => $isAllowed,
                    'reason' => $reason,
                    'period' => $period,
                    'scan_type' => $request->scan_type
                ]);
                
                // If not allowed and not forcing, return error
                if (!$isAllowed && !$forceRecord) {
                    return response()->json([
                        'success' => false,
                        'message' => $reason,
                        'debug_info' => $debugInfo
                    ], 400);
                }
            } else {
                $debugInfo['allowed'] = true;
                $debugInfo['reason'] = 'Force record enabled - bypassing time window checks';
                Log::info('Force record enabled - bypassing time window checks');
            }
            
            // Check if attendance record already exists for today
            $attendance = Attendance::where('user_id', $student->id)
                                  ->where('event_id', $event->id)
                                  ->where('date', $today)
                                  ->first();
            
            // Log attendance record status
            $fieldUpdated = false;
            if ($attendance) {
                Log::info('Found existing attendance record', [
                    'attendance_id' => $attendance->id,
                    'time_in_am' => $attendance->time_in_am,
                    'time_out_am' => $attendance->time_out_am,
                    'time_in_pm' => $attendance->time_in_pm,
                    'time_out_pm' => $attendance->time_out_pm,
                    'time_in_night' => $attendance->time_in_night,
                    'time_out_night' => $attendance->time_out_night
                ]);
                
                // Update the appropriate time field based on scan type and period
                if ($scanType === 'IN') {
                    if ($this->isInAMPeriod($currentTime)) {
                        $attendance->time_in_am = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Updating time_in_am field to ' . $currentTime);
                    } elseif ($this->isInPMPeriod($currentTime)) {
                        $attendance->time_in_pm = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Updating time_in_pm field to ' . $currentTime);
                    } elseif ($this->isInNightPeriod($currentTime)) {
                        $attendance->time_in_night = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Updating time_in_night field to ' . $currentTime);
                    } else {
                        Log::warning('No appropriate time field found to update for IN scan at time: ' . $currentTime);
                    }
                } else { // OUT
                    if ($this->isInAMPeriod($currentTime)) {
                        $attendance->time_out_am = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Updating time_out_am field to ' . $currentTime);
                    } elseif ($this->isInPMPeriod($currentTime)) {
                        $attendance->time_out_pm = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Updating time_out_pm field to ' . $currentTime);
                    } elseif ($this->isInNightPeriod($currentTime)) {
                        $attendance->time_out_night = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Updating time_out_night field to ' . $currentTime);
                    } else {
                        Log::warning('No appropriate time field found to update for OUT scan at time: ' . $currentTime);
                    }
                }
            } else {
                // Create a new attendance record
                Log::info('Creating new attendance record');
                $attendance = new Attendance();
                $attendance->user_id = $student->id;
                $attendance->event_id = $event->id;
                $attendance->rfid = $student->rfid;
                $attendance->date = $today;
                
                // Initialize all time fields to null
                $attendance->time_in_am = null;
                $attendance->time_out_am = null;
                $attendance->time_in_pm = null;
                $attendance->time_out_pm = null;
                $attendance->time_in_night = null;
                $attendance->time_out_night = null;
                
                // Set the appropriate time field based on scan type and period
                if ($scanType === 'IN') {
                    if ($this->isInAMPeriod($currentTime)) {
                        $attendance->time_in_am = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Setting time_in_am field to ' . $currentTime);
                    } elseif ($this->isInPMPeriod($currentTime)) {
                        $attendance->time_in_pm = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Setting time_in_pm field to ' . $currentTime);
                    } elseif ($this->isInNightPeriod($currentTime)) {
                        $attendance->time_in_night = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Setting time_in_night field to ' . $currentTime);
                    } else {
                        Log::warning('No appropriate time field found to set for IN scan at time: ' . $currentTime);
                    }
                } else { // OUT
                    if ($this->isInAMPeriod($currentTime)) {
                        $attendance->time_out_am = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Setting time_out_am field to ' . $currentTime);
                    } elseif ($this->isInPMPeriod($currentTime)) {
                        $attendance->time_out_pm = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Setting time_out_pm field to ' . $currentTime);
                    } elseif ($this->isInNightPeriod($currentTime)) {
                        $attendance->time_out_night = $currentTime;
                        $fieldUpdated = true;
                        Log::info('Setting time_out_night field to ' . $currentTime);
                    } else {
                        Log::warning('No appropriate time field found to set for OUT scan at time: ' . $currentTime);
                    }
                }
            }

            
            if (!$fieldUpdated) {
                Log::error('No time field was updated. Attendance record may not reflect the scan.');
            }
            
            // Save the attendance record
            try {
                $attendance->save();
                
                // Also update or create a record in the absent_fines table
                $absentFine = AbsentFine::where('user_id', $student->id)
                    ->where('event_id', $event->id)
                    ->where('date', $today)
                    ->first();
                
                if ($absentFine) {
                    // Update the existing record with the attendance time
                    if ($scanType === 'IN') {
                        if ($this->isInAMPeriod($currentTime)) {
                            $absentFine->time_in_am = $currentTime;
                        } elseif ($this->isInPMPeriod($currentTime)) {
                            $absentFine->time_in_pm = $currentTime;
                        } elseif ($this->isInNightPeriod($currentTime)) {
                            $absentFine->time_in_night = $currentTime;
                        }
                    } else { // OUT
                        if ($this->isInAMPeriod($currentTime)) {
                            $absentFine->time_out_am = $currentTime;
                        } elseif ($this->isInPMPeriod($currentTime)) {
                            $absentFine->time_out_pm = $currentTime;
                        } elseif ($this->isInNightPeriod($currentTime)) {
                            $absentFine->time_out_night = $currentTime;
                        }
                    }
                    $absentFine->save();
                    
                    Log::info('Updated absent fine record with attendance time', [
                        'student_id' => $student->id,
                        'event_id' => $event->id,
                        'column' => $scanType === 'IN' ? ($this->isInAMPeriod($currentTime) ? 'time_in_am' : ($this->isInPMPeriod($currentTime) ? 'time_in_pm' : 'time_in_night')) : ($this->isInAMPeriod($currentTime) ? 'time_out_am' : ($this->isInPMPeriod($currentTime) ? 'time_out_pm' : 'time_out_night')),
                        'time' => $currentTime
                    ]);
                } else {
                    // Create a new record in absent_fines table
                    $newAbsentFine = new AbsentFine();
                    $newAbsentFine->user_id = $student->id;
                    $newAbsentFine->event_id = $event->id;
                    $newAbsentFine->date = $today;
                    
                    if ($scanType === 'IN') {
                        if ($this->isInAMPeriod($currentTime)) {
                            $newAbsentFine->time_in_am = $currentTime;
                        } elseif ($this->isInPMPeriod($currentTime)) {
                            $newAbsentFine->time_in_pm = $currentTime;
                        } elseif ($this->isInNightPeriod($currentTime)) {
                            $newAbsentFine->time_in_night = $currentTime;
                        }
                    } else { // OUT
                        if ($this->isInAMPeriod($currentTime)) {
                            $newAbsentFine->time_out_am = $currentTime;
                        } elseif ($this->isInPMPeriod($currentTime)) {
                            $newAbsentFine->time_out_pm = $currentTime;
                        } elseif ($this->isInNightPeriod($currentTime)) {
                            $newAbsentFine->time_out_night = $currentTime;
                        }
                    }
                    $newAbsentFine->fine_amount = 0.00; // No fine since student attended
                    $newAbsentFine->status = 'paid'; // Automatically mark as paid since student attended
                    $newAbsentFine->save();
                    
                    Log::info('Created new absent fine record with attendance time', [
                        'student_id' => $student->id,
                        'event_id' => $event->id,
                        'column' => $scanType === 'IN' ? ($this->isInAMPeriod($currentTime) ? 'time_in_am' : ($this->isInPMPeriod($currentTime) ? 'time_in_pm' : 'time_in_night')) : ($this->isInAMPeriod($currentTime) ? 'time_out_am' : ($this->isInPMPeriod($currentTime) ? 'time_out_pm' : 'time_out_night')),
                        'time' => $currentTime
                    ]);
                }
            } catch (\Exception $saveException) {
                Log::error('Error saving attendance record: ' . $saveException->getMessage(), [
                    'exception' => $saveException,
                    'attendance_data' => $attendance->toArray()
                ]);
                
                throw $saveException;
            }
            
            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Attendance recorded successfully',
                'student' => $student,
                'attendance' => $attendance,
                'debug_info' => $debugInfo
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error recording attendance: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to record attendance: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get attendance records for today, optionally filtered by event_id
     */
    public function getAttendanceRecords(Request $request)
    {
        try {
            $today = Carbon::now()->toDateString();
            $query = Attendance::where('date', $today)->with(['user', 'event']);
            
            // Filter by event_id if provided
            if ($request->has('event_id')) {
                $query->where('event_id', $request->event_id);
            }
            
            $records = $query->get();
            
            return response()->json([
                'success' => true,
                'records' => $records
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance records: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attendance records: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Check if the current time is in the AM period (00:00:00 - 12:00:00)
     */
    private function isInAMPeriod($time)
    {
        // Parse the time to ensure we're working with a proper time object
        $timeParsed = Carbon::parse($time);
        $hour = $timeParsed->hour;
        
        Log::info("Checking if time {$time} is in AM period: hour = {$hour}, result = " . ($hour >= 1 && $hour < 12));
        return $hour >= 1 && $hour < 12;
    }
    
    /**
     * Check if the current time is in the PM period (12:00:01 - 18:00:00)
     */
    private function isInPMPeriod($time)
    {
        // Parse the time to ensure we're working with a proper time object
        $timeParsed = Carbon::parse($time);
        $hour = $timeParsed->hour;
        
        Log::info("Checking if time {$time} is in PM period: hour = {$hour}, result = " . ($hour >= 12 && $hour < 18));
        return $hour >= 12 && $hour < 18;
    }
    
    /**
     * Check if the current time is in the Night period (18:00:01 - 23:59:59)
     */
    private function isInNightPeriod($time)
    {
        // Parse the time to ensure we're working with a proper time object
        $timeParsed = Carbon::parse($time);
        $hour = $timeParsed->hour;
        
        Log::info("Checking if time {$time} is in Night period: hour = {$hour}, result = " . ($hour >= 18));
        return $hour >= 18;
    }
    
    /**
     * Check if an event has any time fields configured
     * 
     * @param Event $event The event to check
     * @return bool True if the event has at least one time field configured, false otherwise
     */
    private function eventHasTimeFields($event)
    {
        // Check if any of the time fields are set
        return $event->timeInAM !== null ||
               $event->timeOutAM !== null ||
               $event->timeInPM !== null ||
               $event->timeOutPM !== null ||
               $event->timeInNight !== null ||
               $event->timeOutNight !== null;
    }
    
    /**
     * Mark students as absent if they haven't tapped their card for a specific event
     */
    public function markAbsentStudents(Request $request)
    {
        try {
            // Validate request
            $request->validate([
                'event_id' => 'required|exists:events,id',
                'fine_amount' => 'nullable|numeric|min:0',
            ]);
            
            // Get the event
            $event = Event::find($request->event_id);
            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Event not found'
                ], 404);
            }
            
            // Get current date in Asia/Manila timezone
            $today = Carbon::now('Asia/Manila')->toDateString();
            
            // Log the date comparison for debugging
            Log::info('Date comparison for markAbsentStudents', [
                'today' => $today,
                'event_date' => $event->date,
                'timezone' => Carbon::now('Asia/Manila')->tzName
            ]);
            
            // Check if the event is for today - we'll allow it even if dates don't match exactly
            // This is to accommodate potential timezone issues
            $isEventToday = true; // Always allow marking absent
            
            // Check if the event has any time fields configured
            $hasTimeFields = $this->eventHasTimeFields($event);
            
            if (!$hasTimeFields) {
                return response()->json([
                    'success' => false,
                    'message' => 'This event has no time fields configured. Please configure time fields before marking attendance.'
                ], 400);
            }
            
            // Get all students (users with role 'student')
            $students = User::where('role', 'student')->get();
            
            // Get all attendance records for this event and today
            $existingAttendances = Attendance::where('event_id', $event->id)
                                           ->where('date', $today)
                                           ->get()
                                           ->keyBy('user_id');
            
            // Get all absent fine records for this event and today
            $existingAbsentFines = AbsentFine::where('event_id', $event->id)
                                           ->where('date', $today)
                                           ->get()
                                           ->keyBy('user_id');
            
            $markedCount = 0;
            $alreadyMarkedCount = 0;
            $absentFinesCreated = 0;
            $absentFinesUpdated = 0;
            
            // Get the fine amount for absences from the fines table
            $absentFine = Fines::where('violation', 'Absence')->first();
            
            // Use the fine amount from the database, or the provided amount, or a default
            $fineAmount = $request->has('fine_amount') 
                ? $request->fine_amount 
                : ($absentFine ? $absentFine->amount : 100.00);
                
            Log::info('Using fine amount for absences', [
                'amount' => $fineAmount,
                'source' => $request->has('fine_amount') ? 'request' : ($absentFine ? 'database' : 'default')
            ]);
            
            // Process each student
            foreach ($students as $student) {
                // Check if student already has an attendance record
                if (isset($existingAttendances[$student->id])) {
                    // Student already has an attendance record
                    $attendance = $existingAttendances[$student->id];
                    
                    // We'll mark all null fields as 'Absent' regardless of whether the student has attendance in other columns
                    $hasChanges = false;
                    
                    // Mark all applicable time periods as 'Absent' if they are null
                    if ($event->timeInAM && ($attendance->time_in_am === null)) {
                        $attendance->time_in_am = 'Absent';
                        $hasChanges = true;
                    }
                    
                    if ($event->timeOutAM && ($attendance->time_out_am === null)) {
                        $attendance->time_out_am = 'Absent';
                        $hasChanges = true;
                    }
                    
                    if ($event->timeInPM && ($attendance->time_in_pm === null)) {
                        $attendance->time_in_pm = 'Absent';
                        $hasChanges = true;
                    }
                    
                    if ($event->timeOutPM && ($attendance->time_out_pm === null)) {
                        $attendance->time_out_pm = 'Absent';
                        $hasChanges = true;
                    }
                    
                    if ($event->timeInNight && ($attendance->time_in_night === null)) {
                        $attendance->time_in_night = 'Absent';
                        $hasChanges = true;
                    }
                    
                    if ($event->timeOutNight && ($attendance->time_out_night === null)) {
                        $attendance->time_out_night = 'Absent';
                        $hasChanges = true;
                    }
                    
                    // Save if changes were made
                    if ($hasChanges) {
                        // Save the attendance record
                        $attendance->save();
                        $markedCount++;
                        Log::info('Updated existing attendance record with absent marks', [
                            'student_id' => $student->id,
                            'student_name' => $student->name
                        ]);
                        
                        // Also update or create record in absent_fines table if the student is marked absent
                        $this->updateOrCreateAbsentFineRecord($student->id, $event->id, $today, $attendance, $fineAmount, $existingAbsentFines, $absentFinesCreated, $absentFinesUpdated);
                    } else {
                        $alreadyMarkedCount++;
                    }
                } else {
                    // Create a new attendance record for the student
                    $attendance = new Attendance();
                    $attendance->user_id = $student->id;
                    $attendance->event_id = $event->id;
                    $attendance->rfid = $student->rfid;
                    $attendance->date = $today;
                    
                    // Mark all applicable time periods as 'Absent'
                    // Check each time field in the event and mark as 'Absent' if configured
                    $attendance->time_in_am = $event->timeInAM ? 'Absent' : null;
                    $attendance->time_out_am = $event->timeOutAM ? 'Absent' : null;
                    $attendance->time_in_pm = $event->timeInPM ? 'Absent' : null;
                    $attendance->time_out_pm = $event->timeOutPM ? 'Absent' : null;
                    $attendance->time_in_night = $event->timeInNight ? 'Absent' : null;
                    $attendance->time_out_night = $event->timeOutNight ? 'Absent' : null;
                    
                    // Log the fields being marked as absent
                    Log::info('Creating new attendance record with absent marks', [
                        'student_id' => $student->id,
                        'student_name' => $student->name,
                        'time_in_am' => $attendance->time_in_am,
                        'time_out_am' => $attendance->time_out_am,
                        'time_in_pm' => $attendance->time_in_pm,
                        'time_out_pm' => $attendance->time_out_pm,
                        'time_in_night' => $attendance->time_in_night,
                        'time_out_night' => $attendance->time_out_night
                    ]);
                    
                    $attendance->save();
                    $markedCount++;
                    
                    // Also create record in absent_fines table
                    $this->updateOrCreateAbsentFineRecord($student->id, $event->id, $today, $attendance, $fineAmount, $existingAbsentFines, $absentFinesCreated, $absentFinesUpdated);
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => "Successfully marked {$markedCount} students as absent. Created {$absentFinesCreated} and updated {$absentFinesUpdated} absent fine records.",
                'marked_count' => $markedCount,
                'already_marked_count' => $alreadyMarkedCount,
                'absent_fines_created' => $absentFinesCreated,
                'absent_fines_updated' => $absentFinesUpdated,
                'total_students' => $students->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error marking absent students: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark absent students: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Helper method to update or create a record in the absent_fines table
     * 
     * @param int $userId The user ID
     * @param int $eventId The event ID
     * @param string $date The date of the absence
     * @param Attendance $attendance The attendance record
     * @param float $fineAmount The fine amount
     * @param Collection $existingAbsentFines Collection of existing absent fine records
     * @param int &$absentFinesCreated Reference to counter for created records
     * @param int &$absentFinesUpdated Reference to counter for updated records
     * @return void
     */
    private function updateOrCreateAbsentFineRecord($userId, $eventId, $date, $attendance, $fineAmount, $existingAbsentFines, &$absentFinesCreated, &$absentFinesUpdated)
    {
        // Check if any of the time fields are marked as 'Absent'
        $hasAbsence = false;
        
        if ($attendance->time_in_am === 'Absent' || $attendance->time_out_am === 'Absent' ||
            $attendance->time_in_pm === 'Absent' || $attendance->time_out_pm === 'Absent' ||
            $attendance->time_in_night === 'Absent' || $attendance->time_out_night === 'Absent') {
            $hasAbsence = true;
        }
        
        // Only create or update record if there's an absence
        if ($hasAbsence) {
            // Check if there's already an absent fine record for this student and event
            if (isset($existingAbsentFines[$userId])) {
                // Update existing record
                $absentFine = $existingAbsentFines[$userId];
                $absentFine->time_in_am = $attendance->time_in_am;
                $absentFine->time_out_am = $attendance->time_out_am;
                $absentFine->time_in_pm = $attendance->time_in_pm;
                $absentFine->time_out_pm = $attendance->time_out_pm;
                $absentFine->time_in_night = $attendance->time_in_night;
                $absentFine->time_out_night = $attendance->time_out_night;
                $absentFine->fine_amount = $fineAmount;
                $absentFine->save();
                $absentFinesUpdated++;
            } else {
                // Create new record
                AbsentFine::create([
                    'user_id' => $userId,
                    'event_id' => $eventId,
                    'date' => $date,
                    'time_in_am' => $attendance->time_in_am,
                    'time_out_am' => $attendance->time_out_am,
                    'time_in_pm' => $attendance->time_in_pm,
                    'time_out_pm' => $attendance->time_out_pm,
                    'time_in_night' => $attendance->time_in_night,
                    'time_out_night' => $attendance->time_out_night,
                    'fine_amount' => $fineAmount,
                    'status' => 'pending'
                ]);
                $absentFinesCreated++;
            }
        }
    }
}
