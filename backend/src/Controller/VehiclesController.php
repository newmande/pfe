<?php

namespace App\Controller;

use App\Entity\Vehicles;
use App\Repository\VehiclesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/vehicles')]
class VehiclesController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function index(VehiclesRepository $repo): JsonResponse
    {
        $vehicles = $repo->findAll();
        $data = array_map(fn($v) => $this->serialize($v), $vehicles);
        return $this->json($data);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Vehicles $vehicle): JsonResponse
    {
        return $this->json($this->serialize($vehicle));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $vehicle = new Vehicles();

        if (isset($data['model'])) $vehicle->setModel($data['model']);
        if (isset($data['type'])) $vehicle->setType($data['type']);
        if (isset($data['capacity'])) $vehicle->setCapacity($data['capacity']);
        if (isset($data['priceperkm'])) $vehicle->setPriceperkm($data['priceperkm']);
        if (isset($data['availability'])) $vehicle->setAvailability($data['availability']);

        $em->persist($vehicle);
        $em->flush();

        return $this->json($this->serialize($vehicle), 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(Vehicles $vehicle, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['model'])) $vehicle->setModel($data['model']);
        if (isset($data['type'])) $vehicle->setType($data['type']);
        if (isset($data['capacity'])) $vehicle->setCapacity($data['capacity']);
        if (isset($data['priceperkm'])) $vehicle->setPriceperkm($data['priceperkm']);
        if (isset($data['availability'])) $vehicle->setAvailability($data['availability']);

        $em->flush();

        return $this->json($this->serialize($vehicle));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Vehicles $vehicle, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($vehicle);
        $em->flush();

        return $this->json(['message' => 'Vehicle deleted']);
    }

    private function serialize(Vehicles $v): array
    {
        return [
            'id' => $v->getId(),
            'model' => $v->getModel(),
            'type' => $v->getType(),
            'capacity' => $v->getCapacity(),
            'priceperkm' => $v->getPriceperkm(),
            'availability' => $v->isAvailable(),
        ];
    }
}