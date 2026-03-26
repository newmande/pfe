<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260326231903 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE drivers (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, phone VARCHAR(255) NOT NULL, availability TINYINT DEFAULT 0 NOT NULL, location POINT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_E410C307444F97DD (phone), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE pricing (id INT AUTO_INCREMENT NOT NULL, vehicle_type VARCHAR(100) NOT NULL, category_type VARCHAR(100) NOT NULL, base_fare NUMERIC(7, 2) NOT NULL, price_per_km NUMERIC(7, 2) NOT NULL, minimum_fare NUMERIC(7, 2) NOT NULL, maximum_fare NUMERIC(8, 2) DEFAULT NULL, surge_multiplier NUMERIC(4, 2) NOT NULL, active TINYINT NOT NULL, description LONGTEXT DEFAULT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reservations (id INT AUTO_INCREMENT NOT NULL, datetime DATETIME NOT NULL, pickup_location VARCHAR(255) NOT NULL, dropoff_location VARCHAR(255) NOT NULL, status VARCHAR(50) NOT NULL, number_of_passengers INT NOT NULL, created_at DATETIME NOT NULL, price NUMERIC(10, 2) DEFAULT NULL, distance NUMERIC(10, 2) DEFAULT NULL, duration NUMERIC(10, 2) DEFAULT NULL, vehicle_id INT DEFAULT NULL, driver_id INT DEFAULT NULL, user_id INT NOT NULL, INDEX IDX_4DA239545317D1 (vehicle_id), INDEX IDX_4DA239C3423909 (driver_id), INDEX IDX_4DA239A76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE users (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(255) DEFAULT NULL, role VARCHAR(255) NOT NULL, location POINT DEFAULT NULL, UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email), UNIQUE INDEX UNIQ_1483A5E9444F97DD (phone), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE vehicles (id INT AUTO_INCREMENT NOT NULL, model VARCHAR(255) NOT NULL, license VARCHAR(255) NOT NULL, type VARCHAR(255) NOT NULL, category VARCHAR(255) DEFAULT NULL, capacity INT NOT NULL, availability TINYINT DEFAULT 1 NOT NULL, UNIQUE INDEX UNIQ_1FCE69FA5768F419 (license), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE reservations ADD CONSTRAINT FK_4DA239545317D1 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)');
        $this->addSql('ALTER TABLE reservations ADD CONSTRAINT FK_4DA239C3423909 FOREIGN KEY (driver_id) REFERENCES drivers (id)');
        $this->addSql('ALTER TABLE reservations ADD CONSTRAINT FK_4DA239A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservations DROP FOREIGN KEY FK_4DA239545317D1');
        $this->addSql('ALTER TABLE reservations DROP FOREIGN KEY FK_4DA239C3423909');
        $this->addSql('ALTER TABLE reservations DROP FOREIGN KEY FK_4DA239A76ED395');
        $this->addSql('DROP TABLE drivers');
        $this->addSql('DROP TABLE pricing');
        $this->addSql('DROP TABLE reservations');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE vehicles');
    }
}
