<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260430165740 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE drivers ADD user_id INT NOT NULL');
        $this->addSql('ALTER TABLE drivers ADD CONSTRAINT FK_E410C307A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_E410C307A76ED395 ON drivers (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE drivers DROP FOREIGN KEY FK_E410C307A76ED395');
        $this->addSql('DROP INDEX UNIQ_E410C307A76ED395 ON drivers');
        $this->addSql('ALTER TABLE drivers DROP user_id');
    }
}
