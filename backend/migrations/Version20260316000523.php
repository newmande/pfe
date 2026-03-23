<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260316000523 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservations ADD vehicle_id INT DEFAULT NULL, ADD driver_id INT DEFAULT NULL, ADD user_id INT DEFAULT NULL, DROP idvehicle, DROP iddriver, DROP iduser');
        $this->addSql('ALTER TABLE reservations ADD CONSTRAINT FK_4DA239545317D1 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)');
        $this->addSql('ALTER TABLE reservations ADD CONSTRAINT FK_4DA239C3423909 FOREIGN KEY (driver_id) REFERENCES drivers (id)');
        $this->addSql('ALTER TABLE reservations ADD CONSTRAINT FK_4DA239A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('CREATE INDEX IDX_4DA239545317D1 ON reservations (vehicle_id)');
        $this->addSql('CREATE INDEX IDX_4DA239C3423909 ON reservations (driver_id)');
        $this->addSql('CREATE INDEX IDX_4DA239A76ED395 ON reservations (user_id)');
        $this->addSql('ALTER TABLE vehicledriver ADD vehicle_id INT DEFAULT NULL, ADD driver_id INT DEFAULT NULL, DROP idvehicle, DROP iddriver');
        $this->addSql('ALTER TABLE vehicledriver ADD CONSTRAINT FK_F9F110A9545317D1 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)');
        $this->addSql('ALTER TABLE vehicledriver ADD CONSTRAINT FK_F9F110A9C3423909 FOREIGN KEY (driver_id) REFERENCES drivers (id)');
        $this->addSql('CREATE INDEX IDX_F9F110A9545317D1 ON vehicledriver (vehicle_id)');
        $this->addSql('CREATE INDEX IDX_F9F110A9C3423909 ON vehicledriver (driver_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservations DROP FOREIGN KEY FK_4DA239545317D1');
        $this->addSql('ALTER TABLE reservations DROP FOREIGN KEY FK_4DA239C3423909');
        $this->addSql('ALTER TABLE reservations DROP FOREIGN KEY FK_4DA239A76ED395');
        $this->addSql('DROP INDEX IDX_4DA239545317D1 ON reservations');
        $this->addSql('DROP INDEX IDX_4DA239C3423909 ON reservations');
        $this->addSql('DROP INDEX IDX_4DA239A76ED395 ON reservations');
        $this->addSql('ALTER TABLE reservations ADD idvehicle INT NOT NULL, ADD iddriver INT NOT NULL, ADD iduser INT NOT NULL, DROP vehicle_id, DROP driver_id, DROP user_id');
        $this->addSql('ALTER TABLE vehicledriver DROP FOREIGN KEY FK_F9F110A9545317D1');
        $this->addSql('ALTER TABLE vehicledriver DROP FOREIGN KEY FK_F9F110A9C3423909');
        $this->addSql('DROP INDEX IDX_F9F110A9545317D1 ON vehicledriver');
        $this->addSql('DROP INDEX IDX_F9F110A9C3423909 ON vehicledriver');
        $this->addSql('ALTER TABLE vehicledriver ADD idvehicle INT NOT NULL, ADD iddriver INT NOT NULL, DROP vehicle_id, DROP driver_id');
    }
}
