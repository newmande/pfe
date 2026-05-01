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

   
    public function findAvailableDriver(\DateTimeInterface $requestedStart, \DateTimeInterface $requestedEnd): ?Drivers
{
    $qb = $this->createQueryBuilder('d');

    
    $qb->where('d.availability = :isAvailable')
       ->setParameter('isAvailable', true);

    
    $busyDriversSubquery = $this->getEntityManager()->createQueryBuilder()
        ->select('DISTINCT IDENTITY(r.driver)')
        ->from(\App\Entity\Reservations::class, 'r')
        ->where('r.driver IS NOT NULL')
       
        ->andWhere('r.datetime < :requestedEnd')
        ->andWhere("DATE_ADD(r.datetime, r.duration, 'MINUTE') > :requestedStart");

    
    $qb->andWhere($qb->expr()->notIn('d.id', $busyDriversSubquery->getDQL()))
       ->setParameter('requestedStart', $requestedStart)
       ->setParameter('requestedEnd', $requestedEnd)
       ->setMaxResults(1);

    return $qb->getQuery()->getOneOrNullResult();
}

    
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