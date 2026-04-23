<?php

namespace App\Repository;

use App\Entity\Pricing;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Pricing>
 */
class PricingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pricing::class);
    }

    public function findActiveByTypeAndCategory(string $vehicleType, ?string $categoryType = null): ?Pricing
    {
        $qb = $this->createQueryBuilder('p')
            ->where('p.active = :active')
            ->andWhere('p.vehicleType = :vehicleType')
            ->setParameter('active', true)
            ->setParameter('vehicleType', $vehicleType);

        
        if (!empty($categoryType)) {
            $qb->andWhere('p.categoryType = :categoryType')
               ->setParameter('categoryType', $categoryType);
        } else {
            
            $qb->andWhere('p.categoryType IS NULL OR p.categoryType = :empty')
               ->setParameter('empty', '');
        }

        return $qb->orderBy('p.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    
    public function findAllActive(): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.active = :active')
            ->setParameter('active', true)
            ->orderBy('p.vehicleType', 'ASC') 
            ->addOrderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}