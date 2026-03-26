<?php

namespace App\Entity;

use App\Repository\UsersRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use LongitudeOne\Spatial\PHP\Types\SpatialInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UsersRepository::class)]
class Users implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    /**
     * @var string The hashed password
     */
    #[ORM\Column(length: 255)]
    private ?string $password = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $email = null;

    #[ORM\Column(length: 255, nullable: true, unique: true)]
    private ?string $phone = null;

    /**
     * Internal role string (e.g., 'admin', 'user')
     */
    #[ORM\Column(length: 255)]
    private string $role = 'user';

    /**
     * @var Collection<int, Reservations>
     */
    #[ORM\OneToMany(targetEntity: Reservations::class, mappedBy: 'user')]
    private Collection $history;

    /**
     * ✅ SRID 4326 for MySQL Spatial compatibility
     */
    #[ORM\Column(type: 'point', nullable: true, options: ['srid' => 4326])]
    private ?SpatialInterface $location = null;

    public function __construct()
    {
        $this->history = new ArrayCollection();
        $this->role = 'user';
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): ?string { return $this->name; }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string { return $this->password; }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function getEmail(): ?string { return $this->email; }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getPhone(): ?string { return $this->phone; }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;
        return $this;
    }

    public function getRole(): string { return $this->role; }

    public function setRole(string $role): static
    {
        $this->role = strtolower($role);
        return $this;
    }

    /**
     * ✅ Required by UserInterface
     * Returns the roles granted to the user.
     */
    public function getRoles(): array
    {
        // Convert internal string to Symfony format (ROLE_ADMIN, etc)
        $role = 'ROLE_' . strtoupper($this->role);
        
        $roles = [$role];
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * ✅ Used for manual role setting (like in your Admin controller)
     */
    public function setRoles(array $roles): static
    {
        // Clean up the input (e.g., ['ROLE_ADMIN'] -> 'admin')
        $mainRole = $roles[0] ?? 'user';
        $this->role = strtolower(str_replace('ROLE_', '', $mainRole));
        
        return $this;
    }

    /**
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     */
    public function eraseCredentials(): void 
    {
        // If you store any temporary, sensitive data on the user, clear it here
    }

    /**
     * @return Collection<int, Reservations>
     */
    public function getHistory(): Collection
    {
        return $this->history;
    }

    public function getLocation(): ?SpatialInterface
    {
        return $this->location;
    }

    public function setLocation(?SpatialInterface $location): static
    {
        $this->location = $location;
        return $this;
    }
}