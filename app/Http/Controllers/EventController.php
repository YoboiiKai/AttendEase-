<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Http\Resources\EventResource;

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $event = Event::all();
        return response()->json($event);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $validatedData = $request->validate([
            'eventname' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'timeInAM' => 'nullable|date_format:H:i',
            'timeInAMDuration' => 'nullable|date_format:H:i',
            'timeOutAM' => 'nullable|date_format:H:i',
            'timeOutAMDuration' => 'nullable|date_format:H:i',
            'timeInPM' => 'nullable|date_format:H:i',
            'timeInPMDuration' => 'nullable|date_format:H:i',
            'timeOutPM' => 'nullable|date_format:H:i',
            'timeOutPMDuration' => 'nullable|date_format:H:i',
            'timeInNight' => 'nullable|date_format:H:i',
            'timeInNightDuration' => 'nullable|date_format:H:i',
            'timeOutNight' => 'nullable|date_format:H:i',
            'timeOutNightDuration' => 'nullable|date_format:H:i',
        ]);

        $event = Event::create($validatedData);

        return response()->json(['success' => true, 'event' => $event], 201);
    }

    public function edit(string $id)
    {
        //
    }


    public function update(Request $request, string $id)
    {
        //
        $validatedData = $request->validate([
            'eventname' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'timeInAM' => 'nullable|date_format:H:i',
            'timeInAMDuration' => 'nullable|date_format:H:i',
            'timeOutAM' => 'nullable|date_format:H:i',
            'timeOutAMDuration' => 'nullable|date_format:H:i',
            'timeInPM' => 'nullable|date_format:H:i',
            'timeInPMDuration' => 'nullable|date_format:H:i',
            'timeOutPM' => 'nullable|date_format:H:i',
            'timeOutPMDuration' => 'nullable|date_format:H:i',
            'timeInNight' => 'nullable|date_format:H:i',
            'timeInNightDuration' => 'nullable|date_format:H:i',
            'timeOutNight' => 'nullable|date_format:H:i',
            'timeOutNightDuration' => 'nullable|date_format:H:i',
        ]);

        $event = Event::findOrFail($id);

        $event->eventname = $validatedData['eventname'];
        $event->date = $validatedData['date'];
        $event->location = $validatedData['location'];
        $event->timeInAM = $validatedData['timeInAM'];
        $event->timeInAMDuration = $validatedData['timeInAMDuration'];
        $event->timeOutAM = $validatedData['timeOutAM'];
        $event->timeOutAMDuration = $validatedData['timeOutAMDuration'];
        $event->timeInPM = $validatedData['timeInPM'];
        $event->timeInPMDuration = $validatedData['timeInPMDuration'];
        $event->timeOutPM = $validatedData['timeOutPM'];
        $event->timeOutPMDuration = $validatedData['timeOutPMDuration'];
        $event->timeInNight = $validatedData['timeInNight'];
        $event->timeInNightDuration = $validatedData['timeInNightDuration'];
        $event->timeOutNight = $validatedData['timeOutNight'];
        $event->timeOutNightDuration = $validatedData['timeOutNightDuration'];

        $event->save();

        return response()->json(['success' => true, 'event' => $event], 200);
    }

    /**
     * Get events for students to view
     */
    public function getStudentEvents()
    {
        try {
            // Get all events
            $events = Event::orderBy('date', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $events
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching events: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch events: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        //
        $event = Event::findOrFail($id);
        $event->delete();
        return response()->json(null, 204);
    }
    
    /**
     * Get upcoming events for student dashboard
     */
    public function getUpcomingEvents()
    {
        try {
            // Get upcoming events (events with dates >= today)
            $events = Event::where('date', '>=', now()->format('Y-m-d'))
                          ->orderBy('date', 'asc')
                          ->take(5)
                          ->get()
                          ->map(function($event) {
                              return [
                                  'id' => $event->id,
                                  'title' => $event->eventname,
                                  'date' => date('M d, Y', strtotime($event->date)),
                                  'time' => $event->timeInAM ?? '9:00 AM',
                                  'location' => $event->location,
                                  'description' => 'Event details for ' . $event->eventname
                              ];
                          });
            
            return response()->json([
                'success' => true,
                'events' => $events
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching upcoming events: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch upcoming events',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
