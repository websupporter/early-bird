import { useState } from 'react'
import { AppShell, Navbar, Header, Title, NavLink, Group, Burger } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconDashboard, IconSettings, IconChart, IconBrain } from '@tabler/icons-react'
import Dashboard from './components/Dashboard'
import AdminPanel from './components/AdminPanel'

type TabType = 'dashboard' | 'admin'

function App() {
  const [opened, { toggle }] = useDisclosure(false)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group>
            <IconChart size={24} />
            <Title order={3}>CryptoTraders Morning Briefing</Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          label="Dashboard"
          leftSection={<IconDashboard size="1rem" />}
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
        />
        <NavLink
          label="Admin Panel"
          leftSection={<IconSettings size="1rem" />}
          active={activeTab === 'admin'}
          onClick={() => setActiveTab('admin')}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'admin' && <AdminPanel />}
      </AppShell.Main>
    </AppShell>
  )
}

export default App