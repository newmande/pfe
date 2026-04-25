<?php

namespace App\Controller;

use App\Entity\Users;
use App\Validator\ReservationValidator;
use App\Repository\UsersRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use SymfonyCasts\Bundle\VerifyEmail\VerifyEmailHelperInterface;
use SymfonyCasts\Bundle\VerifyEmail\Exception\VerifyEmailExceptionInterface;

class AuthController extends AbstractController
{
    /**
     * Step 1: Receives registration data, validates it, and sends a signed email.
     * The user is NOT saved to the database yet.
     */
    #[Route('/auth/forgot_password', name: 'api_forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request,UsersRepository $userRepo,
        VerifyEmailHelperInterface $verifyEmailHelper,
        MailerInterface $mailer): JsonResponse
    {
        $email= $request->request->get('email');
        $password = $request->request->get('password');
        
        $user = $userRepo->findOneBy(['email' => $email]);
        if (!$user) {
            return $this->json(['error' => 'Email not found'], 404);
        }
         $signatureComponents = $verifyEmailHelper->generateSignature(
                'api_forgot_password', // Route name below
                $email,
                $email,
                [
                    'email' => $email,
                    'password' => $password // In a real implementation, generate a secure token instead
                ]
            );

            $email = (new TemplatedEmail())
                ->from('noreply@yourdomain.com')
                ->to($email)
                ->subject('Complete your Registration')
                ->htmlTemplate('emails/registration_verify.html.twig')
                ->context(['signedUrl' => $signatureComponents->getSignedUrl()]);

            $mailer->send($email);
        return $this->json(['message' => 'Password reset functionality not implemented yet.'], 501);
    }
    #[Route('/auth/verify-forgot_password', name: 'api_verify_forfot_password', methods: ['GET'])]
    public function confirmforgot_password(
        Request $request,
        EntityManagerInterface $em,
        UsersRepository $userRepo,
        Users $user,
        VerifyEmailHelperInterface $verifyEmailHelper
    ): Response {
        $email = $request->query->get('email');
        $password = $request->query->get('password');
        try {
            // Validate the full URI against the signature
            $verifyEmailHelper->validateEmailConfirmation($request->getUri(), $email, $email);
        } catch (VerifyEmailExceptionInterface $e) {
            // Link was tampered with or expired
            return $this->json(['error' => $e->getReason()], 400);
        }

        // Final check to prevent duplicate creation
        if (!$userRepo->findOneBy(['email' => $email])) {
            return $this->json(['error' => 'User not found.'], 400);
        }

        // Now we actually create and save the User
        $user->setPassword($password); // In a real implementation, hash this password
        $em->persist($user);
        $em->flush();

        // Registration is successful; return the JWT token
        return $this->json([
            'message' => 'password successfully reset!',
            
        ], 201);
    }
    #[Route('/auth/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request, 
        UserPasswordHasherInterface $hasher, 
        UsersRepository $userRepo,
        VerifyEmailHelperInterface $verifyEmailHelper,
        MailerInterface $mailer
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        try {
            // Validate incoming data
            ReservationValidator::validateUserData($data, true);

            // Check if user already exists in main table
            if ($userRepo->findOneBy(['email' => $data['email']])) {
                return $this->json(['error' => 'Email already in use'], 400);
            }

            // Hash the password now so we can pass it securely in the signed link
            $tempUser = new Users();
            $hashedPassword = $hasher->hashPassword($tempUser, $data['password']);

            // Generate a signed URL containing all user info as query params
            // This ensures the data hasn't been tampered with when they click it
            $signatureComponents = $verifyEmailHelper->generateSignature(
                'api_verify_confirm', // Route name below
                $data['email'],
                $data['email'],
                [
                    'email' => $data['email'],
                    'name'  => $data['name'] ?? 'User',
                    'phone' => $data['phone'],
                    'pwd'   => $hashedPassword
                ]
            );

            $email = (new TemplatedEmail())
                ->from('noreply@yourdomain.com')
                ->to($data['email'])
                ->subject('Complete your Registration')
                ->htmlTemplate('emails/registration_verify.html.twig')
                ->context(['signedUrl' => $signatureComponents->getSignedUrl()]);

            $mailer->send($email);

            return $this->json([
                'message' => 'Verification email sent. Please confirm to complete registration.'
            ], 202);

        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Registration failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Step 2: The endpoint hit when clicking the link.
     * Validates the signature and finally persists the User to the DB.
     */
    #[Route('/auth/verify-confirm', name: 'api_verify_confirm', methods: ['GET'])]
    public function confirmRegistration(
        Request $request,
        EntityManagerInterface $em,
        UsersRepository $userRepo,
        JWTTokenManagerInterface $jwtManager,
        VerifyEmailHelperInterface $verifyEmailHelper
    ): Response {
        $email = $request->query->get('email');

        try {
            // Validate the full URI against the signature
            $verifyEmailHelper->validateEmailConfirmation($request->getUri(), $email, $email);
        } catch (VerifyEmailExceptionInterface $e) {
            // Link was tampered with or expired
            return $this->json(['error' => $e->getReason()], 400);
        }

        // Final check to prevent duplicate creation
        if ($userRepo->findOneBy(['email' => $email])) {
            return $this->json(['error' => 'User already verified and created.'], 400);
        }

        // Now we actually create and save the User
        $user = new Users();
        $user->setEmail($email)
             ->setName($request->query->get('name'))
             ->setPhone($request->query->get('phone'))
             ->setRoles(['ROLE_USER'])
             ->setPassword($request->query->get('pwd')); // Already hashed

        $em->persist($user);
        $em->flush();

        // Registration is successful; return the JWT token
        return $this->json([
            'message' => 'Account successfully created!',
            'user' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail()
            ],
            'token' => $jwtManager->create($user)
        ], 201);
    }

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