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

    
    #[ORM\Column(length: 255)]
    private ?string $password = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $email = null;

    #[ORM\Column(length: 255, nullable: true, unique: true)]
    private ?string $phone = null;

    
    #[ORM\Column(length: 255)]
    private string $role = 'user';

    /**
     * @var Collection<int, Reservations>
     */
    #[ORM\OneToMany(targetEntity: Reservations::class, mappedBy: 'user')]
    private Collection $history;

   
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

    
    public function getRoles(): array
    {
        
        $role = 'ROLE_' . strtoupper($this->role);
        
        $roles = [$role];
        
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

   
    public function setRoles(array $roles): static
    {
        
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