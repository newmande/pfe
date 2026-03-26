<?php

namespace App\Entity;

use App\Repository\DriversRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use LongitudeOne\Spatial\PHP\Types\SpatialInterface;

#[ORM\Entity(repositoryClass: DriversRepository::class)]
#[ORM\HasLifecycleCallbacks] // ✅ Essential for automatic updatedAt
class Drivers
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $phone = null;

    #[ORM\Column(options: ["default" => false])]
    private bool $availability = false;

    /**
     * ✅ Optimized for MySQL POINT
     * SRID 4326 is the GPS standard (WGS 84). 
     * MySQL expects Point(longitude, latitude) for this SRID.
     */
    #[ORM\Column(type: 'point', nullable: true, options: ['srid' => 4326])]
    private ?SpatialInterface $location = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    /**
     * @var Collection<int, Reservations>
     */
    #[ORM\OneToMany(targetEntity: Reservations::class, mappedBy: 'driver')]
    private Collection $history;

    public function __construct()
    {
        $this->history = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    /**
     * ✅ Automatically updates the timestamp before every database update
     */
    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(string $phone): static
    {
        $this->phone = $phone;
        return $this;
    }

    public function isAvailable(): bool
    {
        return $this->availability;
    }

    public function setAvailability(bool $availability): static
    {
        $this->availability = $availability;
        return $this;
    }

    /**
     * @return Collection<int, Reservations>
     */
    public function getHistory(): Collection
    {
        return $this->history;
    }

    public function addHistory(Reservations $history): static
    {
        if (!$this->history->contains($history)) {
            $this->history->add($history);
            $history->setDriver($this);
        }
        return $this;
    }

    public function removeHistory(Reservations $history): static
    {
        if ($this->history->removeElement($history)) {
            if ($history->getDriver() === $this) {
                $history->setDriver(null);
            }
        }
        return $this;
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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }
}