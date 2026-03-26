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

    /**
     * ✅ Eager loading: Fetches driver, vehicle, and user in one go.
     */
    public function findAllWithRelations(): array
    {
        return $this->createQueryBuilder('r')
            ->leftJoin('r.driver', 'd')
            ->addSelect('d')
            ->leftJoin('r.vehicle', 'v')
            ->addSelect('v')
            ->leftJoin('r.user', 'u')
            ->addSelect('u')
            ->orderBy('r.datetime', 'DESC') // Newest trips first
            ->getQuery()
            ->getResult();
    }

    /**
     * ✅ Finds active trips (for the live dashboard)
     */
    public function findActiveReservations(): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.status IN (:activeStatuses)')
            ->setParameter('activeStatuses', [
                Reservations::STATUS_PENDING,
                Reservations::STATUS_CONFIRMED
            ])
            ->orderBy('r.datetime', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByUserId(int $userId): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.user = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('r.datetime', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByDriverId(int $driverId): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.driver = :driverId')
            ->setParameter('driverId', $driverId)
            ->orderBy('r.datetime', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findByVehicleId(int $vehicleId): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.vehicle = :vehicleId')
            ->setParameter('vehicleId', $vehicleId)
            ->orderBy('r.datetime', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * ✅ Partial match search for vehicle model within reservations
     */
    public function findByVehicleModel(string $model): array
    {
        return $this->createQueryBuilder('r')
            ->join('r.vehicle', 'v')
            ->where('v.model LIKE :model')
            ->setParameter('model', '%' . $model . '%')
            ->orderBy('r.datetime', 'DESC')
            ->getQuery()
            ->getResult();
    }
}