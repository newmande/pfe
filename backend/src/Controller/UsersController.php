<?php

namespace App\Controller;

use App\Entity\Users;
use App\Repository\UsersRepository;
use Doctrine\ORM\EntityManagerInterface;
use LongitudeOne\Spatial\PHP\Types\Geometry\Point;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users')]
class UsersController extends AbstractController
{
    
    #[Route('/me', name: 'user_me', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function me(): JsonResponse
    {
        /** @var Users $user */
        $user = $this->getUser();
        return $this->json($this->serialize($user));
    }

    
    #[Route('/me', name: 'user_update_me', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateMe(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var Users $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);
        
        $this->mapUserData($user, $data);
        $em->flush();

        return $this->json($this->serialize($user));
    }

    
    #[Route('', name: 'user_list_all', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function getAllUsers(UsersRepository $repo): JsonResponse
    {
        $users = $repo->findAll();
        $data = array_map(fn(Users $u) => $this->serialize($u), $users);
        
        return $this->json($data);
    }

    
    #[Route('/search/email/{email}', name: 'user_search_email', methods: ['GET'])]
    public function searchByEmail(string $email, UsersRepository $repo): JsonResponse
    {
        /** @var Users|null $currentUser */
        $currentUser = $this->getUser();
        
        if (!$currentUser || ($email !== $currentUser->getEmail() && !$this->isGranted('ROLE_ADMIN'))) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        $user = $repo->findOneBy(['email' => $email]);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        return $this->json($this->serialize($user));
    }

   
    #[Route('/{id}', name: 'user_admin_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function updateUser(Users $user, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $this->mapUserData($user, $data);

        if (isset($data['role'])) {
            $role = strtoupper($data['role']);
            if (!str_starts_with($role, 'ROLE_')) {
                $role = 'ROLE_' . $role;
            }
            $user->setRoles([$role]);
        }

        $em->flush();
        return $this->json($this->serialize($user));
    }

    
    #[Route('/{id}', name: 'user_admin_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function deleteUser(Users $user, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($user);
        $em->flush();

        return $this->json(['message' => "User {$user->getEmail()} deleted"]);
    }

    

    private function mapUserData(Users $user, array $data): void
    {
        if (isset($data['name'])) $user->setName($data['name']);
        if (isset($data['phone'])) $user->setPhone($data['phone']);

        if (isset($data['latitude'], $data['longitude'])) {
            $lat = (float)$data['latitude'];
            $lon = (float)$data['longitude'];

            if ($lat >= -90 && $lat <= 90 && $lon >= -180 && $lon <= 180) {
                
                $user->setLocation(new Point($lon, $lat));
            }
        }
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