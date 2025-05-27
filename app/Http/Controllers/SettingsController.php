<?php

namespace App\Http\Controllers;

use App\Models\Settings;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $settings = Settings::first();
        return response()->json($settings);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('Request data before validation:', $request->all());
        try {
            $validated = $request->validate([
               'image' => 'nullable|image|max:10240',
                'schoolname' => 'required|string|max:255',
                'department' => 'required|string|max:255',
            ]);

            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('images', 'public');
                Log::info('Image path after storage:', ['path' => $imagePath]);
            } else {
                Log::info('No image file found in the request.');
            }

            // Check if settings already exist
            $settings = Settings::first();
            
            if ($settings) {
                // Update existing settings
                $updateData = [
                    'schoolname' => $validated['schoolname'],
                    'department' => $validated['department'],
                ];
                
                // Only update image if a new one was uploaded
                if ($imagePath) {
                    // Delete old image if it exists
                    if ($settings->image && Storage::disk('public')->exists($settings->image)) {
                        Storage::disk('public')->delete($settings->image);
                    }
                    $updateData['image'] = $imagePath;
                }
                
                $settings->update($updateData);
            } else {
                // Create new settings
                $settings = Settings::create([
                    'image' => $imagePath,
                    'schoolname' => $validated['schoolname'],
                    'department' => $validated['department'],
                ]);
            }

            return response()->json([
                'success' => true,
                'settings' => $settings,
                'message' => 'Settings updated successfully'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error saving settings:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating the settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
