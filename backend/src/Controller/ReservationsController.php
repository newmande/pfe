<?php

namespace App\Controller;

use App\Entity\Reservations;
use App\Entity\Users;

use App\Repository\ReservationsRepository;
use App\Repository\DriversRepository;
use App\Repository\VehiclesRepository;
use App\Repository\PricingRepository;
use App\Service\MapService;
use App\Validator\ReservationValidator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use SymfonyCasts\Bundle\VerifyEmail\VerifyEmailHelperInterface;
use SymfonyCasts\Bundle\VerifyEmail\Exception\VerifyEmailExceptionInterface;


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

    
    #[Route('', name: 'app_reservations_create', methods: ['POST'])]
    public function create(
        Request $request,
        DriversRepository $driversRepo,
        VehiclesRepository $vehiclesRepo,
        PricingRepository $pricingRepo,
       VerifyEmailHelperInterface $verifyEmailHelper,
        MailerInterface $mailer
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

            
            /** @var \DateTime $startTime */
            $startTime = $reservation->getDatetime();
            if (!$startTime) {
                return $this->json(['error' => 'Invalid reservation date'], 400);
            }
            
            
            $endTime = (clone $startTime)->modify("+" . ($estimatedDuration + 15) . " minutes");

            
            $driver = $driversRepo->findAvailableDriver($startTime, $endTime);
            $requestedCategory = $data['category'] ?? null;
            $vehicle = $vehiclesRepo->findAvailableVehicleByTypeAndCategory($data['type'] ?? 'sedan', $requestedCategory, $startTime, $endTime);

            if (!$driver && !$vehicle) {
                return $this->json(['error' => 'No driver or vehicle available for this time'], 409);
            }
            if (!$driver) {
                return $this->json(['error' => 'No driver available for this time'], 409);
            }
            if (!$vehicle) {
                return $this->json(['error' => 'No vehicle of type "' . ($data['type'] ?? 'sedan') . '" with category "' . ($requestedCategory ?? 'any') . '" available for this time'], 409);
            }

            
            if ((int)($data['numberOfPassengers'] ?? 1) > $vehicle->getCapacity()) {
                return $this->json(['error' => "Vehicle capacity exceeded"], 400);
            }

            $reservation->setDriver($driver);
            $reservation->setVehicle($vehicle);
            $reservation->setStatus('pending');
            
            // Calculate price based on distance
            if ($reservation->getDistance()) {
                $distance = (float)$reservation->getDistance();
                $vehicleType = $vehicle->getType();
                $requestedCategory = $reservation->getCategory() ?? $vehicle->getCategory();
                
                // Try to find pricing: 1) requested category, 2) vehicle's category, 3) type-only, 4) generic sedan fallback
                $pricing = $pricingRepo->findActiveByTypeAndCategory($vehicleType, $requestedCategory);
                
                if (!$pricing && $requestedCategory !== $vehicle->getCategory()) {
                    $pricing = $pricingRepo->findActiveByTypeAndCategory($vehicleType, $vehicle->getCategory());
                }
                
                if (!$pricing) {
                    $pricing = $pricingRepo->findActiveByTypeOnly($vehicleType);
                }
                
                if (!$pricing && $vehicleType !== 'sedan') {
                    $pricing = $pricingRepo->findActiveByTypeOnly('sedan');
                }
                
                if ($pricing) {
                    $reservation->setPrice((string)$pricing->calculatePrice($distance));
                } else {
                    // Default pricing: base 5 TND + 0.5 per km, min 5 TND
                    $defaultPrice = max(5 + ($distance * 0.5), 5);
                    $reservation->setPrice((string)round($defaultPrice, 2));
                }
            }
            
            $this->entityManager->persist($reservation);
            $this->entityManager->flush();
            $signatureComponents = $verifyEmailHelper->generateSignature(
                'api_reservation_confirm', // Route name below
               (string) $reservation->getId(),
                $user->getEmail(),
                [
                   'id' => $reservation->getId(),
                ]
            );

            $email = (new TemplatedEmail())
                ->from('noreply@yourdomain.com')
                ->to($user->getEmail())
                ->subject('Complete your Reservation')
                ->htmlTemplate('emails/reservation_verify.html.twig')
                ->context(['signedUrl' => $signatureComponents->getSignedUrl()]);

            $mailer->send($email);
            return $this->json([
                'message' => 'Verification email sent. Please confirm to complete reservation.'
            ], 202);
            } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
            
            

            
        
    }

    
    #[Route('/{id}', name: 'app_reservations_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(Reservations $reservation): JsonResponse
    {
        $user = $this->getUser();
        if ($reservation->getUser() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Access Denied'], 403);
        }



        $this->entityManager->remove($reservation);
        $this->entityManager->flush();

        return $this->json(['message' => 'Reservation cancelled']);
    }

    
    #[Route('/my-reservations', name: 'app_reservations_my', methods: ['GET'])]
    public function getMyReservations(ReservationsRepository $repo): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Unauthorized'], 401);

        $reservations = $repo->findBy(['user' => $user], ['datetime' => 'DESC']);
        return $this->json(array_map(fn($r) => $this->serialize($r), $reservations));
    }

    
    private function mapData(Reservations $r, array $data): void
    {
        if (isset($data['datetime'])) {
            $r->setDatetime(new \DateTime($data['datetime']));
        }
        if (isset($data['pickupLocation'])) $r->setPickupLocation($data['pickupLocation']);
        if (isset($data['dropoffLocation'])) $r->setDropoffLocation($data['dropoffLocation']);
        if (isset($data['numberOfPassengers'])) $r->setNumberOfPassengers((int)$data['numberOfPassengers']);
        if (isset($data['status'])) $r->setStatus($data['status'] ?? 'pending');
        if (isset($data['category'])) $r->setCategory($data['category']);
    }

    
    private function serialize(Reservations $r): array
    {
        return [
            'id' => $r->getId(),
            'datetime' => $r->getDatetime()?->format('Y-m-d H:i:s'),
            'pickupLocation' => $r->getPickupLocation(),
            'dropoffLocation' => $r->getDropoffLocation(),
            'status' => $r->getStatus(),
            'passengers' => $r->getNumberOfPassengers(),
            'category' => $r->getCategory(),
            'price' => $r->getPrice() . ' TND',
            'distance' => $r->getDistance() . ' km',
            'duration' => $r->getDuration() . ' mins',
            'driver' => $r->getDriver() ? ['id' => $r->getDriver()->getId(), 'name' => $r->getDriver()->getName()] : null,
            'vehicle' => $r->getVehicle() ? [
                'model' => $r->getVehicle()->getModel(),
                'license' => $r->getVehicle()->getLicense()
            ] : null,
            'user' => $r->getUser() ? [
                'id' => $r->getUser()->getId(),
                'name' => $r->getUser()->getName(),
                'email' => $r->getUser()->getEmail()
            ] : null,
        ];
    }
    #[Route('/reservation-confirm/{id}', name: 'api_reservation_confirm', methods: ['GET'])]
public function confirmRegistration(
    Request $request,
    EntityManagerInterface $em,
    Reservations $reservation, 
    VerifyEmailHelperInterface $verifyEmailHelper
): Response {
    try {
        $verifyEmailHelper->validateEmailConfirmation(
            $request->getUri(), 
            (string) $reservation->getId(), 
            $reservation->getUser()->getEmail()
        );
    } catch (VerifyEmailExceptionInterface $e) {
        return $this->json(['error' => $e->getReason()], 400);
    }

    // Check if it's already confirmed to avoid redundant work
    if ($reservation->getStatus() === 'confirmed') {
        return $this->json(['message' => 'Reservation was already confirmed.'], 200);
    }

    // Update the existing record
    $reservation->setStatus('confirmed');
    $em->flush(); // No need for persist() if the object came from the DB

    return $this->json(['message' => 'Reservation confirmed successfully!'], 200);
}

    #[Route('/{id}/status', name: 'app_reservations_update_status', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_DRIVER')]
    public function updateStatus(
        Request $request,
        Reservations $reservation,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Unauthorized'], 401);

        // Find driver by user
        $driver = $this->entityManager->getRepository(\App\Entity\Drivers::class)->findOneBy(['user' => $user]);
        if (!$driver) return $this->json(['error' => 'Driver profile not found'], 404);

        // Check if this reservation belongs to the driver
        if ($reservation->getDriver() !== $driver) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $newStatus = $data['status'] ?? null;

        $allowedStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
        if (!$newStatus || !in_array($newStatus, $allowedStatuses)) {
            return $this->json(['error' => 'Invalid status'], 400);
        }

        // Status transition validation
        $currentStatus = $reservation->getStatus();
        if ($currentStatus === 'completed' || $currentStatus === 'cancelled') {
            return $this->json(['error' => 'Cannot change status of completed or cancelled reservation'], 400);
        }

        if ($currentStatus === 'pending' && $newStatus !== 'confirmed') {
            return $this->json(['error' => 'Pending reservations can only be confirmed'], 400);
        }

        if ($currentStatus === 'confirmed' && !in_array($newStatus, ['in_progress', 'cancelled'])) {
            return $this->json(['error' => 'Confirmed reservations can only be started or cancelled'], 400);
        }

        if ($currentStatus === 'in_progress' && $newStatus !== 'completed') {
            return $this->json(['error' => 'In-progress reservations can only be completed'], 400);
        }

        $reservation->setStatus($newStatus);
        $em->flush();

        return $this->json([
            'message' => 'Status updated successfully',
            'reservation' => $this->serialize($reservation)
        ]);
    }

    #[Route('/{id}', name: 'app_reservations_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(
        Request $request,
        Reservations $reservation,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        try {
            $this->mapData($reservation, $data);
            $em->flush();

            return $this->json([
                'message' => 'Reservation updated successfully',
                'reservation' => $this->serialize($reservation)
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    #[Route('/driver-reservations', name: 'app_reservations_driver', methods: ['GET'])]
    #[IsGranted('ROLE_DRIVER')]
    public function getDriverReservations(ReservationsRepository $repo): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Unauthorized'], 401);

        // Find driver by user
        $driver = $this->entityManager->getRepository(\App\Entity\Drivers::class)->findOneBy(['user' => $user]);
        if (!$driver) return $this->json(['error' => 'Driver profile not found'], 404);

        $reservations = $repo->findBy(['driver' => $driver], ['datetime' => 'DESC']);
        $data = array_map(fn($r) => $this->serialize($r), $reservations);

        return $this->json($data);
    }
}

        