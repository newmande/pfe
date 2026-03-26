<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class MapService
{
    private HttpClientInterface $httpClient;
    private string $apiKey;

    public function __construct(HttpClientInterface $httpClient, string $tomtomApiKey)
    {
        $this->httpClient = $httpClient;
        $this->apiKey = $tomtomApiKey;
    }

    /**
     * Convert an address string to coordinates
     * @return array ['lat' => float, 'lon' => float] or null if not found
     */
    public function addressToCoordinates(string $address): ?array
    {
        try {
            $response = $this->httpClient->request('GET', 'https://api.tomtom.com/search/2/search/' . urlencode($address) . '.json', [
                'query' => ['key' => $this->apiKey, 'limit' => 1]
            ]);

            $data = $response->toArray();
            
            if (empty($data['results'])) {
                return null;
            }

            $position = $data['results'][0]['position'];
            return [
                'lat' => $position['lat'],
                'lon' => $position['lon']
            ];
        } catch (\Exception $e) {
            throw new \RuntimeException('Geocoding failed: ' . $e->getMessage());
        }
    }

    /**
     * Get ride estimate (distance, duration, and price)
     * @return array ['distance' => float (km), 'duration' => float (minutes), 'price' => float (TND)]
     */
    public function getRideEstimate(float $startLat, float $startLon, float $endLat, float $endLon): ?array
    {
        try {
            $url = "https://api.tomtom.com/routing/1/calculateRoute/$startLat,$startLon:$endLat,$endLon/json";
            
            $response = $this->httpClient->request('GET', $url, [
                'query' => [
                    'key' => $this->apiKey,
                    'traffic' => 'true',
                    'travelMode' => 'car'
                ]
            ]);

            $data = $response->toArray();

            if (empty($data['routes'])) {
                return null;
            }

            $route = $data['routes'][0]['summary'];

            $distanceKm = $route['lengthInMeters'] / 1000;
            $durationMin = $route['travelTimeInSeconds'] / 60;
            $price = $this->calculatePrice($distanceKm, $durationMin);

            return [
                'distance' => round($distanceKm, 2),
                'duration' => round($durationMin, 2),
                'price' => round($price, 2)
            ];
        } catch (\Exception $e) {
            throw new \RuntimeException('Route calculation failed: ' . $e->getMessage());
        }
    }

    /**
     * Calculate ride price based on distance and duration
     */
    private function calculatePrice(float $km, float $min): float
    {
        $baseFare = 2.0; // TND
        $perKm = 1.2;    // TND per km
        $perMin = 0.1;   // TND per minute
        
        return $baseFare + ($km * $perKm) + ($min * $perMin);
    }
}
