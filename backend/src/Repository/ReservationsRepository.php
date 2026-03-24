<?php

namespace App\Repository;

use App\Entity\Reservations;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Reservations>
 */
class ReservationsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Reservations::class);
    }

    //    /**
    //     * @return Reservations[] Returns an array of Reservations objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('r')
    //            ->andWhere('r.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('r.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Reservations
    //    {
    //        return $this->createQueryBuilder('r')
    //            ->andWhere('r.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }

    public function findByVehicleModel(string $model): array
    {
        return $this->createQueryBuilder('r')
            ->join('r.vehicle', 'v')
            ->andWhere('v.model = :model')
            ->setParameter('model', $model)
            ->getQuery()
            ->getResult();
    }

    public function findByUserId(int $userId): array
    {
        return $this->createQueryBuilder('r')
            ->join('r.user', 'u')
            ->andWhere('u.id = :userId')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getResult();
    }

    public function findByDriverId(int $driverId): array
    {
        return $this->createQueryBuilder('r')
            ->join('r.driver', 'd')
            ->andWhere('d.id = :driverId')
            ->setParameter('driverId', $driverId)
            ->getQuery()
            ->getResult();
    }

    public function findByVehicleId(int $vehicleId): array
    {
        return $this->createQueryBuilder('r')
            ->join('r.vehicle', 'v')
            ->andWhere('v.id = :vehicleId')
            ->setParameter('vehicleId', $vehicleId)
            ->getQuery()
            ->getResult();
    }
}

