import { useState } from 'react';
import {
  Grid,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Title,
  Modal,
  TextInput,
  NumberInput,
  Switch,
  ActionIcon,
  Table,
  ScrollArea,
  Alert,
  Tabs,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBrandReddit,
  IconBrandWordpress,
  IconPlus,
  IconEdit,
  IconTrash,
  IconPlay,
  IconRefresh,
  IconChartLine,
  IconSettings,
  IconDatabase,
  IconInfoCircle,
} from '@tabler/icons-react';
import {
  useAdminStats,
  useRedditSources,
  useWordPressSources,
  useCreateRedditSource,
  useCreateWordPressSource,
  useUpdateRedditSource,
  useUpdateWordPressSource,
  useDeleteRedditSource,
  useDeleteWordPressSource,
  useRunFullCrawl,
  useRunRedditCrawl,
  useRunWordPressCrawl,
  useUpdateMarketData,
} from '../hooks/queries';
import { RedditSource, WordPressSource } from '../api/admin';

export default function AdminPanel() {
  const [redditModalOpened, { open: openRedditModal, close: closeRedditModal }] = useDisclosure(false);
  const [wordpressModalOpened, { open: openWordPressModal, close: closeWordPressModal }] = useDisclosure(false);
  const [editingRedditSource, setEditingRedditSource] = useState<RedditSource | null>(null);
  const [editingWordPressSource, setEditingWordPressSource] = useState<WordPressSource | null>(null);

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: redditSources, isLoading: redditLoading } = useRedditSources();
  const { data: wordpressSources, isLoading: wordpressLoading } = useWordPressSources();

  const createRedditMutation = useCreateRedditSource();
  const createWordPressMutation = useCreateWordPressSource();
  const updateRedditMutation = useUpdateRedditSource();
  const updateWordPressMutation = useUpdateWordPressSource();
  const deleteRedditMutation = useDeleteRedditSource();
  const deleteWordPressMutation = useDeleteWordPressSource();

  const runFullCrawlMutation = useRunFullCrawl();
  const runRedditCrawlMutation = useRunRedditCrawl();
  const runWordPressCrawlMutation = useRunWordPressCrawl();
  const updateMarketDataMutation = useUpdateMarketData();

  const redditForm = useForm({
    initialValues: {
      subredditName: '',
      description: '',
      crawlIntervalHours: 24,
    },
    validate: {
      subredditName: (value) => value.length < 1 ? 'Subreddit-Name ist erforderlich' : null,
      description: (value) => value.length < 1 ? 'Beschreibung ist erforderlich' : null,
      crawlIntervalHours: (value) => value < 1 ? 'Interval muss mindestens 1 Stunde sein' : null,
    },
  });

  const wordpressForm = useForm({
    initialValues: {
      siteUrl: '',
      siteName: '',
      description: '',
      crawlIntervalHours: 12,
    },
    validate: {
      siteUrl: (value) => !/^https?:\/\/.+/.test(value) ? 'Gültige URL ist erforderlich' : null,
      siteName: (value) => value.length < 1 ? 'Seitenname ist erforderlich' : null,
      description: (value) => value.length < 1 ? 'Beschreibung ist erforderlich' : null,
      crawlIntervalHours: (value) => value < 1 ? 'Interval muss mindestens 1 Stunde sein' : null,
    },
  });

  const handleCreateRedditSource = async (values: typeof redditForm.values) => {
    try {
      await createRedditMutation.mutateAsync(values);
      redditForm.reset();
      closeRedditModal();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleCreateWordPressSource = async (values: typeof wordpressForm.values) => {
    try {
      await createWordPressMutation.mutateAsync(values);
      wordpressForm.reset();
      closeWordPressModal();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleEditRedditSource = (source: RedditSource) => {
    setEditingRedditSource(source);
    redditForm.setValues({
      subredditName: source.subredditName,
      description: source.description,
      crawlIntervalHours: source.crawlIntervalHours,
    });
    openRedditModal();
  };

  const handleEditWordPressSource = (source: WordPressSource) => {
    setEditingWordPressSource(source);
    wordpressForm.setValues({
      siteUrl: source.siteUrl,
      siteName: source.siteName,
      description: source.description,
      crawlIntervalHours: source.crawlIntervalHours,
    });
    openWordPressModal();
  };

  const handleUpdateRedditSource = async (values: typeof redditForm.values) => {
    if (!editingRedditSource) return;
    
    try {
      await updateRedditMutation.mutateAsync({
        id: editingRedditSource.id,
        data: values,
      });
      redditForm.reset();
      setEditingRedditSource(null);
      closeRedditModal();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleUpdateWordPressSource = async (values: typeof wordpressForm.values) => {
    if (!editingWordPressSource) return;
    
    try {
      await updateWordPressMutation.mutateAsync({
        id: editingWordPressSource.id,
        data: values,
      });
      wordpressForm.reset();
      setEditingWordPressSource(null);
      closeWordPressModal();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleToggleRedditSource = async (source: RedditSource) => {
    try {
      await updateRedditMutation.mutateAsync({
        id: source.id,
        data: { isActive: !source.isActive },
      });
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleToggleWordPressSource = async (source: WordPressSource) => {
    try {
      await updateWordPressMutation.mutateAsync({
        id: source.id,
        data: { isActive: !source.isActive },
      });
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleDeleteRedditSource = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Reddit-Quelle löschen möchten?')) {
      try {
        await deleteRedditMutation.mutateAsync(id);
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
  };

  const handleDeleteWordPressSource = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese WordPress-Quelle löschen möchten?')) {
      try {
        await deleteWordPressMutation.mutateAsync(id);
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
  };

  const handleModalClose = () => {
    redditForm.reset();
    wordpressForm.reset();
    setEditingRedditSource(null);
    setEditingWordPressSource(null);
    closeRedditModal();
    closeWordPressModal();
  };

  return (
    <Stack gap="lg">
      <Title order={2}>Admin Panel</Title>

      {/* System Statistics */}
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={3} mb="md">Systemstatistiken</Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Group justify="apart">
              <Text size="sm" c="dimmed">Gesamte Quellen</Text>
              <Text fw={600} size="xl">
                {statsLoading ? '...' : stats?.totalSources || 0}
              </Text>
            </Group>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Group justify="apart">
              <Text size="sm" c="dimmed">Reddit Quellen</Text>
              <Text fw={600} size="xl">
                {statsLoading ? '...' : stats?.redditSources || 0}
              </Text>
            </Group>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Group justify="apart">
              <Text size="sm" c="dimmed">WordPress Quellen</Text>
              <Text fw={600} size="xl">
                {statsLoading ? '...' : stats?.wordpressSources || 0}
              </Text>
            </Group>
          </Grid.Col>
        </Grid>
      </Card>

      {/* Crawler Controls */}
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={3} mb="md">Crawler-Steuerung</Title>
        <Group gap="md">
          <Button
            leftSection={<IconPlay size={16} />}
            onClick={() => runFullCrawlMutation.mutate()}
            loading={runFullCrawlMutation.isPending}
            color="red"
          >
            Vollständiger Crawl
          </Button>
          
          <Button
            leftSection={<IconBrandReddit size={16} />}
            onClick={() => runRedditCrawlMutation.mutate()}
            loading={runRedditCrawlMutation.isPending}
            color="orange"
          >
            Reddit Crawl
          </Button>
          
          <Button
            leftSection={<IconBrandWordpress size={16} />}
            onClick={() => runWordPressCrawlMutation.mutate()}
            loading={runWordPressCrawlMutation.isPending}
            color="blue"
          >
            WordPress Crawl
          </Button>
          
          <Button
            leftSection={<IconChartLine size={16} />}
            onClick={() => updateMarketDataMutation.mutate()}
            loading={updateMarketDataMutation.isPending}
            color="green"
          >
            Marktdaten aktualisieren
          </Button>
        </Group>
      </Card>

      {/* Source Management */}
      <Tabs defaultValue="reddit">
        <Tabs.List>
          <Tabs.Tab value="reddit" leftSection={<IconBrandReddit size={16} />}>
            Reddit Quellen
          </Tabs.Tab>
          <Tabs.Tab value="wordpress" leftSection={<IconBrandWordpress size={16} />}>
            WordPress Quellen
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="reddit" pt="md">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="apart" mb="md">
              <Title order={4}>Reddit Quellen</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openRedditModal}
                color="green"
              >
                Quelle hinzufügen
              </Button>
            </Group>

            {redditLoading ? (
              <Text>Lädt...</Text>
            ) : (
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Subreddit</Table.Th>
                      <Table.Th>Beschreibung</Table.Th>
                      <Table.Th>Intervall</Table.Th>
                      <Table.Th>Posts</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Aktionen</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {redditSources?.map((source) => (
                      <Table.Tr key={source.id}>
                        <Table.Td>
                          <Text fw={600}>r/{source.subredditName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">{source.description}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{source.crawlIntervalHours}h</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{source.totalPostsCrawled}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Switch
                            checked={source.isActive}
                            onChange={() => handleToggleRedditSource(source)}
                            color="green"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              onClick={() => handleEditRedditSource(source)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteRedditSource(source.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="wordpress" pt="md">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="apart" mb="md">
              <Title order={4}>WordPress Quellen</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openWordPressModal}
                color="green"
              >
                Quelle hinzufügen
              </Button>
            </Group>

            {wordpressLoading ? (
              <Text>Lädt...</Text>
            ) : (
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Seite</Table.Th>
                      <Table.Th>URL</Table.Th>
                      <Table.Th>Beschreibung</Table.Th>
                      <Table.Th>Intervall</Table.Th>
                      <Table.Th>Posts</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Aktionen</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {wordpressSources?.map((source) => (
                      <Table.Tr key={source.id}>
                        <Table.Td>
                          <Text fw={600}>{source.siteName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">{source.siteUrl}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">{source.description}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{source.crawlIntervalHours}h</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{source.totalPostsCrawled}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Switch
                            checked={source.isActive}
                            onChange={() => handleToggleWordPressSource(source)}
                            color="green"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              onClick={() => handleEditWordPressSource(source)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteWordPressSource(source.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Reddit Source Modal */}
      <Modal
        opened={redditModalOpened}
        onClose={handleModalClose}
        title={editingRedditSource ? 'Reddit-Quelle bearbeiten' : 'Neue Reddit-Quelle'}
      >
        <form onSubmit={redditForm.onSubmit(editingRedditSource ? handleUpdateRedditSource : handleCreateRedditSource)}>
          <Stack gap="md">
            <TextInput
              label="Subreddit Name"
              placeholder="z.B. cryptocurrency"
              {...redditForm.getInputProps('subredditName')}
            />
            <TextInput
              label="Beschreibung"
              placeholder="Kurze Beschreibung der Quelle"
              {...redditForm.getInputProps('description')}
            />
            <NumberInput
              label="Crawl-Intervall (Stunden)"
              min={1}
              {...redditForm.getInputProps('crawlIntervalHours')}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="outline" onClick={handleModalClose}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                loading={editingRedditSource ? updateRedditMutation.isPending : createRedditMutation.isPending}
              >
                {editingRedditSource ? 'Aktualisieren' : 'Hinzufügen'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* WordPress Source Modal */}
      <Modal
        opened={wordpressModalOpened}
        onClose={handleModalClose}
        title={editingWordPressSource ? 'WordPress-Quelle bearbeiten' : 'Neue WordPress-Quelle'}
      >
        <form onSubmit={wordpressForm.onSubmit(editingWordPressSource ? handleUpdateWordPressSource : handleCreateWordPressSource)}>
          <Stack gap="md">
            <TextInput
              label="Site URL"
              placeholder="https://example.com"
              {...wordpressForm.getInputProps('siteUrl')}
            />
            <TextInput
              label="Seitenname"
              placeholder="Name der Website"
              {...wordpressForm.getInputProps('siteName')}
            />
            <TextInput
              label="Beschreibung"
              placeholder="Kurze Beschreibung der Quelle"
              {...wordpressForm.getInputProps('description')}
            />
            <NumberInput
              label="Crawl-Intervall (Stunden)"
              min={1}
              {...wordpressForm.getInputProps('crawlIntervalHours')}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="outline" onClick={handleModalClose}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                loading={editingWordPressSource ? updateWordPressMutation.isPending : createWordPressMutation.isPending}
              >
                {editingWordPressSource ? 'Aktualisieren' : 'Hinzufügen'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Info Alert */}
      <Alert icon={<IconInfoCircle size={16} />} title="Hinweis" color="blue">
        Crawler-Operationen können einige Zeit dauern. Bitte haben Sie Geduld, während die Daten verarbeitet werden.
      </Alert>
    </Stack>
  );
}