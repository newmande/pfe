<?php

namespace App\Controller;

use App\Entity\Users;
use Doctrine\ORM\EntityManagerInterface;
use LongitudeOne\Spatial\PHP\Types\Geometry\Point;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/users')]
class UsersController extends AbstractController
{
    #[Route('/me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var Users $user */
        $user = $this->getUser();

        return $this->json($this->serialize($user));
    }

    #[Route('/me', methods: ['PUT'])]
    public function updateMe(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var Users $user */
        $user = $this->getUser();

        if (!$user instanceof Users) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $user->setName($data['name']);
        }

        if (isset($data['phone'])) {
            $user->setPhone($data['phone']);
        }

        if (isset($data['latitude']) && isset($data['longitude'])) {
            // ⚡ Correct Point creation: longitude first, latitude second
            $point = new Point($data['longitude'], $data['latitude']);
            $user->setLocation($point);
        }

        $em->flush();

        return $this->json($this->serialize($user));
    }

    private function serialize(Users $user): array
    {
        $location = $user->getLocation();

        return [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'phone' => $user->getPhone(),
            'roles' => $user->getRoles(),
            'location' => $location instanceof Point ? [
                'latitude' => $location->getY(),
                'longitude' => $location->getX(),
            ] : null,
        ];
    }
}