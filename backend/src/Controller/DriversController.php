<?php

namespace App\Controller;

use App\Entity\Drivers;
use App\Repository\DriversRepository;
use App\Validator\ReservationValidator;
use Doctrine\ORM\EntityManagerInterface;
use LongitudeOne\Spatial\PHP\Types\Geometry\Point;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/drivers')]
class DriversController extends AbstractController
{
    /**
     * ✅ GET /api/drivers
     * Returns all drivers. Uses the custom repository method to eager-load 
     * relationships (like vehicle/history) for better performance.
     */
    #[Route('', name: 'app_drivers_index', methods: ['GET'])]
    public function index(DriversRepository $repository): JsonResponse
    {
        $drivers = $repository->findAllWithRelations();
        return $this->json($drivers, 200, [], ['groups' => 'driver:read']);
    }

    /**
     * ✅ GET /api/drivers/{id}
     */
    #[Route('/{id}', name: 'app_drivers_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(Drivers $driver): JsonResponse
    {
        return $this->json($driver, 200, [], ['groups' => 'driver:read']);
    }

    /**
     * ✅ POST /api/drivers
     * Admin only. Validates name, phone, and optional coordinates.
     */
    #[IsGranted('ROLE_ADMIN')]
    #[Route('', name: 'app_drivers_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        try {
            // Uses the refined validator we just updated
            ReservationValidator::validateDriverData($data);

            $driver = new Drivers();
            $this->mapDataToDriver($driver, $data);

            $em->persist($driver);
            $em->flush();

            return $this->json($driver, 201, [], ['groups' => 'driver:read']);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * ✅ PUT/PATCH /api/drivers/{id}
     * Allows updating specific fields (like availability or location) or the whole object.
     */
    #[Route('/{id}', name: 'app_drivers_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(Drivers $driver, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $this->mapDataToDriver($driver, $data);
        $em->flush();

        return $this->json($driver, 200, [], ['groups' => 'driver:read']);
    }

    /**
     * ✅ GET /api/drivers/nearby
     * Spatial search using the custom findNearbyDrivers repository method.
     */
    #[Route('/nearby', name: 'app_drivers_nearby', methods: ['GET'])]
    public function nearby(Request $request, DriversRepository $repo): JsonResponse
    {
        $lat = (float)$request->query->get('lat');
        $lng = (float)$request->query->get('lng');
        $radius = (float)$request->query->get('radius', 5000); // Meters

        if (!$lat || !$lng) {
            return $this->json(['error' => 'Latitude and Longitude are required.'], 400);
        }

        $drivers = $repo->findNearbyDrivers($lng, $lat, $radius);
        return $this->json($drivers, 200, [], ['groups' => 'driver:read']);
    }

    /**
     * ✅ DELETE /api/drivers/{id}
     */
    #[IsGranted('ROLE_ADMIN')]
    #[Route('/{id}', name: 'app_drivers_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(Drivers $driver, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($driver);
        $em->flush();
        return $this->json(['message' => 'Driver deleted successfully.']);
    }

    /**
     * 🔁 Internal Helper: Maps array data to Driver Entity
     */
    private function mapDataToDriver(Drivers $driver, array $data): void
    {
        if (isset($data['name'])) $driver->setName($data['name']);
        if (isset($data['phone'])) $driver->setPhone($data['phone']);
        if (isset($data['availability'])) $driver->setAvailability((bool)$data['availability']);

        // Handle Spatial Point [Longitude, Latitude]
        if (isset($data['latitude'], $data['longitude'])) {
            $lat = (float)$data['latitude'];
            $lon = (float)$data['longitude'];

            if ($lat >= -90 && $lat <= 90 && $lon >= -180 && $lon <= 180) {
                // Point expects [X, Y] -> [Lon, Lat]
                $driver->setLocation(new Point([$lon, $lat]));
            }
        }
    }
}