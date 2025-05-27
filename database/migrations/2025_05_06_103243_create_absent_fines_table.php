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
        Schema::create('absent_fines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->string('time_in_am')->nullable()->default('Absent');
            $table->string('time_out_am')->nullable()->default('Absent');
            $table->string('time_in_pm')->nullable()->default('Absent');
            $table->string('time_out_pm')->nullable()->default('Absent');
            $table->string('time_in_night')->nullable()->default('Absent');
            $table->string('time_out_night')->nullable()->default('Absent');
            $table->decimal('fine_amount', 10, 2)->default(0.00);
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absent_fines');
    }
};
