<?php

namespace App\Repository;

use App\Entity\Drivers;
use App\Entity\Reservations;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Drivers>
 */
class DriversRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Drivers::class);
    }

    /**
     * ✅ Optimized availability check
     * Finds a driver who is toggled "available" AND has no overlapping reservations.
     */
    public function findAvailableDriver(\DateTimeInterface $start, \DateTimeInterface $end): ?Drivers
    {
        $qb = $this->createQueryBuilder('d');

        // 1. Check basic toggle
        $qb->where('d.availability = :isAvailable')
           ->setParameter('isAvailable', true);

        // 2. Subquery: Find IDs of drivers who have a reservation overlapping this time slot
        $busyDriversSubquery = $this->_em->createQueryBuilder()
            ->select('IDENTITY(r.driver)')
            ->from(Reservations::class, 'r')
            ->where('r.driver IS NOT NULL')
            ->andWhere('r.datetime < :end') 
            // Note: If you have a specific 'end_time' field in Reservations, use it here. 
            // Otherwise, we assume a buffer (e.g., datetime + 1 hour).
            ->andWhere('r.datetime > :start');

        // 3. Filter out the busy ones
        $qb->andWhere($qb->expr()->notIn('d.id', $busyDriversSubquery->getDQL()))
           ->setParameter('start', $start)
           ->setParameter('end', $end)
           ->setMaxResults(1);

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * ✅ Spatial Search for TomTom Integration
     * Finds drivers within a specific radius (in meters) from a point.
     * MySQL uses Longitude then Latitude for Point(x, y).
     */
    public function findNearbyDrivers(float $lng, float $lat, float $radiusMeters = 5000): array
    {
        $point = sprintf('POINT(%f %f)', $lng, $lat);

        return $this->createQueryBuilder('d')
            ->where("ST_Distance_Sphere(d.location, ST_GeomFromText(:origin, 4326)) <= :radius")
            ->andWhere('d.availability = :available')
            ->setParameter('origin', $point)
            ->setParameter('radius', $radiusMeters)
            ->setParameter('available', true)
            ->getQuery()
            ->getResult();
    }

    /**
     * ✅ Eager loading to avoid N+1 queries
     */
    public function findAllWithRelations(): array
    {
        return $this->createQueryBuilder('d')
            ->leftJoin('d.history', 'h')
            ->addSelect('h')
            ->orderBy('d.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}