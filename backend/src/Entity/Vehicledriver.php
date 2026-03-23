<?php

namespace App\Entity;

use App\Repository\VehicledriverRepository;
use BcMath\Number;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: VehicledriverRepository::class)]
class Vehicledriver
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Vehicles::class)]
    private ?Vehicles $vehicle = null;

    #[ORM\ManyToOne(targetEntity: Drivers::class)]
    private ?Drivers $driver = null;

    #[ORM\Column]
    private ?\DateTime $start = null;

    #[ORM\Column]
    private ?\DateTime $end = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getvehicle(): ?Vehicles
    {
        return $this->vehicle;
    }

    public function setvehicle(?Vehicles $vehicle): static
    {
        $this->vehicle = $vehicle;

        return $this;
    }

    public function getDriver(): ?Drivers
    {
        return $this->driver;
    }

    public function setDriver(?Drivers $driver): static
    {
        $this->driver = $driver;

        return $this;
    }

    public function getStart(): ?\DateTime
    {
        return $this->start;
    }

    public function setStart(\DateTime $start): static
    {
        $this->start = $start;

        return $this;
    }

    public function getEnd(): ?\DateTime
    {
        return $this->end;
    }

    public function setEnd(\DateTime $end): static
    {
        $this->end = $end;

        return $this;
    }
}
