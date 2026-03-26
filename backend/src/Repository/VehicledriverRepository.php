<?php

namespace App\Repository;

use App\Entity\VehicleDriver;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<VehicleDriver>
 */
class VehicleDriverRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VehicleDriver::class);
    }

    /**
     * ✅ Eager-loaded list for Admin Dashboards.
     */
    public function findAllWithRelations(): array
    {
        return $this->createQueryBuilder('vd')
            ->leftJoin('vd.driver', 'd')
            ->addSelect('d')
            ->leftJoin('vd.vehicle', 'v')
            ->addSelect('v')
            ->orderBy('vd.id', 'DESC') // Usually want to see newest assignments first
            ->getQuery()
            ->getResult();
    }

    /**
     * ✅ Find the vehicle currently assigned to a driver.
     * Useful for the Driver app to know which car they are driving today.
     */
    public function findActiveAssignment(int $driverId): ?VehicleDriver
    {
        $now = new \DateTime();

        return $this->createQueryBuilder('vd')
            ->andWhere('vd.driver = :driverId')
            ->andWhere('vd.start <= :now')
            ->andWhere('vd.end >= :now OR vd.end IS NULL')
            ->setParameter('driverId', $driverId)
            ->setParameter('now', $now)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * ✅ Find which driver is currently using a specific vehicle.
     */
    public function findCurrentDriverForVehicle(int $vehicleId): ?VehicleDriver
    {
        $now = new \DateTime();

        return $this->createQueryBuilder('vd')
            ->innerJoin('vd.driver', 'd')
            ->addSelect('d')
            ->andWhere('vd.vehicle = :vehicleId')
            ->andWhere('vd.start <= :now')
            ->andWhere('vd.end >= :now OR vd.end IS NULL')
            ->setParameter('vehicleId', $vehicleId)
            ->setParameter('now', $now)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}