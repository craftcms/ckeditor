<?php

/**
 * @link https://craftcms.com/
 *
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license https://craftcms.github.io/license/
 */

declare(strict_types=1);

namespace CraftCms\Ckeditor\Data;

use CraftCms\Cms\Entry\Data\EntryType as CraftEntryType;
use Error;
use Override;
use ReflectionClass;

use function CraftCms\Cms\t;

/**
 * EntryType model class.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 *
 * @since 5.0.0
 */
class EntryType extends CraftEntryType
{
    public bool $expanded = false;

    /**
     * Creates a CKEditor entry type from a Craft entry type, copying its state.
     *
     * @since 6.0.0
     */
    public static function fromEntryType(CraftEntryType $entryType, bool $expanded = false): self
    {
        $new = new ReflectionClass(self::class)->newInstanceWithoutConstructor();

        $class = new ReflectionClass($entryType);
        do {
            foreach ($class->getProperties() as $property) {
                if (
                    $property->isStatic() ||
                    $property->isVirtual() ||
                    $property->getDeclaringClass()->getName() !== $class->getName() ||
                    ! $property->isInitialized($entryType)
                ) {
                    continue;
                }

                try {
                    $property->setRawValue($new, $property->getRawValue($entryType));
                } catch (Error) {
                    // readonly properties that can't be set from here
                }
            }
        } while ($class = $class->getParentClass());

        $new->expanded = $expanded;

        return $new;
    }

    #[Override]
    public function getIndicators(): array
    {
        $indicators = parent::getIndicators();

        if ($this->expanded) {
            $indicators[] = [
                'label' => t('Show as a separate button', category: 'ckeditor'),
                'icon' => 'eye',
                'iconColor' => 'teal',
            ];
        }

        return $indicators;
    }

    /**
     * Returns the entry type’s usage config, including whether it should get its own toolbar button.
     *
     * @return array<string, bool|int|string|null>
     */
    #[Override]
    public function getUsageConfig(): array
    {
        $config = parent::getUsageConfig();

        $config['expanded'] = $this->expanded;

        return $config;
    }
}
