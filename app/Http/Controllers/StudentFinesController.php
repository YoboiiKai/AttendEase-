<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Fines;
use App\Models\StudentFines;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StudentFinesController extends Controller
{
    /**
     * Display a listing of student fines.
     */
    public function index(Request $request)
    {
        try {
            // Check if we need to filter by student
            $query = StudentFines::with(['user', 'fine']);
            
            if ($request->has('student_id')) {
                $query->where('user_id', $request->student_id);
            }
            
            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
            
            $studentFines = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $studentFines
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching student fines: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch student fines: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created student fine.
     */
    public function store(Request $request)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'student_id' => 'required|exists:users,id',
                'fines_id' => 'required|exists:fines,id',
                'amount' => 'required|numeric|min:0',
                'reason' => 'required|string',
                'status' => 'nullable|in:paid,unpaid'
            ]);
            
            // Set default values
            $validated['status'] = $validated['status'] ?? 'unpaid';
            
            // Create the student fine
            $studentFine = StudentFines::create([
                'user_id' => $validated['student_id'],
                'fines_id' => $validated['fines_id'],
                'amount' => $validated['amount'],
                'reason' => $validated['reason'],
                'status' => $validated['status'],
                'payment_date' => $validated['status'] === 'paid' ? Carbon::now()->toDateString() : null
            ]);
            
            // Load relationships
            $studentFine->load(['user', 'fine']);
            
            return response()->json([
                'success' => true,
                'message' => 'Student fine added successfully',
                'data' => $studentFine
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error adding student fine: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add student fine: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified student fine.
     */
    public function show(string $id)
    {
        try {
            $studentFine = StudentFines::with(['user', 'fine'])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $studentFine
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching student fine: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch student fine: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified student fine.
     */
    public function update(Request $request, string $id)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'amount' => 'nullable|numeric|min:0',
                'reason' => 'nullable|string',
                'status' => 'nullable|in:paid,unpaid',
                'payment_date' => 'nullable|date'
            ]);
            
            // Find the student fine
            $studentFine = StudentFines::findOrFail($id);
            
            // Update the student fine
            $studentFine->update($validated);
            
            // If status changed to paid, set payment date
            if (isset($validated['status']) && $validated['status'] === 'paid' && $studentFine->status === 'paid' && !$studentFine->payment_date) {
                $studentFine->payment_date = Carbon::now()->toDateString();
                $studentFine->save();
            }
            
            // Load relationships
            $studentFine->load(['user', 'fine']);
            
            return response()->json([
                'success' => true,
                'message' => 'Student fine updated successfully',
                'data' => $studentFine
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating student fine: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update student fine: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a student fine as paid.
     */
    public function markAsPaid(string $id)
    {
        try {
            // Find the student fine
            $studentFine = StudentFines::findOrFail($id);
            
            // Update the student fine
            $studentFine->update([
                'status' => 'paid',
                'payment_date' => Carbon::now()->toDateString()
            ]);
            
            // Load relationships
            $studentFine->load(['user', 'fine']);
            
            return response()->json([
                'success' => true,
                'message' => 'Student fine marked as paid',
                'data' => $studentFine
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking student fine as paid: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark student fine as paid: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified student fine.
     */
    public function destroy(string $id)
    {
        try {
            // Find the student fine
            $studentFine = StudentFines::findOrFail($id);
            
            // Delete the student fine
            $studentFine->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Student fine deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting student fine: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete student fine: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Search for students by name or student number.
     */
    public function searchStudents(Request $request)
    {
        try {
            $query = $request->get('query');
            
            if (!$query) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            
            // Get the authenticated secretary
            $secretary = auth()->user();
            
            // Build the query
            $students = User::where('role', 'student')
                ->where(function($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('studentNo', 'like', "%{$query}%");
                })
                // Filter by the secretary's year and section
                ->where('year', $secretary->year)
                ->where('section', $secretary->section)
                ->select('id', 'name', 'studentNo', 'year', 'section')
                ->limit(10)
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $students
            ]);
        } catch (\Exception $e) {
            Log::error('Error searching students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to search students: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get all available fine types.
     * Excludes the 'absent' violation type as it's automatically calculated.
     */
    public function getFineTypes()
    {
        try {
            // For student view, we want to include all fine types including 'absent'
            // This is different from the secretary view which excludes 'absent'
            $fineTypes = Fines::all();
            
            return response()->json($fineTypes);
        } catch (\Exception $e) {
            Log::error('Error fetching fine types: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch fine types: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get all students in the secretary's section for dropdown
     */
    public function getSectionStudents()
    {
        try {
            // Get the authenticated secretary
            $secretary = auth()->user();
            
            // Get all students in the secretary's section
            $students = User::where('role', 'student')
                ->where('year', $secretary->year)
                ->where('section', $secretary->section)
                ->select('id', 'name', 'studentNo', 'year', 'section')
                ->orderBy('name')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $students
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching section students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch section students: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get fines for the authenticated student
     */
    public function getStudentFines()
    {
        try {
            // Get the authenticated student
            $student = auth()->user();
            
            // Get all fines for this student
            $studentFines = StudentFines::with(['fine'])
                ->where('user_id', $student->id)
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $studentFines
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching student fines: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch your fines: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get dress code fine reports for admin dashboard
     */
    public function getDressCodeFineReports(Request $request)
    {
        try {
            // Get the period filter
            $period = $request->get('period', 'All');
            
            // Start with a base query for dress code violations
            $query = StudentFines::join('fines', 'student_fines.fines_id', '=', 'fines.id')
                ->join('users', 'student_fines.user_id', '=', 'users.id')
                ->where(function($q) {
                    $q->where('fines.violation', 'like', '%dress%')
                      ->orWhere('fines.description', 'like', '%dress%')
                      ->orWhere('fines.violation', 'like', '%uniform%')
                      ->orWhere('fines.description', 'like', '%uniform%')
                      ->orWhere('student_fines.reason', 'like', '%dress%')
                      ->orWhere('student_fines.reason', 'like', '%uniform%');
                });
            
            // Apply period filter
            if ($period !== 'All') {
                $now = Carbon::now();
                
                switch ($period) {
                    case 'Today':
                        $query->whereDate('student_fines.created_at', $now->toDateString());
                        break;
                    case 'ThisWeek':
                        $query->whereBetween('student_fines.created_at', [
                            $now->startOfWeek()->toDateString(),
                            $now->endOfWeek()->toDateString()
                        ]);
                        break;
                    case 'ThisMonth':
                        $query->whereMonth('student_fines.created_at', $now->month)
                              ->whereYear('student_fines.created_at', $now->year);
                        break;
                    case 'ThisYear':
                        $query->whereYear('student_fines.created_at', $now->year);
                        break;
                }
            }
            
            // There are two ways to fix this MySQL strict mode GROUP BY issue:
        // 1. Add all non-aggregated columns to GROUP BY
        // 2. Disable strict mode for this query using DB::statement('SET sql_mode="";');
        // We'll use approach #2 here
        
        // First, let's disable strict mode for this query
        DB::statement('SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,"ONLY_FULL_GROUP_BY",""));');
        
        // Group by violation type instead of date
        $reports = $query->select(
            'fines.violation',
            DB::raw('COUNT(*) as violation_count'),
            DB::raw('SUM(student_fines.amount) as total_fine_amount'),
            DB::raw('ROUND((SUM(CASE WHEN student_fines.status = "paid" THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as payment_rate'),
            DB::raw('"active" as status'),
            DB::raw('MIN(DATE(student_fines.created_at)) as date')
        )
        ->groupBy('fines.violation')
        ->orderBy(DB::raw('COUNT(*)'), 'desc')
        ->get()
        ->map(function($report) {
            // Add an ID for each report (using the violation as a unique identifier)
            $report->id = str_replace(' ', '_', strtolower($report->violation));
            return $report;
        });
            
        // Restore default SQL mode
        DB::statement('SET SESSION sql_mode=(SELECT @@sql_mode);');
            
            return response()->json([
                'success' => true,
                'reports' => $reports
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching dress code fine reports: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dress code fine reports: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get dress code fine details for a specific violation type or date
     */
    public function getDressCodeFineDetails(Request $request)
    {
        try {
            // Skip validation and get the event_id directly
            $eventId = $request->get('event_id');
            
            // Base query for dress code violations
            $query = StudentFines::join('users', 'student_fines.user_id', '=', 'users.id')
                ->join('fines', 'student_fines.fines_id', '=', 'fines.id')
                ->where(function($q) {
                    $q->where('fines.violation', 'like', '%dress%')
                      ->orWhere('fines.description', 'like', '%dress%')
                      ->orWhere('fines.violation', 'like', '%uniform%')
                      ->orWhere('fines.description', 'like', '%uniform%')
                      ->orWhere('student_fines.reason', 'like', '%dress%')
                      ->orWhere('student_fines.reason', 'like', '%uniform%');
                });
            
            // Handle different types of event_id formats
            if ($eventId === '0' || empty($eventId)) {
                // If event_id is 0 or empty, return all dress code violations
                // No additional filtering needed
            } else if (is_numeric($eventId) && strlen($eventId) == 4) {
                // If it's a year (e.g., 2025), filter by year
                $query->whereYear('student_fines.created_at', $eventId);
            } else if (strtotime($eventId) !== false) {
                // If it's a valid date, filter by date
                $query->whereDate('student_fines.created_at', $eventId);
            } else {
                // Otherwise, it's a violation type ID (e.g., "improper_uniform")
                $violationType = str_replace('_', ' ', $eventId);
                
                // Ensure we're strictly matching the violation type (exact match)
                $query->whereRaw('LOWER(fines.violation) = ?', [strtolower($violationType)]);
                
                // Log the violation type for debugging
                Log::info('Filtering by violation type: ' . $violationType);
            }
            
            // Get the results
            $dressCodeFines = $query->select(
                'student_fines.id',
                'student_fines.user_id',
                'users.name',
                'users.studentNo as student_id',
                'users.year',
                'users.section',
                'student_fines.amount as fineamount',
                'fines.violation',
                'student_fines.reason',
                'student_fines.status as payment_status',
                'student_fines.payment_date',
                'student_fines.created_at as date'
            )
            ->get();
            
            // Group by student to get summary data
            $studentSummary = [];
            
            foreach ($dressCodeFines as $fine) {
                $userId = $fine->user_id;
                
                if (!isset($studentSummary[$userId])) {
                    $studentSummary[$userId] = [
                        'user_id' => $userId,
                        'name' => $fine->name,
                        'student_id' => $fine->student_id,
                        'year' => $fine->year,
                        'section' => $fine->section,
                        'violation_count' => 0,
                        'total_fine_amount' => 0
                    ];
                }
                
                $studentSummary[$userId]['violation_count']++;
                $studentSummary[$userId]['total_fine_amount'] += (float) $fine->fineamount;
            }
            
            return response()->json([
                'success' => true,
                'fineDetails' => $dressCodeFines,
                'studentSummary' => $studentSummary
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching dress code fine details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dress code fine details: ' . $e->getMessage()
            ], 500);
        }
    }
}
