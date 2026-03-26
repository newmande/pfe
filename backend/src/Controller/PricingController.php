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
#[IsGranted('ROLE_ADMIN')]
class PricingController extends AbstractController
{
    /**
     * ✅ GET /api/pricing
     * List all active pricing configurations.
     */
    #[Route('', name: 'app_pricing_index', methods: ['GET'])]
    public function index(PricingRepository $repo): JsonResponse
    {
        $pricingList = $repo->findAllActive();
        $data = array_map(fn(Pricing $p) => $this->serializePricing($p), $pricingList);

        return $this->json([
            'status' => 'success',
            'count' => count($data),
            'data' => $data
        ]);
    }

    /**
     * ✅ GET /api/pricing/find
     * Priority is set to 2 to ensure "find" isn't mistaken for an ID.
     */
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

    /**
     * ✅ GET /api/pricing/{id}
     */
    #[Route('/{id}', name: 'app_pricing_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(Pricing $pricing): JsonResponse
    {
        return $this->json($this->serializePricing($pricing));
    }

    /**
     * ✅ POST /api/pricing
     * Note: createdAt is handled by the Entity __construct().
     */
    #[Route('', name: 'app_pricing_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        try {
            // 1. Validate data types and logic
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

    /**
     * ✅ PUT/PATCH /api/pricing/{id}
     * Note: updatedAt is handled by the Entity #[ORM\PreUpdate] callback.
     */
    #[Route('/{id}', name: 'app_pricing_update', methods: ['PUT', 'PATCH'], requirements: ['id' => '\d+'])]
    public function update(Pricing $pricing, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        try {
            ReservationValidator::validatePricingData($data);

            $this->mapData($pricing, $data);
            
            // Doctrine's flush triggers the onPreUpdate callback in the Entity
            $em->flush();

            return $this->json($this->serializePricing($pricing));
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * ✅ DELETE /api/pricing/{id}
     */
    #[Route('/{id}', name: 'app_pricing_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(Pricing $pricing, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($pricing);
        $em->flush();

        return $this->json(['message' => 'Pricing rule deleted successfully']);
    }

    /**
     * 🔁 Internal Helper: Sync array data to Pricing Entity with strict casting
     */
    private function mapData(Pricing $pricing, array $data): void
    {
        if (isset($data['vehicleType'])) $pricing->setVehicleType((string)$data['vehicleType']);
        if (isset($data['categoryType'])) $pricing->setCategoryType((string)$data['categoryType']);
        if (isset($data['baseFare'])) $pricing->setBaseFare((float)$data['baseFare']);
        if (isset($data['pricePerKm'])) $pricing->setPricePerKm((float)$data['pricePerKm']);
        if (isset($data['minimumFare'])) $pricing->setMinimumFare((float)$data['minimumFare']);
        
        // Handle nullable maximumFare
        if (array_key_exists('maximumFare', $data)) {
            $pricing->setMaximumFare($data['maximumFare'] !== null ? (float)$data['maximumFare'] : null);
        }

        if (isset($data['surgeMultiplier'])) $pricing->setSurgeMultiplier((float)$data['surgeMultiplier']);
        if (isset($data['active'])) $pricing->setActive((bool)$data['active']);
        if (isset($data['description'])) $pricing->setDescription((string)$data['description']);
        if (isset($data['notes'])) $pricing->setNotes((string)$data['notes']);
    }

    /**
     * 🔁 Internal Serializer: Convert Entity to clean API-ready Array
     */
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