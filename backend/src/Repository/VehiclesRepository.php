<?php

namespace App\Repository;

use App\Entity\Vehicles;
use App\Entity\VehicleDriver;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Vehicles>
 */
class VehiclesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Vehicles::class);
    }

    /**
     * ✅ Finds a vehicle that is not busy during the requested time slot.
     */
    public function findAvailableVehicle(string $type, \DateTimeInterface $start, \DateTimeInterface $end): ?Vehicles
    {
        $qb = $this->createQueryBuilder('v');

        // 1. Filter by general availability toggle and type
        $qb->where('v.availability = :isAvailable') // Matches Vehicles::$availability
           ->andWhere('v.type = :type')
           ->setParameter('isAvailable', true)
           ->setParameter('type', $type);

        // 2. Subquery: Find IDs of vehicles already assigned to a driver during this window
        $busyVehiclesSubquery = $this->_em->createQueryBuilder()
            ->select('IDENTITY(dv.vehicle)')
            ->from(VehicleDriver::class, 'dv')
            ->where('dv.start < :end') 
            ->andWhere('dv.end > :start');

        // 3. Exclude the busy ones
        $qb->andWhere($qb->expr()->notIn('v.id', $busyVehiclesSubquery->getDQL()))
           ->setParameter('start', $start)
           ->setParameter('end', $end)
           ->setMaxResults(1); 

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * ✅ Eager loading for history to keep index pages fast
     */
    public function findAllWithRelations(): array
    {
        return $this->createQueryBuilder('v')
            ->leftJoin('v.history', 'h') // Matches Vehicles::$history
            ->addSelect('h')
            ->orderBy('v.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * ✅ Find vehicles filtered by Category (Luxury, Economy, etc.)
     */
    public function findByCategory(string $category): array
    {
        return $this->createQueryBuilder('v')
            ->where('v.category = :cat')
            ->andWhere('v.availability = :available')
            ->setParameter('cat', $category)
            ->setParameter('available', true)
            ->getQuery()
            ->getResult();
    }
}