<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->string('rfid');
            $table->date('date');
            $table->string('time_in_am')->nullable()->default('Absent');
            $table->string('time_out_am')->nullable()->default('Absent');
            $table->string('time_in_pm')->nullable()->default('Absent');
            $table->string('time_out_pm')->nullable()->default('Absent');
            $table->string('time_in_night')->nullable()->default('Absent');
            $table->string('time_out_night')->nullable()->default('Absent');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
