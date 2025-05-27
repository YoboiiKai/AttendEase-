<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Models\Attendance;

class StudentController extends Controller
{
    public function index()
    {
        $student = User::where('role', 'student')->get();
        return response()->json($student);
    }

    public function show($id) {
        try {
            $student = User::findOrFail($id);
            return response()->json($student);
        } catch (\Exception $e) {
            \Log::error('Error fetching student data: ' . $e->getMessage());
            return response()->json(['error' => 'Student not found'], 500);
        }
    }
    
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'studentNo' => 'required|string|unique:users,studentNo',
                'year' => 'required|string',
                'section' => 'required|string',
                'rfid' => 'required|string|unique:users,rfid',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'password_confirmation' => 'required|same:password',
                'image' => 'nullable|image|max:10240',
                'qrcode' => 'nullable|string',
            ]);

            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('images', 'public');
            }
            $student = User::create([
                'name' => $validated['name'],
                'studentNo' => $validated['studentNo'],
                'year' => $validated['year'],
                'section' => $validated['section'],
                'rfid' => $validated['rfid'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'image' => $imagePath,
                'qrcode' => $validated['qrcode'],
                'role' => 'student'
            ]);

            return response()->json([
                'success' => true,
                'student' => $student,
                'message' => 'Student created successfully'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while adding the student: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, User $student)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'studentNo' => 'required|string|unique:users,studentNo,' . $student->id,
                'year' => 'required|integer',
                'section' => 'required|string',
                'rfid' => 'required|string|unique:users,rfid,' . $student->id,
                'email' => 'required|email|unique:users,email,' . $student->id,
                'password' => 'nullable|string|min:8|confirmed',
                'image' => 'nullable|image|max:10240',
                'qrcode' => 'nullable|string',
            ]);

            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($student->image) {
                    Storage::disk('public')->delete($student->image);
                }
                $imagePath = $request->file('image')->store('profile_images', 'public');
                $validated['image'] = $imagePath;
            }

            // Only update password if provided
            if ($request->filled('password')) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $student->update($validated);

            return response()->json([
                'success' => true,
                'student' => $student
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating student: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function destroy(User $student)
    {
        $student->delete();
        return response()->json(null, 204);
    }
    
    /**
     * Import students from CSV/Excel file
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function import(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'students' => 'required|array',
                'students.*.name' => 'required|string|max:255',
                'students.*.studentNo' => 'required|string',
                'students.*.year' => 'required',
                'students.*.section' => 'required|string',
                'students.*.rfid' => 'required|string',
                'students.*.email' => 'required|email',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $students = $request->students;
            $imported = 0;
            $errors = [];

            // Begin transaction
            \DB::beginTransaction();

            foreach ($students as $index => $studentData) {
                try {
                    // Check for duplicates
                    $existingEmail = User::where('email', $studentData['email'])->exists();
                    $existingStudentNo = User::where('studentNo', $studentData['studentNo'])->exists();
                    $existingRfid = User::where('rfid', $studentData['rfid'])->exists();

                    if ($existingEmail || $existingStudentNo || $existingRfid) {
                        $error = "Row " . ($index + 1) . ": ";
                        if ($existingEmail) $error .= "Email already exists. ";
                        if ($existingStudentNo) $error .= "Student No already exists. ";
                        if ($existingRfid) $error .= "RFID already exists. ";
                        
                        $errors[] = $error;
                        continue;
                    }

                    // Create the student
                    User::create([
                        'name' => $studentData['name'],
                        'studentNo' => $studentData['studentNo'],
                        'year' => $studentData['year'],
                        'section' => $studentData['section'],
                        'rfid' => $studentData['rfid'],
                        'email' => $studentData['email'],
                        'password' => Hash::make('password123'), // Default password
                        'role' => 'student'
                    ]);

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
                }
            }

            // Commit if we have any successful imports
            if ($imported > 0) {
                \DB::commit();
            } else {
                \DB::rollBack();
            }

            return response()->json([
                'success' => true,
                'imported' => $imported,
                'total' => count($students),
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Error importing students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while importing students: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get students by year and section (for secretary dashboard)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSectionStudents(Request $request)
    {
        try {
            // Get the authenticated user (secretary)
            $secretary = auth()->user();
            
            // Check if the secretary has year and section assigned
            if (!$secretary->year || !$secretary->section) {
                return response()->json([
                    'success' => false,
                    'message' => 'Secretary does not have year and section assigned',
                    'count' => 0,
                    'students' => []
                ]);
            }
            
            // Get students that match the secretary's year and section
            $students = User::where('role', 'student')
                            ->where('year', $secretary->year)
                            ->where('section', $secretary->section)
                            ->get();
            
            return response()->json([
                'success' => true,
                'count' => $students->count(),
                'students' => $students
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching section students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching students: ' . $e->getMessage(),
                'count' => 0,
                'students' => []
            ], 500);
        }
    }

    public function getStudentAbsentCount()
    {
        try {
            $student = auth()->user();
            
            // Get all attendance records for this student
            $attendances = Attendance::where('user_id', $student->id)->get();
            
            // Count all time slots marked as 'Absent'
            $count = 0;
            
            foreach ($attendances as $attendance) {
                // Check morning attendance
                if ($attendance->time_in_am === 'Absent') $count++;
                if ($attendance->time_out_am === 'Absent') $count++;
                
                // Check afternoon attendance
                if ($attendance->time_in_pm === 'Absent') $count++;
                if ($attendance->time_out_pm === 'Absent') $count++;
                
                // Check night attendance
                if ($attendance->time_in_night === 'Absent') $count++;
                if ($attendance->time_out_night === 'Absent') $count++;
            }
            
            return response()->json([
                'success' => true,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            \Log::error('Error counting student absences: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to count absences: ' . $e->getMessage(),
                'count' => 0
            ], 500);
        }
    }
}
