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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('eventname');
            $table->date('date');
            $table->string('location');
            $table->time('timeInAM')->nullable();
            $table->time('timeInAMDuration')->nullable();
            $table->time('timeOutAM')->nullable();
            $table->time('timeOutAMDuration')->nullable();
            $table->time('timeInPM')->nullable();
            $table->time('timeInPMDuration')->nullable();
            $table->time('timeOutPM')->nullable();
            $table->time('timeOutPMDuration')->nullable();
            $table->time('timeInNight')->nullable();
            $table->time('timeInNightDuration')->nullable();
            $table->time('timeOutNight')->nullable();
            $table->time('timeOutNightDuration')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
