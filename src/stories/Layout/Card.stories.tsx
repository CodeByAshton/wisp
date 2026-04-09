import type { Meta, StoryObj } from 'wisp'
import { Card } from './Card'
import { Button } from '../Inputs/Button'
import { Badge } from '../DataDisplay/Badge'

const meta: Meta<typeof Card> = {
  title: 'Card',
  component: Card,
  parameters: {
    docs: `# Card

A surface container for grouping related content.

## Usage

\`\`\`tsx
<Card title="Heading" subtitle="Supporting text">
  Body content
</Card>
\`\`\`
`,
  },
  argTypes: {
    title:    { control: 'text',    description: 'Card heading' },
    subtitle: { control: 'text',    description: 'Supporting text' },
    elevated: { control: 'boolean', description: 'Drop shadow + hover lift' },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Inner padding',
    },
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Simple: Story = {
  args: { title: 'Project Alpha', subtitle: 'Last updated 2 hours ago', elevated: false, padding: 'md' },
  render: args => (
    <div style={{ width: 320 }}>
      <Card {...args}>
        <p style={{ fontSize: 13, color: 'var(--color-label-secondary)', lineHeight: 1.6 }}>
          A next-generation design system for building beautiful products that people love to use.
        </p>
      </Card>
    </div>
  ),
}

export const Elevated: Story = {
  args: { title: 'Revenue', subtitle: 'Monthly recurring', elevated: true, padding: 'md' },
  render: args => (
    <div style={{ width: 280 }}>
      <Card {...args}>
        <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-label)', fontFamily: 'var(--font-display)' }}>
          $12,450
        </p>
        <Badge label="+18% vs last month" variant="success" />
      </Card>
    </div>
  ),
}

export const WithFooter: Story = {
  args: { title: 'Confirm deletion', subtitle: 'This action cannot be undone.', padding: 'md' },
  render: args => (
    <div style={{ width: 360 }}>
      <Card
        {...args}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" label="Cancel" size="sm" />
            <Button variant="destructive" label="Delete" size="sm" />
          </div>
        }
      />
    </div>
  ),
}
