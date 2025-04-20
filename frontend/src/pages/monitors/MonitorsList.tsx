import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, Button, Table, Badge, Card, IconButton, Grid, Tabs } from '@radix-ui/themes';
import { PlusIcon, Pencil1Icon, TrashIcon, CheckCircledIcon, CrossCircledIcon, QuestionMarkCircledIcon, LayoutIcon, ViewGridIcon, ReloadIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { getAllMonitors, deleteMonitor, Monitor } from '../../api/monitors';
import MonitorCard from '../../components/MonitorCard';
import { useTranslation } from 'react-i18next';

const MonitorsList = () => {
  const navigate = useNavigate();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const { t } = useTranslation();

  // 获取监控数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getAllMonitors();
      
      if (response.success && response.monitors) {
        setMonitors(response.monitors);
      } else {
        setError(response.message || t('monitors.loadingError'));
      }
    } catch (err) {
      console.error(t('monitors.loadingError'), err);
      setError(t('monitors.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // 设置定时器，每分钟刷新一次数据
    const intervalId = setInterval(() => {
      console.log('MonitorsList: 自动刷新数据...');
      fetchData();
    }, 60000); // 60000ms = 1分钟
    
    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, []);

  // 处理刷新
  const handleRefresh = () => {
    fetchData();
  };

  // 处理删除
  const handleDelete = async (id: number) => {
    if (!window.confirm(t('monitors.delete.confirm'))) return;
    
    try {
      const response = await deleteMonitor(id);
      
      if (response.success) {
        // 更新列表，移除已删除的监控
        setMonitors(monitors.filter(monitor => monitor.id !== id));
      } else {
        alert(response.message || t('monitors.delete.failed'));
      }
    } catch (err) {
      console.error(t('monitors.delete.failed'), err);
      alert(t('monitors.delete.failed'));
    }
  };

  // 状态图标
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'up':
        return <CheckCircledIcon style={{ color: 'var(--green-9)' }} />;
      case 'down':
        return <CrossCircledIcon style={{ color: 'var(--red-9)' }} />;
      default:
        return <QuestionMarkCircledIcon style={{ color: 'var(--gray-9)' }} />;
    }
  };

  // 状态颜色映射
  const statusColors: { [key: string]: 'green' | 'red' | 'gray' } = {
    'up': 'green',
    'down': 'red',
    'pending': 'gray'
  };

  // 加载中显示
  if (loading) {
    return (
      <Box className="page-container detail-page">
        <Flex justify="center" align="center" p="4">
          <Text>{t('common.loading')}</Text>
        </Flex>
      </Box>
    );
  }

  // 错误显示
  if (error) {
    return (
      <Box className="page-container detail-page">
        <Card mb="4">
          <Flex p="3" style={{ backgroundColor: 'var(--red-3)' }}>
            <Text style={{ color: 'var(--red-9)' }}>{error}</Text>
          </Flex>
        </Card>
        <Button variant="soft" onClick={() => window.location.reload()} mt="2">
          {t('monitors.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <div className="page-container detail-page">
        <Flex justify="between" align="center" className="detail-header">
          <Heading size="6">{t('monitors.pageTitle')}</Heading>
          <Flex gap="3">
            <Tabs.Root defaultValue="grid">
              <Tabs.List>
                <Tabs.Trigger value="grid" onClick={() => setView('grid')}>
                  <ViewGridIcon />
                </Tabs.Trigger>
                <Tabs.Trigger value="list" onClick={() => setView('list')}>
                  <LayoutIcon />
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
            <Button onClick={handleRefresh} disabled={loading}>
              <ReloadIcon />
              {t('monitors.refresh')}
            </Button>
            <Button onClick={() => navigate('/monitors/create')}>
              <PlusIcon />
              {t('monitors.create')}
            </Button>
          </Flex>
        </Flex>

        <div className="detail-content">
          {monitors.length === 0 ? (
            <Card>
              <Flex direction="column" align="center" justify="center" p="6" gap="3">
                <Text>{t('monitors.notFound')}</Text>
                <Button onClick={() => navigate('/monitors/create')}>
                  <PlusIcon />
                  {t('monitors.addOne')}
                </Button>
              </Flex>
            </Card>
          ) : view === 'list' ? (
            // 列表视图
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>{t('monitors.table.name')}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>{t('monitors.table.url')}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>{t('monitors.table.status')}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>{t('monitors.table.responseTime')}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>{t('monitors.table.uptime')}</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>{t('monitors.table.actions')}</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {monitors.map(monitor => (
                  <Table.Row key={monitor.id}>
                    <Table.Cell>
                      <Text weight="medium">{monitor.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text style={{ wordBreak: 'break-all' }}>{monitor.url}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <StatusIcon status={monitor.status} />
                        <Badge color={statusColors[monitor.status]}>
                          {monitor.status === 'up' ? t('monitors.status.up') : monitor.status === 'down' ? t('monitors.status.down') : t('monitor.status.pending')}
                        </Badge>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{monitor.response_time}ms</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{Math.min(monitor.uptime || 0, 100).toFixed(2)}%</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2">
                        <IconButton variant="soft" onClick={() => navigate(`/monitors/${monitor.id}`)} title={t('monitors.viewDetails')}>
                          <InfoCircledIcon />
                        </IconButton>
                        <IconButton variant="soft" onClick={() => navigate(`/monitors/edit/${monitor.id}`)} title={t('monitors.edit')}>
                          <Pencil1Icon />
                        </IconButton>
                        <IconButton variant="soft" color="red" onClick={() => handleDelete(monitor.id)} title={t('monitors.delete')}>
                          <TrashIcon />
                        </IconButton>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            // 网格视图 - 使用 MonitorCard 组件
            <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
              {monitors.map(monitor => (
                <Box key={monitor.id} style={{ position: 'relative' }}>
                  <MonitorCard monitor={monitor} showUrl={false} />
                  <Flex 
                    style={{ 
                      position: 'absolute', 
                      top: '10px', 
                      right: '10px',
                      zIndex: 1
                    }} 
                    gap="2"
                  >
                    <IconButton variant="ghost" size="1" onClick={() => navigate(`/monitors/${monitor.id}`)} title={t('monitors.viewDetails')}>
                      <InfoCircledIcon />
                    </IconButton>
                    <IconButton variant="ghost" size="1" onClick={() => navigate(`/monitors/edit/${monitor.id}`)} title={t('monitors.edit')}>
                      <Pencil1Icon />
                    </IconButton>
                    <IconButton variant="ghost" size="1" color="red" onClick={() => handleDelete(monitor.id)} title={t('monitors.delete')}>
                      <TrashIcon />
                    </IconButton>
                  </Flex>
                </Box>
              ))}
            </Grid>
          )}
        </div>
      </div>
    </Box>
  );
};

export default MonitorsList; 