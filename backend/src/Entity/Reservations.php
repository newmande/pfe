<?php

namespace App\Entity;

use App\Repository\ReservationsRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReservationsRepository::class)]
class Reservations
{
    // Status Constants for application-wide consistency
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_COMPLETED = 'completed';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $datetime = null;

    #[ORM\Column(length: 255)]
    private ?string $pickupLocation = null;

    #[ORM\Column(length: 255)]
    private ?string $dropoffLocation = null;

    #[ORM\Column(length: 50)]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(type: Types::INTEGER)]
    private int $numberOfPassengers = 1;

    #[ORM\ManyToOne(targetEntity: Vehicles::class, inversedBy: 'history')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Vehicles $vehicle = null;

    #[ORM\ManyToOne(targetEntity: Drivers::class, inversedBy: 'history')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Drivers $driver = null;

    #[ORM\ManyToOne(targetEntity: Users::class, inversedBy: 'history')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Users $user = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    private string|float|null $price = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    private string|float|null $distance = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    private string|float|null $duration = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->status = self::STATUS_PENDING;
    }

    public function getId(): ?int { return $this->id; }

    public function getDatetime(): ?\DateTimeInterface { return $this->datetime; }
    
    public function setDatetime(\DateTimeInterface $datetime): static 
    { 
        $this->datetime = $datetime; 
        return $this; 
    }

    public function getPickupLocation(): ?string { return $this->pickupLocation; }
    
    public function setPickupLocation(string $pickupLocation): static 
    { 
        $this->pickupLocation = $pickupLocation; 
        return $this; 
    }

    public function getDropoffLocation(): ?string { return $this->dropoffLocation; }
    
    public function setDropoffLocation(string $dropoffLocation): static 
    { 
        $this->dropoffLocation = $dropoffLocation; 
        return $this; 
    }

    public function getStatus(): string { return $this->status; }
    
    public function setStatus(string $status): static 
    { 
        $this->status = $status; 
        return $this; 
    }

    public function getNumberOfPassengers(): int { return $this->numberOfPassengers; }
    
    public function setNumberOfPassengers(int $num): static 
    { 
        $this->numberOfPassengers = $num; 
        return $this; 
    }

    public function getVehicle(): ?Vehicles { return $this->vehicle; }
    
    public function setVehicle(?Vehicles $vehicle): static 
    { 
        $this->vehicle = $vehicle; 
        return $this; 
    }

    public function getDriver(): ?Drivers { return $this->driver; }
    
    public function setDriver(?Drivers $driver): static 
    { 
        $this->driver = $driver; 
        return $this; 
    }

    public function getUser(): ?Users { return $this->user; }
    
    public function setUser(?Users $user): static 
    { 
        $this->user = $user; 
        return $this; 
    }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function getPrice(): ?float 
    { 
        return $this->price !== null ? (float)$this->price : null; 
    }
    
    public function setPrice(?float $price): static 
    { 
        $this->price = $price; 
        return $this; 
    }

    public function getDistance(): ?float 
    { 
        return $this->distance !== null ? (float)$this->distance : null; 
    }
    
    public function setDistance(?float $distance): static 
    { 
        $this->distance = $distance; 
        return $this; 
    }

    public function getDuration(): ?float 
    { 
        return $this->duration !== null ? (float)$this->duration : null; 
    }
    
    public function setDuration(?float $duration): static 
    { 
        $this->duration = $duration; 
        return $this; 
    }
}