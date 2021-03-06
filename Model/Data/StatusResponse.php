<?php

namespace Emartech\Emarsys\Model\Data;

use Magento\Framework\DataObject;

use Emartech\Emarsys\Api\Data\StatusResponseInterface;

/**
 * Class StatusResponse
 * @package Emartech\Emarsys\Model\Data
 */
class StatusResponse extends DataObject implements StatusResponseInterface
{
    /**
     * @return string
     */
    public function getStatus()
    {
        return $this->getData(self::STATUS_KEY);
    }

    /**
     * @param string $status
     *
     * @return $this
     */
    public function setStatus($status)
    {
        $this->setData(self::STATUS_KEY, $status);
        return $this;
    }
}
