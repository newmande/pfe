<?php

namespace App\Repository;

use App\Entity\Users;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Users>
 */
class UsersRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Users::class);
    }

    /**
     * ✅ Eager-loads history, drivers, and vehicles in ONE query.
     * Note: Changed 'u.reservations' to 'u.history' to match your Entity.
     */
    public function findByEmailWithReservations(string $email): ?Users
    {
        return $this->createQueryBuilder('u')
            ->where('u.email = :email')
            ->setParameter('email', $email)
            ->leftJoin('u.history', 'h') // Matches Users::$history
            ->addSelect('h')
            ->leftJoin('h.driver', 'd')
            ->addSelect('d')
            ->leftJoin('h.vehicle', 'v')
            ->addSelect('v')
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * ✅ Gets history directly. 
     * Using 'h' alias to stay consistent with the OneToMany mapping.
     */
    public function findUserReservations(Users|int $user): array
    {
        $userId = $user instanceof Users ? $user->getId() : $user;

        return $this->_em->createQueryBuilder()
            ->select('h')
            ->from(\App\Entity\Reservations::class, 'h')
            ->where('h.user = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('h.datetime', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * ✅ Spatial Lookup for Users
     * Useful if you want to push notifications to users in a specific area.
     */
    public function findUsersInArea(float $lng, float $lat, float $radiusMeters = 2000): array
    {
        $point = sprintf('POINT(%f %f)', $lng, $lat);

        return $this->createQueryBuilder('u')
            ->where("ST_Distance_Sphere(u.location, ST_GeomFromText(:origin, 4326)) <= :radius")
            ->setParameter('origin', $point)
            ->setParameter('radius', $radiusMeters)
            ->getQuery()
            ->getResult();
    }
}