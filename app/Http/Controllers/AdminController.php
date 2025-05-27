<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function index()
    {
        $admin = User::where('role', 'admin')->get();
        return response()->json($admin);
    }

    public function create()
    {
        // Code to show form for creating a new admin resource
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $validatedData['password'] = Hash::make($validatedData['password']);
        $validatedData['role'] = 'admin';

        $admin = User::create($validatedData);

        return response()->json(['success' => true, 'admin' => $admin], 201);
    }

    public function edit($id)
    {
        // Code to show form for editing an admin resource
    }

    public function update(Request $request, $id)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$id,
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $admin = User::findOrFail($id);

        $admin->name = $validatedData['name'];
        $admin->email = $validatedData['email'];

        if ($request->filled('password')) {
            $admin->password = Hash::make($validatedData['password']);
        }

        $admin->save();

        return response()->json(['success' => true, 'admin' => $admin], 200);
    }

    // Remove the specified resource from storage.
    public function destroy($id)
    {
        $admin = User::findOrFail($id);
        $admin->delete();
        return response()->json(null, 204);
    }
}
