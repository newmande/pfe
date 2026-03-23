<?php

namespace App\Controller;

use App\Entity\Drivers;
use App\Repository\DriversRepository;
use Doctrine\ORM\EntityManagerInterface;
use LongitudeOne\Spatial\PHP\Types\Geometry\Point;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/drivers')]
class DriversController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function index(DriversRepository $repository): JsonResponse
    {
        $drivers = $repository->findAll();

        $data = array_map(fn($driver) => $this->serializeDriver($driver), $drivers);

        return $this->json($data);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Drivers $driver): JsonResponse
    {
        return $this->json($this->serializeDriver($driver));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $driver = new Drivers();
        $this->mapDataToDriver($driver, $data);

        $em->persist($driver);
        $em->flush();

        return $this->json($this->serializeDriver($driver), 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(Drivers $driver, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $this->mapDataToDriver($driver, $data);

        $em->flush();

        return $this->json($this->serializeDriver($driver));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Drivers $driver, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($driver);
        $em->flush();

        return $this->json(['message' => 'Driver deleted']);
    }

    // 🔁 Map request → entity
    private function mapDataToDriver(Drivers $driver, array $data): void
    {
        if (isset($data['name'])) {
            $driver->setName($data['name']);
        }

        if (isset($data['phone'])) {
            $driver->setPhone($data['phone']);
        }

        if (isset($data['availability'])) {
            $driver->setAvailability($data['availability']);
        }

        // ✅ FIXED: correct order (longitude, latitude)
        if (isset($data['latitude']) && isset($data['longitude'])) {
            $point = new Point($data['longitude'], $data['latitude']);
            $driver->setLocation($point);
        }
    }

    // 🔁 Entity → array (FIXED)
    private function serializeDriver(Drivers $driver): array
    {
        $location = $driver->getLocation();

        return [
            'id' => $driver->getId(),
            'name' => $driver->getName(),
            'phone' => $driver->getPhone(),
            'availability' => $driver->isAvailabile(),
            'location' => $location instanceof Point ? [
                // ✅ FIXED: correct getters
                'latitude' => $location->getY(),
                'longitude' => $location->getX(),
            ] : null,
        ];
    }
}