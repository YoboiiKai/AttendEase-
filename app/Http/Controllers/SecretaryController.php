<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SecretaryController
{
    // Example method
    public function index()
    {
        // Logic for handling the index request
        $secretary = User::where('role', 'secretary')->get();
        return response()->json($secretary);
    }

    // Additional methods can be added here
    public function store(Request $request)
    {
        // Validate incoming request data
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'year' => 'required|string|max:10',
            'section' => 'required|string|max:10',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Create a new secretary
        $secretary = new User();
        $secretary->name = $request->name;
        $secretary->email = $request->email;
        $secretary->year = $request->year;
        $secretary->section = $request->section;
        $secretary->password = Hash::make($request->password);
        $secretary->role = 'secretary';
        $secretary->save();

        return response()->json(['success' => true, 'message' => 'Secretary added successfully.']);
    }

    public function show($id)
    {
        // Logic for handling the show request
    }

    public function update(Request $request, $id)
    {
        // Logic for handling the update request
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$id,
            'year' => 'required|string|max:10',
            'section' => 'required|string|max:10',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $secretary = User::findOrFail($id);

        $secretary->name = $validatedData['name'];
        $secretary->email = $validatedData['email'];    
        $secretary->year = $validatedData['year'];
        $secretary->section = $validatedData['section'];

        if ($request->filled('password')) {
            $secretary->password = Hash::make($validatedData['password']);
        }

        $secretary->save();

        return response()->json(['success' => true, 'secretary' => $secretary], 200);
    }

    public function destroy($id)
    {
        // Logic for handling the destroy request
        $secretary = User::findOrFail($id);
        $secretary->delete();
        return response()->json(null, 204);
    }

    /**
     * Import secretaries from CSV/Excel file
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function import(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'secretaries' => 'required|array',
                'secretaries.*.name' => 'required|string|max:255',
                'secretaries.*.email' => 'required|email',
                'secretaries.*.year' => 'required',
                'secretaries.*.section' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $secretaries = $request->secretaries;
            $imported = 0;
            $errors = [];

            // Begin transaction
            \DB::beginTransaction();

            foreach ($secretaries as $index => $secretaryData) {
                try {
                    // Check for duplicate email
                    $existingEmail = User::where('email', $secretaryData['email'])->exists();

                    if ($existingEmail) {
                        $errors[] = "Row " . ($index + 1) . ": Email already exists.";
                        continue;
                    }

                    // Create the secretary
                    User::create([
                        'name' => $secretaryData['name'],
                        'email' => $secretaryData['email'],
                        'year' => $secretaryData['year'],
                        'section' => $secretaryData['section'],
                        'password' => Hash::make('password123'), // Default password
                        'role' => 'secretary'
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
                'total' => count($secretaries),
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Error importing secretaries: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while importing secretaries: ' . $e->getMessage()
            ], 500);
        }
    }
}
