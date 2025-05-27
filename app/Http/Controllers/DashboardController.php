<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Attendance;
use App\Models\StudentFines;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Get upcoming events for student dashboard
     */
    public function getUpcomingEvents()
    {
        try {
            $student = auth()->user();
            
            // Get upcoming events (events with dates in the future)
            $upcomingEvents = Event::where('date', '>=', Carbon::today())
                ->orderBy('date', 'asc')
                ->take(5)
                ->get()
                ->map(function($event) {
                    return [
                        'id' => $event->id,
                        'title' => $event->eventname,
                        'date' => Carbon::parse($event->date)->format('M d, Y'),
                        'time' => $this->formatEventTime($event),
                        'location' => $event->location,
                        'description' => 'Event details for ' . $event->eventname
                    ];
                });
            
            return response()->json([
                'success' => true,
                'events' => $upcomingEvents
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching upcoming events: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch upcoming events: ' . $e->getMessage(),
                'events' => []
            ], 500);
        }
    }
    
    /**
     * Get student dashboard stats
     */
    public function getStudentDashboardStats()
    {
        try {
            $student = auth()->user();
            
            // Get absent count
            $absentCount = $this->getStudentAbsentCount($student);
            
            // Get student fines
            $studentFines = StudentFines::where('user_id', $student->id)->get();
            
            // Get upcoming events
            $upcomingEvents = $this->getUpcomingEventsList($student);
            
            return response()->json([
                'success' => true,
                'absent_count' => $absentCount,
                'student_fines' => $studentFines,
                'upcoming_events' => $upcomingEvents
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching student dashboard stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Helper method to get student absent count
     */
    private function getStudentAbsentCount($student)
    {
        // Get all events
        $allEvents = Event::all()->count();
        
        // Get events where the student was present
        $presentEvents = Attendance::where('user_id', $student->id)
            ->distinct('event_id')
            ->count('event_id');
        
        // Calculate absent count
        return $allEvents - $presentEvents;
    }
    
    /**
     * Helper method to get upcoming events list
     */
    private function getUpcomingEventsList($student)
    {
        return Event::where('date', '>=', Carbon::today())
            ->orderBy('date', 'asc')
            ->take(5)
            ->get()
            ->map(function($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->eventname,
                    'date' => Carbon::parse($event->date)->format('M d, Y'),
                    'time' => $this->formatEventTime($event),
                    'location' => $event->location
                ];
            });
    }
    
    /**
     * Helper method to format event time
     */
    private function formatEventTime($event)
    {
        if ($event->timeInAM) {
            return $event->timeInAM;
        } elseif ($event->timeInPM) {
            return $event->timeInPM;
        } elseif ($event->timeInNight) {
            return $event->timeInNight;
        }
        
        return 'TBA';
    }
}
