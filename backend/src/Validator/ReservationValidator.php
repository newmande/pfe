<?php

namespace App\Validator;

use App\Entity\Reservations;
use InvalidArgumentException;
use Exception;
use DateTime;
use DateInterval;

class ReservationValidator
{
    /**
     * ✅ Validate reservation data (Booking Flow)
     */
    public static function validateReservationData(array $data): void
    {
        // 1. Check Required Fields
        $required = ['datetime', 'pickupLocation', 'dropoffLocation', 'numberOfPassengers'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new InvalidArgumentException("The field '$field' is required.");
            }
        }

        // 2. Prevent Identical Locations
        if (trim(strtolower($data['pickupLocation'])) === trim(strtolower($data['dropoffLocation']))) {
            throw new InvalidArgumentException('Pickup and drop-off locations cannot be the same.');
        }

        // 3. Datetime Validation (Must be +30 mins from now)
        try {
            $datetime = new DateTime($data['datetime']);
            $minTime = (new DateTime())->add(new DateInterval('PT30M'));
            if ($datetime < $minTime) {
                throw new InvalidArgumentException('Reservations must be booked at least 30 minutes in advance.');
            }
        } catch (Exception $e) {
            throw new InvalidArgumentException('Invalid datetime format. Please use YYYY-MM-DD HH:MM.');
        }

        // 4. Passenger Limits
        $passengers = (int)$data['numberOfPassengers'];
        if ($passengers < 1 || $passengers > 8) {
            throw new InvalidArgumentException('Number of passengers must be between 1 and 8.');
        }

        // 5. Status Safety (Uses Entity Constants)
        if (isset($data['status'])) {
            $valid = [
                Reservations::STATUS_PENDING, 
                Reservations::STATUS_CONFIRMED, 
                Reservations::STATUS_CANCELLED, 
                Reservations::STATUS_COMPLETED
            ];
            if (!in_array($data['status'], $valid)) {
                throw new InvalidArgumentException('Invalid status provided.');
            }
        }
    }

    /**
     * ✅ Validate Vehicle Data
     */
    public static function validateVehicleData(array $data): void
    {
        $requiredFields = ['model', 'license', 'type', 'category', 'capacity'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                throw new InvalidArgumentException("The field '$field' is required.");
            }
        }

        $allowedTypes = ['sedan', 'van', 'suv', 'luxury'];
        if (!in_array(strtolower($data['type']), $allowedTypes)) {
            throw new InvalidArgumentException("Invalid vehicle type. Allowed: " . implode(', ', $allowedTypes));
        }

        $allowedCategories = ['economy', 'business', 'first'];
        if (!in_array(strtolower($data['category']), $allowedCategories)) {
            throw new InvalidArgumentException("Invalid category. Allowed: " . implode(', ', $allowedCategories));
        }

        $capacity = (int)$data['capacity'];
        if ($capacity < 1 || $capacity > 20) {
            throw new InvalidArgumentException("Capacity must be between 1 and 20 passengers.");
        }

        if (strlen($data['license']) < 3) {
            throw new InvalidArgumentException("License plate must be at least 3 characters long.");
        }
    }

    /**
     * ✅ Validate Driver Data
     */
    public static function validateDriverData(array $data): void
    {
        if (isset($data['name']) && strlen(trim($data['name'])) < 2) {
            throw new InvalidArgumentException('Driver name must be at least 2 characters.');
        }

        if (isset($data['phone']) && !self::validatePhoneNumber($data['phone'])) {
            throw new InvalidArgumentException('Invalid phone format. Use at least 8 digits.');
        }

        if (isset($data['latitude']) || isset($data['longitude'])) {
            $lat = $data['latitude'] ?? null;
            $lon = $data['longitude'] ?? null;
            if ($lat === null || $lon === null || $lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
                throw new InvalidArgumentException('Invalid coordinates. Lat: -90 to 90, Lon: -180 to 180.');
            }
        }
    }

    /**
     * ✅ Validate User Data
     */
    public static function validateUserData(array $data, bool $isNew = true): void
    {
        if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email address format.');
        }

        if ($isNew && (!isset($data['password']) || strlen($data['password']) < 8)) {
            throw new InvalidArgumentException('Password must be at least 8 characters long.');
        }

        if (isset($data['phone']) && !self::validatePhoneNumber($data['phone'])) {
            throw new InvalidArgumentException('Invalid phone number.');
        }
    }

    /**
     * ✅ Validate Pricing Rules
     */
    public static function validatePricingData(array $data): void
    {
        $fields = ['baseFare', 'pricePerKm', 'minimumFare'];
        foreach ($fields as $field) {
            if (isset($data[$field]) && (!is_numeric($data[$field]) || $data[$field] < 0)) {
                throw new InvalidArgumentException(ucfirst($field) . ' must be a positive number.');
            }
        }

        if (isset($data['surgeMultiplier']) && ($data['surgeMultiplier'] < 1.0 || $data['surgeMultiplier'] > 5.0)) {
            throw new InvalidArgumentException('Surge multiplier must be between 1.0 and 5.0.');
        }
    }

    /**
     * ✅ Global Phone Format Helper
     */
    private static function validatePhoneNumber(string $phone): bool
    {
        $cleanPhone = preg_replace('/[^0-9+]/', '', $phone);
        return strlen($cleanPhone) >= 8 && strlen($cleanPhone) <= 20;
    }
}