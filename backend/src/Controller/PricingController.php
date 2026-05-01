<?php

namespace App\Controller;

use App\Entity\Pricing;
use App\Repository\PricingRepository;
use App\Validator\ReservationValidator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/pricing')]
class PricingController extends AbstractController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    #[Route('', name: 'pricing_index', methods: ['GET'])]
    public function index(PricingRepository $pricingRepository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Authentication required'], 401);
        }

        // Admins see all pricing rules, users see only active ones
        if ($this->isGranted('ROLE_ADMIN')) {
            $pricing = $pricingRepository->findBy([], ['vehicleType' => 'ASC', 'createdAt' => 'DESC']);
        } else {
            $pricing = $pricingRepository->findAllActive();
        }

        $data = array_map(fn(Pricing $p) => $this->serializePricing($p), $pricing);

        return $this->json([
            'status' => 'success',
            'count' => count($data),
            'data' => $data
        ]);
    }

   
    #[Route('/active/{vehicleType}/{categoryType}', name: 'app_pricing_active', methods: ['GET'])]
    public function getActivePricing(string $vehicleType, string $categoryType, PricingRepository $repo): JsonResponse
    {
        $pricing = $repo->findActiveByTypeAndCategory($vehicleType, $categoryType);

        if (!$pricing) {
            return $this->json(['error' => 'No active pricing found for this configuration'], 404);
        }

        return $this->json($this->serializePricing($pricing));
    }

    #[Route('/find', name: 'app_pricing_find', methods: ['GET'], priority: 2)]
    public function findByTypeCategory(Request $request, PricingRepository $repo): JsonResponse
    {
        $vehicleType = $request->query->get('vehicleType');
        $categoryType = $request->query->get('categoryType');

        if (!$vehicleType) {
            return $this->json(['error' => 'vehicleType query parameter is required'], 400);
        }

        $pricing = $repo->findActiveByTypeAndCategory($vehicleType, $categoryType);

        if (!$pricing) {
            return $this->json(['error' => 'No active pricing found for this configuration'], 404);
        }

        return $this->json($this->serializePricing($pricing));
    }

    
    #[Route('/{id}', name: 'app_pricing_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(Pricing $pricing): JsonResponse
    {
        return $this->json($this->serializePricing($pricing));
    }

    
    #[Route('', name: 'app_pricing_create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        try {
            
            ReservationValidator::validatePricingData($data);

            $pricing = new Pricing(); 
            $this->mapData($pricing, $data);

            $em->persist($pricing);
            $em->flush();

            return $this->json($this->serializePricing($pricing), 201);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    
    #[Route('/{id}', name: 'app_pricing_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(Pricing $pricing, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        try {
            ReservationValidator::validatePricingData($data);

            $this->mapData($pricing, $data);
            
            
            $em->flush();

            return $this->json($this->serializePricing($pricing));
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    
    #[Route('/{id}', name: 'app_pricing_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(Pricing $pricing, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($pricing);
        $em->flush();

        return $this->json(['message' => 'Pricing rule deleted successfully']);
    }

    
    private function mapData(Pricing $pricing, array $data): void
    {
        if (isset($data['vehicleType'])) $pricing->setVehicleType((string)$data['vehicleType']);
        if (isset($data['categoryType'])) $pricing->setCategoryType((string)$data['categoryType']);
        if (isset($data['baseFare'])) $pricing->setBaseFare((float)$data['baseFare']);
        if (isset($data['pricePerKm'])) $pricing->setPricePerKm((float)$data['pricePerKm']);
        if (isset($data['minimumFare'])) $pricing->setMinimumFare((float)$data['minimumFare']);
        
        
        if (array_key_exists('maximumFare', $data)) {
            $pricing->setMaximumFare($data['maximumFare'] !== null ? (float)$data['maximumFare'] : null);
        }

        if (isset($data['surgeMultiplier'])) $pricing->setSurgeMultiplier((float)$data['surgeMultiplier']);
        if (isset($data['active'])) $pricing->setActive((bool)$data['active']);
        if (isset($data['description'])) $pricing->setDescription((string)$data['description']);
        if (isset($data['notes'])) $pricing->setNotes((string)$data['notes']);
    }

   
    private function serializePricing(Pricing $p): array
    {
        return [
            'id' => $p->getId(),
            'vehicleType' => $p->getVehicleType(),
            'categoryType' => $p->getCategoryType(),
            'baseFare' => $p->getBaseFare(),
            'pricePerKm' => $p->getPricePerKm(),
            'minimumFare' => $p->getMinimumFare(),
            'maximumFare' => $p->getMaximumFare(),
            'surgeMultiplier' => $p->getSurgeMultiplier(),
            'active' => $p->isActive(),
            'description' => $p->getDescription(),
            'notes' => $p->getNotes(),
            'createdAt' => $p->getCreatedAt()->format('c'), // ISO 8601
            'updatedAt' => $p->getUpdatedAt()?->format('c'),
        ];
    }
}