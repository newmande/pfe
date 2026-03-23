<?php

namespace App\Entity;

use App\Repository\VehiclesRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VehiclesRepository::class)]
class Vehicles
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $model = null;

    #[ORM\Column(length: 255)]
    private ?string $type = null;

    #[ORM\Column(type: Types::INTEGER)]
    private ?int $capacity = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 3)]
    private ?string $priceperkm = null;

    #[ORM\Column]
    private ?bool $availability = null;

    #[ORM\OneToMany(targetEntity: Reservations::class, mappedBy: 'vehicle')]
    private Collection $history;

    public function __construct()
    {
        $this->history = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getModel(): ?string { return $this->model; }

    public function setModel(string $model): static
    {
        $this->model = $model;
        return $this;
    }

    public function getType(): ?string { return $this->type; }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getCapacity(): ?int { return $this->capacity; }

    public function setCapacity(int $capacity): static
    {
        $this->capacity = $capacity;
        return $this;
    }

    public function getPriceperkm(): ?string { return $this->priceperkm; }

    public function setPriceperkm(string $priceperkm): static
    {
        $this->priceperkm = $priceperkm;
        return $this;
    }

    public function isAvailable(): ?bool { return $this->availability; }

    public function setAvailability(bool $availability): static
    {
        $this->availability = $availability;
        return $this;
    }

    public function getHistory(): Collection
    {
        return $this->history;
    }

    public function addHistory(Reservations $history): static
    {
        if (!$this->history->contains($history)) {
            $this->history->add($history);
            $history->setVehicle($this);
        }

        return $this;
    }

    public function removeHistory(Reservations $history): static
    {
        if ($this->history->removeElement($history)) {
            if ($history->getVehicle() === $this) {
                $history->setVehicle(null);
            }
        }

        return $this;
    }
}