<?php

namespace App\Controller;

use App\Entity\Reservations;
use App\Repository\ReservationsRepository;
use App\Repository\DriversRepository;
use App\Repository\VehiclesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/reservations')]
class ReservationsController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function index(ReservationsRepository $repo): JsonResponse
    {
        $reservations = $repo->findAll();

        $data = array_map(fn($r) => $this->serialize($r), $reservations);

        return $this->json($data);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(Reservations $reservation): JsonResponse
    {
        return $this->json($this->serialize($reservation));
    }

    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        DriversRepository $driversRepo,
        VehiclesRepository $vehiclesRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $reservation = new Reservations();

        $this->mapData($reservation, $data, $driversRepo, $vehiclesRepo);

        // ✅ assign logged user (JWT)
        $reservation->setUser($this->getUser());

        // ✅ set createdAt automatically
        $reservation->setCreatedat(new \DateTime());

        $em->persist($reservation);
        $em->flush();

        return $this->json($this->serialize($reservation), 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(
        Reservations $reservation,
        Request $request,
        EntityManagerInterface $em,
        DriversRepository $driversRepo,
        VehiclesRepository $vehiclesRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $this->mapData($reservation, $data, $driversRepo, $vehiclesRepo);

        $em->flush();

        return $this->json($this->serialize($reservation));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(Reservations $reservation, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($reservation);
        $em->flush();

        return $this->json(['message' => 'Reservation deleted']);
    }

    // 🔁 Map request → entity
    private function mapData(
        Reservations $r,
        array $data,
        DriversRepository $driversRepo,
        VehiclesRepository $vehiclesRepo
    ): void {
        if (isset($data['datetime'])) {
            $r->setDatetime(new \DateTime($data['datetime']));
        }

        if (isset($data['pickuplocation'])) {
            $r->setPickuplocation($data['pickuplocation']);
        }

        if (isset($data['dropofflocation'])) {
            $r->setDropofflocation($data['dropofflocation']);
        }

        if (isset($data['status'])) {
            $r->setStatus($data['status']);
        }

        if (isset($data['numberofpassengers'])) {
            $r->setNumberofpassengers($data['numberofpassengers']);
        }

        // ✅ Driver relation
        if (isset($data['driver_id'])) {
            $driver = $driversRepo->find($data['driver_id']);
            if ($driver) {
                $r->setDriver($driver);
            }
        }

        // ✅ Vehicle relation
        if (isset($data['vehicle_id'])) {
            $vehicle = $vehiclesRepo->find($data['vehicle_id']);
            if ($vehicle) {
                $r->setVehicle($vehicle);
            }
        }
    }

    // 🔁 Entity → array
    private function serialize(Reservations $r): array
    {
        return [
            'id' => $r->getId(),
            'datetime' => $r->getDatetime()?->format('Y-m-d H:i:s'),
            'pickuplocation' => $r->getPickuplocation(),
            'dropofflocation' => $r->getDropofflocation(),
            'status' => $r->getStatus(),
            'numberofpassengers' => $r->getNumberofpassengers(),

            // ✅ relations (clean)
            'driver' => $r->getDriver() ? [
                'id' => $r->getDriver()->getId(),
                'name' => $r->getDriver()->getName(),
            ] : null,

            'vehicle' => $r->getVehicle() ? [
                'id' => $r->getVehicle()->getId(),
            ] : null,

            'user' => $r->getUser() ? [
                'id' => $r->getUser()->getId(),
            ] : null,

            'createdat' => $r->getCreatedat()?->format('Y-m-d H:i:s'),
        ];
    }
}