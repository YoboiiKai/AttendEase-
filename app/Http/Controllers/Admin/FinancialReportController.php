<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AbsentFine;
use App\Models\StudentFines;
use App\Models\User;
use App\Models\Event;
use App\Models\Fines;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinancialReportController extends Controller
{
    public function getFinancialReports(Request $request)
    {
        $period = $request->input('period', 'All');
        
        // Get current date
        $now = Carbon::now();
        
        // Calculate date ranges based on period
        $startDate = null;
        $endDate = $now;
        
        switch ($period) {
            case 'Today':
                $startDate = $now->copy()->startOfDay();
                break;
            case 'This Week':
                $startDate = $now->copy()->startOfWeek();
                break;
            case 'This Month':
                $startDate = $now->copy()->startOfMonth();
                break;
            case 'This Year':
                $startDate = $now->copy()->startOfYear();
                break;
            case 'Last 7 Days':
                $startDate = $now->copy()->subDays(7)->startOfDay();
                break;
            case 'Last 30 Days':
                $startDate = $now->copy()->subDays(30)->startOfDay();
                break;
            default:
                // All time - no start date filter
                break;
        }
        
        // Generate a summary report for the current period
        $absentFinesTotal = AbsentFine::when($period !== 'All' && $startDate, function ($query) use ($startDate, $endDate) {
                return $query->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->sum('fine_amount');
            
        $absentFinesPaid = AbsentFine::when($period !== 'All' && $startDate, function ($query) use ($startDate, $endDate) {
                return $query->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->where('status', 'paid')
            ->sum('fine_amount');
            
        $studentFinesTotal = StudentFines::when($period !== 'All' && $startDate, function ($query) use ($startDate, $endDate) {
                return $query->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->sum('amount');
            
        $studentFinesPaid = StudentFines::when($period !== 'All' && $startDate, function ($query) use ($startDate, $endDate) {
                return $query->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->where('status', 'paid')
            ->sum('amount');
            
        $totalFines = $absentFinesTotal + $studentFinesTotal;
        $totalPaid = $absentFinesPaid + $studentFinesPaid;
        $collectionRate = $totalFines > 0 ? round(($totalPaid / $totalFines) * 100, 2) : 0;
        
        // Count unique students with fines
        $absentFineStudents = AbsentFine::when($period !== 'All' && $startDate, function ($query) use ($startDate, $endDate) {
                return $query->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->distinct('user_id')
            ->count('user_id');
            
        $studentFineStudents = StudentFines::when($period !== 'All' && $startDate, function ($query) use ($startDate, $endDate) {
                return $query->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->distinct('user_id')
            ->count('user_id');
            
        // Get total unique students (some may have both types of fines)
        $uniqueStudentCount = DB::table(function ($query) use ($period, $startDate, $endDate) {
            $query->select('user_id')
                ->from('absent_fines')
                ->when($period !== 'All' && $startDate, function ($q) use ($startDate, $endDate) {
                    return $q->whereBetween('created_at', [$startDate, $endDate]);
                })
                ->union(
                    DB::table('student_fines')
                        ->select('user_id')
                        ->when($period !== 'All' && $startDate, function ($q) use ($startDate, $endDate) {
                            return $q->whereBetween('created_at', [$startDate, $endDate]);
                        })
                )
                ->distinct();
        }, 'combined_users')
        ->count();
        
        // Create a summary report
        $reports = [
            [
                'id' => 1,
                'title' => 'Financial Summary Report',
                'date' => $now->toDateString(),
                'period' => $period,
                'total_fines' => $totalFines,
                'total_paid' => $totalPaid,
                'collection_rate' => $collectionRate,
                'student_count' => $uniqueStudentCount,
                'absent_fines_total' => $absentFinesTotal,
                'absent_fines_paid' => $absentFinesPaid,
                'student_fines_total' => $studentFinesTotal,
                'student_fines_paid' => $studentFinesPaid,
                'is_finalized' => true
            ]
        ];
        
        return response()->json([
            'success' => true,
            'reports' => $reports
        ]);
    }
    
    public function getFinancialDetails(Request $request)
    {
        $period = $request->input('period', 'All');
        
        // Get current date
        $now = Carbon::now();
        
        // Calculate date ranges based on period
        $startDate = null;
        $endDate = $now;
        
        switch ($period) {
            case 'Today':
                $startDate = $now->copy()->startOfDay();
                break;
            case 'This Week':
                $startDate = $now->copy()->startOfWeek();
                break;
            case 'This Month':
                $startDate = $now->copy()->startOfMonth();
                break;
            case 'This Year':
                $startDate = $now->copy()->startOfYear();
                break;
            case 'Last 7 Days':
                $startDate = $now->copy()->subDays(7)->startOfDay();
                break;
            case 'Last 30 Days':
                $startDate = $now->copy()->subDays(30)->startOfDay();
                break;
            default:
                // All time - no start date filter
                break;
        }
        
        // Get absent fines with student details
        $absentFines = AbsentFine::when($period !== 'All' && $startDate, function ($query) use ($startDate, $endDate) {
                return $query->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->with(['user:id,name,student_id,year,section', 'event:id,title'])
            ->get()
            ->map(function ($fine) {
                try {
                    return [
                        'id' => $fine->id,
                        'student_id' => $fine->user->student_id ?? 'N/A',
                        'student_name' => $fine->user->name ?? 'Unknown',
                        'year' => $fine->user->year ?? 'N/A',
                        'section' => $fine->user->section ?? 'N/A',
                        'fine_type' => 'Absence',
                        'reason' => 'Absent from ' . ($fine->event->title ?? 'Unknown Event'),
                        'date' => $fine->date,
                        'amount' => $fine->fine_amount,
                        'status' => ucfirst($fine->status),
                        'created_at' => $fine->created_at->format('Y-m-d'),
                        'source' => 'absent_fines',
                        'event_name' => $fine->event->title ?? 'Unknown Event'
                    ];
                } catch (\Exception $e) {
                    // If there's an error with the relationship, provide a fallback
                    return [
                        'id' => $fine->id,
                        'student_id' => $fine->user->student_id ?? 'N/A',
                        'student_name' => $fine->user->name ?? 'Unknown',
                        'year' => $fine->user->year ?? 'N/A',
                        'section' => $fine->user->section ?? 'N/A',
                        'fine_type' => 'Absence',
                        'reason' => 'Absent from event',
                        'date' => $fine->date,
                        'amount' => $fine->fine_amount,
                        'status' => ucfirst($fine->status),
                        'created_at' => $fine->created_at->format('Y-m-d'),
                        'source' => 'absent_fines',
                        'event_name' => 'Unknown Event'
                    ];
                }
            });
            
        // Get student fines with student details
        $studentFines = StudentFines::when($period !== 'All' && $startDate, function ($query) use ($startDate, $endDate) {
                return $query->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->with(['user:id,name,student_id,year,section', 'fine:id,name'])
            ->get()
            ->map(function ($fine) {
                try {
                    return [
                        'id' => $fine->id,
                        'student_id' => $fine->user->student_id ?? 'N/A',
                        'student_name' => $fine->user->name ?? 'Unknown',
                        'year' => $fine->user->year ?? 'N/A',
                        'section' => $fine->user->section ?? 'N/A',
                        'fine_type' => $fine->fine->name ?? 'Other Fine',
                        'reason' => $fine->reason ?? 'Not specified',
                        'date' => $fine->created_at->format('Y-m-d'),
                        'amount' => $fine->amount,
                        'status' => ucfirst($fine->status),
                        'created_at' => $fine->created_at->format('Y-m-d'),
                        'source' => 'student_fines',
                        'event_name' => null
                    ];
                } catch (\Exception $e) {
                    // If there's an error with the relationship, provide a fallback
                    return [
                        'id' => $fine->id,
                        'student_id' => $fine->user->student_id ?? 'N/A',
                        'student_name' => $fine->user->name ?? 'Unknown',
                        'year' => $fine->user->year ?? 'N/A',
                        'section' => $fine->user->section ?? 'N/A',
                        'fine_type' => 'Other Fine',
                        'reason' => $fine->reason ?? 'Not specified',
                        'date' => $fine->created_at->format('Y-m-d'),
                        'amount' => $fine->amount,
                        'status' => ucfirst($fine->status),
                        'created_at' => $fine->created_at->format('Y-m-d'),
                        'source' => 'student_fines',
                        'event_name' => null
                    ];
                }
            });
            
        // Sort each collection by date (newest first)
        $absentFines = $absentFines->sortByDesc('created_at')->values()->all();
        $studentFines = $studentFines->sortByDesc('created_at')->values()->all();
        
        // Also provide combined data for backward compatibility
        $allFines = array_merge($absentFines, $studentFines);
        usort($allFines, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
            
        return response()->json([
            'success' => true,
            'absent_fines' => $absentFines,
            'student_fines' => $studentFines,
            'financial_data' => $allFines
        ]);
    }
    
    /**
     * Get all absent fines directly from the absent_fines table
     */
    public function getAbsentFines()
    {
        $absentFines = AbsentFine::with(['user:id,name,student_id,year,section', 'event:id,title'])
            ->get()
            ->map(function ($fine) {
                try {
                    return [
                        'id' => $fine->id,
                        'student_id' => $fine->user->student_id ?? 'N/A',
                        'student_name' => $fine->user->name ?? 'Unknown',
                        'year' => $fine->user->year ?? 'N/A',
                        'section' => $fine->user->section ?? 'N/A',
                        'fine_type' => 'Absence',
                        'reason' => 'Absent from ' . ($fine->event->title ?? 'Unknown Event'),
                        'date' => $fine->date,
                        'amount' => $fine->fine_amount,
                        'status' => ucfirst($fine->status),
                        'created_at' => $fine->created_at->format('Y-m-d'),
                        'event_name' => $fine->event->title ?? 'Unknown Event'
                    ];
                } catch (\Exception $e) {
                    // If there's an error with the relationship, provide a fallback
                    return [
                        'id' => $fine->id,
                        'student_id' => $fine->user->student_id ?? 'N/A',
                        'student_name' => $fine->user->name ?? 'Unknown',
                        'year' => $fine->user->year ?? 'N/A',
                        'section' => $fine->user->section ?? 'N/A',
                        'fine_type' => 'Absence',
                        'reason' => 'Absent from event',
                        'date' => $fine->date,
                        'amount' => $fine->fine_amount,
                        'status' => ucfirst($fine->status),
                        'created_at' => $fine->created_at->format('Y-m-d'),
                        'event_name' => 'Unknown Event'
                    ];
                }
            });
        
        return response()->json([
            'success' => true,
            'absent_fines' => $absentFines
        ]);
    }
    
    /**
     * Get all student fines directly from the student_fines table
     */
    public function getStudentFines()
    {
        $studentFines = StudentFines::with(['user:id,name,student_id,year,section', 'fine:id,name'])
            ->get()
            ->map(function ($fine) {
                try {
                    return [
                        'id' => $fine->id,
                        'student_id' => $fine->user->student_id ?? 'N/A',
                        'student_name' => $fine->user->name ?? 'Unknown',
                        'year' => $fine->user->year ?? 'N/A',
                        'section' => $fine->user->section ?? 'N/A',
                        'fine_type' => $fine->fine->name ?? 'Other Fine',
                        'reason' => $fine->reason ?? 'Not specified',
                        'date' => $fine->created_at->format('Y-m-d'),
                        'amount' => $fine->amount,
                        'status' => ucfirst($fine->status),
                        'created_at' => $fine->created_at->format('Y-m-d'),
                        'source' => 'student_fines',
                        'event_name' => null
                    ];
                } catch (\Exception $e) {
                    // If there's an error with the relationship, provide a fallback
                    return [
                        'id' => $fine->id,
                        'student_id' => $fine->user->student_id ?? 'N/A',
                        'student_name' => $fine->user->name ?? 'Unknown',
                        'year' => $fine->user->year ?? 'N/A',
                        'section' => $fine->user->section ?? 'N/A',
                        'fine_type' => 'Other Fine',
                        'reason' => $fine->reason ?? 'Not specified',
                        'date' => $fine->created_at->format('Y-m-d'),
                        'amount' => $fine->amount,
                        'status' => ucfirst($fine->status),
                        'created_at' => $fine->created_at->format('Y-m-d'),
                        'source' => 'student_fines',
                        'event_name' => null
                    ];
                }
            });
        
        return response()->json([
            'success' => true,
            'student_fines' => $studentFines
        ]);
    }
}
