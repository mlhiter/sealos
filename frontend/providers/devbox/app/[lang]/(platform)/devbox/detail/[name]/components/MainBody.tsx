import { Box, Button, Flex, Text, Tooltip, useDisclosure } from '@chakra-ui/react';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import MyIcon from '@/components/Icon';
import MyTable from '@/components/MyTable';
import PodLineChart from '@/components/PodLineChart';

import { NetworkType } from '@/types/devbox';
import { useCopyData } from '@/utils/tools';

import { useDevboxStore } from '@/stores/devbox';
import { useEnvStore } from '@/stores/env';

const MonitorModal = dynamic(() => import('@/components/modals/MonitorModal'));

const MainBody = () => {
  const t = useTranslations();
  const { copyData } = useCopyData();
  const { devboxDetail } = useDevboxStore();
  const { env } = useEnvStore();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const networkColumn: {
    title: string;
    dataIndex?: keyof NetworkType;
    key: string;
    render?: (item: NetworkType) => JSX.Element;
    width?: string;
  }[] = [
    {
      title: t('port'),
      key: 'port',
      render: (item: NetworkType) => {
        return (
          <Text pl={4} color={'grayModern.600'}>
            {item.port}
          </Text>
        );
      },
      width: '0.5fr'
    },
    {
      title: t('internal_address'),
      key: 'internalAddress',
      render: (item: NetworkType) => {
        return (
          <Flex alignItems={'center'} justify={'center'}>
            <Text color={'grayModern.600'}>
              {`http://${devboxDetail?.name}.${env.namespace}.svc.cluster.local:${item.port}`}
            </Text>
            <MyIcon
              name="copy"
              w={'16px'}
              ml={1}
              color={'grayModern.500'}
              _hover={{
                color: 'grayModern.600'
              }}
              cursor={'pointer'}
              onClick={() =>
                copyData(
                  `http://${devboxDetail?.name}.${env.namespace}.svc.cluster.local:${item.port}`
                )
              }
            />
          </Flex>
        );
      }
    },
    {
      title: t('external_address'),
      key: 'externalAddress',
      render: (item: NetworkType) => {
        if (item.openPublicDomain) {
          const address = item.customDomain || item.publicDomain;
          return (
            <Tooltip
              label={t('open_link')}
              hasArrow
              bg={'#FFFFFF'}
              color={'grayModern.900'}
              fontSize={'12px'}
              fontWeight={400}
              py={2}
              borderRadius={'md'}
            >
              <Text
                className="guide-network-address"
                cursor="pointer"
                color={'grayModern.600'}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => window.open(`https://${address}`, '_blank')}
              >
                https://{address}
              </Text>
            </Tooltip>
          );
        }
        return <Text>-</Text>;
      }
    }
  ];
  return (
    <Flex gap={4} direction={'column'}>
      <Box bg={'white'} borderRadius="lg" pl={6} pt={2} pr={6} pb={6} borderWidth={1}>
        {/* monitor */}
        <Box mt={4}>
          <Flex alignItems={'space-between'} mb={2}>
            <Text fontSize="medium" fontWeight={'bold'} color={'grayModern.900'}>
              {t('monitor')}
            </Text>
            <Box ml={2} color={'grayModern.500'}>
              ({t('update Time')}&ensp;
              {dayjs().format('HH:mm')})
            </Box>
          </Flex>
          <Flex bg={'grayModern.50'} p={4} borderRadius={'lg'} minH={'80px'} gap={4}>
            <Box flex={1} position={'relative'}>
              <Box color={'grayModern.600'} fontWeight={'bold'} mb={2} fontSize={'12px'}>
                {t('cpu')} {devboxDetail?.usedCpu?.yData[devboxDetail?.usedCpu?.yData?.length - 1]}%
              </Box>
              <Box h={'60px'} minW={['200px', '250px', '300px']}>
                <Box h={'60px'} minW={['200px', '250px', '300px']}>
                  <PodLineChart type="blue" data={devboxDetail?.usedCpu} />
                </Box>
              </Box>
            </Box>
            <Box flex={1} position={'relative'}>
              <Button
                variant={'square'}
                position={'absolute'}
                right={'2px'}
                top={'-6px'}
                onClick={onOpen}
              >
                <MyIcon name="maximize" width={'16px'} fill={'#667085'} />
              </Button>
              <Box color={'grayModern.600'} fontWeight={'bold'} mb={2} fontSize={'12px'}>
                {t('memory')}
                {devboxDetail?.usedMemory?.yData[devboxDetail?.usedMemory?.yData?.length - 1]}%
              </Box>
              <Box h={'60px'}>
                <Box h={'60px'}>
                  <PodLineChart type="purple" data={devboxDetail?.usedMemory} />
                </Box>
              </Box>
            </Box>
          </Flex>
        </Box>
        <MonitorModal isOpen={isOpen} onClose={onClose} />
      </Box>
      <Box bg={'white'} borderRadius="lg" pl={6} pt={2} pr={6} pb={6} borderWidth={1}>
        {/* network */}
        <Box mt={4}>
          <Flex alignItems={'center'} mb={2}>
            <Text fontSize="medium" fontWeight={'bold'} color={'grayModern.900'}>
              {t('network')}
            </Text>
          </Flex>
          {devboxDetail?.networks && devboxDetail.networks.length > 0 ? (
            <MyTable columns={networkColumn} data={devboxDetail?.networks} />
          ) : (
            <Flex justify={'center'} align={'center'} h={'100px'}>
              <Text color={'grayModern.600'}>{t('no_network')}</Text>
            </Flex>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default MainBody;
