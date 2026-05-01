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
    public function forgotPassword(Request $request, UsersRepository $userRepo,
        VerifyEmailHelperInterface $verifyEmailHelper,
        MailerInterface $mailer): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;
        
        if (!$email) {
            return $this->json(['error' => 'Email is required'], 400);
        }
        
        // Always return success for security (don't reveal if email exists)
        $user = $userRepo->findOneBy(['email' => $email]);
        if (!$user) {
            return $this->json(['message' => 'If an account with this email exists, a password reset link has been sent.'], 200);
        }

        try {
            // Generate a secure reset token with 1 hour expiration
            $signatureComponents = $verifyEmailHelper->generateSignature(
                'api_verify_forgot_password',
                $email,
                $email,
                [
                    'email' => $email,
                    'timestamp' => time(),
                    'expires' => time() + 3600
                ]
            );

            $backendResetUrl = $signatureComponents->getSignedUrl();
            
            // Parse the backend URL to extract parameters
            $urlParts = parse_url($backendResetUrl);
            $queryParams = $urlParts['query'] ?? '';
            
            // Create frontend URL that points to reset-password.html with the same parameters
            $frontendResetUrl = 'http://localhost:5174/reset-password.html?' . $queryParams;

            // Send email with frontend URL
            $resetEmail = (new TemplatedEmail())
                ->from('noreply@yourdomain.com')
                ->to($email)
                ->subject('Reset Your Password - TransportHub')
                ->htmlTemplate('emails/password_reset.html.twig')
                ->context(['frontendUrl' => $frontendResetUrl]);

            $mailer->send($resetEmail);

            // Return success with both URLs for testing
            return $this->json([
                'message' => 'Password reset link has been sent to your email.',
                'resetUrl' => $frontendResetUrl,
                'backendUrl' => $backendResetUrl
            ], 200);

        } catch (\Exception $e) {
            // Log error but don't reveal to user
            error_log('Password reset error: ' . $e->getMessage());
            return $this->json(['error' => 'Failed to send reset email. Please try again later.'], 500);
        }
    }
    #[Route('/auth/verify-forgot_password', name: 'api_verify_forgot_password', methods: ['GET', 'POST'])]
    public function confirmForgotPassword(
        Request $request,
        EntityManagerInterface $em,
        UsersRepository $userRepo,
        UserPasswordHasherInterface $hasher,
        VerifyEmailHelperInterface $verifyEmailHelper
    ): JsonResponse {
        $email = $request->query->get('email');
        
        if (!$email) {
            return $this->json(['error' => 'Invalid reset link'], 400);
        }
        
        try {
            // Validate the signed URL
            $verifyEmailHelper->validateEmailConfirmation($request->getUri(), $email, $email);
        } catch (VerifyEmailExceptionInterface $e) {
            return $this->json(['error' => 'Invalid or expired reset link'], 400);
        }

        // Find user
        $user = $userRepo->findOneBy(['email' => $email]);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        // GET request: show that link is valid
        if ($request->isMethod('GET')) {
            return $this->json([
                'message' => 'Reset link is valid. Please POST your new password.',
                'email' => $email
            ]);
        }

        // POST request: reset password
        $data = json_decode($request->getContent(), true);
        $newPassword = $data['password'] ?? null;

        if (!$newPassword) {
            return $this->json(['error' => 'Password is required'], 400);
        }

        if (strlen($newPassword) < 6) {
            return $this->json(['error' => 'Password must be at least 6 characters long'], 400);
        }

        try {
            // Hash and update password
            $hashedPassword = $hasher->hashPassword($user, $newPassword);
            $user->setPassword($hashedPassword);
            
            $em->persist($user);
            $em->flush();

            return $this->json([
                'message' => 'Password has been successfully reset!',
                'email' => $email
            ]);
            
        } catch (\Exception $e) {
            error_log('Password reset error: ' . $e->getMessage());
            return $this->json(['error' => 'Failed to reset password. Please try again.'], 500);
        }
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
            return $this->redirect('http://localhost:5173/login?registration=error&message=' . urlencode($e->getReason()));
        }

        // Final check to prevent duplicate creation
        if ($userRepo->findOneBy(['email' => $email])) {
            return $this->redirect('http://localhost:5173/login?registration=error&message=' . urlencode('User already verified and created.'));
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

        // Registration is successful; redirect to frontend login page
        return $this->redirect('http://localhost:5173/login?registration=success');
    }

    #[Route('/auth/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        UsersRepository $userRepo,
        UserPasswordHasherInterface $hasher,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        
        // Debug logging
        error_log('=== LOGIN REQUEST DEBUG ===');
        error_log('Request content: ' . $request->getContent());
        error_log('Decoded data: ' . json_encode($data));
        error_log('Request method: ' . $request->getMethod());
        error_log('Request URI: ' . $request->getRequestUri());
        
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        
        error_log('Email: ' . ($email ? $email : 'null'));
        error_log('Password: ' . ($password ? 'set' : 'null'));

        if (!$email || !$password) {
            error_log('=== MISSING CREDENTIALS ===');
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

    #[Route('/auth/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        return $this->json(['message' => 'Logged out successfully'], 200);
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