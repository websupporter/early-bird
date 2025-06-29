import { useState } from 'react';
import {
  Grid,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Paper,
  Title,
  List,
  Divider,
  Progress,
  Alert,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconBrandReddit,
  IconBrandWordpress,
  IconBrain,
  IconChartLine,
  IconFileText,
  IconRefresh,
  IconAnalyze,
  IconInfoCircle,
} from '@tabler/icons-react';
import {
  useBriefingStatus,
  useBriefingSentiment,
  useGenerateBriefing,
  useAnalyzeContent,
} from '../hooks/queries';
import { BriefingData } from '../api/briefing';

export default function Dashboard() {
  const [currentBriefing, setCurrentBriefing] = useState<BriefingData | null>(null);
  
  const { data: status, isLoading: statusLoading } = useBriefingStatus();
  const { data: sentiment, isLoading: sentimentLoading, refetch: refetchSentiment } = useBriefingSentiment();
  
  const generateBriefingMutation = useGenerateBriefing();
  const analyzeContentMutation = useAnalyzeContent();

  const handleGenerateBriefing = async () => {
    try {
      const briefing = await generateBriefingMutation.mutateAsync();
      setCurrentBriefing(briefing);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleRefreshSentiment = () => {
    refetchSentiment();
  };

  const handleAnalyzeContent = () => {
    analyzeContentMutation.mutate();
  };

  const avgSentiment = sentiment 
    ? ((sentiment.redditSentiment + sentiment.wordpressSentiment) / 2).toFixed(2)
    : '--';

  return (
    <Stack gap="lg">
      <Title order={2}>Dashboard</Title>

      {/* Status Overview */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="apart" mb="xs">
              <Text size="sm" c="dimmed">Reddit Quellen</Text>
              <IconBrandReddit size={20} color="orange" />
            </Group>
            <Text fw={500} size="xl">
              {statusLoading ? '...' : status?.reddit?.activeSources || 0}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="apart" mb="xs">
              <Text size="sm" c="dimmed">WordPress Quellen</Text>
              <IconBrandWordpress size={20} color="blue" />
            </Group>
            <Text fw={500} size="xl">
              {statusLoading ? '...' : status?.wordpress?.activeSources || 0}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="apart" mb="xs">
              <Text size="sm" c="dimmed">Greed & Fear Index</Text>
              <IconBrain size={20} color="yellow" />
            </Group>
            <Text fw={500} size="xl">
              {sentimentLoading ? '...' : sentiment?.greedFearIndex || '--'}
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="apart" mb="xs">
              <Text size="sm" c="dimmed">Durchschnittsstimmung</Text>
              <IconChartLine size={20} color="purple" />
            </Group>
            <Text fw={500} size="xl">
              {sentimentLoading ? '...' : avgSentiment}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Quick Actions */}
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={3} mb="md">Schnellaktionen</Title>
        <Group gap="md">
          <Button
            leftSection={<IconFileText size={16} />}
            onClick={handleGenerateBriefing}
            loading={generateBriefingMutation.isPending}
            size="md"
          >
            Morning Briefing generieren
          </Button>
          
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefreshSentiment}
            loading={sentimentLoading}
            variant="outline"
            color="green"
            size="md"
          >
            Stimmung aktualisieren
          </Button>
          
          <Button
            leftSection={<IconAnalyze size={16} />}
            onClick={handleAnalyzeContent}
            loading={analyzeContentMutation.isPending}
            variant="outline"
            color="purple"
            size="md"
          >
            Inhalte analysieren
          </Button>
        </Group>
      </Card>

      {/* Current Briefing */}
      {currentBriefing && (
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="apart">
              <Title order={3}>Aktuelles Morning Briefing</Title>
              <Badge color="blue" variant="light">
                {new Date(currentBriefing.date).toLocaleDateString('de-DE')}
              </Badge>
            </Group>
            
            <Title order={4}>{currentBriefing.title}</Title>
            <Text c="dimmed">{currentBriefing.summary}</Text>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" withBorder>
                  <Title order={5} mb="sm">Marktübersicht</Title>
                  <Text size="sm">{currentBriefing.marketOverview}</Text>
                </Paper>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" withBorder>
                  <Title order={5} mb="sm">Sentiment-Analyse</Title>
                  <Text size="sm">{currentBriefing.sentimentAnalysis}</Text>
                </Paper>
              </Grid.Col>
            </Grid>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" withBorder>
                  <Title order={5} mb="sm">Wichtige Erkenntnisse</Title>
                  <List size="sm">
                    {currentBriefing.keyInsights.map((insight, index) => (
                      <List.Item key={index}>{insight}</List.Item>
                    ))}
                  </List>
                </Paper>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="md" withBorder>
                  <Title order={5} mb="sm">Empfehlungen</Title>
                  <List size="sm">
                    {currentBriefing.recommendations.map((rec, index) => (
                      <List.Item key={index}>{rec}</List.Item>
                    ))}
                  </List>
                </Paper>
              </Grid.Col>
            </Grid>
            
            <Divider />
            
            <Group justify="apart">
              <Group gap="md">
                <Text size="sm" c="dimmed">
                  Vertrauen: <Text component="span" fw={600}>
                    {((currentBriefing.confidence || 0) * 100).toFixed(0)}%
                  </Text>
                </Text>
                <Text size="sm" c="dimmed">
                  Quellen: <Text component="span" fw={600}>
                    {currentBriefing.metadata?.sourceCount || 0}
                  </Text>
                </Text>
                <Text size="sm" c="dimmed">
                  Datenpunkte: <Text component="span" fw={600}>
                    {currentBriefing.metadata?.dataPoints || 0}
                  </Text>
                </Text>
              </Group>
              
              <Progress 
                value={(currentBriefing.confidence || 0) * 100} 
                w={100}
                size="sm"
                color={
                  (currentBriefing.confidence || 0) > 0.8 ? 'green' :
                  (currentBriefing.confidence || 0) > 0.6 ? 'yellow' : 'red'
                }
              />
            </Group>
          </Stack>
        </Card>
      )}

      {/* Sentiment Details */}
      {sentiment && (
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={4} mb="md">Reddit Stimmung</Title>
              <Progress 
                value={Math.abs(sentiment.redditSentiment) * 100} 
                color={sentiment.redditSentiment > 0 ? 'green' : 'red'}
                size="lg"
                mb="sm"
              />
              <Group justify="apart">
                <Text size="sm" c="dimmed">Wert</Text>
                <Text fw={600}>{sentiment.redditSentiment.toFixed(3)}</Text>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={4} mb="md">WordPress Stimmung</Title>
              <Progress 
                value={Math.abs(sentiment.wordpressSentiment) * 100} 
                color={sentiment.wordpressSentiment > 0 ? 'green' : 'red'}
                size="lg"
                mb="sm"
              />
              <Group justify="apart">
                <Text size="sm" c="dimmed">Wert</Text>
                <Text fw={600}>{sentiment.wordpressSentiment.toFixed(3)}</Text>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Info Alert */}
      <Alert icon={<IconInfoCircle size={16} />} title="Hinweis" color="blue">
        Die Sentiment-Werte reichen von -1 (sehr negativ) bis +1 (sehr positiv). 
        Der Greed & Fear Index reicht von 0 (extreme Angst) bis 100 (extreme Gier).
      </Alert>
    </Stack>
  );
}