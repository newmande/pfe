<?php

namespace App\Controller;

use App\Entity\Users;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

class AuthController extends AbstractController
{
    #[Route('/auth/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request, 
        UserPasswordHasherInterface $hasher, 
        EntityManagerInterface $em,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        $name = $data['name'] ?? 'User';
        $phone = $data['phone'] ?? null;

        // Validate required fields
        if (!$email || !$password) {
            return new JsonResponse(['error' => 'Email and password are required'], 400);
        }

        if (!$phone) {
            return new JsonResponse(['error' => 'Phone is required'], 400);
        }

        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['error' => 'Invalid email format'], 400);
        }

        // Check for existing user
        $existingUser = $em->getRepository(Users::class)->findOneBy(['email' => $email]);
        if ($existingUser) {
            return new JsonResponse(['error' => 'Email already in use'], 400);
        }

        // Create new user
        $user = new Users();
        $user->setEmail($email);
        $user->setName($name);
        $user->setPhone($phone);
        $user->setRole('USER');
        $user->setPassword($hasher->hashPassword($user, $password));

        try {
            $em->persist($user);
            $em->flush();
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Failed to register user'], 500);
        }

        // Generate JWT token
        $token = $jwtManager->create($user);

        return new JsonResponse([
            'message' => 'Registration successful',
            'user' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles()
            ],
            'token' => $token
        ], 201);
    }
    #[Route('/auth/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            return new JsonResponse(['error' => 'Email and password are required'], 400);
        }

        $user = $em->getRepository(Users::class)->findOneBy(['email' => $email]);

        // Generic error message for security
        if (!$user || !$hasher->isPasswordValid($user, $password)) {
            return new JsonResponse(['error' => 'Invalid credentials'], 401);
        }

        // Generate the JWT
        $token = $jwtManager->create($user);

        return new JsonResponse([
            'token' => $token,
            'roles' => $user->getRoles()
        ], 200);
    }
}