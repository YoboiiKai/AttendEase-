<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AbsentFine;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AbsentFinesController extends Controller
{
    /**
     * Get absent fine reports for admin dashboard
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAbsentFineReports(Request $request)
    {
        try {
            // Get the period filter if provided
            $period = $request->input('period', 'All');
            
            // Base query to get events with absent fines
            $query = DB::table('events')
                ->join('absent_fines', 'events.id', '=', 'absent_fines.event_id')
                ->select(
                    'events.id',
                    'events.eventname as event',
                    'events.date',
                    'events.location',
                    DB::raw('COUNT(DISTINCT absent_fines.user_id) as absent_count'),
                    DB::raw('SUM(absent_fines.fine_amount) as total_fine_amount'),
                    DB::raw('COUNT(CASE WHEN absent_fines.status = "paid" THEN 1 END) * 100.0 / COUNT(*) as payment_rate')
                )
                ->groupBy('events.id', 'events.eventname', 'events.date', 'events.location');
            
            // Apply period filter if specified
            if ($period !== 'All') {
                $now = now();
                
                switch ($period) {
                    case 'Daily':
                        $query->whereDate('events.date', $now->toDateString());
                        break;
                    case 'Weekly':
                        $query->whereBetween('events.date', [
                            $now->startOfWeek()->toDateString(),
                            $now->endOfWeek()->toDateString()
                        ]);
                        break;
                    case 'Monthly':
                        $query->whereMonth('events.date', $now->month)
                              ->whereYear('events.date', $now->year);
                        break;
                    case 'Quarterly':
                        $currentQuarter = ceil($now->month / 3);
                        $startMonth = ($currentQuarter - 1) * 3 + 1;
                        $endMonth = $currentQuarter * 3;
                        
                        $query->whereMonth('events.date', '>=', $startMonth)
                              ->whereMonth('events.date', '<=', $endMonth)
                              ->whereYear('events.date', $now->year);
                        break;
                    case 'Annual':
                        $query->whereYear('events.date', $now->year);
                        break;
                }
            }
            
            // Get all reports
            $reports = $query->get();
            
            // Format the reports
            $formattedReports = $reports->map(function ($report) {
                // Determine event status
                $eventDate = new \DateTime($report->date);
                $now = new \DateTime();
                
                if ($eventDate > $now) {
                    $status = 'Upcoming';
                } elseif ($eventDate->format('Y-m-d') === $now->format('Y-m-d')) {
                    $status = 'Ongoing';
                } else {
                    $status = 'Completed';
                }
                
                return [
                    'id' => $report->id,
                    'event' => $report->event,
                    'date' => $report->date,
                    'location' => $report->location,
                    'absent_count' => (int) $report->absent_count,
                    'total_fine_amount' => (float) $report->total_fine_amount,
                    'payment_rate' => round($report->payment_rate, 2),
                    'status' => $status
                ];
            });
            
            return response()->json([
                'success' => true,
                'reports' => $formattedReports
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching absent fine reports: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch absent fine reports: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get absent fine details for a specific event
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAbsentFineDetails(Request $request)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'event_id' => 'required|exists:events,id'
            ]);
            
            // Get the event ID
            $eventId = $validated['event_id'];
            
            // Get the standard fine amount for absences from the fines table
            $standardFineAmount = DB::table('fines')
                ->where(function($query) {
                    $query->where('violation', 'like', '%absent%')
                          ->orWhere('description', 'like', '%absent%');
                })
                ->value('amount') ?? 50.00; // Default to 50 if not found
            
            // Get all absent fines for this event
            $absentFines = DB::table('absent_fines')
                ->join('users', 'absent_fines.user_id', '=', 'users.id')
                ->join('events', 'absent_fines.event_id', '=', 'events.id')
                ->where('absent_fines.event_id', $eventId)
                ->select(
                    'absent_fines.id',
                    'absent_fines.user_id',
                    'users.name',
                    'users.studentNo as student_id',
                    'users.year',
                    'users.section',
                    'absent_fines.fine_amount',
                    'absent_fines.status as payment_status',
                    'absent_fines.date',
                    'events.eventname as event_name',
                    'absent_fines.time_in_am',
                    'absent_fines.time_out_am',
                    'absent_fines.time_in_pm',
                    'absent_fines.time_out_pm',
                    'absent_fines.time_in_night',
                    'absent_fines.time_out_night'
                )
                ->get();
            
            // Group by student to get summary data and calculate absence counts
            $studentSummary = [];
            $studentAbsenceCounts = [];
            $studentTimeAbsences = [];
            
            foreach ($absentFines as $fine) {
                $userId = $fine->user_id;
                
                // Initialize student absence tracking
                if (!isset($studentAbsenceCounts[$userId])) {
                    $studentAbsenceCounts[$userId] = 0;
                }
                
                // Initialize student time absences tracking
                if (!isset($studentTimeAbsences[$userId])) {
                    $studentTimeAbsences[$userId] = 0;
                }
                
                // Count time period absences
                $timeAbsences = 0;
                if (isset($fine->time_in_am) && $fine->time_in_am === 'Absent') $timeAbsences++;
                if (isset($fine->time_out_am) && $fine->time_out_am === 'Absent') $timeAbsences++;
                if (isset($fine->time_in_pm) && $fine->time_in_pm === 'Absent') $timeAbsences++;
                if (isset($fine->time_out_pm) && $fine->time_out_pm === 'Absent') $timeAbsences++;
                if (isset($fine->time_in_night) && $fine->time_in_night === 'Absent') $timeAbsences++;
                if (isset($fine->time_out_night) && $fine->time_out_night === 'Absent') $timeAbsences++;
                
                // Add to student's total time absences
                $studentTimeAbsences[$userId] += $timeAbsences;
                
                // Increment record count
                $studentAbsenceCounts[$userId]++;
                
                // Build student summary
                if (!isset($studentSummary[$userId])) {
                    $studentSummary[$userId] = [
                        'user_id' => $userId,
                        'name' => $fine->name,
                        'student_id' => $fine->student_id,
                        'year' => $fine->year,
                        'section' => $fine->section,
                        'absent_count' => 0,
                        'total_fine_amount' => 0
                    ];
                }
                
                $studentSummary[$userId]['absent_count']++;
                $studentSummary[$userId]['total_fine_amount'] += (float) $fine->fine_amount;
            }
            
            // Format the data
            $fineDetails = $absentFines->map(function ($fine) use ($studentAbsenceCounts, $studentTimeAbsences, $standardFineAmount) {
                // Convert payment status to title case for display
                $paymentStatus = ucfirst($fine->payment_status);
                
                // Calculate reason based on time periods
                $reasons = [];
                $timeAbsences = 0;
                if (isset($fine->time_in_am) && $fine->time_in_am === 'Absent') { $reasons[] = 'Morning In'; $timeAbsences++; }
                if (isset($fine->time_out_am) && $fine->time_out_am === 'Absent') { $reasons[] = 'Morning Out'; $timeAbsences++; }
                if (isset($fine->time_in_pm) && $fine->time_in_pm === 'Absent') { $reasons[] = 'Afternoon In'; $timeAbsences++; }
                if (isset($fine->time_out_pm) && $fine->time_out_pm === 'Absent') { $reasons[] = 'Afternoon Out'; $timeAbsences++; }
                if (isset($fine->time_in_night) && $fine->time_in_night === 'Absent') { $reasons[] = 'Night In'; $timeAbsences++; }
                if (isset($fine->time_out_night) && $fine->time_out_night === 'Absent') { $reasons[] = 'Night Out'; $timeAbsences++; }
                
                $reason = count($reasons) > 0 ? 'Absent: ' . implode(', ', $reasons) : 'Absent';
                
                // Calculate total absences for this student
                $totalAbsences = $studentTimeAbsences[$fine->user_id] ?? $timeAbsences;
                
                // Calculate the fine amount based on the number of absences
                $calculatedFineAmount = $timeAbsences * $standardFineAmount;
                $totalFineAmount = $totalAbsences * $standardFineAmount;
                
                return [
                    'id' => $fine->id,
                    'user_id' => $fine->user_id,
                    'name' => $fine->name,
                    'student_id' => $fine->student_id,
                    'year' => $fine->year,
                    'section' => $fine->section,
                    'fineamount' => $calculatedFineAmount, // Calculated based on absences
                    'reason' => $reason,
                    'due_date' => $fine->date, // Using event date as due date
                    'payment_status' => $paymentStatus,
                    'payment_date' => $paymentStatus === 'Paid' ? $fine->date : null,
                    'event_name' => $fine->event_name,
                    'time_absences' => $timeAbsences, // Individual record's time absences
                    'total_absences' => $totalAbsences, // Total time absences for this student
                    'totalfineamount' => $totalFineAmount // Total fine amount based on all absences
                ];
            });
            
            // Convert student summary to array
            $studentSummaryArray = array_values($studentSummary);
            
            return response()->json([
                'success' => true,
                'fineDetails' => $fineDetails,
                'studentSummary' => $studentSummaryArray
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching absent fine details: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch absent fine details: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get absence records for students in the secretary's section
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAbsenceRecords(Request $request)
    {
        try {
            // Get the authenticated secretary
            $secretary = Auth::user();
            
            // Validate that the user is a secretary
            if ($secretary->role !== 'secretary') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
            
            // Get the month filter if provided
            $month = $request->input('month', 'All');
            
            // Get students in the secretary's section
            $students = User::where('role', 'student')
                ->where('year', $secretary->year)
                ->where('section', $secretary->section)
                ->get();
                
            $studentIds = $students->pluck('id')->toArray();
            
            // Base query to get absence records
            $query = AbsentFine::whereIn('user_id', $studentIds);
            
            // Apply month filter if specified
            if ($month !== 'All') {
                $query->whereMonth('date', $month);
            }
            
            // Get all absence records
            $absenceRecords = $query->get();
            
            // Group records by student and count absences
            $groupedRecords = [];
            foreach ($absenceRecords as $record) {
                $studentId = $record->user_id;
                $student = $students->firstWhere('id', $studentId);
                
                if (!$student) continue;
                
                // Count absences in this record
                $absenceCount = 0;
                if ($record->time_in_am === 'Absent') $absenceCount++;
                if ($record->time_out_am === 'Absent') $absenceCount++;
                if ($record->time_in_pm === 'Absent') $absenceCount++;
                if ($record->time_out_pm === 'Absent') $absenceCount++;
                if ($record->time_in_night === 'Absent') $absenceCount++;
                if ($record->time_out_night === 'Absent') $absenceCount++;
                
                // Skip records with no absences
                if ($absenceCount === 0) continue;
                
                // Check if student already exists in grouped records
                $existingIndex = array_search($studentId, array_column($groupedRecords, 'user_id'));
                
                if ($existingIndex !== false) {
                    // Update existing record
                    $groupedRecords[$existingIndex]['absence_count'] += $absenceCount;
                    $groupedRecords[$existingIndex]['amount'] += $record->fine_amount;
                    
                    // Set payment status to the "worst" status
                    if ($record->status === 'pending' && $groupedRecords[$existingIndex]['payment_status'] === 'paid') {
                        $groupedRecords[$existingIndex]['payment_status'] = 'pending';
                    }
                } else {
                    // Create new record
                    $groupedRecords[] = [
                        'id' => $record->id,
                        'user_id' => $studentId,
                        'student_name' => $student->name,
                        'student_id' => $student->studentNo,
                        'year' => $student->year,
                        'section' => $student->section,
                        'absence_count' => $absenceCount,
                        'amount' => $record->fine_amount,
                        'payment_status' => $record->status,
                        'date_range' => $record->date
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'records' => array_values($groupedRecords)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching absence records: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch absence records: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update the payment status of an absence record
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePaymentStatus(Request $request, $id)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'payment_status' => 'required|in:Paid,Pending,paid,pending'
            ]);
            
            // Convert status to lowercase for consistency in database
            $status = strtolower($validated['payment_status']);
            
            // Find the record
            $absentFine = AbsentFine::findOrFail($id);
            
            // Update the status with lowercase value
            $absentFine->status = $status;
            $absentFine->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Payment status updated successfully',
                'record' => $absentFine
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error updating payment status: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
                'id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate an invoice for an absence fine
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateInvoice(Request $request)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'record_id' => 'required|exists:absent_fines,id'
            ]);
            
            // Find the record
            $absentFine = AbsentFine::with('user', 'event')->findOrFail($validated['record_id']);
            
            // Generate invoice data
            $invoiceData = [
                'invoice_number' => 'INV-ABS-' . $absentFine->id . '-' . time(),
                'date' => now()->format('Y-m-d'),
                'student' => [
                    'name' => $absentFine->user->name,
                    'id' => $absentFine->user->studentNo,
                    'year' => $absentFine->user->year,
                    'section' => $absentFine->user->section
                ],
                'event' => [
                    'name' => $absentFine->event->eventname,
                    'date' => $absentFine->date
                ],
                'absences' => [
                    'time_in_am' => $absentFine->time_in_am === 'Absent',
                    'time_out_am' => $absentFine->time_out_am === 'Absent',
                    'time_in_pm' => $absentFine->time_in_pm === 'Absent',
                    'time_out_pm' => $absentFine->time_out_pm === 'Absent',
                    'time_in_night' => $absentFine->time_in_night === 'Absent',
                    'time_out_night' => $absentFine->time_out_night === 'Absent'
                ],
                'amount' => $absentFine->fine_amount,
                'status' => $absentFine->status
            ];
            
            return response()->json([
                'success' => true,
                'invoice' => $invoiceData
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error generating invoice: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate invoice: ' . $e->getMessage()
            ], 500);
        }
    }
}
