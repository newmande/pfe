<?php

namespace App\Repository;

use App\Entity\Vehicles;
use App\Entity\Reservations;
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

    
    public function findAvailableVehicle(string $type, \DateTimeInterface $start, \DateTimeInterface $end): ?Vehicles
{
    $qb = $this->createQueryBuilder('v');

    
    $qb->where('v.availability = :isAvailable')
       ->andWhere('v.type = :type')
       ->setParameter('isAvailable', true)
       ->setParameter('type', $type);

    
    $busyVehiclesSubquery = $this->_em->createQueryBuilder()
        ->select('DISTINCT IDENTITY(r.vehicle)')
        ->from(\App\Entity\Reservations::class, 'r')
        ->where('r.vehicle IS NOT NULL')
        
        ->andWhere('r.datetime < :end')
        ->andWhere("DATE_ADD(r.datetime, r.duration, 'MINUTE') > :start");

    
    $qb->andWhere($qb->expr()->notIn('v.id', $busyVehiclesSubquery->getDQL()))
       ->setParameter('start', $start)
       ->setParameter('end', $end)
       ->setMaxResults(1); 

    return $qb->getQuery()->getOneOrNullResult();
}

    
    public function findAllWithRelations(): array
    {
        return $this->createQueryBuilder('v')
            ->leftJoin('v.history', 'h') 
            ->addSelect('h')
            ->orderBy('v.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    
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