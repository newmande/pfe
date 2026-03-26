<?php

namespace App\Controller;

use App\Entity\Reservations;
use App\Entity\Vehicledriver;
use App\Repository\ReservationsRepository;
use App\Repository\DriversRepository;
use App\Repository\VehiclesRepository;
use App\Repository\UsersRepository;
use App\Service\MapService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[Route('/reservations')]
class ReservationsController extends AbstractController
{
    private MapService $mapService;

    public function __construct(MapService $mapService)
    {
        $this->mapService = $mapService;
    }
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
        
        $driver= $driversRepo->findAvailableDriver(
            $reservation->getDatetime(),
            $reservation->getDatetime()->modify('+1 hour')
        );
        $reservation->setDriver($driver);

        $vehicle = $vehiclesRepo->findAvailableVehicle(
            $data['type'],
            $reservation->getDatetime(),
            $reservation->getDatetime()->modify('+1 hour')
        );
        $reservation->setVehicle($vehicle);

        // ✅ set createdAt automatically
        $reservation->setCreatedat(new \DateTime());

        // ✅ Calculate ride estimate if addresses are provided
        try {
            if (!empty($reservation->getPickuplocation()) && !empty($reservation->getDropofflocation())) {
                $pickupCoords = $this->mapService->addressToCoordinates($reservation->getPickuplocation());
                $dropoffCoords = $this->mapService->addressToCoordinates($reservation->getDropofflocation());

                if ($pickupCoords && $dropoffCoords) {
                    $estimate = $this->mapService->getRideEstimate(
                        $pickupCoords['lat'],
                        $pickupCoords['lon'],
                        $dropoffCoords['lat'],
                        $dropoffCoords['lon']
                    );

                    if ($estimate) {
                        $reservation->setDistance((string)$estimate['distance']);
                        $reservation->setDuration((string)$estimate['duration']);
                        $reservation->setPrice((string)$estimate['price']);
                    }
                }
            }
        } catch (\Exception $e) {
            // Log error but don't fail the reservation
            // You may want to add proper logging here
            error_log('Route calculation failed: ' . $e->getMessage());
        }

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
        $driverVehicle = $em->getRepository(Vehicledriver::class)->findOneBy([
        'driver' => $reservation->getDriver()->getId(),
        'vehicle' => $reservation->getVehicle()->getId(),
        'rideStart' => $reservation->getDatetime() // Adding time ensures you delete the right "slot"
    ]);

    // 2. If a matching record exists, remove it
    if ($driverVehicle) {
        $em->remove($driverVehicle);
    }
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
            'distance' => $r->getDistance(), // in km
            'duration' => $r->getDuration(), // in minutes
            'price' => $r->getPrice(), // in TND

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

    #[Route('/by-user/{userId}', methods: ['GET'])]
    public function searchByUser(int $userId, ReservationsRepository $repo): JsonResponse
    {
        // Only ADMIN or the user themselves can view their reservations
        /** @var Users $currentUser */
        $currentUser = $this->getUser();
        
        if (!$currentUser || (!$this->isGranted('ROLE_ADMIN') && $currentUser->getId() !== $userId)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $reservations = $repo->findByUserId($userId);
        $data = array_map(fn($r) => $this->serialize($r), $reservations);
        return $this->json($data);
    }

    #[Route('/by-driver/{driverId}', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function searchByDriver(int $driverId, ReservationsRepository $repo): JsonResponse
    {
        $reservations = $repo->findByDriverId($driverId);
        $data = array_map(fn($r) => $this->serialize($r), $reservations);
        return $this->json($data);
    }

    #[Route('/by-vehicle/{vehicleId}', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function searchByVehicle(int $vehicleId, ReservationsRepository $repo): JsonResponse
    {
        $reservations = $repo->findByVehicleId($vehicleId);
        $data = array_map(fn($r) => $this->serialize($r), $reservations);
        return $this->json($data);
    }

    #[Route('/my-reservations', methods: ['GET'])]
    public function getMyReservations(UsersRepository $usersRepo): JsonResponse
    {
        $user = $this->getUser();
        
        if (!$user) {
            return $this->json(['error' => 'Not authenticated'], 401);
        }

        $reservations = $usersRepo->findUserReservations($user);
        $data = array_map(fn($r) => $this->serialize($r), $reservations);

        return $this->json($data);
    }
}