<?php

namespace Emartech\Emarsys\Api\Data;

/**
 * Interface EventInterface
 * @package Emartech\Emarsys\Api\Data
 */
interface EventInterface
{
    const EVENT_ID_KEY   = 'event_id';
    const EVENT_TYPE_KEY = 'event_type';
    const EVENT_DATA_KEY = 'event_data';
    const CREATED_AT_KEY = 'created_at';
    const WEBSITE_ID_KEY = 'website_id';
    const STORE_ID_KEY   = 'store_id';
    const ENTITY_ID_KEY  = 'entity_id';

    /**
     * @return int
     */
    public function getEventId();

    /**
     * @return string
     */
    public function getEventType();

    /**
     * @return string
     */
    public function getEventData();

    /**
     * @return string
     */
    public function getCreatedAt();

    /**
     * @return int
     */
    public function getWebsiteId();

    /**
     * @return int
     */
    public function getStoreId();

    /**
     * @return int
     */
    public function getEntityId();

    /**
     * @param int $eventId
     *
     * @return $this
     */
    public function setEventId($eventId);

    /**
     * @param string $eventType
     *
     * @return $this
     */
    public function setEventType($eventType);

    /**
     * @param string $eventData
     *
     * @return $this
     */
    public function setEventData($eventData);

    /**
     * @param string $createdAt
     *
     * @return $this
     */
    public function setCreatedAt($createdAt);

    /**
     * @param int $websiteId
     *
     * @return $this
     */
    public function setWebsiteId($websiteId);

    /**
     * @param int $storeId
     *
     * @return $this
     */
    public function setStoreId($storeId);

    /**
     * @param int $entityId
     *
     * @return $this
     */
    public function setEntityId($entityId);
}
