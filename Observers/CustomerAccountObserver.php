<?php


namespace Emartech\Emarsys\Observers;

use Emartech\Emarsys\Helper\CustomerEventHandler;
use Magento\Customer\Model\Customer;
use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Psr\Log\LoggerInterface;

/**
 * Class CustomerAccountObserver
 * @package Emartech\Emarsys\Observers
 */
class CustomerAccountObserver implements ObserverInterface
{
    /**
     * @var CustomerEventHandler
     */
    private $customerEventHandler;
    /**
     * @var LoggerInterface
     */
    private $logger;

    public function __construct(CustomerEventHandler $customerEventHandler, LoggerInterface $logger)
    {
        $this->customerEventHandler = $customerEventHandler;
        $this->logger = $logger;
    }

    /**
     * @param Observer $observer
     *
     * @return void
     */
    public function execute(Observer $observer)
    {
        /** @var Customer $customer */
        $customer = $observer->getEvent()->getCustomer();

        try {
            $this->customerEventHandler->store(
                $customer->getId(),
                $customer->getWebsiteId(),
                $customer->getStoreId()
            );
        } catch (\Exception $e) {
            $this->logger->warning('Emartech\\Emarsys\\Observers\\CustomerAccountObserver: ' . $e->getMessage());
        }
    }
}
