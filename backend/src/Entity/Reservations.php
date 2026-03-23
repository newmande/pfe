<?php

namespace App\Entity;

use App\Repository\ReservationsRepository;
use BcMath\Number;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReservationsRepository::class)]
class Reservations
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?\DateTime $datetime = null;

    #[ORM\Column(length: 255)]
    private ?string $pickuplocation = null;

    #[ORM\Column(length: 255)]
    private ?string $dropofflocation = null;

    #[ORM\Column(length: 255)]
    private ?string $status = null;

    #[ORM\Column(type: Types::INTEGER)]
    private ?int $numberofpassengers = null;

    #[ORM\ManyToOne(targetEntity: Vehicles::class, inversedBy: 'history')]
    private ?Vehicles $vehicle = null;

     #[ORM\ManyToOne(targetEntity: Drivers::class, inversedBy: 'history')]
    private ?Drivers $driver = null;

    
    #[ORM\ManyToOne(targetEntity: Users::class, inversedBy: "history")]
    private ?Users $user = null;

    #[ORM\Column]
    private ?\DateTime $createdat = null;

    
    

    

    

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDatetime(): ?\DateTime
    {
        return $this->datetime;
    }

    public function setDatetime(\DateTime $datetime): static
    {
        $this->datetime = $datetime;

        return $this;
    }

    public function getPickuplocation(): ?string
    {
        return $this->pickuplocation;
    }

    public function setPickuplocation(string $pickuplocation): static
    {
        $this->pickuplocation = $pickuplocation;

        return $this;
    }

    public function getDropofflocation(): ?string
    {
        return $this->dropofflocation;
    }

    public function setDropofflocation(string $dropofflocation): static
    {
        $this->dropofflocation = $dropofflocation;

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getNumberofpassengers(): ?int
    {
        return $this->numberofpassengers;
    }

    public function setNumberofpassengers(int $numberofpassengers): static
    {
        $this->numberofpassengers = $numberofpassengers;

        return $this;
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

    public function getUser(): ?Users
    {
        return $this->user;
    }

    public function setUser(?Users $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getCreatedat(): ?\DateTime
    {
        return $this->createdat;
    }

    public function setCreatedat(\DateTime $createdat): static
    {
        $this->createdat = $createdat;

        return $this;
    }

   

    

    

    

    
}
