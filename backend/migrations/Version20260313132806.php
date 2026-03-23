<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260313132806 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE drivers (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, phone VARCHAR(255) NOT NULL, availability TINYINT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reservations (id INT AUTO_INCREMENT NOT NULL, datetime DATETIME NOT NULL, pickuplocation VARCHAR(255) NOT NULL, dropofflocation VARCHAR(255) NOT NULL, status VARCHAR(255) NOT NULL, numberofpassengers INT NOT NULL, idvehicle INT NOT NULL, iddriver INT NOT NULL, iduser INT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE vehicles (id INT AUTO_INCREMENT NOT NULL, model VARCHAR(255) NOT NULL, type VARCHAR(255) NOT NULL, capacity INT NOT NULL, priceperkm NUMERIC(10, 3) NOT NULL, availability TINYINT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE drivers');
        $this->addSql('DROP TABLE reservations');
        $this->addSql('DROP TABLE vehicles');
    }
}
