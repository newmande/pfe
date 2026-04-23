<?php

namespace App\Controller;

use App\Entity\Vehicles;
use App\Repository\VehiclesRepository;
use App\Validator\ReservationValidator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/vehicles')]
class VehiclesController extends AbstractController
{
    
    #[Route('', name: 'vehicle_index', methods: ['GET'])]
    public function index(VehiclesRepository $repo): JsonResponse
    {
        
        $vehicles = $repo->findAll(); 
        $data = array_map(fn($v) => $this->serialize($v), $vehicles);
        return $this->json($data);
    }

    
    #[Route('/available', name: 'vehicle_available', methods: ['GET'], priority: 2)]
    public function getAvailable(VehiclesRepository $repo): JsonResponse
    {
        $vehicles = $repo->findBy(['availability' => true]);
        $data = array_map(fn($v) => $this->serialize($v), $vehicles);
        return $this->json($data);
    }

   
    #[Route('/type/{type}', name: 'vehicle_by_type', methods: ['GET'])]
    public function getByType(string $type, VehiclesRepository $repo): JsonResponse
    {
        $vehicles = $repo->findBy(['type' => $type]);
        $data = array_map(fn($v) => $this->serialize($v), $vehicles);
        return $this->json($data);
    }

    
    #[Route('/{id}', name: 'vehicle_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(Vehicles $vehicle): JsonResponse
    {
        return $this->json($this->serialize($vehicle));
    }

    
    #[Route('', name: 'vehicle_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        try {
            
            ReservationValidator::validateVehicleData($data);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }

        $vehicle = new Vehicles();
        $this->mapData($vehicle, $data);

        $em->persist($vehicle);
        $em->flush();

        return $this->json($this->serialize($vehicle), 201);
    }

   
    #[Route('/{id}', name: 'vehicle_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(Vehicles $vehicle, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $this->mapData($vehicle, $data);
        $em->flush();

        return $this->json($this->serialize($vehicle));
    }

    
    #[Route('/{id}', name: 'vehicle_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(Vehicles $vehicle, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($vehicle);
        $em->flush();

        return $this->json(['message' => 'Vehicle deleted successfully']);
    }

    
    #[Route('/search/{model}', name: 'vehicle_search_model', methods: ['GET'])]
    public function searchByModel(string $model, VehiclesRepository $repo): JsonResponse
    {
        $vehicles = $repo->createQueryBuilder('v')
            ->where('v.model LIKE :model')
            ->setParameter('model', '%' . $model . '%')
            ->getQuery()
            ->getResult();

        if (empty($vehicles)) {
            return $this->json(['message' => 'No vehicles found'], 404);
        }

        $data = array_map(fn($v) => $this->serialize($v), $vehicles);
        return $this->json($data);
    }

    

    private function mapData(Vehicles $vehicle, array $data): void
    {
        if (isset($data['model'])) $vehicle->setModel($data['model']);
        if (isset($data['license'])) $vehicle->setLicense($data['license']);
        if (isset($data['type'])) $vehicle->setType($data['type']);
        if (isset($data['category'])) $vehicle->setCategory($data['category']);
        if (isset($data['capacity'])) $vehicle->setCapacity((int)$data['capacity']);
        if (isset($data['availability'])) $vehicle->setAvailability((bool)$data['availability']);
    }

    private function serialize(Vehicles $v): array
    {
        return [
            'id' => $v->getId(),
            'model' => $v->getModel(),
            'license' => $v->getLicense(),
            'type' => $v->getType(),
            'category' => $v->getCategory(),
            'capacity' => $v->getCapacity(),
            'availability' => (bool)$v->isAvailable(), 
        ];
    }
    
}