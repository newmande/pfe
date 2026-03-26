<?php

namespace App\Service;

use App\Entity\Pricing;
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
     * ✅ Geocoding: Address -> Coordinates
     */
    public function addressToCoordinates(string $address): ?array
    {
        try {
            $response = $this->httpClient->request('GET', 'https://api.tomtom.com/search/2/search/' . urlencode($address) . '.json', [
                'query' => [
                    'key' => $this->apiKey, 
                    'limit' => 1,
                    'typeahead' => 'true'
                ]
            ]);

            $data = $response->toArray();
            
            if (empty($data['results'])) {
                return null;
            }

            $position = $data['results'][0]['position'];
            return [
                'lat' => (float)$position['lat'],
                'lon' => (float)$position['lon']
            ];
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * ✅ Routing: Calculate Distance and Duration via TomTom
     * Renamed to getRideEstimate to match your Controller's expectation
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

            $summary = $data['routes'][0]['summary'];

            return [
                'distance' => $summary['lengthInMeters'] / 1000, // KM
                'duration' => $summary['travelTimeInSeconds'] / 60, // Minutes
            ];
        } catch (\Exception $e) {
            return null;
        }
    }
}