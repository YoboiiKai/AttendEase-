<?php

namespace App\Http\Controllers;

use App\Models\Fines;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class FinesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $fines = Fines::all();
        return response()->json($fines);
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
        $validatedData = $request->validate([
            'violation' => 'required|string|max:255',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
        ]);

        $fines= Fines::create($validatedData);

        return response()->json(['success' => true, 'fines' => $fines], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $fines = Fines::findOrFail($id);
        return response()->json($fines);
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
        $validatedData = $request->validate([
            'violation' => 'required|string|max:255',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
        ]);

        $fines = Fines::findOrFail($id);
        $fines->update($validatedData);

        return response()->json(['success' => true, 'fines' => $fines], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $fines = Fines::findOrFail($id);
        $fines->delete();
        return response()->json(null, 204);
    }
}
