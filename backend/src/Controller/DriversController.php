<?php

namespace App\Controller;

use App\Entity\Drivers;
use App\Repository\DriversRepository;
use App\Repository\UsersRepository;
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
    
    #[IsGranted('ROLE_ADMIN')]
    #[Route('', name: 'app_drivers_index', methods: ['GET'])]
    public function index(DriversRepository $repository): JsonResponse
    {
        $drivers = $repository->findAllWithRelations();
        $data = array_map(fn($d) => $this->serialize($d), $drivers);
        return $this->json($data);
    }

    
    #[IsGranted('ROLE_ADMIN')]
    #[Route('/{id}', name: 'app_drivers_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(Drivers $driver): JsonResponse
    {
        return $this->json($this->serialize($driver));
    }

    
    #[IsGranted('ROLE_ADMIN')]
    #[Route('', name: 'app_drivers_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, UsersRepository $usersRepo): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        try {
           
            ReservationValidator::validateDriverData($data);

            $driver = new Drivers();
            $this->mapDataToDriver($driver, $data);

            // Optional: Link to user if user_id provided
            if (!empty($data['user_id'])) {
                $user = $usersRepo->find($data['user_id']);
                if ($user) {
                    $driver->setUser($user);
                }
            }

            $em->persist($driver);
            $em->flush();

            return $this->json($this->serialize($driver), 201);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    
    #[IsGranted('ROLE_ADMIN')]
    #[Route('/{id}', name: 'app_drivers_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(Drivers $driver, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $this->mapDataToDriver($driver, $data);
        $em->flush();

        return $this->json($this->serialize($driver));
    }

    
    #[IsGranted('ROLE_ADMIN')]
    #[Route('/available', name: 'app_drivers_available', methods: ['GET'])]
    public function getAvailable(DriversRepository $repo): JsonResponse
    {
        $drivers = $repo->findBy(['availability' => true]);
        $data = array_map(fn($d) => $this->serialize($d), $drivers);
        return $this->json($data);
    }

    #[IsGranted('ROLE_ADMIN')]
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

    
    #[IsGranted('ROLE_ADMIN')]
    #[Route('/{id}', name: 'app_drivers_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(Drivers $driver, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($driver);
        $em->flush();
        return $this->json(['message' => 'Driver deleted successfully.']);
    }

   
    private function mapDataToDriver(Drivers $driver, array $data): void
    {
        if (isset($data['name'])) $driver->setName($data['name']);
        if (isset($data['phone'])) $driver->setPhone($data['phone']);
        if (isset($data['availability'])) $driver->setAvailability((bool)$data['availability']);

        
        if (isset($data['latitude'], $data['longitude'])) {
            $lat = (float)$data['latitude'];
            $lon = (float)$data['longitude'];

            if ($lat >= -90 && $lat <= 90 && $lon >= -180 && $lon <= 180) {
                
                $driver->setLocation(new Point([$lon, $lat]));
            }
        }
    }

    private function serialize(Drivers $driver): array
    {
        $location = $driver->getLocation();
        
        return [
            'id' => $driver->getId(),
            'name' => $driver->getName(),
            'phone' => $driver->getPhone(),
            'availability' => (bool)$driver->isAvailable(),
            'location' => $location ? [
                'latitude' => $location->getY(),
                'longitude' => $location->getX(),
            ] : null,
        ];
    }
}