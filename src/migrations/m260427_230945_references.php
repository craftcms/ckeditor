<?php

namespace craft\ckeditor\migrations;

use craft\ckeditor\Plugin;
use craft\db\Migration;
use craft\db\Table;

/**
 * m260427_230945_references migration.
 */
class m260427_230945_references extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        $this->createTable(Plugin::TABLE_REFERENCES, [
            'id' => $this->primaryKey(),
            'fieldId' => $this->integer()->notNull(),
            'fieldInstanceUid' => $this->uid()->notNull(),
            'sourceId' => $this->integer()->notNull(),
            'sourceSiteId' => $this->integer(),
            'targetId' => $this->integer()->notNull(),
        ]);

        $this->createIndex(null, Plugin::TABLE_REFERENCES, ['fieldId', 'fieldInstanceUid', 'sourceId', 'sourceSiteId', 'targetId'], true);
        $this->createIndex(null, Plugin::TABLE_REFERENCES, ['targetId']);

        $this->addForeignKey(null, Plugin::TABLE_REFERENCES, ['fieldId'], Table::FIELDS, ['id'], 'CASCADE', null);
        $this->addForeignKey(null, Plugin::TABLE_REFERENCES, ['sourceId'], Table::ELEMENTS, 'id', 'CASCADE', null);
        $this->addForeignKey(null, Plugin::TABLE_REFERENCES, ['sourceSiteId'], Table::SITES, 'id', 'CASCADE', 'CASCADE');

        return true;
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): bool
    {
        $this->dropTableIfExists(Plugin::TABLE_REFERENCES);
        return true;
    }
}
