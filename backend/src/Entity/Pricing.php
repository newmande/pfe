<?php

namespace App\Entity;

use App\Repository\PricingRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PricingRepository::class)]
#[ORM\HasLifecycleCallbacks] 
class Pricing
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private ?string $vehicleType = null;

    #[ORM\Column(length: 100)]
    private ?string $categoryType = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 7, scale: 2)]
    private string|float|null $baseFare = 2.00;

    #[ORM\Column(type: Types::DECIMAL, precision: 7, scale: 2)]
    private string|float|null $pricePerKm = 0.50;

    #[ORM\Column(type: Types::DECIMAL, precision: 7, scale: 2)]
    private string|float|null $minimumFare = 5.00;

    #[ORM\Column(type: Types::DECIMAL, precision: 8, scale: 2, nullable: true)]
    private string|float|null $maximumFare = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 4, scale: 2)]
    private string|float|null $surgeMultiplier = 1.00;

    #[ORM\Column]
    private bool $active = true;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTime $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->active = true;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getVehicleType(): ?string { return $this->vehicleType; }
    public function setVehicleType(string $vehicleType): static { $this->vehicleType = $vehicleType; return $this; }

    public function getCategoryType(): ?string { return $this->categoryType; }
    public function setCategoryType(string $categoryType): static { $this->categoryType = $categoryType; return $this; }

    public function getBaseFare(): float { return (float) $this->baseFare; }
    public function setBaseFare(float $baseFare): static { $this->baseFare = $baseFare; return $this; }

    public function getPricePerKm(): float { return (float) $this->pricePerKm; }
    public function setPricePerKm(float $pricePerKm): static { $this->pricePerKm = $pricePerKm; return $this; }

    public function getMinimumFare(): float { return (float) $this->minimumFare; }
    public function setMinimumFare(float $minimumFare): static { $this->minimumFare = $minimumFare; return $this; }

    public function getMaximumFare(): ?float { return $this->maximumFare !== null ? (float) $this->maximumFare : null; }
    public function setMaximumFare(?float $maximumFare): static { $this->maximumFare = $maximumFare; return $this; }

    public function getSurgeMultiplier(): float { return (float) $this->surgeMultiplier; }
    public function setSurgeMultiplier(float $surgeMultiplier): static { $this->surgeMultiplier = $surgeMultiplier; return $this; }

    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): static { $this->active = $active; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): ?\DateTime { return $this->updatedAt; }

    public function calculatePrice(float $distanceKm): float
    {
        $subtotal = $this->getBaseFare() + ($this->getPricePerKm() * $distanceKm);
        $price = max($subtotal, $this->getMinimumFare());
        $price *= $this->getSurgeMultiplier();

        if ($this->getMaximumFare() !== null) {
            $price = min($price, $this->getMaximumFare());
        }

        return round($price, 2);
    }
}