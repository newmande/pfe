<?php

namespace App\Controller;

use App\Entity\Users;
use App\Validator\ReservationValidator;
use App\Repository\UsersRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

class AuthController extends AbstractController
{
    /**
     * ✅ Register a standard User (ROLE_USER)
     */
    #[Route('/auth/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request, 
        UserPasswordHasherInterface $hasher, 
        EntityManagerInterface $em,
        JWTTokenManagerInterface $jwtManager,
        UsersRepository $userRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        try {
            // 1. Use our centralized validator (handles email, phone, and password length)
            ReservationValidator::validateUserData($data, true);

            // 2. Check for existing user via Repository
            if ($userRepo->findOneBy(['email' => $data['email']])) {
                return $this->json(['error' => 'Email already in use'], 400);
            }

            $user = new Users();
            $user->setEmail($data['email'])
                 ->setName($data['name'] ?? 'User')
                 ->setPhone($data['phone'])
                 ->setRoles(['ROLE_USER'])
                 ->setPassword($hasher->hashPassword($user, $data['password']));

            $em->persist($user);
            $em->flush();

            // 3. Generate JWT Token immediately upon registration
            $token = $jwtManager->create($user);

            return $this->json([
                'message' => 'Registration successful',
                'user' => [
                    'id' => $user->getId(),
                    'name' => $user->getName(),
                    'email' => $user->getEmail()
                ],
                'token' => $token
            ], 216); // 216 is a nice touch for Tunisia, but 201 is standard!

        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return $this->json(['error' => 'An unexpected error occurred'], 500);
        }
    }

    /**
     * ✅ Standard Login
     */
    #[Route('/auth/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        UsersRepository $userRepo,
        UserPasswordHasherInterface $hasher,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            return $this->json(['error' => 'Email and password are required'], 400);
        }

        $user = $userRepo->findOneBy(['email' => $email]);

        if (!$user || !$hasher->isPasswordValid($user, $password)) {
            return $this->json(['error' => 'Invalid credentials'], 401);
        }

        return $this->json([
            'token' => $jwtManager->create($user),
            'roles' => $user->getRoles(),
            'user' => [
                'id' => $user->getId(),
                'name' => $user->getName()
            ]
        ], 200);
    }

    /**
     * ✅ Admin Registration (Protected)
     */
    #[IsGranted('ROLE_ADMIN')]
    #[Route('/auth/register-admin', name: 'api_register_admin', methods: ['POST'])]
    public function registerAdmin(
        Request $request,
        UserPasswordHasherInterface $hasher,
        EntityManagerInterface $em,
        UsersRepository $userRepo
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        try {
            ReservationValidator::validateUserData($data, true);

            if ($userRepo->findOneBy(['email' => $data['email']])) {
                return $this->json(['error' => 'Email already in use'], 400);
            }

            $user = new Users();
            $user->setEmail($data['email'])
                 ->setName($data['name'] ?? 'Admin')
                 ->setPhone($data['phone'])
                 ->setRoles(['ROLE_ADMIN'])
                 ->setPassword($hasher->hashPassword($user, $data['password']));

            $em->persist($user);
            $em->flush();

            return $this->json(['message' => 'Admin created successfully'], 201);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }
}