<?php

namespace App\Repository;

use App\Entity\Drivers;
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

    //    /**
    //     * @return Drivers[] Returns an array of Drivers objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('d')
    //            ->andWhere('d.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('d.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Drivers
    //    {
    //        return $this->createQueryBuilder('d')
    //            ->andWhere('d.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
    public function findAvailableDriver(\DateTime $requestedStart, \DateTime $requestedEnd): ?Drivers
{
    $qb = $this->createQueryBuilder('d');

    // 1. Basic availability check
    $qb->where('d.available = :isAvailable')
       ->setParameter('isAvailable', true);

    // 2. Subquery to find "Busy" drivers during that time
    $busyDriversSubquery = $this->_em->createQueryBuilder()
        ->select('dv.driverId') // Assuming driverId is the link in DriverVehicle
        ->from('App\Entity\DriverVehicle', 'dv')
        ->where('dv.rideStart < :end') 
        ->andWhere('dv.rideEnd > :start');

    // 3. Exclude those busy drivers from the main results
    $qb->andWhere($qb->expr()->notIn('d.id', $busyDriversSubquery->getDQL()))
       ->setParameter('start', $requestedStart)
       ->setParameter('end', $requestedEnd)
       ->setMaxResults(1); // Get just one available driver

    return $qb->getQuery()->getOneOrNullResult();
}
    }
