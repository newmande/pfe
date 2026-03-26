<?php

namespace App\Controller;

use App\Entity\Reservations;
use App\Entity\Users;
use App\Entity\VehicleDriver;
use App\Repository\ReservationsRepository;
use App\Repository\DriversRepository;
use App\Repository\VehiclesRepository;
use App\Repository\PricingRepository;
use App\Service\MapService;
use App\Validator\ReservationValidator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/reservations')]
class ReservationsController extends AbstractController
{
    private MapService $mapService;
    private EntityManagerInterface $entityManager;

    public function __construct(MapService $mapService, EntityManagerInterface $entityManager)
    {
        $this->mapService = $mapService;
        $this->entityManager = $entityManager;
    }

    /**
     * ✅ GET /api/reservations
     */
    #[Route('', name: 'app_reservations_index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function index(Request $request, ReservationsRepository $repo): JsonResponse
    {
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(100, max(1, $request->query->getInt('limit', 20)));
        $offset = ($page - 1) * $limit;

        $qb = $repo->createQueryBuilder('r')
            ->leftJoin('r.driver', 'd')->addSelect('d')
            ->leftJoin('r.vehicle', 'v')->addSelect('v')
            ->leftJoin('r.user', 'u')->addSelect('u')
            ->orderBy('r.datetime', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limit);

        $reservations = $qb->getQuery()->getResult();
        $total = $repo->count([]);

        $data = array_map(fn($r) => $this->serialize($r), $reservations);

        return $this->json([
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'pages' => (int)ceil($total / $limit)
            ]
        ]);
    }

    /**
     * ✅ POST /api/reservations
     */
    #[Route('', name: 'app_reservations_create', methods: ['POST'])]
    public function create(
        Request $request,
        DriversRepository $driversRepo,
        VehiclesRepository $vehiclesRepo,
        PricingRepository $pricingRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        try {
            ReservationValidator::validateReservationData($data);
            
            $user = $this->getUser();
            if (!$user instanceof Users) {
                return $this->json(['error' => 'Authentication required'], 401);
            }

            $reservation = new Reservations();
            $this->mapData($reservation, $data);
            $reservation->setUser($user);

            // 1. Map Logic
            $estimatedDuration = 60; 
            if (!empty($data['pickupLocation']) && !empty($data['dropoffLocation'])) {
                $pickupCoords = $this->mapService->addressToCoordinates($data['pickupLocation']);
                $dropoffCoords = $this->mapService->addressToCoordinates($data['dropoffLocation']);

                if ($pickupCoords && $dropoffCoords) {
                    $estimate = $this->mapService->getRideEstimate(
                        $pickupCoords['lat'], $pickupCoords['lon'],
                        $dropoffCoords['lat'], $dropoffCoords['lon']
                    );

                    if ($estimate) {
                        $reservation->setDistance((string)$estimate['distance']);
                        $reservation->setDuration((string)$estimate['duration']);
                        $estimatedDuration = (int)ceil($estimate['duration']);
                    }
                }
            }

            // 2. Type-Safe Date Calculation (Fixes Intelephense P1013)
            /** @var \DateTime $startTime */
            $startTime = $reservation->getDatetime();
            if (!$startTime) {
                return $this->json(['error' => 'Invalid reservation date'], 400);
            }
            
            // Clone to avoid modifying the original start time
            $endTime = (clone $startTime)->modify("+" . ($estimatedDuration + 15) . " minutes");

            // 3. Resource Availability
            $driver = $driversRepo->findAvailableDriver($startTime, $endTime);
            $vehicle = $vehiclesRepo->findAvailableVehicle($data['type'] ?? 'sedan', $startTime, $endTime);

            if (!$driver || !$vehicle) {
                return $this->json(['error' => 'No driver or vehicle available for this time'], 409);
            }

            // 4. Capacity & Pricing
            if ((int)($data['numberOfPassengers'] ?? 1) > $vehicle->getCapacity()) {
                return $this->json(['error' => "Vehicle capacity exceeded"], 400);
            }

            $reservation->setDriver($driver);
            $reservation->setVehicle($vehicle);

            $pricing = $pricingRepo->findActiveByTypeAndCategory($vehicle->getType(), $vehicle->getCategory());
            if ($pricing && $reservation->getDistance()) {
                $reservation->setPrice((string)$pricing->calculatePrice((float)$reservation->getDistance()));
            }

            // 5. Create Overlap Record
            $driverVehicle = new VehicleDriver();
            $driverVehicle->setVehicle($vehicle);
            $driverVehicle->setDriver($driver);
            $driverVehicle->setStart($startTime);
            $driverVehicle->setEnd($endTime);

            $this->entityManager->persist($reservation);
            $this->entityManager->persist($driverVehicle);
            $this->entityManager->flush();

            return $this->json($this->serialize($reservation), 201);

        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * ✅ DELETE /api/reservations/{id}
     */
    #[Route('/{id}', name: 'app_reservations_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(Reservations $reservation): JsonResponse
    {
        $user = $this->getUser();
        if ($reservation->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access Denied'], 403);
        }

        $assignment = $this->entityManager->getRepository(VehicleDriver::class)->findOneBy([
            'driver' => $reservation->getDriver(),
            'vehicle' => $reservation->getVehicle(),
            'start' => $reservation->getDatetime()
        ]);

        if ($assignment) {
            $this->entityManager->remove($assignment);
        }

        $this->entityManager->remove($reservation);
        $this->entityManager->flush();

        return $this->json(['message' => 'Reservation cancelled']);
    }

    /**
     * ✅ GET /api/reservations/my-reservations
     */
    #[Route('/my-reservations', name: 'app_reservations_my', methods: ['GET'])]
    public function getMyReservations(ReservationsRepository $repo): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Unauthorized'], 401);

        $reservations = $repo->findBy(['user' => $user], ['datetime' => 'DESC']);
        return $this->json(array_map(fn($r) => $this->serialize($r), $reservations));
    }

    /**
     * 🔁 Internal Helper: Map Request → Entity
     */
    private function mapData(Reservations $r, array $data): void
    {
        if (isset($data['datetime'])) {
            $r->setDatetime(new \DateTime($data['datetime']));
        }
        if (isset($data['pickupLocation'])) $r->setPickupLocation($data['pickupLocation']);
        if (isset($data['dropoffLocation'])) $r->setDropoffLocation($data['dropoffLocation']);
        if (isset($data['numberOfPassengers'])) $r->setNumberOfPassengers((int)$data['numberOfPassengers']);
        if (isset($data['status'])) $r->setStatus($data['status'] ?? 'pending');
    }

    /**
     * 🔁 Internal Helper: Entity → Array
     */
    private function serialize(Reservations $r): array
    {
        return [
            'id' => $r->getId(),
            'datetime' => $r->getDatetime()?->format('Y-m-d H:i:s'),
            'pickupLocation' => $r->getPickupLocation(),
            'dropoffLocation' => $r->getDropoffLocation(),
            'status' => $r->getStatus(),
            'passengers' => $r->getNumberOfPassengers(),
            'price' => $r->getPrice() . ' TND',
            'distance' => $r->getDistance() . ' km',
            'duration' => $r->getDuration() . ' mins',
            'driver' => $r->getDriver() ? ['id' => $r->getDriver()->getId(), 'name' => $r->getDriver()->getName()] : null,
            'vehicle' => $r->getVehicle() ? [
                'model' => $r->getVehicle()->getModel(), 
                'license' => $r->getVehicle()->getLicense()
            ] : null,
        ];
    }
}