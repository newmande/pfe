<?php

namespace App\Repository;

use App\Entity\Vehicles;
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

    //    /**
    //     * @return Vehicles[] Returns an array of Vehicles objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('v')
    //            ->andWhere('v.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('v.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Vehicles
    //    {
    //        return $this->createQueryBuilder('v')
    //            ->andWhere('v.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
    public function findAvailableVehicle(string $type, \DateTime $start, \DateTime $end): ?Vehicles
{
    $qb = $this->createQueryBuilder('v');

    // 1. General availability AND the specific type
    $qb->where('v.available = :isAvailable')
       ->andWhere('v.type = :type') // Added this line
       ->setParameter('isAvailable', true)
       ->setParameter('type', $type);

    // 2. Subquery for busy vehicles (remains the same)
    $busyVehiclesSubquery = $this->_em->createQueryBuilder()
        ->select('dv.vehicleId')
        ->from('App\Entity\DriverVehicle', 'dv')
        ->where('dv.rideStart < :end') 
        ->andWhere('dv.rideEnd > :start');

    // 3. Exclude busy vehicles from results
    $qb->andWhere($qb->expr()->notIn('v.id', $busyVehiclesSubquery->getDQL()))
       ->setParameter('start', $start)
       ->setParameter('end', $end)
       ->setMaxResults(1); 

    return $qb->getQuery()->getOneOrNullResult();
}
    
    }
